// middleware/auth.js - Updated for dashboard redirect
// Simple authentication without database (for initial deployment)

// Simple admin credentials - using environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234';

function validateCredentials(username, password) {
  // Support any 4-digit password as requested
  const isValidPassword = /^\d{4}$/.test(password) && password === ADMIN_PASSWORD;
  return username === 'admin' && isValidPassword;
}

function requireAuth(req, res, next) {
  if (req.session.isAuthenticated) {
    // Log page access to console (later we'll log to database)
    console.log(`📄 Page access: ${req.originalUrl} - Session: ${req.sessionID}`);
    next();
  } else {
    // Log unauthorized access attempt
    console.log(`🚫 Unauthorized access attempt: ${req.originalUrl}`);
    res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    // Redirect to EDI dashboard instead of page1
    res.redirect('/edi/dashboard');
  } else {
    next();
  }
}

// Helper function to get client IP address
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
}

module.exports = {
  validateCredentials,
  requireAuth,
  redirectIfAuthenticated,
  getClientIP
};