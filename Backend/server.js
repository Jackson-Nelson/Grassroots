require("dotenv").config()

const express = require('express')
const cors = require("cors")

const {Pool} = require('pg')

const app = express()


// Middleware
app.use(express.json())
app.use(cors())


const pool = new Pool({
  user: process.env.DB_USER,
  password:process.env.DB_PASSWORD,
  host:process.env.DB_HOST,
  port:process.env.DB_PORT,
  database:process.env.DB_NAME,
})


app.get("/api/adduser", (req, res)=>{
  console.log("received adduser")
  res.send("Response received: " + req.body)
})

app.post("/api/register", async (req, res)=>{
    const {email, username, password, location} = req.body

    // verify user does not already exist
    const result = await pool.query('SELECT * FROM users WHERE username = $1 or email = $2', [username, email])

    if (result.rowCount != 0){
      return res.status(400).json({ error: 'Username or email already exists.' });
    }

    // hash password??

    // create new user
    result = await pool.query(`INSERT INTO users (email, username, password_hash, location, created_at) VALUES($1, $2, $3, $4, NOW())`, [email, username, password, location])

    res.status(201).send("User registered successfully");
})


app.post("/api/login", async (req, res)=>{
    const {email, username, password, location} = req.body

    // verify user does already exist
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username])

    if (result.rowCount == 0){
      return res.status(401).json({ error: 'Invalid username.' });
    }

    const user = result[0];

    // hash password??
    // check passwords match
    if(result.password_hash != password){
      return res.status(401).json({ error: 'Invalid password :3.' });
    }

    // create new user
    result = await pool.query(`INSERT INTO users (email, username, password, location, created_at) VALUES($1, $2, $3, $4, NOW())`, [email, username, password, location])

    res.send("User logged in successfully");
})

// event routes
app.get("/api/events/nearby", async (req, res)=>{
  const {city, state, zip, country} = req.query
  const events = await pool.query('SELECT * FROM events WHERE city = $1 AND state = $2 AND zip = $3 AND country = $4', [city, state, zip, country])
  res.json(events.rows)
});


// group routes
app.get("/api/groups/my-groups", async (req, res)=>{
  const {user_id} = req.query
  // Get groups where user is a member OR where user is the creator
  const groups = await pool.query(
    `SELECT DISTINCT g.* 
     FROM groups g 
     LEFT JOIN group_members gm ON g.group_id = gm.group_id 
     WHERE gm.user_id = $1 OR g.creator_id = $1`, 
    [user_id]
  )
  res.json(groups.rows)
});

app.listen(process.env.PORT, ()=>console.log("Server listening on localhost:4000"))
