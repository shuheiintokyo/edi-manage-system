// routes/auth.js - Updated with database integration
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const { validateCredentials, redirectIfAuthenticated, getClientIP } = require('../middleware/auth');
const { pool, logActivity } = require('../config/database');

const router = express.Router();

// Login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Login form submission
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const clientIP = getClientIP(req);
  const userAgent = req.get('User-Agent') || 'unknown';
  
  try {
    // Check against database users first
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );
    
    let isValidUser = false;
    let userId = null;
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      // Check if password matches (assuming bcrypt hashed passwords)
      if (user.password_hash) {
        isValidUser = await bcrypt.compare(password, user.password_hash);
      } else {
        // Fallback to simple comparison for admin/1234
        isValidUser = validateCredentials(username, password);
      }
      userId = user.id;
    } else {
      // Fallback to environment-based validation
      isValidUser = validateCredentials(username, password);
    }
    
    if (isValidUser) {
      req.session.isAuthenticated = true;
      req.session.username = username;
      req.session.userId = userId;
      req.session.loginTime = new Date();
      
      // Update last login in database if user exists
      if (userId) {
        await pool.query(
          'UPDATE users SET last_login = NOW() WHERE id = $1',
          [userId]
        );
      }
      
      // Log successful login to console and database
      console.log(`✅ LOGIN_SUCCESS: User ${username} from IP ${clientIP} at ${new Date().toISOString()}`);
      await logActivity(req.sessionID, 'LOGIN_SUCCESS', username, userAgent, clientIP);
      
      // Redirect to intended page or default
      const redirectUrl = req.query.redirect || '/pages/page1';
      res.redirect(redirectUrl);
    } else {
      // Log failed login attempt
      console.log(`❌ LOGIN_FAILED: Username ${username} from IP ${clientIP} at ${new Date().toISOString()}`);
      await logActivity(req.sessionID, 'LOGIN_FAILED', `Failed login for ${username}`, userAgent, clientIP);
      
      res.redirect('/auth/login?error=invalid');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/auth/login?error=server_error');
  }
});

// Logout
router.post('/logout', async (req, res) => {
  if (req.session.isAuthenticated) {
    const username = req.session.username;
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    
    try {
      // Log logout to console and database
      console.log(`👋 LOGOUT: User ${username} from IP ${clientIP} at ${new Date().toISOString()}`);
      await logActivity(req.sessionID, 'LOGOUT', username, userAgent, clientIP);
    } catch (error) {
      console.error('Logout logging error:', error);
    }
    
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
    userId: req.session.userId || null,
    loginTime: req.session.loginTime || null,
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'connected' : 'not_configured'
  });
});

// API health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;