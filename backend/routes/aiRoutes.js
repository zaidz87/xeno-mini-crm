/**
 * AI Routes
 * Exposes endpoints for natural language processing features using Google Gemini.
 */
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST /api/ai/segment - Convert plain English to query rules
router.post('/segment', aiController.parseSegmentRules);

// POST /api/ai/message - Draft marketing message based on goals
router.post('/message', aiController.generateMessage);

module.exports = router;
