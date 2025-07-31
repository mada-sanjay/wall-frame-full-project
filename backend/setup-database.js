const mysql = require('mysql2');
require('dotenv').config();

console.log('🔧 MySQL Database Setup Script');
console.log('==============================');

// Create connection without specifying database first
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  port: process.env.DB_PORT || 3306
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Failed to connect to MySQL server:', err.message);
    console.log('\n📋 Troubleshooting Steps:');
    console.log('1. Make sure MySQL is installed and running');
    console.log('2. Check your .env file has correct credentials');
    console.log('3. Try connecting with: mysql -u root -p');
    console.log('4. If using XAMPP/WAMP, ensure MySQL service is started');
    process.exit(1);
  }

  console.log('✅ Connected to MySQL server successfully!');
  
  // Create database if it doesn't exist
  const dbName = process.env.DB_NAME || 'wallframe';
  connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
    if (err) {
      console.error('❌ Failed to create database:', err.message);
      process.exit(1);
    }
    
    console.log(`✅ Database '${dbName}' created/verified successfully!`);
    
    // Use the database
    connection.query(`USE ${dbName}`, (err) => {
      if (err) {
        console.error('❌ Failed to use database:', err.message);
        process.exit(1);
      }
      
      console.log(`✅ Using database '${dbName}'`);
      
      // Create tables
      createTables();
    });
  });
});

function createTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      plan ENUM('basic', 'pro', 'pro_max') DEFAULT 'basic',
      isAdmin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS drafts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      data JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS decorations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      image VARCHAR(500) NOT NULL,
      status ENUM('Active', 'Pending', 'Inactive') DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  ];

  let completed = 0;
  
  tables.forEach((tableQuery, index) => {
    connection.query(tableQuery, (err) => {
      if (err) {
        console.error(`❌ Failed to create table ${index + 1}:`, err.message);
      } else {
        console.log(`✅ Table ${index + 1} created/verified successfully!`);
      }
      
      completed++;
      if (completed === tables.length) {
        console.log('\n🎉 Database setup completed successfully!');
        console.log('You can now start your application.');
        connection.end();
        process.exit(0);
      }
    });
  });
} 