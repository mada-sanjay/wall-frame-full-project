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

const addSubscriptionPlanColumn = async () => {
  try {
    console.log('🔧 Adding subscription_plan column to decorations table...');
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

    // Check if subscription_plan column exists
    await new Promise((resolve, reject) => {
      db.query('DESCRIBE decorations', (err, results) => {
        if (err) {
          console.error('❌ Error checking table structure:', err);
          reject(err);
        } else {
          const hasSubscriptionPlan = results.some(col => col.Field === 'subscription_plan');
          if (hasSubscriptionPlan) {
            console.log('✅ subscription_plan column already exists');
            resolve();
          } else {
            console.log('🔧 Adding subscription_plan column...');
            db.query('ALTER TABLE decorations ADD COLUMN subscription_plan VARCHAR(20) DEFAULT "basic"', (err2) => {
              if (err2) {
                console.error('❌ Error adding subscription_plan column:', err2);
                reject(err2);
              } else {
                console.log('✅ subscription_plan column added successfully');
                resolve();
              }
            });
          }
        }
      });
    });

    // Update existing decorations to have basic plan
    await new Promise((resolve, reject) => {
      db.query('UPDATE decorations SET subscription_plan = "basic" WHERE subscription_plan IS NULL', (err, result) => {
        if (err) {
          console.error('❌ Error updating existing decorations:', err);
          reject(err);
        } else {
          console.log(`✅ Updated ${result.affectedRows} existing decorations with basic plan`);
          resolve();
        }
      });
    });

    console.log('✅ Subscription plan column setup completed successfully!');
    db.end();
  } catch (error) {
    console.error('❌ Error adding subscription plan column:', error);
  }
};

// Run the script
addSubscriptionPlanColumn(); 