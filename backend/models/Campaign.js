/**
 * Campaign Model
 * Tracks marketing message campaigns, channels, and logs overall aggregate status.
 */
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true
  },
  segmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Segment',
    required: [true, 'Campaign must be target at an audience segment']
  },
  segmentName: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    required: [true, 'Channel is required'],
    enum: ['whatsapp', 'sms', 'email']
  },
  message: {
    type: String,
    required: [true, 'Campaign message is required']
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'sending', 'completed'],
    default: 'draft'
  },
  totalAudience: {
    type: Number,
    default: 0
  },
  sent: {
    type: Number,
    default: 0
  },
  delivered: {
    type: Number,
    default: 0
  },
  failed: {
    type: Number,
    default: 0
  },
  opened: {
    type: Number,
    default: 0
  },
  clicked: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Campaign', campaignSchema);
