const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stock_craft_billing',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    logger.success('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    logger.warning('Make sure MySQL is running and the database exists');
    return false;
  }
}

// Middleware
app.use(helmet());

// Conditional logging based on environment
if (process.env.NODE_ENV === 'development' && process.env.ENABLE_HTTP_LOGS === 'true') {
  app.use(morgan('dev')); // Shorter format for development
} else if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined')); // Full format for production
}
// No logging in development by default
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database is now connected via MySQL connection pool

// Custom logging utility
const logger = {
  info: (message) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`ℹ️  ${message}`);
    }
  },
  success: (message) => {
    console.log(`✅ ${message}`);
  },
  error: (message) => {
    console.error(`❌ ${message}`);
  },
  warning: (message) => {
    console.warn(`⚠️  ${message}`);
  }
};

// Database functions for real MySQL operations

// Database middleware
app.use((req, res, next) => {
  req.db = {
    execute: async (query, params = []) => {
      try {
        const [rows] = await pool.execute(query, params);
        return [rows];
      } catch (error) {
        console.error('Database query error:', error);
        throw error;
      }
    },
    withTransaction: async (callback) => {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const txDb = {
          execute: async (query, params = []) => {
            const [rows] = await connection.execute(query, params);
            return [rows];
          },
        };
        const result = await callback(txDb);
        await connection.commit();
        return result;
      } catch (err) {
        try { await connection.rollback(); } catch (_) {}
        throw err;
      } finally {
        connection.release();
      }
    }
  };
  next();
});

// Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/items', require('./routes/items'));
app.use('/api/raw-materials', require('./routes/rawMaterials'));
app.use('/api/manufacturing', require('./routes/manufacturing'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/payments', require('./routes/payments'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Stock Craft Billing API is running with MySQL database',
    timestamp: new Date().toISOString()
  });
});

// Admin endpoints removed - now using real MySQL database

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, async () => {
  logger.success(`Server running on port ${PORT}`);
  
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    logger.info(`Connected to MySQL database: ${dbConfig.database}`);
  } else {
    logger.warning('Running without database connection - some features may not work');
  }
});

module.exports = app;