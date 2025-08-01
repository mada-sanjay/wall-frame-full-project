const mysql = require('mysql2');
const config = require('./config/config');

const createConnection = () => {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 60000,
    charset: 'utf8mb4'
  });
};

const testAdminAuth = async () => {
  try {
    console.log('🔍 Testing admin authentication...');
    const db = createConnection();
    
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

    // Check admin user
    console.log('🔍 Checking admin user...');
    await new Promise((resolve, reject) => {
      db.query('SELECT * FROM users WHERE email = ?', ['admin@wallframe.com'], (err, results) => {
        if (err) {
          console.error('❌ Error checking admin user:', err);
          reject(err);
        } else {
          if (results.length > 0) {
            const admin = results[0];
            console.log('✅ Admin user found:');
            console.log(`  - ID: ${admin.id}`);
            console.log(`  - Email: ${admin.email}`);
            console.log(`  - Is Admin: ${admin.isAdmin}`);
            console.log(`  - Plan: ${admin.plan}`);
            console.log(`  - Created: ${admin.created_at}`);
          } else {
            console.log('❌ Admin user not found!');
          }
          resolve();
        }
      });
    });

    // Check all users
    console.log('\n🔍 Checking all users...');
    await new Promise((resolve, reject) => {
      db.query('SELECT id, email, isAdmin, plan, created_at FROM users', (err, results) => {
        if (err) {
          console.error('❌ Error checking users:', err);
          reject(err);
        } else {
          console.log(`📋 Total users: ${results.length}`);
          results.forEach(user => {
            console.log(`  - ID: ${user.id}, Email: ${user.email}, Admin: ${user.isAdmin}, Plan: ${user.plan}`);
          });
          resolve();
        }
      });
    });

    console.log('✅ Admin authentication test completed successfully!');
    db.end();
  } catch (error) {
    console.error('❌ Admin authentication test failed:', error);
  }
};

// Run the test
testAdminAuth(); 