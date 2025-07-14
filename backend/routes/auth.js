const express = require('express');
const router = express.Router();
const db = require('../db');

// Register endpoint (no hashing)
router.post('/register', (req, res) => {
  console.log('Registration request received:', req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    console.log('Missing fields in registration request');
    return res.status(400).json({ message: 'Missing fields' });
  }
  
  console.log('Attempting to insert user:', email);
  db.query(
    'INSERT INTO users (email, password) VALUES (?, ?)',
    [email, password],
    (err, results) => {
      if (err) {
        console.error('Database error during registration:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Email already registered' });
        }
        return res.status(500).json({ message: 'Database error', error: err });
      }
      console.log('User registered successfully:', email, 'ID:', results.insertId);
      res.json({ message: 'Registration successful' });
    }
  );
});

// Login endpoint (no hashing)
router.post('/login', (req, res) => {
  console.log('Login request received:', req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    console.log('Missing fields in login request');
    return res.status(400).json({ message: 'Missing fields' });
  }
  
  console.log('Attempting to find user:', email);
  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, results) => {
      if (err) {
        console.error('Database error during login:', err);
        return res.status(500).json({ message: 'Database error', error: err });
      }
      const user = results[0];
      if (!user) {
        console.log('User not found:', email);
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      if (user.password !== password) {
        console.log('Invalid password for user:', email);
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      console.log('User logged in successfully:', email);
      res.json({ message: 'Login successful', user: { id: user.id, email: user.email } });
    }
  );
});

// Save session (draft) endpoint
router.post('/save-session', (req, res) => {
  const { user_email, session_data } = req.body;
  if (!user_email || !session_data) {
    return res.status(400).json({ message: 'Missing user_email or session_data' });
  }
  
  db.query(
    'INSERT INTO sessions (user_email, session_data) VALUES (?, ?)',
    [user_email, JSON.stringify(session_data)],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.json({ message: 'Session saved successfully', sessionId: results.insertId });
    }
  );
});

// Get user sessions endpoint
router.get('/sessions', (req, res) => {
  const { user_email } = req.query;
  console.log("GET /sessions called with user_email:", user_email);
  if (!user_email) {
    console.log("Missing user_email in request");
    return res.status(400).json({ message: 'Missing user_email' });
  }
  
  db.query(
    'SELECT id, session_data, created_at FROM sessions WHERE user_email = ? ORDER BY created_at DESC',
    [user_email],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: 'Database error', error: err });
      }
      console.log("Found sessions:", results);
      res.json({ sessions: results });
    }
  );
});

// Delete session endpoint
router.delete('/session/:id', (req, res) => {
  const { id } = req.params;
  const { user_email } = req.query;
  
  if (!user_email) {
    return res.status(400).json({ message: 'Missing user_email' });
  }
  
  db.query(
    'DELETE FROM sessions WHERE id = ? AND user_email = ?',
    [id, user_email],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: 'Database error', error: err });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Session not found or unauthorized' });
      }
      res.json({ message: 'Session deleted successfully' });
    }
  );
});

module.exports = router; 