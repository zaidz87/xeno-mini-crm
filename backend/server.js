/**
 * Express Server Entrypoint
 * Configures express server, cors, global error boundaries, mounts routers,
 * and sets up MongoDB connection lifecycle.
 */
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const customerRoutes = require('./routes/customerRoutes');
const segmentRoutes = require('./routes/segmentRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const aiRoutes = require('./routes/aiRoutes');
const receiptRoutes = require('./routes/receiptRoutes');

// Import controllers/middleware for orders
const customerController = require('./controllers/customerController');
const upload = require('./middleware/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors({
  origin: '*', // Allow all origins in local dev/testing
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// Mount routes
app.use('/api/customers', customerRoutes);
app.use('/api/segments', segmentRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/receipt', receiptRoutes);

// Register orders route (since no separate orders router file is defined in spec)
const orderRouter = express.Router();
orderRouter.post('/import', upload.single('file'), customerController.importOrders);
app.use('/api/orders', orderRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'An internal server error occurred.'
  });
});

// Connect to MongoDB Database
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/xeno-crm';
console.log(`Attempting database connection to: ${mongoUri}`);

mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connection established successfully.');
    // Start Server
    app.listen(PORT, () => {
      console.log(`Xeno CRM Backend Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Critical database connection failure. Server aborted.', error);
    process.exit(1);
  });

// Handle graceful termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination.');
  process.exit(0);
});
