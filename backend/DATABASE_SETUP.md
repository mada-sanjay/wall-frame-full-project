# Database Setup Guide

## Quick Fix for Database Connection Error

The error `ER_ACCESS_DENIED_ERROR` means your database credentials are incorrect. Here's how to fix it:

### Step 1: Create Environment File

Create a `.env` file in the `backend` folder with these settings:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=wallframe
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-secret-key-here
```

### Step 2: Install MySQL (if not installed)

**Option A: XAMPP (Recommended for Windows)**
1. Download XAMPP from https://www.apachefriends.org/
2. Install and start MySQL service
3. Default credentials: `root` with no password

**Option B: MySQL Community Server**
1. Download from https://dev.mysql.com/downloads/mysql/
2. Install with default settings
3. Set root password during installation

### Step 3: Run Database Setup

```bash
cd backend
npm install
node setup-database.js
```

### Step 4: Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm start
```

## Troubleshooting

### If you get "Access denied" error:

1. **Check MySQL is running:**
   ```bash
   # Windows (XAMPP)
   # Start MySQL from XAMPP Control Panel
   
   # Windows (MySQL Service)
   net start mysql
   
   # Mac/Linux
   sudo service mysql start
   ```

2. **Test MySQL connection:**
   ```bash
   mysql -u root -p
   ```

3. **Create database manually:**
   ```sql
   CREATE DATABASE wallframe;
   USE wallframe;
   ```

4. **Reset MySQL root password:**
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY '';
   FLUSH PRIVILEGES;
   ```

### If you get "Connection refused" error:

1. Check if MySQL is running
2. Verify the port (default: 3306)
3. Check firewall settings

### Common Issues:

- **XAMPP users**: Make sure MySQL service is started in XAMPP Control Panel
- **WAMP users**: Start MySQL service in WAMP
- **Docker users**: Use `docker-compose up mysql`
- **Cloud databases**: Update host, user, and password in `.env`

## Database Schema

The setup script will create these tables:

1. **users** - User accounts and authentication
2. **drafts** - Saved wall designs
3. **images** - Uploaded images

## Image Storage Process

1. **Upload**: Images are uploaded to `uploads/` folder
2. **Database**: File metadata stored in `images` table
3. **Retrieval**: Images served via `/uploads/` endpoint
4. **Cleanup**: Old images cleaned up automatically

## Need Help?

If you're still having issues:

1. Check the console output for detailed error messages
2. Verify MySQL is running: `mysql -u root -p`
3. Test connection: `node setup-database.js`
4. Check your `.env` file exists and has correct values 