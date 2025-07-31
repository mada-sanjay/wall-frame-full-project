const mysql = require('mysql2');
require('dotenv').config();

console.log('Testing database connection...');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);
console.log('Port:', process.env.DB_PORT);
console.log('Password:', process.env.DB_PASS ? '[SET]' : '[NOT SET]');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔧 Solution: Check your username and password');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('\n🔧 Solution: Check if the database is running and accessible');
    } else if (err.code === 'ENOTFOUND') {
      console.error('\n🔧 Solution: Check your DB_HOST - make sure it\'s the full AWS RDS endpoint');
    }
  } else {
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    connection.query('SELECT 1 as test', (err, results) => {
      if (err) {
        console.error('❌ Query test failed:', err);
      } else {
        console.log('✅ Query test successful:', results);
      }
      connection.end();
    });
  }
}); 