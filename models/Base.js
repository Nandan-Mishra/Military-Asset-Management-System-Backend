const mongoose = require('mongoose');

const baseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Base name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Base code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Base', baseSchema);

