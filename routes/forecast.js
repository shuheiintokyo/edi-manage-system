// routes/forecast.js - Fixed for correct file path and authentication
const express = require('express');
const path = require('path');
const multer = require('multer');
const { pool, logActivity } = require('../config/database');
const { getClientIP } = require('../middleware/auth');

const router = express.Router();

// Configure multer for Excel file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx and .xls files are allowed'), false);
    }
  }
});

// Forecast dashboard page - FIXED PATH
router.get('/dashboard', (req, res) => {
  // Check if the correct file exists, fallback to old location if needed
  const correctPath = path.join(__dirname, '../views/forecast/dashboard.html');
  const fallbackPath = path.join(__dirname, '../views/forecast-dashboard.html');
  
  const fs = require('fs');
  
  if (fs.existsSync(correctPath)) {
    console.log('✅ Serving forecast dashboard from correct location');
    res.sendFile(correctPath);
  } else if (fs.existsSync(fallbackPath)) {
    console.log('⚠️ Serving forecast dashboard from fallback location');
    res.sendFile(fallbackPath);
  } else {
    console.log('❌ Forecast dashboard file not found');
    res.status(404).send(`
      <h1>Forecast Dashboard Not Found</h1>
      <p>Please create the file at: <code>views/forecast/dashboard.html</code></p>
      <p>Expected location: ${correctPath}</p>
      <p><a href="/edi/dashboard">← Back to EDI Dashboard</a></p>
    `);
  }
});

// Get all forecast data
router.get('/api/forecasts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        drawing_number,
        month_date::text as month_date,
        quantity,
        updated_by,
        updated_at
      FROM forecasts 
      ORDER BY drawing_number, month_date
    `);
    
    console.log(`📊 Retrieved ${result.rows.length} forecast records`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
});

// Get EDI delivery dates for forecast planning
router.get('/api/edi-delivery-dates', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT delivery_date, COUNT(*) as order_count
      FROM edi_orders 
      WHERE delivery_date IS NOT NULL AND delivery_date != ''
      GROUP BY delivery_date
      ORDER BY delivery_date
    `);
    
    console.log(`📅 Retrieved ${result.rows.length} unique delivery dates`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching EDI delivery dates:', error);
    res.status(500).json({ error: 'Failed to fetch EDI delivery dates' });
  }
});

// Save batch forecast data
router.post('/api/forecasts/batch', async (req, res) => {
  try {
    const { forecasts } = req.body;
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    
    if (!forecasts || !Array.isArray(forecasts)) {
      return res.status(400).json({ error: 'Invalid forecast data format' });
    }
    
    let saved = 0;
    
    await pool.query('BEGIN');
    
    try {
      for (const forecast of forecasts) {
        const { drawing_number, month_date, quantity } = forecast;
        
        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(month_date)) {
          console.error(`Invalid date format: ${month_date}`);
          continue;
        }
        
        console.log(`💾 Saving: ${drawing_number} | ${month_date} | ${quantity}`);
        
        // Upsert forecast data using actual DATE type
        await pool.query(`
          INSERT INTO forecasts (drawing_number, month_date, quantity, updated_by, updated_at)
          VALUES ($1, $2::date, $3, $4, NOW())
          ON CONFLICT (drawing_number, month_date)
          DO UPDATE SET 
            quantity = EXCLUDED.quantity,
            updated_by = EXCLUDED.updated_by,
            updated_at = EXCLUDED.updated_at
        `, [drawing_number, month_date, quantity, req.session.userId]);
        
        saved++;
      }
      
      await pool.query('COMMIT');
      
      // Log the activity
      await logActivity(
        req.sessionID,
        'FORECAST_BATCH_SAVE',
        `Saved ${saved} forecast entries based on EDI delivery dates`,
        userAgent,
        clientIP
      );
      
      res.json({ success: true, saved });
      
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error saving forecast batch:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save forecast data',
      details: error.message
    });
  }
});

// Clear all forecast data
router.delete('/api/forecasts/clear', async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Check if user has admin permissions
    if (req.session.username !== 'admin') {
      return res.status(403).json({ error: 'Admin permissions required' });
    }
    
    const result = await pool.query('DELETE FROM forecasts');
    
    await logActivity(
      req.sessionID,
      'FORECAST_CLEAR_ALL',
      `Cleared ${result.rowCount} forecast records`,
      userAgent,
      clientIP
    );
    
    res.json({ 
      success: true, 
      message: `Cleared ${result.rowCount} forecast records` 
    });
    
  } catch (error) {
    console.error('Error clearing forecasts:', error);
    res.status(500).json({ error: 'Failed to clear forecast data' });
  }
});

// Get user info for permissions
router.get('/api/user-info', (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userInfo = {
    username: req.session.username,
    role: req.session.username === 'admin' ? 'admin' : 'user',
    permissions: {
      canEdit: req.session.username === 'admin',
      canView: true
    }
  };
  
  res.json(userInfo);
});

// Get forecast statistics with EDI integration
router.get('/api/forecast-stats', async (req, res) => {
  try {
    // Get forecast statistics
    const forecastStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT drawing_number) as product_count,
        COUNT(*) as total_entries,
        SUM(quantity) as total_quantity,
        AVG(quantity) as avg_quantity
      FROM forecasts
      WHERE quantity > 0
    `);
    
    // Get EDI delivery date range
    const ediStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT delivery_date) as unique_dates,
        MIN(delivery_date) as earliest_date,
        MAX(delivery_date) as latest_date,
        COUNT(*) as total_orders
      FROM edi_orders
      WHERE delivery_date IS NOT NULL AND delivery_date != ''
    `);
    
    res.json({
      forecast: forecastStats.rows[0],
      edi: ediStats.rows[0],
      integration: {
        forecast_based_on_edi: true,
        last_updated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching forecast stats:', error);
    res.status(500).json({ error: 'Failed to fetch forecast statistics' });
  }
});

// Debug endpoint for troubleshooting
router.get('/api/debug/forecasts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        drawing_number,
        month_date::text as month_date,
        quantity,
        updated_at
      FROM forecasts 
      ORDER BY drawing_number, month_date
      LIMIT 20
    `);
    
    res.json({
      source: 'database',
      count: result.rowCount,
      data: result.rows,
      sampleKeys: result.rows.slice(0, 5).map(row => `${row.drawing_number}-${row.month_date}`),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.json({
      source: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Logout endpoint
router.post('/api/logout', async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    
    if (req.session.isAuthenticated) {
      const username = req.session.username;
      
      await logActivity(
        req.sessionID,
        'LOGOUT',
        username,
        userAgent,
        clientIP
      );
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.clearCookie('edi.sid');
      res.json({ success: true });
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;