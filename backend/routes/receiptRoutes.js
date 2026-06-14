/**
 * Receipt Routes
 * Endpoint for callback status webhooks from external channels.
 */
const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');

// POST /api/receipt - Callback endpoint from carrier / channel service
router.post('/', receiptController.handleReceipt);

module.exports = router;
