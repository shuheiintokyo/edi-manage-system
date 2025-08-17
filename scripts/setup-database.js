#!/usr/bin/env node

/**
 * Database Setup Script for EDI Management System
 * Run this script to initialize the database tables
 */

require('dotenv').config();
const { initializeTables } = require('../config/database');

async function setupDatabase() {
  console.log('🚀 Starting database setup...');
  
  try {
    await initializeTables();
    console.log('✅ Database setup completed successfully!');
    console.log('📝 Tables created:');
    console.log('   - activity_logs (for tracking user activities)');
    console.log('   - session (for session storage)');
    console.log('   - users (for future user management)');
    console.log('   - system_settings (for configuration)');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Visit http://localhost:3000');
    console.log('   3. Login with admin/1234');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Check your DATABASE_URL in .env file');
    console.error('   2. Ensure PostgreSQL is running');
    console.error('   3. Verify database credentials');
    console.error('   4. Check if database exists');
    console.error('');
    process.exit(1);
  }
}

// Run the setup
setupDatabase();