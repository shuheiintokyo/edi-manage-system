// config/database.js - Fixed for Vercel serverless deployment with forecast support
const { Pool } = require('pg');

// Serverless-optimized configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Required for most hosted PostgreSQL services
  } : false,
  // Optimized for serverless - smaller pool, shorter timeouts
  max: 3, // Reduced pool size for serverless
  idleTimeoutMillis: 5000, // Shorter idle timeout
  connectionTimeoutMillis: 10000, // Connection timeout
  keepAlive: false, // Disable keepalive for serverless
  statement_timeout: 10000, // 10 second statement timeout
  query_timeout: 10000, // 10 second query timeout
};

// Create connection pool
let pool;

function getPool() {
  if (!pool) {
    pool = new Pool(dbConfig);
    
    // Handle pool errors without crashing
    pool.on('error', (err) => {
      console.error('Database pool error:', err.message);
    });
    
    pool.on('connect', () => {
      console.log('✅ Connected to database');
    });
  }
  return pool;
}

// Activity logging function with better error handling for serverless
async function logActivity(sessionId, action, details = null, userAgent = null, ipAddress = null) {
  let client;
  try {
    const pool = getPool();
    client = await pool.connect();
    await client.query(
      `INSERT INTO activity_logs (session_id, action, details, user_agent, ip_address, timestamp) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [sessionId, action, details, userAgent, ipAddress]
    );
    console.log(`📝 Activity logged: ${action} for session ${sessionId?.substring(0, 8)}...`);
  } catch (err) {
    console.error('Error logging activity:', err.message);
    // Don't throw error to avoid breaking the main flow
  } finally {
    if (client) client.release();
  }
}

// Test database connection function (async)
async function testConnection() {
  let client;
  try {
    const pool = getPool();
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

// Initialize database tables (only run when explicitly called)
async function initializeTables() {
  let client;
  try {
    const pool = getPool();
    client = await pool.connect();
    
    console.log('🔧 Checking database tables...');

    // Create activity_logs table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        user_agent TEXT,
        ip_address INET
      )
    `);

    // Create indexes if they don't exist
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_session_id ON activity_logs(session_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
    `);

    // Create session table for express-session
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" VARCHAR NOT NULL COLLATE "default",
        "sess" JSON NOT NULL,
        "expire" TIMESTAMP(6) NOT NULL
      )
    `);

    await client.query(`
      ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_pkey";
      ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);

    // Create edi_orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS edi_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(255) UNIQUE NOT NULL,
        product_code VARCHAR(255),
        product_name VARCHAR(255),
        order_quantity VARCHAR(100),
        delivery_date VARCHAR(100),
        uploaded_by INTEGER,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_edi_orders_order_number ON edi_orders(order_number);
      CREATE INDEX IF NOT EXISTS idx_edi_orders_uploaded_at ON edi_orders(uploaded_at);
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // Create forecasts table for monthly production forecasting
    await client.query(`
      CREATE TABLE IF NOT EXISTS forecasts (
        id SERIAL PRIMARY KEY,
        drawing_number VARCHAR(255) NOT NULL,
        month_date DATE NOT NULL,
        quantity INTEGER DEFAULT 0,
        updated_by INTEGER,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(drawing_number, month_date)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_forecasts_drawing_number ON forecasts(drawing_number);
      CREATE INDEX IF NOT EXISTS idx_forecasts_month_date ON forecasts(month_date);
      CREATE INDEX IF NOT EXISTS idx_forecasts_updated_at ON forecasts(updated_at);
    `);

    // Create trigger for auto-timestamp updates on forecasts
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      CREATE TRIGGER update_forecasts_updated_at BEFORE UPDATE ON forecasts
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Database tables verified/created including forecasts table');
    
  } catch (err) {
    console.error('❌ Error initializing database tables:', err.message);
    throw err;
  } finally {
    if (client) client.release();
  }
}

// Graceful cleanup function
async function closePool() {
  if (pool) {
    try {
      await pool.end();
      console.log('🔒 Database pool closed gracefully');
    } catch (err) {
      console.error('Error closing database pool:', err.message);
    }
  }
}

module.exports = {
  get pool() {
    return getPool();
  },
  logActivity,
  initializeTables,
  testConnection,
  closePool
};