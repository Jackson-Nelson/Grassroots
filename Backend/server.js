require("dotenv").config()

const jwt = require('jsonwebtoken');
const express = require('express')
const cors = require("cors")

const { Pool } = require('pg')

const app = express()


// Middleware
app.use(express.json())
app.use(cors())


const JWT_Key = process.env.JSON_TOKEN_SECRET_KEY


const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
})


app.get("/api/adduser", (req, res) => {
  console.log("received adduser")
  res.send("Response received: " + req.body)
})


// include auth before your private data request
const auth = async (req, res, next) => {

  const headers = req.headers;
  const token = (headers.authorization || "").replace("Bearer ", "");

  console.log(`Checking token: ${token} (${typeof token})`)
  if (token === 'null' || !token) {
    console.log(`No token. Status 403`)

    return res.sendStatus(403);
  }

  const payload = jwt.verify(token, JWT_Key).uid;

  if (!payload) {
    return res.sendStatus(401);
  }

  const username = (await pool.query('SELECT username FROM users WHERE user_id = $1', [payload])).rows[0].username;
  console.log("verified [" + username + "]");

  // assign user with verified user id
  req.user = payload;
  next();
}


app.get("/api/auth", auth, async (req, res) => {

  console.log('authenticated?')
  res.sendStatus(200);
})

app.get("/api/me", auth, async (req, res) => {


  const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [req.user]);

  if (result.rowCount === 0) {
    return res.sendStatus(400);
  }

  res.status(200).json(result.rows[0]);
})

app.post("/api/register", async (req, res) => {


  const { email, username, password, city, state, country } = req.body

  // verify user does not already exist
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])

  if (result.rowCount != 0) {
    return res.status(400).send('Email already registered.');
  }


  // username cant be shorter than three. this should also be checked client-side
  if (username.length <= 3) {
    return res.status(400).send("username is too short.");
  }

  // hash password??

  // create new user
  const newUser = await pool.query(`INSERT INTO users (email, username, password_hash, city, state, country, created_at) VALUES($1, $2, $3, $4, $5, $6, NOW()) RETURNING user_id`, [email, username, password, city, state, country])

  const user_id = newUser.rows[0].user_id;


  // can add options such as: expires in 1 hour
  // generates session id that validates this user is logged in 
  const token = jwt.sign({ uid: user_id }, JWT_Key)


  // inform client of success and their new session and user ids.
  res.status(201).json({ JWT: token, uid: user_id, success: "yipee" });
})


app.post("/api/login", async (req, res) => {
  const { email, password } = req.body

  // verify user does already exist
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])

  // fails if email unregistered
  if (result.rowCount == 0) {
    return res.status(401).send('Invalid em ail or password.');
  }

  const user = result.rows[0];

  // hash password??
  // check passwords match
  if (user.password_hash != password) {
    return res.status(401).send('Invalid email or pass word.');
  }

  const user_id = user.user_id;

  // can add options such as: expires in 1 hour
  // generates session id that validates this user is logged in 
  const token = jwt.sign({ uid: user_id }, JWT_Key)


  // inform client of success and their new session and user ids.
  res.status(201).json({ JWT: token, uid: user_id, success: "yipee" });
})

// event routes
app.get("/api/events/nearby", async (req, res) => {
  try {
    const { city, state, country } = req.query

    const events = await pool.query(
      'SELECT * FROM events WHERE city = $1 AND state = $2 AND country = $3',
      [city, state, country]
    )


    res.json(events.rows)

  } catch (err) {
    console.error('Error fetching nearby events:', err);
    res.status(500).json({ error: 'Failed to fetch events', details: err.message });
  }
});

// FOR EVENT PAGES: fetching individual event info
app.get("/api/events/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    // get event
    const eventResult = await pool.query(
      `SELECT e.*, g.name as group_name, g.description as group_description, 
              u.username as creator_username
       FROM events e
       JOIN groups g ON e.group_id = g.group_id
       JOIN users u ON e.creator_id = u.user_id
       WHERE e.event_id = $1`,
      [eventId]
    );

    if (eventResult.rowCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];
    res.json(event);

  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ error: 'Failed to fetch event', details: err.message });
  }
});

// update an event (requires auth, only creator can update)
app.put("/api/events/:eventId", auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user;
    const { title, description, event_date, event_time, address, city, state, zip, country } = req.body;

    // check if event exists and user is the creator
    const eventResult = await pool.query(
      'SELECT creator_id FROM events WHERE event_id = $1',
      [eventId]
    );

    // correct country input for the united states of america
    if (country !== undefined) {
      const normalizedCountry = country.trim();
      if (normalizedCountry === "United States" || normalizedCountry === "US") {
        country = "United States of America";
      }
    }

    if (eventResult.rowCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (eventResult.rows[0].creator_id !== userId) {
      return res.status(403).json({ error: 'Only the event creator can update this event' });
    }

    // updating an event:
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (event_date !== undefined) {
      updates.push(`event_date = $${paramIndex++}`);
      values.push(event_date);
    }
    if (event_time !== undefined) {
      updates.push(`event_time = $${paramIndex++}`);
      values.push(event_time);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      values.push(address);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      values.push(city);
    }
    if (state !== undefined) {
      updates.push(`state = $${paramIndex++}`);
      values.push(state);
    }
    if (zip !== undefined) {
      updates.push(`zip = $${paramIndex++}`);
      values.push(zip);
    }
    if (country !== undefined) {
      updates.push(`country = $${paramIndex++}`);
      values.push(country);
    }

    values.push(eventId);

    const updateQuery = `
      UPDATE events 
      SET ${updates.join(', ')}
      WHERE event_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Failed to update event', details: err.message });
  }
});


// group routes
app.get("/api/groups/my-groups", auth, async (req, res) => {
  try {
    const user_id = req.user;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id parameter is required' });
    }

    // get group 'group' objects
    const groups = await pool.query(
      'SELECT groups.* FROM groups JOIN group_members ON groups.group_id = group_members.group_id WHERE group_members.user_id = $1',
      [user_id]
    )

    // will be a list of groups, with the addition of all of their members and tags
    const augmentedGroups = await Promise.all(groups.rows.map(async (group, i) => {

      // get group tags
      const tags = await pool.query(
        'SELECT tag FROM tags JOIN groups ON tags.gid = groups.group_id WHERE groups.group_id = $1',
        [group.group_id]
      )

      // get group members
      const members = await pool.query(
        'SELECT username FROM groups JOIN group_members ON groups.group_id = group_members.group_id JOIN users ON users.user_id = group_members.user_id WHERE groups.group_id = $1',
        [group.group_id]
      )

      const tagNames = tags.rows.map((tag) => tag.tag)
      const memberNames = members.rows.map((username) => username.username)

      const result = { ...group, tags: tagNames, members: memberNames };

      console.log(result)
      console.log('======================')

      return result;
    }))

    res.status(200).json(augmentedGroups)
  } catch (err) {
    console.error('Error fetching user groups:', err);
    res.status(500).json({ error: 'Failed to fetch groups', details: err.message });
  }
});




// create new group, requires authentication
app.post("/api/groups/create", auth, async (req, res) => {
  const { name, desc, tags } = req.body;
  const creator_id = req.user;

  console.log("begin group creation: " + name)

  // name and description are required
  if (!name || !desc) {
    return res.status(400).send("missing name or description!");
  }

  if (name.length <= 3) {
    res.status(400).send("name must be longer than 3 characters!");
  }


  let result = await pool.query("SELECT city, country FROM users WHERE user_id = $1", [creator_id]);

  // check if result faild somehow
  if (result.rowCount === 0) {
    return res.status(400).send('something went wreally wrong!');
  }

  console.log(JSON.stringify(result));

  // city/country of group should equal those of the creator
  const [city, country] = [result.rows[0].city, result.rows[0].country];

  console.log('city:' + city);
  console.log('country:' + country);

  // check if group by that name already exists
  result = await pool.query('SELECT * FROM groups where name = $1 and city = $2 and country = $3', [name, city, country]);
  if (result.rowCount !== 0) {
    return res.status(400).send("group already exists!");
  }


  //all checks passed, create group
  result = await pool.query("INSERT INTO groups (name, description, city, country, creator_id, created_at) VALUES($1, $2, $3, $4, $5, NOW()) RETURNING group_id", [name, desc, city, country, creator_id])

  const group_id = result.rows[0].group_id;

  // add tags to pool of tags
  tags.forEach(async tag => {
    await pool.query("INSERT INTO tags (tag, gid) VALUES($1, $2)", [tag, group_id]);
  });

  // creator is first member by default
  await pool.query("INSERT INTO group_members (group_id, user_id, role) VALUES($1, $2, 'owner')", [group_id, creator_id]);

  res.status(201).json({ success: 'yipee', gid: group_id });

})

app.get("/api/groups/message-history", async (req, res) => {
  
  const groupId = req.query.groupId;

  // check if group exists
  let results = await pool.query('SELECT group_id FROM groups WHERE groups.group_id = $1', [groupId]);
  if(results.rowCount === 0){
    return res.sendStatus(404);
  }

  results = await pool.query('SELECT * FROM messages JOIN groups ON messages.group_id = groups.group_id JOIN users WHERE messages.user_id = users.user_id WHERE groups.group_id = $1', [groupId]);
  const msgs = results.rows;
console.log(msgs[0]);

  return res.status(200).json(msgs);

})

// must be logged in to send a message
app.post("/api/groups/:groupId/send-message", auth, async (req, res) => {
    
  const groupId = req.params.groupId;
  const sender = req.userId;
  const {content} = req.body;

  // check if group exists
  let results = await pool.query('SELECT group_id FROM groups WHERE groups.group_id = $1', [groupId]);
  if(results.rowCount === 0){
    return res.sendStatus(404);
  }

  results = await pool.query('INSERT INTO messages (group_id, user_id, content, created_at) VALUES($1, $2, $3, NOW()) RETURNING message_id', [groupId, sender, content]);

  if(results.rowCount === 0){
    return res.sendStatus(500);
  }

  res.status(200).json(results.rows[0]);
})


// user data
app.get('/api/users/:userId', async (req, res) => {

  const uid = req.params.userId;
  console.log(uid)

  //check if user exists in db
  const results = await pool.query('SELECT username FROM users WHERE user_id = $1', [uid])

  if (results.rowCount === 0) {
    res.status(400).send("No such user.");
  }

  res.status(200).json({ username: results.rows[0].username });
})






app.listen(process.env.PORT, () => console.log("Server listening on localhost:4000"))


