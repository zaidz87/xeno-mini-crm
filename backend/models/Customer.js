/**
 * Customer Model
 * Represents a customer stored in the Xeno CRM database.
 */
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Customer email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  phone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true
  },
  totalSpend: {
    type: Number,
    default: 0,
    min: [0, 'Total spend cannot be negative']
  },
  orderCount: {
    type: Number,
    default: 0,
    min: [0, 'Order count cannot be negative']
  },
  lastOrderDate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Helper index for query builder performance
customerSchema.index({ totalSpend: 1, orderCount: 1, lastOrderDate: 1 });

module.exports = mongoose.model('Customer', customerSchema);
