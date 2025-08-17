const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

// Import middleware and routes
const sessionConfig = require('./middleware/session');
const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const { requireAuth } = require('./middleware/auth');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors());
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(sessionConfig);

// Routes
app.use('/auth', authRoutes);
app.use('/pages', requireAuth, pageRoutes);

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
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Page not found' });
});

// Add this line after your existing routes
app.use('/api', requireAuth, (req, res, next) => {
  if (req.originalUrl === '/api/health') {
    next();
  } else {
    next();
  }
});

module.exports = app;