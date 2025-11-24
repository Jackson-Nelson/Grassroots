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
  if (token === 'null') {
    console.log(`No token. Status 403`)

    return res.sendStatus(403);
  }

  const payload = jwt.verify(token, JWT_Key).uid;

  if (!payload) {
    return res.sendStatus(401);
  }

  const username = (await pool.query('SELECT username FROM users WHERE user_id = $1', [payload])).rows[0].username;
  console.log("verified [" + username +"]");

  next();
}


app.get("/api/auth", auth, async (req, res) => {

  console.log('authenticated?')
  res.sendStatus(200);
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
  const { city, state, zip, country } = req.query
  const events = await pool.query('SELECT * FROM events WHERE city = $1 AND state = $2 AND zip = $3 AND country = $4', [city, state, zip, country])
  res.json(events.rows)
});


// group routes
app.get("/api/groups/my-groups", auth, async (req, res)=>{
  const {user_id} = req.query
  const groups = await pool.query('SELECT * FROM groups JOIN group_members ON group_id WHERE user_id = #1', [user_id])
  res.json(groups.rows)
});


// create new group, requires authentication
app.post("/api/groups/create", auth, async (req, res) => {
  const { name, desc, tags, creator_id } = req.body;

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


