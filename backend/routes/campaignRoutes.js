/**
 * Campaign Routes
 * Maps campaign configuration, sending, and statistical retrieval endpoints.
 */
const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

// GET /api/campaigns - List all campaigns
router.get('/', campaignController.getCampaigns);

// POST /api/campaigns - Create a new campaign (draft)
router.post('/', campaignController.createCampaign);

// GET /api/campaigns/:id - Get detailed campaign metadata and metrics
router.get('/:id', campaignController.getCampaignDetail);

// GET /api/campaigns/:id/logs - Get granular per-customer communication logs
router.get('/:id/logs', campaignController.getCampaignLogs);

// POST /api/campaigns/:id/send - Trigger async background delivery
router.post('/:id/send', campaignController.sendCampaign);

module.exports = router;
