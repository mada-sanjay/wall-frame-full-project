const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_secret_key';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  db.query('SELECT isAdmin FROM users WHERE id = ?', [req.user.id], (err, results) => {
    if (err || !results.length || !results[0].isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
}

// List all decorations
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  db.query('SELECT * FROM decorations WHERE status != "Pending" ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ decorations: results });
  });
});

// List pending decorations
router.get('/pending', authenticateToken, requireAdmin, (req, res) => {
  db.query('SELECT * FROM decorations WHERE status = "Pending" ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ decorations: results });
  });
});

// Add new decoration
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { name, category, image } = req.body;
  if (!name || !category || !image) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  db.query('INSERT INTO decorations (name, category, image, status) VALUES (?, ?, ?, "Active")',
    [name, category, image],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      db.query('SELECT * FROM decorations WHERE id = ?', [results.insertId], (err2, rows) => {
        if (err2 || !rows.length) return res.json({ message: 'Decoration added' });
        res.json({ decoration: rows[0] });
      });
    }
  );
});

// Delete decoration
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  db.query('DELETE FROM decorations WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: 'Decoration deleted' });
  });
});

// Approve pending decoration
router.post('/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  db.query('UPDATE decorations SET status = "Active" WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    db.query('SELECT * FROM decorations WHERE id = ?', [req.params.id], (err2, rows) => {
      if (err2 || !rows.length) return res.json({ message: 'Decoration approved' });
      res.json({ decoration: rows[0] });
    });
  });
});

// Reject pending decoration
router.post('/:id/reject', authenticateToken, requireAdmin, (req, res) => {
  db.query('DELETE FROM decorations WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: 'Decoration rejected and deleted' });
  });
});

// Public: List all active decorations for users
router.get('/public', (req, res) => {
  db.query('SELECT * FROM decorations WHERE status = "Active" ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ decorations: results });
  });
});

module.exports = router; 