# Environment Variables Configuration

This document describes all environment variables used in the WallFrame application.

## Backend Environment Variables (.env)

### Server Configuration
```env
PORT=5000
NODE_ENV=development
```

### Database Configuration
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=wallframe
DB_PORT=3306
```

### JWT Configuration
```env
JWT_SECRET=your_very_long_random_secret_key_here_change_in_production
JWT_EXPIRES_IN=2h
```

### Email Configuration
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_SECURE=false
```

### CORS Configuration
```env
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.onrender.com
```

### File Upload Configuration
```env
MAX_FILE_SIZE=5242880
UPLOAD_PATH=public/uploads
```

### API Configuration
```env
API_BASE_URL=http://localhost:5000
```

## Frontend Environment Variables (.env)

### API Configuration
```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

### Feature Flags
```env
REACT_APP_ENABLE_EMAIL_NOTIFICATIONS=true
REACT_APP_ENABLE_FILE_UPLOAD=true
REACT_APP_ENABLE_ADMIN_PANEL=true
```

### Upload Configuration
```env
REACT_APP_MAX_FILE_SIZE=5242880
```

### App Configuration
```env
REACT_APP_APP_NAME=WallFrame
REACT_APP_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development
```

## Production Configuration

For production deployment, update these values:

### Backend (.env)
```env
NODE_ENV=production
JWT_SECRET=your_production_secret_key_here
ALLOWED_ORIGINS=https://your-frontend-domain.com
API_BASE_URL=https://your-backend-domain.com
```

### Frontend (.env)
```env
REACT_APP_API_BASE_URL=https://your-backend-domain.com
REACT_APP_ENVIRONMENT=production
```

## Security Notes

1. **JWT_SECRET**: Use a strong, random string (at least 32 characters)
2. **Database Password**: Use a strong password for production
3. **Email Credentials**: Use app-specific passwords for Gmail
4. **CORS Origins**: Only include trusted domains in production
5. **File Upload Limits**: Set appropriate limits for your use case

## Configuration Files

The application uses centralized configuration files:

- `backend/config/config.js` - Backend configuration
- `frontend/src/config/config.js` - Frontend configuration

These files automatically load environment variables and provide fallback defaults. 