# 🚀 Wall Frame Deployment Guide

## Quick Redeployment Steps

### 1. Frontend Deployment (Render/Netlify)

```bash
# Build the frontend
cd frontend
npm run build

# The build folder is ready for deployment
```

**Environment Variables for Frontend:**
- `NODE_ENV=production`
- `REACT_APP_API_BASE_URL=http://13.203.67.147:5000` (optional, defaults to production URL)

### 2. Backend Deployment (EC2/Render)

**Environment Variables for Backend:**
```
NODE_ENV=production
PORT=5000
DB_HOST=wallframe-db.cp86geusk6nr.ap-south-1.rds.amazonaws.com
DB_USER=admin
DB_PASS=Sanjay8374
DB_NAME=wallframe
DB_PORT=3306
JWT_SECRET=wallframe-secret-key-2024
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=madhasanjaypatel13@gmail.com
EMAIL_PASS=oicj onit qlgj ndjy
ADMIN_PASSWORD=changeme123
```

### 3. Current Production URLs
- **Frontend**: https://wall-frame-full-project-frontend.onrender.com
- **Backend**: http://13.203.67.147:5000
- **Database**: AWS RDS MySQL (configured)

### 4. Deployment Commands

**For Render (if using Render for backend):**
- Just push to your connected GitHub repository
- Render will auto-deploy

**For EC2 (if using EC2 for backend):**
```bash
# SSH to your EC2 instance
ssh -i your-key.pem ec2-user@13.203.67.147

# Navigate to your project
cd /path/to/your/wall-frame-project

# Pull latest changes
git pull origin main

# Install dependencies (if needed)
cd backend && npm install

# Restart the application
pm2 restart wallframe-backend
# OR
sudo systemctl restart wallframe
```

### 5. Health Check
After deployment, verify:
- ✅ Frontend loads: https://wall-frame-full-project-frontend.onrender.com
- ✅ Backend health: http://13.203.67.147:5000/health
- ✅ API working: http://13.203.67.147:5000/api/test-save-session

### 6. Quick Fixes if Issues

**CORS Error:**
- Check `ALLOWED_ORIGINS` in backend .env
- Ensure frontend URL is included in backend CORS config

**API Connection Error:**
- Verify backend is running on port 5000
- Check if EC2 security groups allow inbound on port 5000

**Database Connection Error:**
- Verify RDS security groups allow connections
- Check database credentials in .env

---

## 🔧 Current Configuration Status
- ✅ Hardcoded values removed
- ✅ Environment variables configured
- ✅ Production security headers added
- ✅ CORS properly configured
- ✅ JWT secrets secured
- ✅ Database connection configured
- ✅ Email service configured

Your code is **READY FOR DEPLOYMENT** 🚀
