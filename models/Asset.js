const mongoose = require('mongoose');
const { EQUIPMENT_TYPES, ASSET_STATUS } = require('../utils/constants');

const assetSchema = new mongoose.Schema({
  assetNumber: {
    type: String,
    required: [true, 'Asset number is required'],
    unique: true,
    trim: true
  },
  equipmentType: {
    type: String,
    enum: Object.values(EQUIPMENT_TYPES),
    required: [true, 'Equipment type is required']
  },
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  currentBase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    required: [true, 'Current base is required']
  },
  status: {
    type: String,
    enum: Object.values(ASSET_STATUS),
    default: ASSET_STATUS.AVAILABLE
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  currentQuantity: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
assetSchema.index({ currentBase: 1, equipmentType: 1 });
assetSchema.index({ assetNumber: 1 });

module.exports = mongoose.model('Asset', assetSchema);

