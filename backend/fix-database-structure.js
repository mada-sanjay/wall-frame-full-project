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

const fixDatabaseStructure = async () => {
  try {
    console.log('🔧 Fixing database structure...');
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

    // Check if drafts table exists and has user_email column
    await new Promise((resolve, reject) => {
      db.query('DESCRIBE drafts', (err, results) => {
        if (err) {
          console.log('❌ Drafts table does not exist, creating it...');
          // Create the drafts table
          const createDraftsTable = `
            CREATE TABLE drafts (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL,
              user_email VARCHAR(255) NOT NULL,
              data JSON NOT NULL,
              share_token VARCHAR(255) UNIQUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `;
          db.query(createDraftsTable, (err2) => {
            if (err2) {
              console.error('❌ Error creating drafts table:', err2);
              reject(err2);
            } else {
              console.log('✅ Drafts table created successfully');
              resolve();
            }
          });
        } else {
          console.log('✅ Drafts table exists, checking columns...');
          const hasUserEmail = results.some(col => col.Field === 'user_email');
          if (!hasUserEmail) {
            console.log('❌ user_email column missing, adding it...');
            db.query('ALTER TABLE drafts ADD COLUMN user_email VARCHAR(255) NOT NULL AFTER user_id', (err2) => {
              if (err2) {
                console.error('❌ Error adding user_email column:', err2);
                reject(err2);
              } else {
                console.log('✅ user_email column added successfully');
                resolve();
              }
            });
          } else {
            console.log('✅ user_email column exists');
            resolve();
          }
        }
      });
    });

    // Check if users table exists
    await new Promise((resolve, reject) => {
      db.query('DESCRIBE users', (err, results) => {
        if (err) {
          console.log('❌ Users table does not exist, creating it...');
          const createUsersTable = `
            CREATE TABLE users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              email VARCHAR(255) UNIQUE NOT NULL,
              password VARCHAR(255) NOT NULL,
              isAdmin BOOLEAN DEFAULT FALSE,
              plan ENUM('basic', 'pro', 'pro_max') DEFAULT 'basic',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
          `;
          db.query(createUsersTable, (err2) => {
            if (err2) {
              console.error('❌ Error creating users table:', err2);
              reject(err2);
            } else {
              console.log('✅ Users table created successfully');
              resolve();
            }
          });
        } else {
          console.log('✅ Users table exists');
          resolve();
        }
      });
    });

    // Check if decorations table exists
    await new Promise((resolve, reject) => {
      db.query('DESCRIBE decorations', (err, results) => {
        if (err) {
          console.log('❌ Decorations table does not exist, creating it...');
          const createDecorationsTable = `
            CREATE TABLE decorations (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              category VARCHAR(100) NOT NULL,
              image VARCHAR(500),
              status ENUM('Active', 'Pending', 'Inactive') DEFAULT 'Active',
              subscription_plan ENUM('basic', 'pro', 'pro_max') DEFAULT 'basic',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
          `;
          db.query(createDecorationsTable, (err2) => {
            if (err2) {
              console.error('❌ Error creating decorations table:', err2);
              reject(err2);
            } else {
              console.log('✅ Decorations table created successfully');
              resolve();
            }
          });
        } else {
          console.log('✅ Decorations table exists');
          resolve();
        }
      });
    });

    // Check if upgrade_requests table exists
    await new Promise((resolve, reject) => {
      db.query('DESCRIBE upgrade_requests', (err, results) => {
        if (err) {
          console.log('❌ Upgrade_requests table does not exist, creating it...');
          const createUpgradeRequestsTable = `
            CREATE TABLE upgrade_requests (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_email VARCHAR(255) NOT NULL,
              current_plan ENUM('basic', 'pro', 'pro_max') NOT NULL,
              requested_plan ENUM('basic', 'pro', 'pro_max') NOT NULL,
              status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
          `;
          db.query(createUpgradeRequestsTable, (err2) => {
            if (err2) {
              console.error('❌ Error creating upgrade_requests table:', err2);
              reject(err2);
            } else {
              console.log('✅ Upgrade_requests table created successfully');
              resolve();
            }
          });
        } else {
          console.log('✅ Upgrade_requests table exists');
          resolve();
        }
      });
    });

    console.log('✅ Database structure fixed successfully!');
    db.end();
  } catch (error) {
    console.error('❌ Error fixing database structure:', error);
  }
};

// Run the fix if this script is executed directly
if (require.main === module) {
  fixDatabaseStructure();
}

module.exports = { fixDatabaseStructure }; 