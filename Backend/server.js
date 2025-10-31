// server.js - Main Express Server
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 2931,
  database: process.env.DB_NAME || 'group_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'hello',
});

console.log("PASSWORD= " + pool.options.password)

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ============ USER ROUTES ============

// Register new user
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, fullName } = req.body;

  try {
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING user_id, username, email, full_name, created_at`,
      [username, email, hashedPassword, fullName || null]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE user_id = $1',
      [user.user_id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, username, email, full_name, bio, avatar_url, created_at, last_login 
       FROM users WHERE user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/users/me', authenticateToken, async (req, res) => {
  const { fullName, bio, avatarUrl } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           bio = COALESCE($2, bio),
           avatar_url = COALESCE($3, avatar_url)
       WHERE user_id = $4
       RETURNING user_id, username, email, full_name, bio, avatar_url`,
      [fullName, bio, avatarUrl, req.user.userId]
    );

    res.json({ 
      message: 'Profile updated successfully',
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ GROUP ROUTES ============

// Create new group
app.post('/api/groups', authenticateToken, async (req, res) => {
  const { name, description } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Create group
    const groupResult = await pool.query(
      `INSERT INTO groups (name, description, creator_id, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING *`,
      [name, description, req.user.userId]
    );

    const group = groupResult.rows[0];

    // Add creator as member
    await pool.query(
      `INSERT INTO group_members (group_id, user_id, role, joined_at) 
       VALUES ($1, $2, 'admin', NOW())`,
      [group.group_id, req.user.userId]
    );

    res.status(201).json({
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all groups (with membership info)
app.get('/api/groups', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.*, 
              u.username as creator_username,
              COUNT(DISTINCT gm.user_id) as member_count,
              COUNT(DISTINCT e.event_id) as event_count,
              BOOL_OR(gm.user_id = $1) as is_member,
              MAX(CASE WHEN gm.user_id = $1 THEN gm.role END) as user_role
       FROM groups g
       LEFT JOIN users u ON g.creator_id = u.user_id
       LEFT JOIN group_members gm ON g.group_id = gm.group_id
       LEFT JOIN events e ON g.group_id = e.group_id
       GROUP BY g.group_id, u.username
       ORDER BY g.created_at DESC`,
      [req.user.userId]
    );

    res.json({ groups: result.rows });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single group details
app.get('/api/groups/:groupId', authenticateToken, async (req, res) => {
  const { groupId } = req.params;

  try {
    const groupResult = await pool.query(
      `SELECT g.*, 
              u.username as creator_username,
              gm.role as user_role
       FROM groups g
       LEFT JOIN users u ON g.creator_id = u.user_id
       LEFT JOIN group_members gm ON g.group_id = gm.group_id AND gm.user_id = $1
       WHERE g.group_id = $2`,
      [req.user.userId, groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = groupResult.rows[0];

    // Get members
    const membersResult = await pool.query(
      `SELECT u.user_id, u.username, u.full_name, u.avatar_url, gm.role, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.user_id = u.user_id
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at`,
      [groupId]
    );

    group.members = membersResult.rows;

    res.json({ group });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join group
app.post('/api/groups/:groupId/join', authenticateToken, async (req, res) => {
  const { groupId } = req.params;

  try {
    // Check if group exists
    const groupCheck = await pool.query(
      'SELECT group_id FROM groups WHERE group_id = $1',
      [groupId]
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if already a member
    const memberCheck = await pool.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.userId]
    );

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    // Add member
    await pool.query(
      `INSERT INTO group_members (group_id, user_id, role, joined_at) 
       VALUES ($1, $2, 'member', NOW())`,
      [groupId, req.user.userId]
    );

    res.json({ message: 'Successfully joined group' });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave group
app.post('/api/groups/:groupId/leave', authenticateToken, async (req, res) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 RETURNING *',
      [groupId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Not a member of this group' });
    }

    res.json({ message: 'Successfully left group' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete group (admin only)
app.delete('/api/groups/:groupId', authenticateToken, async (req, res) => {
  const { groupId } = req.params;

  try {
    // Check if user is admin
    const memberCheck = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.userId]
    );

    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can delete groups' });
    }

    await pool.query('DELETE FROM groups WHERE group_id = $1', [groupId]);

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ EVENT ROUTES ============

// Create event
app.post('/api/groups/:groupId/events', authenticateToken, async (req, res) => {
  const { groupId } = req.params;
  const { title, description, eventDate, eventTime, location } = req.body;

  try {
    // Check if user is member
    const memberCheck = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Must be a group member to create events' });
    }

    const result = await pool.query(
      `INSERT INTO events (group_id, creator_id, title, description, event_date, event_time, location, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
       RETURNING *`,
      [groupId, req.user.userId, title, description, eventDate, eventTime, location]
    );

    res.status(201).json({
      message: 'Event created successfully',
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get group events
app.get('/api/groups/:groupId/events', authenticateToken, async (req, res) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      `SELECT e.*, 
              u.username as creator_username,
              COUNT(DISTINCT ea.user_id) as attendee_count,
              BOOL_OR(ea.user_id = $1) as is_attending
       FROM events e
       LEFT JOIN users u ON e.creator_id = u.user_id
       LEFT JOIN event_attendees ea ON e.event_id = ea.event_id
       WHERE e.group_id = $2
       GROUP BY e.event_id, u.username
       ORDER BY e.event_date, e.event_time`,
      [req.user.userId, groupId]
    );

    res.json({ events: result.rows });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle event attendance
app.post('/api/events/:eventId/attend', authenticateToken, async (req, res) => {
  const { eventId } = req.params;

  try {
    // Check if already attending
    const attendeeCheck = await pool.query(
      'SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, req.user.userId]
    );

    if (attendeeCheck.rows.length > 0) {
      // Remove attendance
      await pool.query(
        'DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2',
        [eventId, req.user.userId]
      );
      res.json({ message: 'Attendance removed', attending: false });
    } else {
      // Add attendance
      await pool.query(
        'INSERT INTO event_attendees (event_id, user_id, rsvp_date) VALUES ($1, $2, NOW())',
        [eventId, req.user.userId]
      );
      res.json({ message: 'Attendance confirmed', attending: true });
    }
  } catch (error) {
    console.error('Toggle attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ MESSAGE ROUTES ============

// Get group messages
app.get('/api/groups/:groupId/messages', authenticateToken, async (req, res) => {
  const { groupId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  try {
    const result = await pool.query(
      `SELECT m.*, u.username, u.full_name, u.avatar_url
       FROM messages m
       JOIN users u ON m.user_id = u.user_id
       WHERE m.group_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [groupId, limit, offset]
    );

    res.json({ messages: result.rows.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message
app.post('/api/groups/:groupId/messages', authenticateToken, async (req, res) => {
  const { groupId } = req.params;
  const { content } = req.body;

  try {
    // Check if user is member
    const memberCheck = await pool.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Must be a group member to send messages' });
    }

    const result = await pool.query(
      `INSERT INTO messages (group_id, user_id, content, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING *`,
      [groupId, req.user.userId, content]
    );

    res.status(201).json({
      message: 'Message sent successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end();
  process.exit(0);
});