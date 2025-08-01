const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/emailService');
const config = require('../config/config');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// --- ADMIN MIDDLEWARE ---
function requireAdmin(req, res, next) {
  // req.user is set by authenticateToken
  const userId = req.user && req.user.id;
  console.log('🔍 requireAdmin middleware - User ID:', userId);
  if (!userId) {
    console.log('❌ requireAdmin - No user ID found');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  db.query(
    'SELECT isAdmin FROM users WHERE id = ?',
    [userId],
    (err, results) => {
      if (err) {
        console.error('❌ requireAdmin - Database error:', err);
        return res.status(500).json({ message: 'Database error', error: err });
      }
      if (!results.length || !results[0].isAdmin) {
        console.log('❌ requireAdmin - User is not admin. Results:', results);
        return res.status(403).json({ message: 'Admin access required' });
      }
      console.log('✅ requireAdmin - User is admin');
      next();
    }
  );
}

// Admin: Delete user's draft
router.delete('/delete-draft/:id', authenticateToken, requireAdmin, async (req, res) => {
  console.log('DELETE /delete-draft/:id called with:', req.params, req.query);
  const { id } = req.params;
  const { userEmail } = req.query;

  try {
    console.log('Sending draft deletion email to', userEmail, 'for draft', id);
    const emailSent = await sendEmail(userEmail, 'draftDeletion', id);
    console.log('Email sent result (draft deletion):', emailSent);
    // Delete the draft from drafts table
    db.query(
      'DELETE d FROM drafts d JOIN users u ON d.user_id = u.id WHERE d.id = ? AND u.email = ?',
      [id, userEmail],
      (err, result) => {
        if (err) {
          console.error('Error deleting draft:', err);
          return res.status(500).json({ message: 'Failed to delete draft' });
        }

        console.log('Delete result:', result);
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Draft not found' });
        }

        res.json({ message: 'Draft deleted successfully' });
      }
    );
  } catch (error) {
    console.error('Error in delete-draft:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  db.query('SELECT * FROM users ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    console.log('Users fetched:', results.length);
    res.json({ users: results });
  });
});

// Get all drafts
router.get('/drafts', authenticateToken, requireAdmin, (req, res) => {
  console.log('🔍 Admin /drafts endpoint called');
  console.log('🔍 User making request:', req.user);
  console.log('🔍 User ID:', req.user.id);
  
  db.query('SELECT d.id, d.user_id, d.user_email, d.data, d.created_at, d.share_token, u.email as userEmail, CONCAT("Draft ", d.id) as name FROM drafts d JOIN users u ON d.user_id = u.id LIMIT 50', (err, results) => {
    if (err) {
      console.error('❌ Admin drafts query error:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
    console.log('✅ Admin drafts fetched:', results.length);
    console.log('🔍 Draft IDs:', results.map(r => r.id));
    console.log('🔍 Draft users:', results.map(r => r.userEmail));
    res.json({ drafts: results });
  });
});

// Get admin stats
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  Promise.all([
    new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM users', (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    }),
    new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM drafts', (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    })
  ])
    .then(([userCount, draftCount]) => {
      console.log('Stats - Users:', userCount, 'Drafts:', draftCount);
      res.json({ userCount, draftCount });
    })
    .catch(err => {
      console.error('Error getting stats:', err);
      res.status(500).json({ message: 'Database error', error: err });
    });
});

module.exports = router; 