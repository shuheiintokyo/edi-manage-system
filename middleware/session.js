const session = require('express-session');

// For initial deployment, use memory store
// Later we'll switch to PostgreSQL store
const sessionConfig = session({
  // Memory store for now (will switch to PostgreSQL later)
  secret: process.env.SESSION_SECRET || 'edi-manage-secret-change-in-production',
  name: 'edi.sid', // Custom session cookie name
  
  // Session behavior
  resave: false, // Don't save unchanged sessions
  saveUninitialized: false, // Don't save empty sessions
  rolling: true, // Reset expiration on activity
  
  // Cookie settings
  cookie: {
    secure: process.env.NODE_ENV === 'production' && process.env.HTTPS_ONLY === 'true', 
    httpOnly: true, // Prevent XSS access to cookies
    maxAge: 30 * 60 * 1000, // 30 minutes
    sameSite: 'lax' // CSRF protection
  }
});

module.exports = sessionConfig;