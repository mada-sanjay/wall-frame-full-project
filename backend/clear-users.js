const mysql = require('mysql2');
require('dotenv').config();

console.log('🧹 Clearing Users Table');
console.log('========================');

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
  
  // Clear all users
  console.log('\n🗑️ Clearing all users...');
  connection.query('DELETE FROM users', (err) => {
    if (err) {
      console.error('❌ Error clearing users:', err.message);
      process.exit(1);
    }
    
    console.log('✅ All users cleared');
    
    // Check if username column exists and remove it if it does
    connection.query('DESCRIBE users', (err, results) => {
      if (err) {
        console.error('❌ Error describing table:', err.message);
        process.exit(1);
      }
      
      const hasUsername = results.some(row => row.Field === 'username');
      
      if (hasUsername) {
        console.log('\n🔧 Removing username column...');
        connection.query('ALTER TABLE users DROP COLUMN username', (err) => {
          if (err) {
            console.error('❌ Error removing username column:', err.message);
          } else {
            console.log('✅ Username column removed');
          }
          
          // Final verification
          connection.query('DESCRIBE users', (err, results) => {
            if (err) {
              console.error('❌ Error describing table:', err.message);
            } else {
              console.log('\n📋 Final users table structure:');
              results.forEach(row => {
                console.log(`   - ${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : ''} ${row.Key === 'PRI' ? 'PRIMARY KEY' : ''} ${row.Key === 'UNI' ? 'UNIQUE' : ''}`);
              });
            }
            
            connection.query('SELECT COUNT(*) as count FROM users', (err, results) => {
              if (err) {
                console.error('❌ Error counting users:', err.message);
              } else {
                console.log(`\n👥 Users count: ${results[0].count} (should be 0)`);
              }
              
              connection.end();
              console.log('\n🎉 Users table cleared and fixed!');
              console.log('You can now register new users.');
            });
          });
        });
      } else {
        // No username column, just verify
        console.log('\n📋 Users table structure (no changes needed):');
        results.forEach(row => {
          console.log(`   - ${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : ''} ${row.Key === 'PRI' ? 'PRIMARY KEY' : ''} ${row.Key === 'UNI' ? 'UNIQUE' : ''}`);
        });
        
        connection.query('SELECT COUNT(*) as count FROM users', (err, results) => {
          if (err) {
            console.error('❌ Error counting users:', err.message);
          } else {
            console.log(`\n👥 Users count: ${results[0].count} (should be 0)`);
          }
          
          connection.end();
          console.log('\n🎉 Users table cleared!');
          console.log('You can now register new users.');
        });
      }
    });
  });
}); 