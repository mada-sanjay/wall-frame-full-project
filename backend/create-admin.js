const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('👑 Creating Admin User');
console.log('======================');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  connectTimeout: 10000,
  charset: 'utf8mb4'
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }

  console.log('✅ Connected to database');
  
  // Admin user details
  const adminEmail = 'admin@wallframe.com';
  const adminPassword = 'admin123';
  
  // Hash the password
  bcrypt.hash(adminPassword, 10, (err, hash) => {
    if (err) {
      console.error('❌ Error hashing password:', err.message);
      process.exit(1);
    }
    
    console.log('🔐 Password hashed successfully');
    
    // Check if admin user already exists
    connection.query('SELECT * FROM users WHERE email = ?', [adminEmail], (err, results) => {
      if (err) {
        console.error('❌ Error checking existing admin:', err.message);
        process.exit(1);
      }
      
      if (results.length > 0) {
        console.log('⚠️ Admin user already exists, updating...');
        
        // Update existing admin
        connection.query(
          'UPDATE users SET password = ?, isAdmin = TRUE, plan = "pro_max" WHERE email = ?',
          [hash, adminEmail],
          (err) => {
            if (err) {
              console.error('❌ Error updating admin:', err.message);
              process.exit(1);
            }
            
            console.log('✅ Admin user updated successfully!');
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
            console.log(`👑 Role: Admin`);
            console.log(`📋 Plan: pro_max`);
            
            connection.end();
          }
        );
      } else {
        console.log('👑 Creating new admin user...');
        
        // Create new admin user
        connection.query(
          'INSERT INTO users (email, password, isAdmin, plan) VALUES (?, ?, TRUE, "pro_max")',
          [adminEmail, hash],
          (err) => {
            if (err) {
              console.error('❌ Error creating admin:', err.message);
              process.exit(1);
            }
            
            console.log('✅ Admin user created successfully!');
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
            console.log(`👑 Role: Admin`);
            console.log(`📋 Plan: pro_max`);
            
            connection.end();
          }
        );
      }
    });
  });
}); 