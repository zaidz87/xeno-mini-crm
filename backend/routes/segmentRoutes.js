/**
 * Segment Routes
 * Maps audience segment endpoints to their respective controllers.
 */
const express = require('express');
const router = express.Router();
const segmentController = require('../controllers/segmentController');

// GET /api/segments - List all segments
router.get('/', segmentController.getSegments);

// POST /api/segments - Create new segment with rules
router.post('/', segmentController.createSegment);

// POST /api/segments/preview - Preview customer count for temporary rules (unsaved segment)
router.post('/preview', segmentController.previewRules);

// GET /api/segments/:id/preview - Preview customer count for saved segment
router.get('/:id/preview', segmentController.previewSavedSegment);

// DELETE /api/segments/:id - Delete segment
router.delete('/:id', segmentController.deleteSegment);

module.exports = router;
