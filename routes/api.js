const express = require('express');
const router = express.Router();
const Drone = require('../models/Drone');
const Order = require('../models/Order');

// Get all drones for carousel
router.get('/drones', async (req, res) => {
  try {
    const drones = await Drone.find({ status: 'available' });
    res.json({ success: true, drones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Recommend drone based on parcel details
// Recommend drone based on parcel details
router.post('/drones/recommend', async (req, res) => {
  try {
    const { parcelType, weight, distance } = req.body;
    
    console.log('Recommendation request:', { parcelType, weight, distance });
    
    // First, let's find all available drones
    const allDrones = await Drone.find({ status: 'available' });
    console.log(`Found ${allDrones.length} available drones`);
    
    if (allDrones.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No drones available in the system' 
      });
    }

    // Filter drones based on requirements
    const suitableDrones = allDrones.filter(drone => {
      const weightOk = drone.maxWeight >= weight;
      const rangeOk = drone.maxRange >= distance;
      const typeOk = drone.suitableFor.includes(parcelType);
      
      console.log(`${drone.name}: weight(${weightOk}) range(${rangeOk}) type(${typeOk})`);
      
      return weightOk && rangeOk && typeOk;
    });

    console.log(`Found ${suitableDrones.length} suitable drones`);

    if (suitableDrones.length === 0) {
      // If no exact match, find drones that can handle weight and distance
      const fallbackDrones = allDrones.filter(drone => {
        return drone.maxWeight >= weight && drone.maxRange >= distance;
      });

      if (fallbackDrones.length > 0) {
        const recommendedDrone = fallbackDrones.sort((a, b) => a.pricePerKm - b.pricePerKm)[0];
        return res.json({ 
          success: true, 
          recommendedDrone: recommendedDrone,
          alternatives: fallbackDrones.slice(1, 3),
          message: `No exact match found for ${parcelType}, but this drone can handle your package.`
        });
      }

      return res.status(404).json({ 
        success: false, 
        message: `No suitable drone found. Requirements: ${weight}kg, ${distance}km range, ${parcelType} type.`
      });
    }
    
    // Sort by price (cheapest first)
    const sortedDrones = suitableDrones.sort((a, b) => a.pricePerKm - b.pricePerKm);
    
    res.json({ 
      success: true, 
      recommendedDrone: sortedDrones[0],
      alternatives: sortedDrones.slice(1, 3)
    });
  } catch (error) {
    console.error('Error in drone recommendation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new order
router.post('/orders', async (req, res) => {
  try {
    const orderData = req.body;
    const orderId = `DRN${Date.now()}`;
    
    // Calculate distance (simulation for Mumbai area)
    const distance = Math.round(Math.random() * 25 + 5); // 5-30 km
    
    // Get drone details for pricing
    const drone = await Drone.findById(orderData.recommendedDrone);
    if (!drone) {
      return res.status(404).json({ success: false, message: 'Drone not found' });
    }
    
    // Calculate pricing
    const baseFare = 50;
    const distanceFare = distance * drone.pricePerKm;
    const pickupFee = orderData.pickupOption === 'home' ? 100 : 0;
    const total = baseFare + distanceFare + pickupFee;
    
    const order = new Order({
      orderId,
      ...orderData,
      distance,
      pricing: { baseFare, distanceFare, pickupFee, total },
      dronePosition: orderData.locations.pickup.coordinates,
      estimatedDeliveryTime: Math.round(distance / drone.speed * 60) // minutes
    });
    
    await order.save();
    const populatedOrder = await Order.findById(order._id).populate('recommendedDrone');
    
    res.json({ success: true, order: populatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get order by ID
router.get('/orders/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .populate('recommendedDrone');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update drone position (for tracking)
router.patch('/orders/:orderId/position', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { dronePosition: { lat, lng } },
      { new: true }
    ).populate('recommendedDrone');
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
