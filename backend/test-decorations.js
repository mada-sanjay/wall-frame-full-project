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

const testDecorations = async () => {
  try {
    console.log('🔍 Testing decorations...');
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

    // Check all decorations in database
    console.log('🔍 Checking all decorations in database:');
    await new Promise((resolve, reject) => {
      db.query('SELECT * FROM decorations', (err, results) => {
        if (err) {
          console.error('❌ Error fetching decorations:', err);
          reject(err);
        } else {
          console.log('📋 Total decorations in database:', results.length);
          results.forEach(decoration => {
            console.log(`ID: ${decoration.id}, Name: ${decoration.name}, Image: ${decoration.image}, Status: ${decoration.status}`);
          });
          resolve();
        }
      });
    });

    // Test the public decorations endpoint query
    console.log('\n🔍 Testing public decorations query:');
    await new Promise((resolve, reject) => {
      db.query('SELECT * FROM decorations WHERE status = "Active" ORDER BY id DESC', (err, results) => {
        if (err) {
          console.error('❌ Error fetching active decorations:', err);
          reject(err);
        } else {
          console.log('📋 Active decorations:', results.length);
          results.forEach(decoration => {
            // Use the new URL fixing logic
            const fixedUrl = decoration.image ? 
              (decoration.image.startsWith('http') ? decoration.image : `${config.api.baseUrl}${decoration.image}`) : 
              null;
            console.log(`ID: ${decoration.id}, Name: ${decoration.name}, Original Image: ${decoration.image}, Fixed URL: ${fixedUrl}`);
          });
          resolve();
        }
      });
    });

    console.log('✅ Decorations test completed successfully!');
    db.end();
  } catch (error) {
    console.error('❌ Decorations test failed:', error);
  }
};

// Run the test
testDecorations(); 