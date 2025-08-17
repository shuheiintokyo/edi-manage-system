const express = require('express');
const path = require('path');
const { validateCredentials, redirectIfAuthenticated, getClientIP } = require('../middleware/auth');

const router = express.Router();

// Login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Login form submission
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const clientIP = getClientIP(req);
  
  if (validateCredentials(username, password)) {
    req.session.isAuthenticated = true;
    req.session.username = username;
    req.session.loginTime = new Date();
    
    // Log successful login to console (later we'll log to database)
    console.log(`✅ LOGIN_SUCCESS: User ${username} from IP ${clientIP} at ${new Date().toISOString()}`);
    
    // Redirect to intended page or default
    const redirectUrl = req.query.redirect || '/pages/page1';
    res.redirect(redirectUrl);
  } else {
    // Log failed login attempt to console
    console.log(`❌ LOGIN_FAILED: Username ${username} from IP ${clientIP} at ${new Date().toISOString()}`);
    res.redirect('/auth/login?error=invalid');
  }
});

// Logout
router.post('/logout', async (req, res) => {
  if (req.session.isAuthenticated) {
    const username = req.session.username;
    const clientIP = getClientIP(req);
    
    // Log logout to console
    console.log(`👋 LOGOUT: User ${username} from IP ${clientIP} at ${new Date().toISOString()}`);
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.clearCookie('edi.sid');
      res.redirect('/auth/login?message=logged_out');
    });
  } else {
    res.redirect('/auth/login');
  }
});

// Check authentication status (API endpoint)
router.get('/status', (req, res) => {
  res.json({
    authenticated: !!req.session.isAuthenticated,
    username: req.session.username || null,
    loginTime: req.session.loginTime || null,
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'connected' : 'not_configured'
  });
});

module.exports = router;