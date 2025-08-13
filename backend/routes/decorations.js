const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config/config');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save into backend/public/uploads
    cb(null, path.join(__dirname, '../public/uploads'));
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

// Middleware functions
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
    return res.status(400).json({ message: 'Name, category, and image are required' });
  }
  
  db.query(
    'INSERT INTO decorations (name, category, image, subscription_plan, status) VALUES (?, ?, ?, ?, "Active")',
    [name, category, image, subscription_plan],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      
      // Get the newly created decoration
      db.query('SELECT * FROM decorations WHERE id = ?', [results.insertId], (err2, rows) => {
        if (err2 || !rows.length) return res.status(500).json({ message: 'Failed to retrieve created decoration' });
        
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

// Delete decoration with file cleanup
router.delete('/decorations/:id', authenticateToken, requireAdmin, (req, res) => {
  const decorationId = req.params.id;
  
  // First, get the decoration to find the image file
  db.query('SELECT * FROM decorations WHERE id = ?', [decorationId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Decoration not found' });
    }
    
    const decoration = results[0];
    const imagePath = decoration.image;
    
    // Delete from database first
    db.query('DELETE FROM decorations WHERE id = ?', [decorationId], (err2, results2) => {
      if (err2) return res.status(500).json({ message: 'Database error', error: err2 });
      
      // If the decoration has an uploaded image file, delete it from the server
      if (imagePath && imagePath.startsWith('/uploads/')) {
        // Ensure we resolve to backend/public/uploads even if imagePath starts with '/'
        const relativeImagePath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        const filePath = path.join(__dirname, '../public', relativeImagePath);
        
        // Check if file exists and delete it
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err3) => {
            if (err3) {
              console.error('Error deleting file:', err3);
              // Don't fail the request if file deletion fails
            } else {
              console.log('✅ Uploaded file deleted:', filePath);
            }
          });
        }
      }
      
      res.json({ 
        message: 'Decoration deleted successfully',
        deletedFile: imagePath && imagePath.startsWith('/uploads/') ? imagePath : null
      });
    });
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

// Public: List decorations by subscription plan (Base64 image if local file)
const mime = require('mime-types');
router.get('/public/:plan', async (req, res) => {
  const { plan } = req.params;
  const validPlans = ['basic', 'pro', 'pro_max'];
  if (!validPlans.includes(plan)) {
    return res.status(400).json({ message: 'Invalid subscription plan' });
  }
  let query;
  let params = [];
  if (plan === 'basic') {
    query = 'SELECT * FROM decorations WHERE status = "Active" AND subscription_plan = "basic" ORDER BY id DESC';
  } else if (plan === 'pro') {
    query = 'SELECT * FROM decorations WHERE status = "Active" AND (subscription_plan = "basic" OR subscription_plan = "pro") ORDER BY id DESC';
  } else if (plan === 'pro_max') {
    query = 'SELECT * FROM decorations WHERE status = "Active" ORDER BY id DESC';
  }
  db.query(query, params, async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    const decorationsWithBase64 = await Promise.all(results.map(async decoration => {
      let image = decoration.image;
      if (image && !image.startsWith('http') && !image.startsWith('data:')) {
        try {
          const filePath = path.join(__dirname, '../public', image.startsWith('/') ? image : `/${image}`);
          const mimeType = mime.lookup(filePath) || 'image/png';
          const fileData = fs.readFileSync(filePath);
          image = `data:${mimeType};base64,${fileData.toString('base64')}`;
        } catch (e) {
          image = null;
        }
      }
      return { ...decoration, image };
    }));
    res.json({ decorations: decorationsWithBase64 });
  });
});

// Public: List all active decorations for users (Base64 image if local file)
router.get('/public', async (req, res) => {
  db.query('SELECT * FROM decorations WHERE status = "Active" AND subscription_plan = "basic" ORDER BY id DESC', async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    const decorationsWithBase64 = await Promise.all(results.map(async decoration => {
      let image = decoration.image;
      if (image && !image.startsWith('http') && !image.startsWith('data:')) {
        try {
          const filePath = path.join(__dirname, '../public', image.startsWith('/') ? image : `/${image}`);
          const mimeType = mime.lookup(filePath) || 'image/png';
          const fileData = fs.readFileSync(filePath);
          image = `data:${mimeType};base64,${fileData.toString('base64')}`;
        } catch (e) {
          image = null;
        }
      }
      return { ...decoration, image };
    }));
    res.json({ decorations: decorationsWithBase64 });
  });
});

module.exports = router; 