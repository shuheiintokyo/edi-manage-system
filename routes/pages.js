const express = require('express');
const path = require('path');

const router = express.Router();

// Sample Page 1
router.get('/page1', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/page1.html'));
});

// Sample Page 2
router.get('/page2', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/page2.html'));
});

// Sample Page 3
router.get('/page3', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/page3.html'));
});

// API endpoint for page data (example)
router.get('/api/data', (req, res) => {
  res.json({
    message: 'Protected data',
    user: req.session.username,
    timestamp: new Date(),
    pages: [
      { id: 1, name: 'Sample Page 1', url: '/pages/page1' },
      { id: 2, name: 'Sample Page 2', url: '/pages/page2' },
      { id: 3, name: 'Sample Page 3', url: '/pages/page3' }
    ]
  });
});

module.exports = router;