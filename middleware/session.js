// middleware/session.js - Updated for Vercel deployment
const session = require('express-session');

let sessionConfig;

if (process.env.NODE_ENV === 'production') {
  // Production: Use PostgreSQL session store for Vercel
  const pgSession = require('connect-pg-simple')(session);
  const { pool } = require('../config/database');
  
  sessionConfig = session({
    store: new pgSession({
      pool: pool,                     // Use existing database connection
      tableName: 'session',          // Use existing session table
      createTableIfMissing: true     // Auto-create if needed
    }),
    secret: process.env.SESSION_SECRET || 'edi-manage-secret-change-in-production',
    name: 'edi.sid',
    
    // Session behavior for production
    resave: false,
    saveUninitialized: false,
    rolling: true,
    
    // Cookie settings for production
    cookie: {
      secure: process.env.HTTPS_ONLY === 'true', // HTTPS in production
      httpOnly: true,
      maxAge: 30 * 60 * 1000, // 30 minutes
      sameSite: 'lax'
    }
  });
} else {
  // Development: Use memory store (current setup)
  sessionConfig = session({
    secret: process.env.SESSION_SECRET || 'edi-manage-secret-change-in-production',
    name: 'edi.sid',
    
    resave: false,
    saveUninitialized: false,
    rolling: true,
    
    cookie: {
      secure: false, // HTTP is fine for development
      httpOnly: true,
      maxAge: 30 * 60 * 1000, // 30 minutes
      sameSite: 'lax'
    }
  });
}

module.exports = sessionConfig;