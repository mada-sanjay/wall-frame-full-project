const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', config.upload.uploadPath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: function (req, file, cb) {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

function requireAdmin(req, res, next) {
  db.query('SELECT isAdmin FROM users WHERE id = ?', [req.user.id], (err, results) => {
    if (err || !results.length || !results[0].isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
}

// List all decorations
router.get('/decorations', authenticateToken, requireAdmin, (req, res) => {
  db.query('SELECT * FROM decorations WHERE status = "Active" ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    
    // Fix image URLs - handle both full URLs and relative paths
    const decorationsWithFixedUrls = results.map(decoration => ({
      ...decoration,
      image: decoration.image ? 
        (decoration.image.startsWith('http') ? decoration.image : `${config.api.baseUrl}${decoration.image}`) : 
        null
    }));
    
    res.json({ decorations: decorationsWithFixedUrls });
  });
});

// List pending decorations
router.get('/decorations/pending', authenticateToken, requireAdmin, (req, res) => {
  db.query('SELECT * FROM decorations WHERE status = "Pending" ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    
    // Fix image URLs - handle both full URLs and relative paths
    const decorationsWithFixedUrls = results.map(decoration => ({
      ...decoration,
      image: decoration.image ? 
        (decoration.image.startsWith('http') ? decoration.image : `${config.api.baseUrl}${decoration.image}`) : 
        null
    }));
    
    res.json({ decorations: decorationsWithFixedUrls });
  });
});

// Add new decoration
router.post('/decorations', authenticateToken, requireAdmin, (req, res) => {
  const { name, category, image, subscription_plan = 'basic' } = req.body;
  if (!name || !category || !image) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  
  // Validate subscription plan
  const validPlans = ['basic', 'pro', 'pro_max'];
  if (!validPlans.includes(subscription_plan)) {
    return res.status(400).json({ message: 'Invalid subscription plan' });
  }
  
  db.query('INSERT INTO decorations (name, category, image, status, subscription_plan) VALUES (?, ?, ?, "Active", ?)',
    [name, category, image, subscription_plan],
    (err, results) => {
      if (err) {
        console.error('Error adding decoration:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      db.query('SELECT * FROM decorations WHERE id = ?', [results.insertId], (err2, rows) => {
        if (err2 || !rows.length) return res.json({ message: 'Decoration added' });
        
        // Fix image URL - handle both full URLs and relative paths
        const decorationWithFixedUrl = {
          ...rows[0],
          image: rows[0].image ? 
            (rows[0].image.startsWith('http') ? rows[0].image : `${config.api.baseUrl}${rows[0].image}`) : 
            null
        };
        
        res.json({ decoration: decorationWithFixedUrl });
      });
    }
  );
});

// Delete decoration
router.delete('/decorations/:id', authenticateToken, requireAdmin, (req, res) => {
  db.query('DELETE FROM decorations WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: 'Decoration deleted' });
  });
});

// Approve pending decoration
router.post('/decorations/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  db.query('UPDATE decorations SET status = "Active" WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    db.query('SELECT * FROM decorations WHERE id = ?', [req.params.id], (err2, rows) => {
      if (err2 || !rows.length) return res.json({ message: 'Decoration approved' });
      
      // Fix image URL - handle both full URLs and relative paths
      const decorationWithFixedUrl = {
        ...rows[0],
        image: rows[0].image ? 
          (rows[0].image.startsWith('http') ? rows[0].image : `${config.api.baseUrl}${rows[0].image}`) : 
          null
      };
    
      res.json({ decoration: decorationWithFixedUrl });
    });
  });
});

// Reject pending decoration
router.post('/decorations/:id/reject', authenticateToken, requireAdmin, (req, res) => {
  db.query('DELETE FROM decorations WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: 'Decoration rejected and deleted' });
  });
});

// Upload image endpoint
router.post('/upload-image', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Return the file path relative to the public directory
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Public: List decorations by subscription plan
router.get('/decorations/public/:plan', (req, res) => {
  const { plan } = req.params;
  const validPlans = ['basic', 'pro', 'pro_max'];
  
  if (!validPlans.includes(plan)) {
    return res.status(400).json({ message: 'Invalid subscription plan' });
  }
  
  // Filter decorations by subscription plan
  let query;
  let params = [];
  
  if (plan === 'basic') {
    // Basic users get only basic decorations
    query = 'SELECT * FROM decorations WHERE status = "Active" AND subscription_plan = "basic" ORDER BY id DESC';
  } else if (plan === 'pro') {
    // Pro users get basic and pro decorations
    query = 'SELECT * FROM decorations WHERE status = "Active" AND (subscription_plan = "basic" OR subscription_plan = "pro") ORDER BY id DESC';
  } else if (plan === 'pro_max') {
    // Pro_max users get all decorations
    query = 'SELECT * FROM decorations WHERE status = "Active" ORDER BY id DESC';
  }
  
  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    
    // Fix image URLs - handle both full URLs and relative paths
    const decorationsWithFixedUrls = results.map(decoration => ({
      ...decoration,
      image: decoration.image ? 
        (decoration.image.startsWith('http') ? decoration.image : `${config.api.baseUrl}${decoration.image}`) : 
        null
    }));
    
    res.json({ decorations: decorationsWithFixedUrls });
  });
});

// Public: List all active decorations for users
router.get('/decorations/public', (req, res) => {
  // Default to basic decorations for backward compatibility
  db.query('SELECT * FROM decorations WHERE status = "Active" AND subscription_plan = "basic" ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    
    // Fix image URLs - handle both full URLs and relative paths
    const decorationsWithFixedUrls = results.map(decoration => ({
      ...decoration,
      image: decoration.image ? 
        (decoration.image.startsWith('http') ? decoration.image : `${config.api.baseUrl}${decoration.image}`) : 
        null
    }));
    
    res.json({ decorations: decorationsWithFixedUrls });
  });
});

module.exports = router; 