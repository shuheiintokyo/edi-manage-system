require('dotenv').config();
const { testConnection } = require('./config/database');

async function test() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  const connected = await testConnection();
  if (connected) {
    console.log('✅ Database connection successful!');
  } else {
    console.log('❌ Database connection failed!');
    console.log('Check your DATABASE_URL in .env file');
  }
  process.exit(0);
}

test();