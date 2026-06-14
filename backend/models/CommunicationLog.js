/**
 * CommunicationLog Model
 * Tracks individual delivery details and receipt status callback history for each customer.
 */
const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['sent', 'delivered', 'failed', 'opened', 'clicked']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const communicationLogSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    required: true,
    enum: ['whatsapp', 'sms', 'email']
  },
  status: {
    type: String,
    required: true,
    enum: ['sent', 'delivered', 'failed', 'opened', 'clicked'],
    default: 'sent'
  },
  statusHistory: {
    type: [statusHistorySchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Set compound index to make queries from channel callback super fast
communicationLogSchema.index({ campaignId: 1, customerId: 1 }, { unique: true });

module.exports = mongoose.model('CommunicationLog', communicationLogSchema);
