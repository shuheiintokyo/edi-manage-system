// middleware/session.js - Fixed for Vercel serverless deployment
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

// Create session configuration that works in serverless
function createSessionConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const sessionConfig = {
    store: process.env.DATABASE_URL ? new pgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
      // Serverless optimizations
      ttl: 60 * 60, // 1 hour TTL
      disableTouch: false,
      pruneSessionInterval: false, // Disable automatic pruning in serverless
    }) : undefined, // Use memory store if no database
    
    secret: process.env.SESSION_SECRET || 'edi-manage-secret-stable-key-2025',
    name: 'edi.sid',
    
    // Session behavior optimized for serverless
    resave: false, // Don't save unchanged sessions
    saveUninitialized: false, // Don't save empty sessions
    rolling: true, // Reset expiration on activity
    
    // Cookie settings
    cookie: {
      secure: isProduction && process.env.VERCEL_URL, // Secure in production with HTTPS
      httpOnly: true, // Prevent XSS
      maxAge: 60 * 60 * 1000, // 1 hour
      sameSite: isProduction ? 'none' : 'lax' // Cross-site for production, lax for dev
    }
  };

  return session(sessionConfig);
}

// Session debugging middleware (only in development)
const sessionDebugger = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    const timestamp = new Date().toISOString();
    
    console.log('\n🔍 ===== SESSION DEBUG =====');
    console.log(`⏰ Time: ${timestamp}`);
    console.log(`🌐 URL: ${req.method} ${req.originalUrl}`);
    console.log(`🍪 Session ID: ${req.sessionID}`);
    console.log(`📊 Session Data:`, {
      isAuthenticated: req.session?.isAuthenticated,
      username: req.session?.username,
      loginTime: req.session?.loginTime,
      userId: req.session?.userId
    });
    console.log('🔍 ========================\n');
  }
  next();
};

// Auth checker with minimal logging for production
const authDebugger = (req, res, next) => {
  const isAuthRoute = req.originalUrl.startsWith('/auth/');
  const isStaticFile = req.originalUrl.includes('.');
  
  if (!isAuthRoute && !isStaticFile && process.env.NODE_ENV !== 'production') {
    console.log('🔐 Auth Check:', {
      url: req.originalUrl,
      authenticated: !!req.session?.isAuthenticated,
      sessionId: req.sessionID?.substring(0, 8) + '...',
      redirecting: !req.session?.isAuthenticated
    });
  }
  
  next();
};

module.exports = {
  sessionConfig: createSessionConfig(),
  sessionDebugger,
  authDebugger
};