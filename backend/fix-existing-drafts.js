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

const fixExistingDrafts = async () => {
  try {
    console.log('🔧 Fixing existing drafts with missing user_email...');
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

    // First, let's see what drafts exist
    await new Promise((resolve, reject) => {
      db.query('SELECT * FROM drafts', (err, results) => {
        if (err) {
          console.error('❌ Error fetching drafts:', err);
          reject(err);
        } else {
          console.log(`📋 Found ${results.length} drafts in database`);
          results.forEach(draft => {
            console.log(`Draft ID: ${draft.id}, User ID: ${draft.user_id}, User Email: ${draft.user_email || 'EMPTY'}`);
          });
          resolve();
        }
      });
    });

    // Update drafts with missing user_email
    await new Promise((resolve, reject) => {
      db.query(`
        UPDATE drafts d 
        JOIN users u ON d.user_id = u.id 
        SET d.user_email = u.email 
        WHERE d.user_email IS NULL OR d.user_email = ''
      `, (err, result) => {
        if (err) {
          console.error('❌ Error updating drafts:', err);
          reject(err);
        } else {
          console.log(`✅ Updated ${result.affectedRows} drafts with user_email`);
          resolve();
        }
      });
    });

    // Verify the fix
    await new Promise((resolve, reject) => {
      db.query('SELECT * FROM drafts', (err, results) => {
        if (err) {
          console.error('❌ Error verifying drafts:', err);
          reject(err);
        } else {
          console.log(`📋 Verification: ${results.length} drafts in database`);
          results.forEach(draft => {
            console.log(`Draft ID: ${draft.id}, User ID: ${draft.user_id}, User Email: ${draft.user_email || 'STILL EMPTY'}`);
          });
          resolve();
        }
      });
    });

    console.log('✅ Existing drafts fixed successfully!');
    db.end();
  } catch (error) {
    console.error('❌ Error fixing existing drafts:', error);
  }
};

// Run the fix if this script is executed directly
if (require.main === module) {
  fixExistingDrafts();
}

module.exports = { fixExistingDrafts }; 