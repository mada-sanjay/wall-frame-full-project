# 🚀 Wall Frame Project - Render Deployment Guide

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **MySQL Database** - You'll need a MySQL database (can use Render's MySQL service)

## 🔧 Step-by-Step Deployment Process

### Step 1: Prepare Your Database

#### Option A: Use Render's MySQL Service
1. Go to Render Dashboard
2. Click "New" → "MySQL"
3. Choose "Free" plan
4. Set database name: `wallframe`
5. Note down the connection details

#### Option B: Use External MySQL (PlanetScale, Railway, etc.)
- Get your MySQL connection string
- Ensure it's accessible from external connections

### Step 2: Set Up Database Tables

Run this SQL in your MySQL database:

```sql
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS wallframe;
USE wallframe;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  plan ENUM('basic', 'pro', 'pro_max') DEFAULT 'basic',
  isAdmin BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drafts table
CREATE TABLE IF NOT EXISTS drafts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  data LONGTEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  draft_id INT NOT NULL,
  image_data LONGTEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (draft_id) REFERENCES drafts(id) ON DELETE CASCADE
);

-- Upgrade requests table
CREATE TABLE IF NOT EXISTS upgrade_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  requested_plan ENUM('pro', 'pro_max') NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Decorations table
CREATE TABLE IF NOT EXISTS decorations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_data LONGTEXT NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert admin user (change email and password)
INSERT INTO users (email, password, isAdmin) VALUES ('admin@example.com', '$2a$10$your_hashed_password_here', TRUE);
```

### Step 3: Deploy to Render

1. **Connect GitHub Repository**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Web Service**
   - **Name**: `wall-frame-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`

3. **Set Environment Variables**
   Click "Environment" tab and add these variables:

   ```
   NODE_ENV=production
   PORT=10000
   DB_HOST=your_mysql_host
   DB_USER=your_mysql_user
   DB_PASS=your_mysql_password
   DB_NAME=wallframe
   DB_PORT=3306
   JWT_SECRET=your_very_long_random_secret_key_here
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   FRONTEND_URL=https://your-frontend-domain.onrender.com
   ALLOWED_ORIGINS=https://your-frontend-domain.onrender.com,http://localhost:3000
   BASIC_PLAN_DRAFTS=3
   PRO_PLAN_DRAFTS=6
   PRO_MAX_PLAN_DRAFTS=999
   ```

### Step 4: Deploy Frontend (Optional)

If you want to deploy frontend separately:

1. **Create Static Site**
   - Go to Render Dashboard
   - Click "New" → "Static Site"
   - Connect your GitHub repository

2. **Configure Static Site**
   - **Name**: `wall-frame-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`

3. **Update Backend CORS**
   - Update `ALLOWED_ORIGINS` in backend environment variables
   - Add your frontend URL to the list

### Step 5: Test Your Deployment

1. **Health Check**: Visit `https://your-backend-name.onrender.com/health`
2. **API Test**: Test your endpoints
3. **Database Connection**: Check logs for database connection success

## 🔒 Security Checklist

- [ ] JWT_SECRET is a strong, random string
- [ ] Database password is strong
- [ ] Email app password is set (not regular password)
- [ ] CORS origins are properly configured
- [ ] No hardcoded secrets in code
- [ ] Environment variables are set in Render

## 🐛 Common Issues & Solutions

### Database Connection Issues
- Check if MySQL service is running
- Verify connection credentials
- Ensure database exists
- Check if IP is whitelisted

### CORS Errors
- Update `ALLOWED_ORIGINS` with your frontend URL
- Check if frontend is making requests to correct backend URL

### Build Failures
- Check if all dependencies are in package.json
- Verify Node.js version compatibility
- Check build logs for specific errors

### Environment Variables
- Ensure all required variables are set in Render
- Check variable names match code exactly
- Restart service after adding variables

## 📞 Support

If you encounter issues:
1. Check Render logs in the dashboard
2. Verify all environment variables are set
3. Test database connection manually
4. Check CORS configuration

## 🔄 Updates

To update your deployment:
1. Push changes to GitHub
2. Render will automatically redeploy
3. Check logs for any issues
4. Test the updated functionality 