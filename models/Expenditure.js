const mongoose = require('mongoose');
const { EQUIPMENT_TYPES } = require('../utils/constants');

const expenditureSchema = new mongoose.Schema({
  expenditureNumber: {
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
  base: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    required: [true, 'Base is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1
  },
  expenditureDate: {
    type: Date,
    required: [true, 'Expenditure date is required'],
    default: Date.now
  },
  reason: {
    type: String,
    required: [true, 'Reason for expenditure is required'],
    trim: true
  },
  expendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
expenditureSchema.index({ base: 1, expenditureDate: -1 });
expenditureSchema.index({ equipmentType: 1, expenditureDate: -1 });

module.exports = mongoose.model('Expenditure', expenditureSchema);

