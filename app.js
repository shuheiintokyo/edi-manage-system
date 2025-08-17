// app.js - Fixed for Vercel serverless deployment
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Import middleware and routes with error handling
let sessionConfig, authRoutes, pageRoutes, ediRoutes;
let requireAuth = (req, res, next) => next(); // Fallback

try {
  const sessionModule = require('./middleware/session');
  sessionConfig = sessionModule.sessionConfig;
  
  authRoutes = require('./routes/auth');
  pageRoutes = require('./routes/pages');
  ediRoutes = require('./routes/edi-dashboard');
  
  const authModule = require('./middleware/auth');
  requireAuth = authModule.requireAuth;
} catch (error) {
  console.error('Error loading modules:', error.message);
}

// Security middleware - relaxed for Vercel
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  } : false // Disable CSP in development
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://*.vercel.app', process.env.VERCEL_URL].filter(Boolean)
    : true,
  credentials: true
}));

// Logging - minimal in production
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('combined'));
}

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware with error handling
if (sessionConfig) {
  app.use(sessionConfig);
}

// Health check endpoint (before authentication)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'configured' : 'not_configured'
  });
});

// Routes with error handling
if (authRoutes) {
  app.use('/auth', authRoutes);
}

if (pageRoutes && requireAuth) {
  app.use('/pages', requireAuth, pageRoutes);
}

if (ediRoutes && requireAuth) {
  app.use('/edi', requireAuth, ediRoutes);
}

// Root route - redirect to login or dashboard
app.get('/', (req, res) => {
  try {
    if (req.session?.isAuthenticated) {
      res.redirect('/pages/page1');
    } else {
      res.redirect('/auth/login');
    }
  } catch (error) {
    console.error('Root route error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Catch-all for missing static files
app.get('/css/*', (req, res) => {
  res.status(404).send('CSS file not found');
});

app.get('/js/*', (req, res) => {
  res.status(404).send('JS file not found');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Application error:', err.message);
  
  // Handle specific error types
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      error: 'File too large',
      details: 'Maximum file size is 10MB'
    });
  }
  
  if (err.message && err.message.includes('Only .EDIdat')) {
    return res.status(400).json({ 
      error: 'Invalid file type',
      details: err.message
    });
  }

  // Database connection errors
  if (err.message && err.message.includes('database')) {
    return res.status(503).json({ 
      error: 'Database connection error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Database temporarily unavailable'
    });
  }
  
  // Generic error response
  const status = err.status || 500;
  res.status(status).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Page not found',
    path: req.originalUrl 
  });
});

// Graceful shutdown handling for serverless
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

module.exports = app;