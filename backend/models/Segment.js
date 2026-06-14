/**
 * Segment Model
 * Represents user-defined or AI-defined audience segmentation rules.
 */
const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true,
    enum: ['totalSpend', 'orderCount', 'daysSinceLastOrder']
  },
  operator: {
    type: String,
    required: true,
    enum: ['gt', 'lt', 'gte', 'lte', 'eq']
  },
  value: {
    type: Number,
    required: true
  }
}, { _id: false });

const segmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Segment name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  rules: {
    type: [ruleSchema],
    default: []
  },
  matchedCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Segment', segmentSchema);
