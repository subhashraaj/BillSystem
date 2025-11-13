import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import customersRouter from './routes/customers.js';
import itemsRouter from './routes/items.js';
import rawMaterialsRouter from './routes/rawMaterials.js';
import manufacturingRouter from './routes/manufacturing.js';
import invoicesRouter from './routes/invoices.js';
import paymentsRouter from './routes/payments.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// Database connection
async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/stock_craft_billing';

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    logger.success('Database connected successfully');
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    logger.warning('Make sure MongoDB is running and accessible');
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

// Routes
app.use('/api/customers', customersRouter);
app.use('/api/items', itemsRouter);
app.use('/api/raw-materials', rawMaterialsRouter);
app.use('/api/manufacturing', manufacturingRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/payments', paymentsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Stock Craft Billing API is running with MongoDB database',
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
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    logger.success(`Server running on port ${PORT}`);

    if (mongoose.connection.readyState === 1) {
      logger.info(`Connected to MongoDB database: ${mongoose.connection.name}`);
    } else {
      logger.warning('Running without database connection - some features may not work');
    }
  });
}

startServer().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});

export default app;