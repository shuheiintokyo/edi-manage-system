// app.js - Updated with EDI Dashboard routes
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

// Import middleware and routes
const sessionConfig = require('./middleware/session');
const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const ediRoutes = require('./routes/edi-dashboard'); // New EDI routes
const { requireAuth } = require('./middleware/auth');

const app = express();

// Security middleware - relaxed for development
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  } : false // Disable CSP in development
}));

app.use(cors());
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(sessionConfig);

// Routes
app.use('/auth', authRoutes);
app.use('/pages', requireAuth, pageRoutes);
app.use('/edi', requireAuth, ediRoutes); // New EDI routes

// Root route - redirect to login or dashboard
app.get('/', (req, res) => {
  if (req.session.isAuthenticated) {
    res.redirect('/pages/page1');
  } else {
    res.redirect('/auth/login');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle multer errors (file upload errors)
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
  
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Page not found' });
});

module.exports = app;