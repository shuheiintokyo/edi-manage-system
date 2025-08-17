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
    
    console.log('🔧 Initializing database tables...');

    // Create activity_logs table with enhanced structure
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        user_agent TEXT,
        ip_address INET,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create optimized indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_session_id ON activity_logs(session_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action)
    `);

    // Create sessions table for express-session (Neon compatible)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" VARCHAR NOT NULL COLLATE "default",
        "sess" JSON NOT NULL,
        "expire" TIMESTAMP(6) NOT NULL
      ) WITH (OIDS=FALSE)
    `);

    // Add primary key if not exists (safe for re-runs)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey'
        ) THEN
          ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");
        END IF;
      END $$
    `);

    // Create index for session cleanup
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `);

    // Create users table (for future expansion)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    // Create system_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Insert default admin user (using bcrypt hash for '1234')
    await client.query(`
      INSERT INTO users (username, password_hash, email, role) 
      VALUES ('admin', '$2b$10$7ZvZmFTBUBVnZqJ5Z2v0d.cKS0cFwIlP1pRJ9cYjY5cXQYZJ8cFwC', 'admin@edi-system.com', 'admin')
      ON CONFLICT (username) DO NOTHING
    `);

    // Insert default system settings
    await client.query(`
      INSERT INTO system_settings (setting_key, setting_value, description) VALUES
      ('system_name', 'EDI Management System', 'Name of the system'),
      ('session_timeout', '30', 'Session timeout in minutes'),
      ('max_login_attempts', '5', 'Maximum login attempts before lockout'),
      ('maintenance_mode', 'false', 'System maintenance mode flag')
      ON CONFLICT (setting_key) DO NOTHING
    `);

    // Create view for recent activities
    await client.query(`
      CREATE OR REPLACE VIEW recent_activities AS
      SELECT 
        al.*,
        CASE 
          WHEN al.action = 'LOGIN_SUCCESS' THEN 'User logged in successfully'
          WHEN al.action = 'LOGIN_FAILED' THEN 'Failed login attempt'
          WHEN al.action = 'LOGOUT' THEN 'User logged out'
          WHEN al.action = 'PAGE_ACCESS' THEN 'Accessed page: ' || COALESCE(al.details, 'Unknown')
          ELSE al.action
        END AS action_description
      FROM activity_logs al
      ORDER BY al.timestamp DESC
      LIMIT 100
    `);

    console.log('✅ Database tables initialized successfully');
    console.log('📊 Tables created: activity_logs, session, users, system_settings');
    
  } catch (err) {
    console.error('❌ Error initializing database tables:', err.message);
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