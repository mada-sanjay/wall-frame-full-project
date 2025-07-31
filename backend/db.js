const mysql = require('mysql2');
const config = require('./config/config');

// Log the database configuration (without password for security)
console.log('Database Configuration:');
console.log('Host:', config.database.host);
console.log('User:', config.database.user);
console.log('Database:', config.database.database);
console.log('Port:', config.database.port);
console.log('Password:', config.database.password ? '[SET]' : '[NOT SET]');

// Create connection with AWS RDS optimized configuration
const db = mysql.createConnection({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  port: config.database.port,
  // AWS RDS specific settings
  ssl: {
    rejectUnauthorized: false,
    ca: undefined,
    cert: undefined,
    key: undefined
  },
  // Connection timeout settings
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  // Additional settings for stability
  charset: 'utf8mb4',
  multipleStatements: false,
  // Reconnection settings
  reconnect: true,
  maxReconnects: 10,
  reconnectDelay: 1000
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to MySQL RDS:', err);
    console.error('Error Code:', err.code);
    console.error('Error Number:', err.errno);
    console.error('SQL State:', err.sqlState);
    console.error('\nAWS RDS Connection Troubleshooting:');
    console.error('1. Check Security Group allows connections from Render IPs');
    console.error('2. Verify RDS is publicly accessible (if needed)');
    console.error('3. Check VPC and subnet configurations');
    console.error('4. Verify database credentials');
    console.error('5. Check if RDS instance is running');
    // Don't exit - let the app continue and try auto-setup
  } else {
    console.log('✅ Connected to AWS RDS MySQL successfully!');
  }
});

// Handle connection errors
db.on('error', (err) => {
  console.error('Database connection error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was lost. Reconnecting...');
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('Access denied. Please check your username and password.');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('Connection refused. Check Security Group and network settings.');
  } else if (err.code === 'ENOTFOUND') {
    console.error('Host not found. Check your DB_HOST setting.');
  } else if (err.code === 'ETIMEDOUT') {
    console.error('Connection timeout. Check Security Group allows Render IPs.');
  }
});

module.exports = db; 