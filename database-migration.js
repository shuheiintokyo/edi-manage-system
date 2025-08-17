#!/usr/bin/env node

/**
 * Database Migration Script
 * Adds status tracking to existing EDI orders and sets up complete system
 */

require('dotenv').config();
const { pool, testConnection } = require('./config/database');

async function runMigration() {
  console.log('🚀 Running Database Migration...');
  console.log('');

  try {
    // Test database connection
    console.log('📋 Step 1: Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connection successful');
    console.log('');

    const client = await pool.connect();
    
    try {
      console.log('📋 Step 2: Adding status columns to edi_orders...');
      
      // Add status column if it doesn't exist
      await client.query(`
        ALTER TABLE edi_orders 
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'default'
      `);
      
      // Add status_updated_at column if it doesn't exist
      await client.query(`
        ALTER TABLE edi_orders 
        ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `);
      
      console.log('✅ Status columns added successfully');
      console.log('');

      console.log('📋 Step 3: Creating status update trigger...');
      
      // Create trigger function for status updates
      await client.query(`
        CREATE OR REPLACE FUNCTION update_status_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.status IS DISTINCT FROM OLD.status THEN
                NEW.status_updated_at = NOW();
            END IF;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);
      
      // Drop existing trigger if it exists
      await client.query(`
        DROP TRIGGER IF EXISTS update_edi_orders_status_timestamp ON edi_orders;
      `);
      
      // Create trigger
      await client.query(`
        CREATE TRIGGER update_edi_orders_status_timestamp 
        BEFORE UPDATE ON edi_orders
        FOR EACH ROW EXECUTE FUNCTION update_status_timestamp();
      `);
      
      console.log('✅ Status update trigger created');
      console.log('');

      console.log('📋 Step 4: Creating indexes for better performance...');
      
      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_edi_orders_status ON edi_orders(status);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_edi_orders_delivery_date ON edi_orders(delivery_date);
      `);
      
      console.log('✅ Performance indexes created');
      console.log('');

      console.log('📋 Step 5: Updating existing orders with default status...');
      
      // Update existing orders that don't have status set
      const updateResult = await client.query(`
        UPDATE edi_orders 
        SET status = 'default', status_updated_at = NOW() 
        WHERE status IS NULL OR status = ''
      `);
      
      console.log(`✅ Updated ${updateResult.rowCount} existing orders with default status`);
      console.log('');

      console.log('📋 Step 6: Verifying migration...');
      
      // Check table structure
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'edi_orders' 
        AND column_name IN ('status', 'status_updated_at')
        ORDER BY ordinal_position
      `);
      
      console.log('✅ Migration verification:');
      columnsResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
      });
      console.log('');

      // Check data
      const statusCountResult = await client.query(`
        SELECT status, COUNT(*) as count 
        FROM edi_orders 
        GROUP BY status
        ORDER BY status
      `);
      
      console.log('✅ Current status distribution:');
      statusCountResult.rows.forEach(row => {
        console.log(`   - ${row.status}: ${row.count} orders`);
      });
      console.log('');

    } finally {
      client.release();
    }

    // Summary
    console.log('🎯 DATABASE MIGRATION COMPLETE!');
    console.log('');
    console.log('📊 What was migrated:');
    console.log('   ✅ Added status column to edi_orders');
    console.log('   ✅ Added status_updated_at timestamp column');
    console.log('   ✅ Created automatic status timestamp trigger');
    console.log('   ✅ Added performance indexes');
    console.log('   ✅ Set default status for existing orders');
    console.log('');
    console.log('🎮 Status System Features:');
    console.log('   • Click status to cycle: default → 1/2 → 3/4 → finished');
    console.log('   • Long press (3+ seconds) to reset to default');
    console.log('   • Color-coded status indicators');
    console.log('   • Bar chart integration with priority stacking');
    console.log('   • Forecast data overlay (gray)');
    console.log('');
    console.log('🚀 Ready for deployment!');
    console.log('');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Check DATABASE_URL in .env file');
    console.error('   2. Ensure database is accessible');
    console.error('   3. Verify table permissions');
    console.error('   4. Check if edi_orders table exists');
    console.error('');
    process.exit(1);
  }
}

// Run the migration
runMigration();