const express = require('express');
const router = express.Router();
const db = require('../db');

// Register endpoint (no hashing)
router.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
  db.query(
    'INSERT INTO users (email, password) VALUES (?, ?)',
    [email, password],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Email already registered' });
        }
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.json({ message: 'Registration successful' });
    }
  );
});

// Login endpoint (no hashing)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (results.length === 0) return res.status(400).json({ message: 'Invalid credentials' });
      const user = results[0];
      if (user.password !== password) return res.status(400).json({ message: 'Invalid credentials' });
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
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.json({ message: 'Session saved successfully', sessionId: result.insertId });
    }
  );
});

module.exports = router; 