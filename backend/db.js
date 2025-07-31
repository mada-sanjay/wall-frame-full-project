const mysql = require('mysql2');
const config = require('./config/config');

// Log the database configuration (without password for security)
console.log('Database Configuration:');
console.log('Host:', config.database.host);
console.log('User:', config.database.user);
console.log('Database:', config.database.database);
console.log('Port:', config.database.port);
console.log('Password:', config.database.password ? '[SET]' : '[NOT SET]');

// Create connection with more detailed configuration
const db = mysql.createConnection({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  port: config.database.port,
  // Additional connection options
  connectTimeout: 60000,
  charset: 'utf8mb4'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err);
    console.error('Error Code:', err.code);
    console.error('Error Number:', err.errno);
    console.error('SQL State:', err.sqlState);
    console.error('\nPlease check your database configuration:');
    console.error('1. Make sure MySQL is running');
    console.error('2. Verify your database credentials in .env file');
    console.error('3. Ensure the database "wallframe" exists');
    console.error('4. Check if the user has proper permissions');
    console.error('5. Try connecting manually: mysql -u root -p');
    // Don't exit - let the app continue and try auto-setup
  } else {
    console.log('✅ Connected to MySQL database successfully!');
  }
});

// Handle connection errors
db.on('error', (err) => {
  console.error('Database connection error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was lost. Reconnecting...');
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('Access denied. Please check your username and password.');
    console.error('Try: mysql -u root -p to test your credentials');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('Connection refused. Please check if MySQL is running.');
    console.error('Start MySQL service or check if it\'s running on the correct port.');
  } else if (err.code === 'ENOTFOUND') {
    console.error('Host not found. Check your DB_HOST setting.');
  }
});

module.exports = db; 