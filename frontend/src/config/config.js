const config = {
  // API Configuration
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://13.203.67.147:5000',
    prefix: process.env.REACT_APP_API_PREFIX || '/api'
  },
  
  // App Configuration
  app: {
    name: 'WallFrame',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  
  // Feature Flags
  features: {
    enableEmailNotifications: process.env.REACT_APP_ENABLE_EMAIL_NOTIFICATIONS === 'true' || true,
    enableFileUpload: process.env.REACT_APP_ENABLE_FILE_UPLOAD === 'true' || true,
    enableAdminPanel: process.env.REACT_APP_ENABLE_ADMIN_PANEL === 'true' || true
  },
  
  // Upload Configuration
  upload: {
    maxFileSize: process.env.REACT_APP_MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
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

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  const baseUrl = config.api.baseUrl;
  const prefix = config.api.prefix;
  const fullUrl = `${baseUrl}${prefix}${endpoint}`;
  console.log('🔍 API Config:', { 
    baseUrl, 
    prefix, 
    endpoint, 
    fullUrl,
    envVar: process.env.REACT_APP_API_BASE_URL,
    nodeEnv: process.env.NODE_ENV
  });
  return fullUrl;
};

// Helper function to get admin API URL
export const getAdminApiUrl = (endpoint) => {
  const baseUrl = config.api.baseUrl;
  const prefix = config.api.prefix;
  const fullUrl = `${baseUrl}${prefix}/admin${endpoint}`;
  console.log('🔍 Admin API Config:', { baseUrl, prefix, endpoint, fullUrl });
  return fullUrl;
};

export default config; 