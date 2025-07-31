const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const createConnection = () => {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    // AWS RDS specific settings
    ssl: {
      rejectUnauthorized: false,
      ca: undefined,
      cert: undefined,
      key: undefined
    },
    // Connection timeout settings
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    charset: 'utf8mb4'
  });
};

const createTables = (db) => {
  return new Promise((resolve, reject) => {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        isAdmin BOOLEAN DEFAULT FALSE,
        plan ENUM('basic', 'pro', 'pro_max') DEFAULT 'basic',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS drafts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        data JSON NOT NULL,
        share_token VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS decorations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image VARCHAR(500),
        status ENUM('Active', 'Pending', 'Inactive') DEFAULT 'Active',
        subscription_plan ENUM('basic', 'pro', 'pro_max') DEFAULT 'basic',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS upgrade_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        current_plan ENUM('basic', 'pro', 'pro_max') NOT NULL,
        requested_plan ENUM('basic', 'pro', 'pro_max') NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    ];

    let completed = 0;
    tables.forEach((tableSQL, index) => {
      db.query(tableSQL, (err) => {
        if (err) {
          console.error(`Error creating table ${index + 1}:`, err);
          reject(err);
        } else {
          console.log(`✅ Table ${index + 1} created/verified`);
          completed++;
          if (completed === tables.length) {
            resolve();
          }
        }
      });
    });
  });
};

const createAdminUser = (db) => {
  return new Promise((resolve, reject) => {
    const adminEmail = 'admin@wallframe.com';
    const adminPassword = 'admin123';
    
    bcrypt.hash(adminPassword, 10, (err, hash) => {
      if (err) {
        console.error('Error hashing password:', err);
        reject(err);
        return;
      }

      db.query(
        'INSERT INTO users (email, password, isAdmin, plan) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE password = ?, isAdmin = ?, plan = ?',
        [adminEmail, hash, true, 'pro_max', hash, true, 'pro_max'],
        (err) => {
          if (err) {
            console.error('Error creating admin user:', err);
            reject(err);
          } else {
            console.log('✅ Admin user created/updated');
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
            resolve();
          }
        }
      );
    });
  });
};

const autoSetupDatabase = async () => {
  try {
    console.log('🔄 Auto-setting up database...');
    const db = createConnection();
    
    // Test connection first
    await new Promise((resolve, reject) => {
      db.connect((err) => {
        if (err) {
          console.error('❌ Database connection failed:', err);
          reject(err);
        } else {
          console.log('✅ Database connection successful');
          resolve();
        }
      });
    });
    
    await createTables(db);
    await createAdminUser(db);
    
    console.log('✅ Database auto-setup completed successfully!');
    db.end();
  } catch (error) {
    console.error('❌ Database auto-setup failed:', error);
    console.error('Error details:', error.message);
    // Don't exit - let the app continue
  }
};

module.exports = { autoSetupDatabase }; 