/**
 * Customer Routes
 * Defines endpoints for customer queries, data seeding, and customer CSV uploads.
 */
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const upload = require('../middleware/upload');

// GET /api/customers - Retrieve all customers with pagination
router.get('/', customerController.getCustomers);

// POST /api/customers/import - Upload and process customer CSV
router.post('/import', upload.single('file'), customerController.importCustomers);

// POST /api/customers/seed - Seed database with demo data
router.post('/seed', customerController.seedCustomers);

module.exports = router;
