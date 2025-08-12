const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drone-delivery');

const droneSchema = new mongoose.Schema({
  name: String,
  model: String,
  maxWeight: Number,
  maxRange: Number,
  batteryLife: String,
  speed: Number,
  description: String,
  image: String,
  pricePerKm: Number,
  suitableFor: [String],
  status: { type: String, default: 'available' }
});

const Drone = mongoose.model('Drone', droneSchema);

const seedDrones = async () => {
  try {
    // Clear existing drones
    await Drone.deleteMany({});
    console.log('Cleared existing drone data');

    const drones = [
      {
        name: "SwiftCourier",
        model: "SC-Light",
        maxWeight: 2,
        maxRange: 15,
        batteryLife: "45 minutes",
        speed: 60,
        description: "Perfect for documents and small packages. Ultra-fast delivery within Mumbai.",
        image: "🚁",
        pricePerKm: 8,
        suitableFor: ["documents", "medicines"],
        status: "available"
      },
      {
        name: "CargoDrone Pro",
        model: "CDP-Medium", 
        maxWeight: 5,
        maxRange: 25,
        batteryLife: "60 minutes",
        speed: 50,
        description: "Ideal for electronics and medium-weight parcels. Weather-resistant design.",
        image: "🚁",
        pricePerKm: 12,
        suitableFor: ["electronics", "food", "medicines"],
        status: "available"
      },
      {
        name: "HeavyLifter Max",
        model: "HLM-Heavy",
        maxWeight: 10,
        maxRange: 30,
        batteryLife: "90 minutes",
        speed: 40,
        description: "Heavy-duty drone for large packages. Advanced GPS tracking.",
        image: "🚁",
        pricePerKm: 18,
        suitableFor: ["heavy", "fragile", "electronics"],
        status: "available"
      }
    ];

    const result = await Drone.insertMany(drones);
    console.log(`✅ Successfully seeded ${result.length} drones:`);
    result.forEach(drone => {
      console.log(`- ${drone.name}: suitable for ${drone.suitableFor.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error seeding drones:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

seedDrones();
