const mongoose = require('mongoose');

const droneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  maxWeight: {
    type: Number,
    required: true
  },
  maxRange: {
    type: Number,
    required: true
  },
  batteryLife: {
    type: String,
    required: true
  },
  speed: {
    type: Number,
    default: 50
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  pricePerKm: {
    type: Number,
    required: true
  },
  suitableFor: [{
    type: String,
    enum: ['documents', 'electronics', 'food', 'medicines', 'fragile', 'heavy']
  }],
  status: {
    type: String,
    enum: ['available', 'in-use', 'maintenance'],
    default: 'available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Drone', droneSchema);
