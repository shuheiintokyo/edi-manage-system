// middleware/session-debug.js - Comprehensive session debugging
const session = require('express-session');

// Enhanced session configuration with debugging
const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'edi-manage-secret-stable-key-2025',
  name: 'edi.sid',
  
  // Session behavior
  resave: true, // Save session even if unchanged
  saveUninitialized: false, // Don't save empty sessions
  rolling: true, // Reset expiration on activity
  
  // Cookie settings
  cookie: {
    secure: false, // HTTP only for development
    httpOnly: true, // Prevent XSS
    maxAge: 60 * 60 * 1000, // 1 hour
    sameSite: 'lax' // Allow cross-site requests
  }
});

// Comprehensive session debugging middleware
const sessionDebugger = (req, res, next) => {
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
  
  // Check cookies
  console.log(`🍪 Request Cookies:`, req.headers.cookie);
  
  // Check if session exists in memory
  console.log(`💾 Session Store Info:`, {
    sessionExists: !!req.session,
    sessionKeys: req.session ? Object.keys(req.session) : 'No session'
  });
  
  // Monitor session changes
  const originalSession = JSON.stringify(req.session);
  
  // Hook into response to see what happens after
  res.on('finish', () => {
    const newSession = JSON.stringify(req.session);
    if (originalSession !== newSession) {
      console.log('🔄 Session changed during request');
      console.log('📤 New session data:', req.session);
    }
  });
  
  console.log('🔍 ========================\n');
  next();
};

// Cookie inspector middleware
const cookieInspector = (req, res, next) => {
  // Log all cookies being sent
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=');
      return { name, value: value?.substring(0, 20) + '...' };
    });
    console.log('🍪 Incoming Cookies:', cookies);
  } else {
    console.log('🚫 No cookies in request');
  }
  
  // Hook into response to see what cookies are being set
  const originalSetHeader = res.setHeader;
  res.setHeader = function(name, value) {
    if (name.toLowerCase() === 'set-cookie') {
      console.log('🍪 Setting Cookie:', value);
    }
    return originalSetHeader.call(this, name, value);
  };
  
  next();
};

// Auth checker with detailed logging
const authDebugger = (req, res, next) => {
  const isAuthRoute = req.originalUrl.startsWith('/auth/');
  const isStaticFile = req.originalUrl.includes('.');
  
  if (!isAuthRoute && !isStaticFile) {
    console.log('🔐 Auth Check:', {
      url: req.originalUrl,
      authenticated: !!req.session?.isAuthenticated,
      sessionId: req.sessionID,
      redirecting: !req.session?.isAuthenticated
    });
    
    if (!req.session?.isAuthenticated) {
      console.log('❌ REDIRECTING TO LOGIN - Session not authenticated');
    }
  }
  
  next();
};

module.exports = {
  sessionConfig,
  sessionDebugger,
  cookieInspector,
  authDebugger
};