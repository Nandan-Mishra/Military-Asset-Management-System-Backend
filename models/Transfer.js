const mongoose = require('mongoose');
const { EQUIPMENT_TYPES } = require('../utils/constants');

const transferStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  COMPLETED: 'completed',
  REJECTED: 'rejected'
};

const transferSchema = new mongoose.Schema({
  transferNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: [true, 'Asset is required']
  },
  equipmentType: {
    type: String,
    enum: Object.values(EQUIPMENT_TYPES),
    required: [true, 'Equipment type is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1
  },
  fromBase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    required: [true, 'Source base is required']
  },
  toBase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    required: [true, 'Destination base is required']
  },
  transferDate: {
    type: Date,
    required: [true, 'Transfer date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: Object.values(transferStatus),
    default: transferStatus.PENDING
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
transferSchema.index({ fromBase: 1, transferDate: -1 });
transferSchema.index({ toBase: 1, transferDate: -1 });
transferSchema.index({ equipmentType: 1, transferDate: -1 });
transferSchema.index({ status: 1 });

module.exports = mongoose.model('Transfer', transferSchema);

