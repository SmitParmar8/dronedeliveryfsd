const express = require('express');
const router = express.Router();
const Drone = require('../models/Drone');
const Order = require('../models/Order');

// Homepage with drone carousel
router.get('/', async (req, res) => {
  try {
    const drones = await Drone.find({ status: 'available' });
    res.render('index', { 
      title: 'Mumbai Drone Delivery Service',
      drones: drones || []
    });
  } catch (error) {
    console.error('Error loading homepage:', error);
    res.render('index', { 
      title: 'Mumbai Drone Delivery Service',
      drones: []
    });
  }
});

// Order flow page
router.get('/order', (req, res) => {
  res.render('order', {
    title: 'Place Your Order - Drone Delivery'
  });
});

// Tracking page
router.get('/tracking/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .populate('recommendedDrone');
    
    if (!order) {
      return res.status(404).send('Order not found');
    }
    
    res.render('tracking', {
      title: `Track Order ${req.params.orderId}`,
      order: order
    });
  } catch (error) {
    console.error('Error loading tracking page:', error);
    res.status(500).send('Error loading tracking information');
  }
});

// Past orders page
router.get('/past-orders', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'delivered' })
      .populate('recommendedDrone')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.render('pastorders', {
      title: 'Past Orders',
      orders: orders || []
    });
  } catch (error) {
    console.error('Error loading past orders:', error);
    res.render('pastorders', {
      title: 'Past Orders',
      orders: []
    });
  }
});

module.exports = router;
