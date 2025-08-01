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

const testDrafts = async () => {
  try {
    console.log('🔍 Testing drafts query...');
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

    // Test the exact query that's failing
    const user_email = 'madhasanjaypatel13@gmail.com';
    console.log('🔍 Testing query for user_email:', user_email);
    
    // Try without ORDER BY first
    await new Promise((resolve, reject) => {
      db.query(
        'SELECT d.id, d.data as session_data, d.created_at, d.share_token FROM drafts d WHERE d.user_email = ? LIMIT 20',
        [user_email],
        (err, results) => {
          if (err) {
            console.error('❌ Query error (no ORDER BY):', err);
            reject(err);
          } else {
            console.log('✅ Query successful (no ORDER BY)');
            console.log('📋 Found', results.length, 'drafts');
            results.forEach((draft, index) => {
              console.log(`Draft ${index + 1}: ID=${draft.id}, Created=${draft.created_at}, Has data=${!!draft.session_data}`);
            });
            resolve();
          }
        }
      );
    });

    // Also check all drafts to see the current state
    console.log('\n🔍 Checking all drafts in database:');
    await new Promise((resolve, reject) => {
      db.query('SELECT * FROM drafts', (err, results) => {
        if (err) {
          console.error('❌ Error fetching all drafts:', err);
          reject(err);
        } else {
          console.log('📋 Total drafts in database:', results.length);
          results.forEach(draft => {
            console.log(`ID: ${draft.id}, User ID: ${draft.user_id}, User Email: ${draft.user_email || 'EMPTY'}, Created: ${draft.created_at}`);
          });
          resolve();
        }
      });
    });

    console.log('✅ Test completed successfully!');
    db.end();
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testDrafts(); 