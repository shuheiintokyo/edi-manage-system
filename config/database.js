// config/database.js - Updated for Neon integration
const { Pool } = require('pg');

// Neon Postgres optimized configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon
  },
  // Optimized for Neon's serverless environment
  max: 10, // Reduced pool size for serverless
  idleTimeoutMillis: 10000, // Shorter idle timeout
  connectionTimeoutMillis: 5000, // Reasonable connection timeout
  keepAlive: true,
  keepAliveInitialDelayMillis: 0
};

// Create connection pool
const pool = new Pool(dbConfig);

// Enhanced error handling for Neon
pool.on('connect', (client) => {
  console.log('✅ Connected to Neon PostgreSQL database');
});

pool.on('error', (err, client) => {
  console.error('❌ Neon database connection error:', err.message);
  // Don't exit process in serverless environment
  if (process.env.NODE_ENV !== 'production') {
    console.error('Full error:', err);
  }
});

// Activity logging function with better error handling
async function logActivity(sessionId, action, details = null, userAgent = null, ipAddress = null) {
  let client;
  try {
    client = await pool.connect();
    await client.query(
      `INSERT INTO activity_logs (session_id, action, details, user_agent, ip_address, timestamp) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [sessionId, action, details, userAgent, ipAddress]
    );
    console.log(`📝 Activity logged: ${action} for session ${sessionId}`);
  } catch (err) {
    console.error('Error logging activity:', err.message);
    // Don't throw error to avoid breaking the main flow
  } finally {
    if (client) client.release();
  }
}

// Test database connection function
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    console.log('🚀 Database test successful:', {
      timestamp: result.rows[0].now,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    });
    return true;
  } catch (err) {
    console.error('❌ Database test failed:', err.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Initialize database tables with Neon-optimized queries
async function initializeTables() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔧 Checking database tables...');

    // Check if our main tables exist
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'activity_logs', 'edi_documents', 'user_sessions', 'system_config')
    `);

    console.log(`✅ Found ${tableCheck.rows.length} tables in database`);
    
    if (tableCheck.rows.length < 5) {
      console.log('⚠️  Some tables missing. Please run the SQL schema in Neon console.');
    }

    // Test a simple query
    await client.query('SELECT 1');
    console.log('✅ Database connection and tables verified');
    
  } catch (err) {
    console.error('❌ Error checking database tables:', err.message);
    throw err;
  } finally {
    if (client) client.release();
  }
}

// Graceful cleanup function
async function closePool() {
  try {
    await pool.end();
    console.log('🔒 Database pool closed gracefully');
  } catch (err) {
    console.error('Error closing database pool:', err.message);
  }
}

// Initialize on startup (only in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  testConnection().then(connected => {
    if (connected) {
      initializeTables().catch(err => {
        console.error('Failed to initialize database tables:', err.message);
      });
    }
  });
}

module.exports = {
  pool,
  logActivity,
  initializeTables,
  testConnection,
  closePool
};