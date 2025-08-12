const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  parcelDetails: {
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['documents', 'electronics', 'food', 'medicines', 'fragile', 'heavy'],
      required: true
    },
    weight: {
      type: Number,
      required: true
    },
    description: String
  },
  locations: {
    pickup: {
      address: String,
      coordinates: {
        lat: { type: Number, default: 19.0760 }, // Mumbai coordinates
        lng: { type: Number, default: 72.8777 }
      }
    },
    delivery: {
      address: String,
      coordinates: {
        lat: { type: Number, default: 19.1136 },
        lng: { type: Number, default: 72.8697 }
      }
    }
  },
  distance: {
    type: Number,
    required: true
  },
  recommendedDrone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drone',
    required: true
  },
  pickupOption: {
    type: String,
    enum: ['home', 'station'],
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  pricing: {
    baseFare: Number,
    distanceFare: Number,
    pickupFee: Number,
    total: Number
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'picked-up', 'in-transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  dronePosition: {
    lat: Number,
    lng: Number
  },
  estimatedDeliveryTime: Number
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
