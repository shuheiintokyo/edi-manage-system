// routes/edi-dashboard.js - New EDI file processing routes
const express = require('express');
const multer = require('multer');
const path = require('path');
const iconv = require('iconv-lite'); // For Shift-JIS encoding support
const { pool, logActivity } = require('../config/database');
const { getClientIP } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow .EDIdat files and text files
    const allowedExtensions = ['.edidat', '.txt', '.dat'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension) || file.originalname.toLowerCase().includes('edi')) {
      cb(null, true);
    } else {
      cb(new Error('Only .EDIdat, .txt, and .dat files are allowed'), false);
    }
  }
});

// EDI Dashboard page
router.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/edi-dashboard.html'));
});

// Parse EDI file function (based on your Python logic)
const iconv = require('iconv-lite');

function parseEDIFile(fileBuffer) {
  try {
    // Convert buffer to string using Shift-JIS encoding (exactly like Python code)
    // Read the file with Shift-JIS encoding
    console.log('📄 File size:', fileBuffer.length, 'bytes');
    
    let content;
    try {
      content = iconv.decode(fileBuffer, 'shift_jis');
      console.log('✅ Successfully decoded with Shift-JIS encoding');
    } catch (encodingError) {
      console.warn('⚠️ Shift-JIS decoding failed, trying UTF-8 fallback:', encodingError.message);
      content = fileBuffer.toString('utf8');
    }
    
    console.log('📝 Content preview (first 200 chars):', content.substring(0, 200));
    
    // Split into lines and process
    const lines = content.trim().split('\n');
    const dataRows = [];
    
    for (const line of lines) {
      const columns = line.split('\t').map(col => col.trim());
      dataRows.push(columns);
    }
    
    if (dataRows.length < 2) {
      throw new Error('File must contain at least header and one data row');
    }
    
    const headers = dataRows[0];
    const data = dataRows.slice(1);
    
    console.log(`📊 File loaded: ${data.length} data rows, ${headers.length} columns`);
    
    // Your selected column indices (0-based)
    const selectedColumns = [
      { index: 6, name: '注文番号', key: 'order_number' },                    // Order Number
      { index: 22, name: '発注者品名コード', key: 'product_code' },            // Orderer Product Code
      { index: 20, name: '品名（品名仕様）', key: 'product_name' },            // Product Name/Specification
      { index: 14, name: '注文数量（受注数量）', key: 'order_quantity' },        // Order Quantity
      { index: 27, name: '納期', key: 'delivery_date' }                       // Delivery Date
    ];
    
    // Validate columns exist
    const maxRequiredIndex = Math.max(...selectedColumns.map(col => col.index));
    if (headers.length <= maxRequiredIndex) {
      throw new Error(`File must have at least ${maxRequiredIndex + 1} columns, but only has ${headers.length}`);
    }
    
    // Extract data for selected columns
    const extractedData = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      if (row.length <= maxRequiredIndex) {
        console.warn(`⚠️ Row ${i + 1} has insufficient columns, skipping`);
        continue;
      }
      
      const extractedRow = {
        row_number: i + 1,
        order_number: (row[6] || '').trim(),
        product_code: (row[22] || '').trim(),
        product_name: (row[20] || '').trim(),
        order_quantity: (row[14] || '').trim(),
        delivery_date: (row[27] || '').trim()
      };
      
      // Debug: Log Japanese text to verify encoding
      if (i < 3) { // Log first 3 rows for debugging
        console.log(`📋 Row ${i + 1} product_name:`, extractedRow.product_name);
      }
      
      // Skip rows with empty order numbers
      if (extractedRow.order_number) {
        extractedData.push(extractedRow);
      }
    }
    
    return {
      success: true,
      totalRows: data.length,
      extractedRows: extractedData.length,
      data: extractedData,
      columns: selectedColumns
    };
    
  } catch (error) {
    console.error('EDI parsing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Upload and process EDI file
router.post('/upload', upload.single('ediFile'), async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log(`📁 Processing EDI file: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Parse the EDI file
    const parseResult = parseEDIFile(req.file.buffer);
    
    if (!parseResult.success) {
      await logActivity(
        req.sessionID,
        'EDI_UPLOAD_FAILED',
        `Failed to parse ${req.file.originalname}: ${parseResult.error}`,
        userAgent,
        clientIP
      );
      
      return res.status(400).json({ 
        error: 'Failed to parse EDI file', 
        details: parseResult.error 
      });
    }
    
    const { data: extractedData } = parseResult;
    
    // Check existing orders in database and insert new ones
    let newRecords = 0;
    let skippedRecords = 0;
    let errorRecords = 0;
    const processedOrders = [];
    
    await pool.query('BEGIN');
    
    try {
      for (const record of extractedData) {
        // Check if order already exists
        const existingOrder = await pool.query(
          'SELECT order_number FROM edi_orders WHERE order_number = $1',
          [record.order_number]
        );
        
        if (existingOrder.rows.length > 0) {
          skippedRecords++;
          processedOrders.push({
            ...record,
            status: 'skipped',
            reason: 'Order already exists'
          });
        } else {
          try {
            // Insert new order
            await pool.query(`
              INSERT INTO edi_orders (
                order_number, product_code, product_name, 
                order_quantity, delivery_date, uploaded_by, uploaded_at
              ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [
              record.order_number,
              record.product_code,
              record.product_name,
              record.order_quantity,
              record.delivery_date,
              req.session.userId || null
            ]);
            
            newRecords++;
            processedOrders.push({
              ...record,
              status: 'added',
              reason: 'New order added'
            });
          } catch (insertError) {
            console.error(`Error inserting order ${record.order_number}:`, insertError);
            errorRecords++;
            processedOrders.push({
              ...record,
              status: 'error',
              reason: insertError.message
            });
          }
        }
      }
      
      await pool.query('COMMIT');
      
      // Log the upload activity
      await logActivity(
        req.sessionID,
        'EDI_UPLOAD_SUCCESS',
        `Processed ${req.file.originalname}: ${newRecords} new, ${skippedRecords} skipped, ${errorRecords} errors`,
        userAgent,
        clientIP
      );
      
      res.json({
        success: true,
        filename: req.file.originalname,
        totalParsed: extractedData.length,
        newRecords,
        skippedRecords,
        errorRecords,
        data: processedOrders
      });
      
    } catch (dbError) {
      await pool.query('ROLLBACK');
      throw dbError;
    }
    
  } catch (error) {
    console.error('EDI upload error:', error);
    
    try {
      await logActivity(
        req.sessionID,
        'EDI_UPLOAD_ERROR',
        `Upload failed: ${error.message}`,
        req.get('User-Agent') || 'unknown',
        getClientIP(req)
      );
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }
    
    res.status(500).json({ 
      error: 'Failed to process EDI file', 
      details: error.message 
    });
  }
});

// Get all EDI orders with pagination
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    // Get orders with user information
    const orders = await pool.query(`
      SELECT 
        eo.*,
        u.username as uploaded_by_username
      FROM edi_orders eo
      LEFT JOIN users u ON eo.uploaded_by = u.id
      ORDER BY eo.uploaded_at DESC, eo.order_number
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM edi_orders');
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      orders: orders.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching EDI orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get EDI dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Total orders
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM edi_orders');
    const totalOrders = parseInt(totalResult.rows[0].count);
    
    // Orders by status/date
    const recentResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM edi_orders 
      WHERE uploaded_at > NOW() - INTERVAL '7 days'
    `);
    const recentOrders = parseInt(recentResult.rows[0].count);
    
    // Unique products
    const productsResult = await pool.query('SELECT COUNT(DISTINCT product_code) as count FROM edi_orders');
    const uniqueProducts = parseInt(productsResult.rows[0].count);
    
    // Recent uploads
    const uploadsResult = await pool.query(`
      SELECT COUNT(DISTINCT session_id) as count 
      FROM activity_logs 
      WHERE action = 'EDI_UPLOAD_SUCCESS' 
      AND timestamp > NOW() - INTERVAL '24 hours'
    `);
    const recentUploads = parseInt(uploadsResult.rows[0].count);
    
    res.json({
      totalOrders,
      recentOrders,
      uniqueProducts,
      recentUploads
    });
    
  } catch (error) {
    console.error('Error fetching EDI stats:', error);
    res.status(500).json({ 
      totalOrders: 0,
      recentOrders: 0,
      uniqueProducts: 0,
      recentUploads: 0
    });
  }
});

// Delete an order (admin function)
router.delete('/orders/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    
    const result = await pool.query(
      'DELETE FROM edi_orders WHERE order_number = $1 RETURNING *',
      [orderNumber]
    );
    
    if (result.rows.length > 0) {
      await logActivity(
        req.sessionID,
        'EDI_ORDER_DELETED',
        `Deleted order: ${orderNumber}`,
        userAgent,
        clientIP
      );
      
      res.json({ success: true, message: 'Order deleted successfully' });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
    
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;