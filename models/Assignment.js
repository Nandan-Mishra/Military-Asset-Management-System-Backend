const mongoose = require('mongoose');
const { EQUIPMENT_TYPES } = require('../utils/constants');

const assignmentSchema = new mongoose.Schema({
  assignmentNumber: {
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
  assignedTo: {
    type: String,
    required: [true, 'Personnel name/ID is required'],
    trim: true
  },
  personnelId: {
    type: String,
    trim: true
  },
  assignmentDate: {
    type: Date,
    required: [true, 'Assignment date is required'],
    default: Date.now
  },
  returnDate: {
    type: Date
  },
  isReturned: {
    type: Boolean,
    default: false
  },
  assignedBy: {
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
assignmentSchema.index({ base: 1, assignmentDate: -1 });
assignmentSchema.index({ assignedTo: 1 });
assignmentSchema.index({ equipmentType: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);

