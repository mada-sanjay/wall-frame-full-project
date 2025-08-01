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

const testAdminDrafts = async () => {
  try {
    console.log('🔍 Testing admin drafts query...');
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

    // Test the admin drafts query
    console.log('🔍 Testing admin drafts query...');
    
    await new Promise((resolve, reject) => {
      db.query('SELECT d.id, d.user_id, d.user_email, d.data, d.created_at, d.share_token, u.email as userEmail, CONCAT("Draft ", d.id) as name FROM drafts d JOIN users u ON d.user_id = u.id LIMIT 50', (err, results) => {
        if (err) {
          console.error('❌ Admin drafts query error:', err);
          reject(err);
        } else {
          console.log('✅ Admin drafts query successful');
          console.log('📋 Found', results.length, 'drafts');
          results.forEach((draft, index) => {
            console.log(`Draft ${index + 1}: ID=${draft.id}, User=${draft.userEmail}, Name=${draft.name}, Created=${draft.created_at}`);
          });
          resolve();
        }
      });
    });

    console.log('✅ Admin drafts test completed successfully!');
    db.end();
  } catch (error) {
    console.error('❌ Admin drafts test failed:', error);
  }
};

// Run the test
testAdminDrafts(); 