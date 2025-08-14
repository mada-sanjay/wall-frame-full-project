require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'wallframe',
    port: process.env.DB_PORT || 3306
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h'
  },
  
  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    secure: process.env.EMAIL_SECURE === 'true' || false
  },
  
  // CORS Configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'http://localhost:3002', 
        'http://127.0.0.1:3000', 
        'http://127.0.0.1:3001',
        'https://wall-frame-full-project-frontend.onrender.com',
        'http://13.203.67.147',
        'https://13.203.67.147',
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
      ].filter(Boolean)
  },
  
  // File Upload Configuration
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    uploadPath: process.env.UPLOAD_PATH || 'public/uploads'
  },
  
  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
    prefix: '/api'
  },
  
  // Plan Configuration
  plans: {
    basic: {
      name: 'basic',
      draftLimit: 3,
      features: ['Basic wall design', 'Limited decorations']
    },
    pro: {
      name: 'pro', 
      draftLimit: 10,
      features: ['Advanced wall design', 'All decorations', 'Priority support']
    },
    pro_max: {
      name: 'pro_max',
      draftLimit: 50,
      features: ['Unlimited wall designs', 'All decorations', 'Premium support', 'Custom uploads']
    }
  }
};

module.exports = config; 