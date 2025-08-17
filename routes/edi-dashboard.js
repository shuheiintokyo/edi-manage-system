// routes/edi-dashboard.js - EDI Dashboard Routes
const express = require('express');
const path = require('path');
const multer = require('multer');
const iconv = require('iconv-lite');
const { pool, logActivity } = require('../config/database');
const { getClientIP } = require('../middleware/auth');

const router = express.Router();

// Configure multer for EDI file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.edidat', '.txt', '.dat'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only .EDIdat, .txt, and .dat files are allowed'), false);
    }
  }
});

// Dashboard page
router.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/edi-dashboard.html'));
});

// Get all EDI orders with pagination and filtering
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    const productCode = req.query.product_code;
    const status = req.query.status;
    
    let query = `
      SELECT id, order_number, product_code, product_name, order_quantity, 
             delivery_date, status, status_updated_at, uploaded_at
      FROM edi_orders
    `;
    const params = [];
    const conditions = [];
    
    if (productCode) {
      conditions.push(`product_code = $${params.length + 1}`);
      params.push(productCode);
    }
    
    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY 
      CASE 
        WHEN product_code = 'PP4166-4681P003' THEN 1
        WHEN product_code = 'PP4166-4681P004' THEN 2
        WHEN product_code = 'PP4166-4726P003' THEN 3
        WHEN product_code = 'PP4166-4726P004' THEN 4
        WHEN product_code = 'PP4166-4731P002' THEN 5
        WHEN product_code = 'PP4166-7106P003' THEN 6
        WHEN product_code = 'PP4166-7106P001' THEN 7
        ELSE 8
      END,
      delivery_date ASC NULLS LAST,
      uploaded_at DESC
    `;
    
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM edi_orders';
    const countParams = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams.push(...params.slice(0, -2)); // Remove limit and offset
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      orders: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching EDI orders:', error);
    res.status(500).json({ error: 'Failed to fetch EDI orders' });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN uploaded_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_orders,
        COUNT(DISTINCT product_code) as unique_products,
        COUNT(CASE WHEN status = 'finished' THEN 1 END) as completed_orders
      FROM edi_orders
    `);
    
    res.json({
      totalOrders: parseInt(stats.rows[0].total_orders),
      recentOrders: parseInt(stats.rows[0].recent_orders),
      uniqueProducts: parseInt(stats.rows[0].unique_products),
      completedOrders: parseInt(stats.rows[0].completed_orders)
    });
    
  } catch (error) {
    console.error('Error fetching EDI stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Upload EDI file
router.post('/upload', upload.single('ediFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    
    console.log(`📁 Processing EDI file: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Decode file content with proper encoding
    let content;
    try {
      // Try UTF-8 first
      content = req.file.buffer.toString('utf8');
      
      // If content looks garbled, try Shift-JIS (common for Japanese systems)
      if (content.includes('�') || content.includes('\ufffd')) {
        console.log('🔄 Trying Shift-JIS encoding...');
        content = iconv.decode(req.file.buffer, 'shift_jis');
      }
    } catch (encodingError) {
      console.error('Encoding error:', encodingError);
      content = req.file.buffer.toString('utf8');
    }
    
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    console.log(`📄 File contains ${lines.length} lines`);
    
    let processedRecords = 0;
    let newRecords = 0;
    let skippedRecords = 0;
    
    await pool.query('BEGIN');
    
    try {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse EDI line - adjust parsing logic based on your EDI format
        const parsedData = parseEDILine(line, i + 1);
        if (!parsedData) {
          console.log(`⚠️ Line ${i + 1}: Could not parse - ${line.substring(0, 50)}...`);
          continue;
        }
        
        processedRecords++;
        
        // Check if order already exists
        const existingOrder = await pool.query(
          'SELECT id FROM edi_orders WHERE order_number = $1',
          [parsedData.orderNumber]
        );
        
        if (existingOrder.rows.length > 0) {
          skippedRecords++;
          console.log(`⏭️ Order ${parsedData.orderNumber} already exists, skipping`);
          continue;
        }
        
        // Insert new order
        await pool.query(`
          INSERT INTO edi_orders (order_number, product_code, product_name, order_quantity, delivery_date, uploaded_by, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          parsedData.orderNumber,
          parsedData.productCode,
          parsedData.productName,
          parsedData.orderQuantity,
          parsedData.deliveryDate,
          req.session.userId,
          'default'
        ]);
        
        newRecords++;
        console.log(`✅ Added order: ${parsedData.orderNumber} - ${parsedData.productCode}`);
      }
      
      await pool.query('COMMIT');
      
      // Log the upload activity
      await logActivity(
        req.sessionID,
        'EDI_UPLOAD_SUCCESS',
        `File: ${req.file.originalname}, New: ${newRecords}, Skipped: ${skippedRecords}`,
        userAgent,
        clientIP
      );
      
      console.log(`🎯 Upload complete: ${newRecords} new records, ${skippedRecords} skipped`);
      
      res.json({
        success: true,
        filename: req.file.originalname,
        processedRecords,
        newRecords,
        skippedRecords,
        message: `Successfully processed ${processedRecords} records. ${newRecords} new orders added, ${skippedRecords} duplicates skipped.`
      });
      
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('EDI upload error:', error);
    
    // Log the failed upload
    try {
      await logActivity(
        req.sessionID,
        'EDI_UPLOAD_FAILED',
        `File: ${req.file?.originalname || 'unknown'}, Error: ${error.message}`,
        req.get('User-Agent') || 'unknown',
        getClientIP(req)
      );
    } catch (logError) {
      console.error('Failed to log upload error:', logError);
    }
    
    res.status(500).json({
      success: false,
      error: 'Upload processing failed',
      details: error.message
    });
  }
});

// Update order status
router.post('/update-status', async (req, res) => {
  try {
    const { orderId, status } = req.body;
    
    if (!orderId || !status) {
      return res.status(400).json({ error: 'Order ID and status are required' });
    }
    
    const validStatuses = ['default', 'half', 'three-quarter', 'finished'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await pool.query(
      'UPDATE edi_orders SET status = $1, status_updated_at = NOW() WHERE id = $2',
      [status, orderId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Log the status update
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    
    await logActivity(
      req.sessionID,
      'ORDER_STATUS_UPDATE',
      `Order ID: ${orderId}, Status: ${status}`,
      userAgent,
      clientIP
    );
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Helper function to parse EDI line based on your format
function parseEDILine(line, lineNumber) {
  try {
    // This is a simplified parser - adjust based on your actual EDI format
    // Common EDI formats use fixed-width fields or delimited fields
    
    // Example for comma/tab-delimited format:
    const fields = line.split(/[,\t]+/).map(field => field.trim().replace(/['"]/g, ''));
    
    if (fields.length < 4) {
      console.log(`⚠️ Line ${lineNumber}: Insufficient fields (${fields.length})`);
      return null;
    }
    
    // Adjust field mapping based on your EDI structure
    let orderNumber, productCode, productName, orderQuantity, deliveryDate;
    
    // Try different parsing strategies
    if (fields.length >= 5) {
      // Format: OrderNumber, ProductCode, ProductName, Quantity, DeliveryDate
      [orderNumber, productCode, productName, orderQuantity, deliveryDate] = fields;
    } else if (fields.length === 4) {
      // Format: OrderNumber, ProductCode, Quantity, DeliveryDate
      [orderNumber, productCode, orderQuantity, deliveryDate] = fields;
      productName = productCode; // Use code as name if name not provided
    } else {
      console.log(`⚠️ Line ${lineNumber}: Unexpected field count (${fields.length})`);
      return null;
    }
    
    // Clean and validate fields
    orderNumber = (orderNumber || '').trim();
    productCode = (productCode || '').trim();
    productName = (productName || productCode || '').trim();
    
    // Parse quantity
    const quantity = parseInt(orderQuantity) || 1;
    
    // Parse delivery date - handle various formats
    let parsedDate = null;
    if (deliveryDate && deliveryDate.trim()) {
      const dateStr = deliveryDate.trim();
      
      // Try common date formats
      const dateFormats = [
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/,  // YYYY-MM-DD
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
        /^(\d{4})(\d{2})(\d{2})$/,        // YYYYMMDD
      ];
      
      for (const format of dateFormats) {
        const match = dateStr.match(format);
        if (match) {
          let year, month, day;
          if (format === dateFormats[0] || format === dateFormats[1]) {
            [, year, month, day] = match;
          } else if (format === dateFormats[2]) {
            [, month, day, year] = match;
          } else if (format === dateFormats[3]) {
            [, year, month, day] = match;
            month = month.substring(0, 2);
            day = day.substring(2, 4);
          }
          
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(date.getTime())) {
            parsedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            break;
          }
        }
      }
      
      if (!parsedDate) {
        console.log(`⚠️ Line ${lineNumber}: Could not parse date: ${dateStr}`);
        parsedDate = dateStr; // Keep original if we can't parse it
      }
    }
    
    if (!orderNumber || !productCode) {
      console.log(`⚠️ Line ${lineNumber}: Missing required fields (order: ${orderNumber}, product: ${productCode})`);
      return null;
    }
    
    return {
      orderNumber,
      productCode,
      productName,
      orderQuantity: quantity,
      deliveryDate: parsedDate
    };
    
  } catch (error) {
    console.error(`❌ Error parsing line ${lineNumber}:`, error);
    return null;
  }
}

module.exports = router;