# 🔧 Environment Variables Reference

## Required Environment Variables

### Database Configuration
```
DB_HOST=your_mysql_host
DB_USER=your_mysql_username
DB_PASS=your_mysql_password
DB_NAME=wallframe
DB_PORT=3306
```

### Server Configuration
```
PORT=5000
NODE_ENV=production
```

### JWT Configuration
```
JWT_SECRET=your_very_long_random_secret_key_here_change_in_production
```

### Email Configuration (for notifications)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
```

### Frontend URL (for CORS)
```
FRONTEND_URL=https://your-frontend-domain.onrender.com
ALLOWED_ORIGINS=https://your-frontend-domain.onrender.com,http://localhost:3000
```

### Plan Limits
```
BASIC_PLAN_DRAFTS=3
PRO_PLAN_DRAFTS=6
PRO_MAX_PLAN_DRAFTS=999
```

## 🔒 Security Notes

1. **JWT_SECRET**: Use a strong, random string (at least 32 characters)
2. **DB_PASS**: Use a strong database password
3. **EMAIL_PASS**: Use an app password, not your regular Gmail password
4. **ALLOWED_ORIGINS**: Only include trusted domains

## 🚀 Render Deployment

When deploying to Render, set these environment variables in the Render dashboard:

1. Go to your service in Render
2. Click "Environment" tab
3. Add each variable with its value
4. Click "Save Changes"
5. Restart your service

## 📝 Example Values

```
NODE_ENV=production
PORT=10000
DB_HOST=your-render-mysql-host.render.com
DB_USER=wallframe_user
DB_PASS=your_strong_password_123
DB_NAME=wallframe
DB_PORT=3306
JWT_SECRET=my_super_secret_jwt_key_that_is_very_long_and_random_12345
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-app@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=https://your-frontend.onrender.com
ALLOWED_ORIGINS=https://your-frontend.onrender.com,http://localhost:3000
BASIC_PLAN_DRAFTS=3
PRO_PLAN_DRAFTS=6
PRO_MAX_PLAN_DRAFTS=999
``` 