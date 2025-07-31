const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const { autoSetupDatabase } = require('./utils/autoSetupDb');

const app = express();

// Production-ready CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (config.cors.allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Increase payload limit for image uploads
app.use(express.json({ limit: config.upload.maxFileSize }));
app.use(express.urlencoded({ limit: config.upload.maxFileSize, extended: true }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, config.upload.uploadPath)));

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test database connection endpoint
app.get('/test-db', async (req, res) => {
  try {
    const db = require('./db');
    db.query('SELECT 1 as test', (err, results) => {
      if (err) {
        console.error('Database test failed:', err);
        res.status(500).json({ error: 'Database connection failed', details: err.message });
      } else {
        res.status(200).json({ 
          status: 'Database connected', 
          test: results[0].test,
          timestamp: new Date().toISOString() 
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Database test failed', details: error.message });
  }
});

// Test database connection
const db = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const decorationRoutes = require('./routes/decorations');
const adminRoutes = require('./routes/admin');
app.use(config.api.prefix, authRoutes);
app.use(`${config.api.prefix}/admin`, decorationRoutes);
app.use(`${config.api.prefix}/admin`, adminRoutes);

// API-only backend - frontend is served separately
// No need to serve frontend files since we have separate frontend service

app.listen(config.port, async () => {
  console.log(`🚀 Backend running on port ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔗 CORS Origins: ${config.cors.allowedOrigins.join(', ')}`);
  
  // Auto-setup database on startup
  await autoSetupDatabase();
}); 