const mysql = require('mysql2');
const config = require('./config/config');

// Log the database configuration (without password for security)
console.log('Database Configuration:');
console.log('Host:', config.database.host);
console.log('User:', config.database.user);
console.log('Database:', config.database.database);
console.log('Port:', config.database.port);
console.log('Password:', config.database.password ? '[SET]' : '[NOT SET]');

// Create a connection pool for better reliability
const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  port: config.database.port,
  ssl: {
    rejectUnauthorized: false
  },
  connectTimeout: 60000,
  charset: 'utf8mb4',
  multipleStatements: false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the pool connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error connecting to MySQL RDS (pool):', err);
    console.error('Error Code:', err.code);
    console.error('Error Number:', err.errno);
    console.error('SQL State:', err.sqlState);
    console.error('\nAWS RDS Connection Troubleshooting:');
    console.error('1. Check Security Group allows connections from Render IPs');
    console.error('2. Verify RDS is publicly accessible (if needed)');
    console.error('3. Check VPC and subnet configurations');
    console.error('4. Verify database credentials');
    console.error('5. Check if RDS instance is running');
  } else {
    console.log('✅ Connected to AWS RDS MySQL successfully (pool)!');
    connection.release();
  }
});

module.exports = pool; 