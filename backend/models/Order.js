/**
 * Order Model
 * Represents transactions/orders made by customers.
 */
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Order must belong to a Customer'],
    index: true
  },
  customerEmail: {
    type: String,
    required: [true, 'Order email is required for tracking and link imports'],
    trim: true,
    lowercase: true,
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Order amount is required'],
    min: [0, 'Order amount cannot be negative']
  },
  date: {
    type: Date,
    required: [true, 'Order date is required'],
    default: Date.now
  },
  items: {
    type: String,
    required: [true, 'Items string is required']
  }
});

module.exports = mongoose.model('Order', orderSchema);
