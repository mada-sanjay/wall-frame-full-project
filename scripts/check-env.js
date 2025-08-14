#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('🔍 Checking Environment Configuration...\n');

// Required environment variables for backend
const backendRequiredVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASS',
  'DB_NAME',
  'JWT_SECRET',
  'EMAIL_HOST',
  'EMAIL_USER',
  'EMAIL_PASS',
  'ADMIN_PASSWORD'
];

// Required environment variables for frontend (React)
const frontendRequiredVars = [
  'REACT_APP_API_BASE_URL',
  'REACT_APP_PRODUCTION_API_URL'
];

function checkEnvFile(filePath, requiredVars, name) {
  console.log(`📁 Checking ${name} environment file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${name} .env file not found!`);
    console.log(`   Create: ${filePath}`);
    return false;
  }
  
  const envContent = fs.readFileSync(filePath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      envVars[key.trim()] = value.trim();
    }
  });
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    if (!envVars[varName] || envVars[varName] === '') {
      console.log(`❌ Missing or empty: ${varName}`);
      allPresent = false;
    } else {
      console.log(`✅ Found: ${varName}`);
    }
  });
  
  return allPresent;
}

// Check security issues
function checkSecurity() {
  console.log('\n🔒 Security Checks...');
  
  const backendEnvPath = path.join(__dirname, '../backend/.env');
  if (fs.existsSync(backendEnvPath)) {
    const envContent = fs.readFileSync(backendEnvPath, 'utf8');
    
    // Check for weak passwords
    if (envContent.includes('admin123') || envContent.includes('password123')) {
      console.log('⚠️  WARNING: Default/weak passwords detected!');
    }
    
    // Check for development JWT secret
    if (envContent.includes('your_secret_key_change_in_production')) {
      console.log('⚠️  WARNING: Default JWT secret detected!');
    }
    
    // Check NODE_ENV
    if (envContent.includes('NODE_ENV=development')) {
      console.log('⚠️  WARNING: NODE_ENV is set to development!');
    }
  }
}

// Main execution
async function main() {
  const backendEnvPath = path.join(__dirname, '../backend/.env');
  const frontendEnvPath = path.join(__dirname, '../frontend/.env');
  
  const backendOk = checkEnvFile(backendEnvPath, backendRequiredVars, 'Backend');
  console.log('');
  const frontendOk = checkEnvFile(frontendEnvPath, frontendRequiredVars, 'Frontend');
  
  checkSecurity();
  
  console.log('\n📋 Summary:');
  console.log(`Backend Environment: ${backendOk ? '✅ Ready' : '❌ Needs attention'}`);
  console.log(`Frontend Environment: ${frontendOk ? '✅ Ready' : '❌ Needs attention'}`);
  
  if (backendOk && frontendOk) {
    console.log('\n🚀 Environment configuration looks good for deployment!');
    process.exit(0);
  } else {
    console.log('\n❌ Please fix the environment configuration before deploying.');
    process.exit(1);
  }
}

main().catch(console.error);
