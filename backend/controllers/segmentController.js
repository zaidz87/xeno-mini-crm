/**
 * Segment Controller
 * Handles audience segment creation, previews, and management.
 */
const Segment = require('../models/Segment');
const Customer = require('../models/Customer');
const { buildQuery } = require('../services/segmentEngine');

/**
 * Get all segments.
 * GET /api/segments
 */
async function getSegments(req, res) {
  try {
    const segments = await Segment.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      segments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve segments.', error: error.message });
  }
}

/**
 * Create a new segment.
 * POST /api/segments
 */
async function createSegment(req, res) {
  try {
    const { name, description, rules } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Segment name is required.' });
    }

    // Convert rules to Mongo Query and count matched customers
    const query = buildQuery(rules || []);
    const matchedCount = await Customer.countDocuments(query);

    const segment = new Segment({
      name,
      description: description || '',
      rules: rules || [],
      matchedCount
    });

    await segment.save();

    res.status(201).json({
      success: true,
      message: 'Segment created successfully.',
      segment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create segment.', error: error.message });
  }
}

/**
 * Preview matching customer count for an existing saved segment.
 * GET /api/segments/:id/preview
 */
async function previewSavedSegment(req, res) {
  try {
    const segment = await Segment.findById(req.params.id);
    if (!segment) {
      return res.status(404).json({ success: false, message: 'Segment not found.' });
    }

    const query = buildQuery(segment.rules);
    const count = await Customer.countDocuments(query);

    res.status(200).json({
      success: true,
      segmentId: segment._id,
      matchedCount: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error previewing saved segment.', error: error.message });
  }
}

/**
 * Preview matching customer count for a list of unsaved rules (used in segment builder).
 * POST /api/segments/preview
 */
async function previewRules(req, res) {
  try {
    const { rules } = req.body;
    
    // Convert rules to Mongo query and count matches
    const query = buildQuery(rules || []);
    const count = await Customer.countDocuments(query);

    res.status(200).json({
      success: true,
      matchedCount: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error previewing segment rules.', error: error.message });
  }
}

/**
 * Delete a segment.
 * DELETE /api/segments/:id
 */
async function deleteSegment(req, res) {
  try {
    const segment = await Segment.findByIdAndDelete(req.params.id);
    if (!segment) {
      return res.status(404).json({ success: false, message: 'Segment not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Segment deleted successfully.',
      deletedSegmentId: segment._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete segment.', error: error.message });
  }
}

module.exports = {
  getSegments,
  createSegment,
  previewSavedSegment,
  previewRules,
  deleteSegment
};
