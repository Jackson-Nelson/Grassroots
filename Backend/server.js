require("dotenv").config()

const jwt = require('jsonwebtoken');
const express = require('express')
const cors = require("cors")

const { Pool } = require('pg')

const app = express()


// Middleware
app.use(express.json({ limit: '10mb' })) // Increase limit for base64 image uploads
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

const login = async (req, res) => {
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
  res.status(201).json({ JWT: token, user: { uid: user.user_id, name: user.username, email: user.email }, success: "yipee" });
}

const register = async (req, res, next) => {

  const { email, username, password, city, state, country } = req.body

  // verify user does not already exist
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])

  if (result.rowCount != 0) {
    return res.status(400).send('Email already registered.');
  }


  // username cant be shorter than three. this should also be checked client-side
  if (username.length < 3) {
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
  // res.status(201).json({ JWT: token, uid: user_id, success: "yipee" });

  // move on to logging in
  next();
}

app.post("/api/register", register, login)

app.post("/api/login", login);



// EVENT ROUTES //

// HOMEPAGE: get events nearby
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

// HOMEPAGE: get my events (RSVP'd to)
app.get("/api/events/my-events", auth, async (req, res) => {
  try {
    const user_id = req.user;

    const events = await pool.query(
      `SELECT e.* FROM events e
       JOIN event_attendees ea ON e.event_id = ea.event_id
       WHERE ea.user_id = $1 AND ea.rsvp_status = 'yes'
       ORDER BY e.event_date ASC`,
      [user_id]
    );

    res.json(events.rows);

  } catch (err) {
    console.error('Error fetching user events:', err);
    res.status(500).json({ error: 'Failed to fetch events', details: err.message });
  }
});

// HOMEPAGE: get my group's events
app.get("/api/events/my-group-events", auth, async (req, res) => {
  try {
    const user_id = req.user;

    const events = await pool.query(
      `SELECT DISTINCT e.* FROM events e
       JOIN group_members gm ON e.group_id = gm.group_id
       WHERE gm.user_id = $1
       ORDER BY e.event_date ASC`,
      [user_id]
    );

    res.json(events.rows);

  } catch (err) {
    console.error('Error fetching group events:', err);
    res.status(500).json({ error: 'Failed to fetch events', details: err.message });
  }
});

// EVENT PAGES: fetching individual event info
app.get("/api/events/:eventId", auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user;

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

    // check if user has rsvp'd
    if (userId) {
      const rsvpResult = await pool.query(
        `SELECT rsvp_status FROM event_attendees 
         WHERE event_id = $1 AND user_id = $2`,
        [eventId, userId]
      );
      
      if (rsvpResult.rowCount > 0) {
        event.user_rsvp_status = rsvpResult.rows[0].rsvp_status;
        event.has_rsvpd = true;
      } else {
        event.user_rsvp_status = null;
        event.has_rsvpd = false;
      }
    } else {
      event.user_rsvp_status = null;
      event.has_rsvpd = false;
    }

    res.json(event);

  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ error: 'Failed to fetch event', details: err.message });
  }
});

// EVENT PAGES: RSVP to an event
app.post("/api/events/:eventId/rsvp", auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user;

    // Check if event exists
    const eventResult = await pool.query(
      'SELECT event_id FROM events WHERE event_id = $1',
      [eventId]
    );

    if (eventResult.rowCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user already RSVP'd
    const existingRsvp = await pool.query(
      `SELECT rsvp_status FROM event_attendees 
       WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );

    if (existingRsvp.rowCount > 0) {
      return res.status(400).json({ error: 'You have already RSVP\'d to this event' });
    }

    // Insert RSVP with status 'yes'
    await pool.query(
      `INSERT INTO event_attendees (event_id, user_id, rsvp_status, rsvp_date)
       VALUES ($1, $2, 'yes', NOW())
       ON CONFLICT (event_id, user_id) DO NOTHING`,
      [eventId, userId]
    );

    res.status(201).json({ message: 'Successfully RSVP\'d to event', rsvp_status: 'yes' });

  } catch (err) {
    console.error('Error RSVPing to event:', err);
    res.status(500).json({ error: 'Failed to RSVP to event', details: err.message });
  }
});

// EVENT PAGES: update an event (requires auth, only creator can update)
app.put("/api/events/:eventId", auth, async (req, res) => {
  try {
    let { eventId } = req.params;
    const userId = req.user;
    const { title, description, event_date, event_time, address, city, state, zip, country, image_url, group_id } = req.body;

    if (eventId !== 'new') {
      // check if event exists and user is the creator
      const eventResult = await pool.query(
        'SELECT creator_id FROM events WHERE event_id = $1',
        [eventId]
      );

      if (eventResult.rowCount === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (eventResult.rows[0].creator_id !== userId) {
        return res.status(403).json({ error: 'Only the event creator can update this event' });
      }
    }

    // correct country input for the united states of america
    if (country !== undefined) {
      const normalizedCountry = country.trim();
      if (normalizedCountry === "United States" || normalizedCountry === "US") {
        country = "United States of America";
      }
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
    if (image_url !== undefined && image_url !== null && image_url !== '') {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(image_url);
    }

    // values.push(eventId);


    // create a new event
    if (eventId === 'new') {

      if (!group_id || !userId || !title || !event_date || !address || !city || !country) {
        return res.status(400).json({ error: 'A new event must specify all of: title, event_date, address, city, country' });
      }

      const query = `INSERT INTO events (group_id,creator_id,title,event_date,address,city,country) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING event_id`
      eventId = (await pool.query(query,
        [group_id, userId, title, event_date, address, city, country]
      )).rows[0].event_id;
    }


    const updateQuery = `
      UPDATE events 
      SET ${updates.join(', ')}
      WHERE event_id = $${paramIndex}
      RETURNING *
      `;

    const result = await pool.query(updateQuery, [...values, eventId]);


    res.json(result.rows[0]);

  } catch (err) {
    console.error('Error updating event:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    res.status(500).json({ error: 'Failed to update event', details: err.message });
  }
});



// ABSTRACTED GROUP PARSING
const getGroupMembers = async (gid) => {

  // get group members
  const memberships = await pool.query(
    'SELECT username, email, user_id FROM groups JOIN group_members using(group_id) JOIN users using(user_id) WHERE groups.group_id = $1',
    [gid]
  )

  return memberships.rows;//.map((membership) => membership.username);
}
const getGroupTags = async (gid) => {

  // get group tags
  const taggings = await pool.query(
    'SELECT tag FROM tags JOIN groups ON tags.gid = groups.group_id WHERE groups.group_id = $1',
    [gid]
  )
  return taggings.rows.map((tagging) => tagging.tag)
}

const getGroupChannels = async (gid) => {

  // get group tags
  const channels = await pool.query(
    'SELECT channel_id, channels.name FROM channels JOIN groups using(group_id) WHERE groups.group_id = $1',
    [gid]
  )
  return channels.rows;//.map((channel) => channels.channe)
}

const getGroupEvents = async (gid) => {

  // get group tags
  const events = await pool.query(
    'SELECT events.* FROM events JOIN groups using(group_id) WHERE group_id = $1',
    [gid]
  )
  return events.rows;//.map((channel) => channels.channe)
}

const getGroupData = async (gid) => {

  const result = await pool.query("SELECT * FROM groups WHERE groups.group_id = $1", [gid]);

  return (result.rowCount === 0)
    ? null
    : {
      ...result.rows[0],
      tags: await getGroupTags(gid),
      members: await getGroupMembers(gid),
      channels: await getGroupChannels(gid),
      events: await getGroupEvents(gid),
    }
}



// GROUP ROUTES //

// INDIVIDUAL GROUP PAGES
app.get("/api/group/:groupId", async (req, res) => { // successful response is a group with all db fields + tags + members
  const groupId = req.params.groupId;
  console.log("serving group: " + groupId);

  try {

    const group = await getGroupData(groupId);

    // no group with that id?
    if (!group) {
      return res.sendStatus(404);
    }

    console.log(group);

    res.status(200).json(group);

  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
}
)

app.post("/api/groups/:groupId/join", auth, async (req, res) => {

  const groupId = req.params.groupId;
  const userId = req.user;

  try {

    const groups = await pool.query("SELECT * FROM groups WHERE groups.group_id = $1", [groupId]);

    // group does not exist
    if (groups.rowCount === 0) {
      return res.sendStatus(400);
    }

    const membership = await pool.query("SELECT * FROM users JOIN group_members using(user_id) JOIN groups using(group_id) WHERE user_id = $1 AND group_id = $2", [userId, groupId]);

    // check if already a member
    if (membership.rowCount !== 0) {
      return res.sendStatus(400);
    }

    await pool.query("INSERT INTO group_members (user_id, group_id) VALUES($1, $2)", [userId, groupId]);

    res.sendStatus(204);

  } catch (err) {
    console.error("Error while joining group:" + err);
    res.sendStatus(500);
  }

})
app.post("/api/groups/:groupId/leave", auth, async (req, res) => {

  const groupId = req.params.groupId;
  const userId = req.user;

  try {

    const groups = await pool.query("SELECT * FROM groups WHERE groups.group_id = $1", [groupId]);

    // group does not exist
    if (groups.rowCount === 0) {
      return res.sendStatus(400);
    }

    const membership = await pool.query("SELECT * FROM users JOIN group_members using(user_id) JOIN groups using(group_id) WHERE user_id = $1 AND group_id = $2", [userId, groupId]);

    // check if already a member
    if (membership.rowCount === 0) {
      return res.sendStatus(400);
    }

    await pool.query("DELETE FROM group_members where user_id = $1 AND group_id = $2", [userId, groupId]);

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }

})

// HOMEPAGE: fetch my groups
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

// HOMEPAGE: get groups near me
app.get("/api/groups/nearby", async (req, res) => {
  try {
    const { city, state, country } = req.query;

    const groups = await pool.query(
      'SELECT * FROM groups WHERE city = $1 AND state = $2 AND country = $3',
      [city, state, country]
    );

    res.json(groups.rows);

  } catch (err) {
    console.error('Error fetching nearby groups:', err);
    res.status(500).json({ error: 'Failed to fetch groups', details: err.message });
  }
});

// GROUPS PAGE: create new group, requires authentication
app.post("/api/groups/create", auth, async (req, res) => {
  const { name, desc, tags, contact_email, contact_phone} = req.body;
  const creator_id = req.user;

  console.log("begin group creation: " + name)

  // name and description are required
  if (!name || !desc) {
    return res.status(400).send("missing name or description!");
  }

  if (name.length <= 3) {
    return res.status(400).send("name must be longer than 3 characters!");
  }


  let result = await pool.query("SELECT city, state, country FROM users WHERE user_id = $1", [creator_id]);

  // check if result faild somehow
  if (result.rowCount === 0) {
    return res.status(400).send('something went wreally wrong!');
  }

  console.log(JSON.stringify(result));

  // city/country of group should equal those of the creator
  const [city, state, country] = [result.rows[0].city, result.rows[0].state, result.rows[0].country];

  console.log('city:' + city);
  console.log('state:' + state);
  console.log('country:' + country);

  // check if group by that name already exists
  result = await pool.query('SELECT * FROM groups where name = $1 and city = $2 and state = $3 AND country = $4', [name, city, state, country]);
  if (result.rowCount !== 0) {
    return res.status(400).send("group already exists!");
  }


  //all checks passed, create group
  result = await pool.query(
    "INSERT INTO groups (name, description, city, state, country, creator_id, created_at, contact_email, contact_phone) VALUES($1, $2, $3, $4, $5, $6, NOW(), $7, $8) RETURNING group_id", [name, desc, city, state, country, creator_id, contact_email || null, contact_phone || null]);

  const group_id = result.rows[0].group_id;

  // add tags to pool of tags
  tags.forEach(async tag => {
    await pool.query("INSERT INTO tags (tag, gid) VALUES($1, $2)", [tag, group_id]);
  });

  // creator is first member by default
  await pool.query("INSERT INTO group_members (group_id, user_id, role) VALUES($1, $2, 'owner')", [group_id, creator_id]);

  // every group has a default text channel
  await pool.query("INSERT INTO channels (group_id, name) VALUES($1, 'default')", [group_id]);

  res.status(201).json({ success: 'yipee', gid: group_id });

})



// MESSAGE ROUTES //

app.get("/api/messages/history/:channelId", async (req, res) => {

  const channelId = req.params.channelId;

  console.log("Getting message history for group: " + channelId);


  // check if group exists
  let results = await pool.query('SELECT channel_id FROM channels WHERE channels.channel_id = $1', [channelId]);
  if (results.rowCount === 0) {
    return res.sendStatus(404);
  }

  results = await pool.query('SELECT * FROM messages JOIN channels using(channel_id) JOIN users using(user_id) WHERE channels.channel_id = $1', [channelId]);
  const msgs = results.rows;
  console.log(msgs[0]);

  return res.status(200).json(msgs);

})

// must be logged in to send a message
app.post("/api/messages/:channelId/send", auth, async (req, res) => {

  const channelId = req.params.channelId;
  const sender = req.user;
  const { content } = req.body;

  // check if channel exists
  let results = await pool.query('SELECT channel_id FROM channels WHERE channels.channel_id = $1', [channelId]);
  if (results.rowCount === 0) {
    return res.sendStatus(404);
  }

  results = await pool.query('INSERT INTO messages (channel_id, user_id, content, created_at) VALUES($1, $2, $3, NOW()) RETURNING message_id', [channelId, sender, content]);

  if (results.rowCount === 0) {
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

// POLL ROUTES 

// Get all polls for a group
app.get("/api/polls", auth, async (req, res) => {
  try {
    const { group_id } = req.query;

    if (!group_id) {
      return res.status(400).json({ error: 'group_id parameter is required' });
    }

    const user_id = req.user;

    // Delete polls that ended more than 24 hours ago
    await pool.query(
      `DELETE FROM polls 
       WHERE group_id = $1 
       AND end_time IS NOT NULL 
       AND end_time < NOW() - INTERVAL '24 hours'`,
      [group_id]
    );

    // Get all polls for this group
    const pollsResult = await pool.query(
      `SELECT p.*, u.username as creator_username
       FROM polls p
       JOIN users u ON p.creator_id = u.user_id
       WHERE p.group_id = $1
       ORDER BY p.created_at DESC`,
      [group_id]
    );

    const polls = await Promise.all(pollsResult.rows.map(async (poll) => {
      // Get options for this poll
      const optionsResult = await pool.query(
        `SELECT option_id, option_text, option_order
         FROM poll_options
         WHERE poll_id = $1
         ORDER BY option_order ASC`,
        [poll.poll_id]
      );

      // Get vote counts for each option
      const resultsQuery = await pool.query(
        `SELECT po.option_id, po.option_text, po.option_order, COUNT(pv.vote_id)::integer as vote_count
         FROM poll_options po
         LEFT JOIN poll_votes pv ON po.option_id = pv.option_id
         WHERE po.poll_id = $1
         GROUP BY po.option_id, po.option_text, po.option_order
         ORDER BY po.option_order ASC`,
        [poll.poll_id]
      );

      // Check if current user has voted
      const voteCheck = await pool.query(
        `SELECT 1 FROM poll_votes WHERE poll_id = $1 AND user_id = $2 LIMIT 1`,
        [poll.poll_id, user_id]
      );
      const userHasVoted = voteCheck.rowCount > 0;

      return {
        ...poll,
        options: optionsResult.rows,
        results: resultsQuery.rows,
        user_has_voted: userHasVoted
      };
    }));

    res.json(polls);

  } catch (err) {
    console.error('Error fetching polls:', err);
    res.status(500).json({ error: 'Failed to fetch polls', details: err.message });
  }
});

// Create a new poll
app.post("/api/polls/create", auth, async (req, res) => {
  try {
    const { group_id, title, description, poll_type, options, end_time } = req.body;
    const creator_id = req.user;

    // Validation
    if (!group_id || !title || !poll_type || !options || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'At least 2 options are required' });
    }

    if (!['single_choice', 'multiple_choice'].includes(poll_type)) {
      return res.status(400).json({ error: 'Invalid poll_type' });
    }

    // Check if group exists
    const groupCheck = await pool.query(
      'SELECT group_id FROM groups WHERE group_id = $1',
      [group_id]
    );

    if (groupCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Insert poll
    const pollResult = await pool.query(
      `INSERT INTO polls (creator_id, group_id, title, description, poll_type, end_time, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING poll_id`,
      [creator_id, group_id, title, description || '', poll_type, end_time]
    );

    const poll_id = pollResult.rows[0].poll_id;

    // Insert poll options
    const optionPromises = options.map((optionText, index) => {
      return pool.query(
        `INSERT INTO poll_options (poll_id, option_text, option_order, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING option_id, option_text, option_order`,
        [poll_id, optionText, index + 1]
      );
    });

    const optionResults = await Promise.all(optionPromises);
    const createdOptions = optionResults.map(result => result.rows[0]);

    // Get creator username
    const userResult = await pool.query(
      'SELECT username FROM users WHERE user_id = $1',
      [creator_id]
    );

    // Return the created poll with options
    res.status(201).json({
      poll_id,
      creator_id,
      creator_username: userResult.rows[0].username,
      group_id,
      title,
      description: description || '',
      poll_type,
      end_time,
      is_active: true,
      options: createdOptions,
      results: createdOptions.map(opt => ({ ...opt, vote_count: 0 })),
      user_has_voted: false
    });

  } catch (err) {
    console.error('Error creating poll:', err);
    res.status(500).json({ error: 'Failed to create poll', details: err.message });
  }
});

// Submit a vote
app.post("/api/polls/:pollId/vote", auth, async (req, res) => {
  try {
    const { pollId } = req.params;
    const { option_ids } = req.body;
    const user_id = req.user;

    // Validation
    if (!option_ids || !Array.isArray(option_ids) || option_ids.length === 0) {
      return res.status(400).json({ error: 'option_ids array is required' });
    }

    // Get poll info
    const pollResult = await pool.query(
      'SELECT poll_id, poll_type, end_time, is_active FROM polls WHERE poll_id = $1',
      [pollId]
    );

    if (pollResult.rowCount === 0) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const poll = pollResult.rows[0];

    // Check if poll is still active
    if (!poll.is_active || (poll.end_time && new Date(poll.end_time) < new Date())) {
      return res.status(400).json({ error: 'Poll has ended' });
    }

    // Check if user already voted
    const existingVote = await pool.query(
      'SELECT vote_id FROM poll_votes WHERE poll_id = $1 AND user_id = $2',
      [pollId, user_id]
    );

    if (existingVote.rowCount > 0) {
      return res.status(400).json({ error: 'You have already voted in this poll' });
    }

    // Validate poll type
    if (poll.poll_type === 'single_choice' && option_ids.length > 1) {
      return res.status(400).json({ error: 'Only one option allowed for single choice polls' });
    }

    // Verify all option_ids belong to this poll
    const optionsCheck = await pool.query(
      'SELECT option_id FROM poll_options WHERE poll_id = $1 AND option_id = ANY($2)',
      [pollId, option_ids]
    );

    if (optionsCheck.rowCount !== option_ids.length) {
      return res.status(400).json({ error: 'Invalid option_ids' });
    }

    // Insert votes
    const votePromises = option_ids.map(option_id => {
      return pool.query(
        `INSERT INTO poll_votes (poll_id, option_id, user_id, voted_at)
         VALUES ($1, $2, $3, NOW())`,
        [pollId, option_id, user_id]
      );
    });

    await Promise.all(votePromises);

    // Get updated results
    const resultsQuery = await pool.query(
      `SELECT po.option_id, po.option_text, po.option_order, COUNT(pv.vote_id) as vote_count
       FROM poll_options po
       LEFT JOIN poll_votes pv ON po.option_id = pv.option_id
       WHERE po.poll_id = $1
       GROUP BY po.option_id, po.option_text, po.option_order
       ORDER BY po.option_order ASC`,
      [pollId]
    );

    res.json({
      success: true,
      message: 'Vote submitted successfully',
      results: resultsQuery.rows
    });

  } catch (err) {
    console.error('Error submitting vote:', err);
    res.status(500).json({ error: 'Failed to submit vote', details: err.message });
  }
});

// Get results for a specific poll
app.get("/api/polls/:pollId/results", async (req, res) => {
  try {
    const { pollId } = req.params;

    // Get poll info
    const pollResult = await pool.query(
      `SELECT p.*, u.username as creator_username
       FROM polls p
       JOIN users u ON p.creator_id = u.user_id
       WHERE p.poll_id = $1`,
      [pollId]
    );

    if (pollResult.rowCount === 0) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Get results with vote counts and percentages
    const resultsQuery = await pool.query(
      `SELECT 
        po.option_id,
        po.option_text,
        po.option_order,
        COUNT(pv.vote_id) as vote_count,
        ROUND(
          (COUNT(pv.vote_id)::FLOAT / NULLIF(
            (SELECT COUNT(DISTINCT user_id) FROM poll_votes WHERE poll_id = $1), 0
          )) * 100, 2
        ) as percentage
       FROM poll_options po
       LEFT JOIN poll_votes pv ON po.option_id = pv.option_id
       WHERE po.poll_id = $1
       GROUP BY po.option_id, po.option_text, po.option_order
       ORDER BY po.option_order ASC`,
      [pollId]
    );

    // Get total unique voters
    const votersQuery = await pool.query(
      'SELECT COUNT(DISTINCT user_id) as total_voters FROM poll_votes WHERE poll_id = $1',
      [pollId]
    );

    res.json({
      poll: pollResult.rows[0],
      results: resultsQuery.rows,
      total_voters: parseInt(votersQuery.rows[0].total_voters)
    });

  } catch (err) {
    console.error('Error fetching poll results:', err);
    res.status(500).json({ error: 'Failed to fetch results', details: err.message });
  }
});


app.listen(process.env.PORT, () => console.log("Server listening on localhost:" + process.env.PORT))


