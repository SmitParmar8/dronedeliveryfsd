class DroneTracker {
  constructor() {
    this.map = null;
    this.droneMarker = null;
    this.pickupMarker = null;
    this.deliveryMarker = null;
    this.routeLine = null;
    this.currentStatus = window.orderData.status;
    this.dronePosition = window.orderData.dronePosition;
    this.isTracking = false;
    this.simulationInterval = null;
    
    this.init();
  }

  init() {
    console.log('Initializing drone tracker with data:', window.orderData);
    
    // Start status simulation based on pickup option
    this.startDeliverySimulation();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    const followDroneBtn = document.getElementById('followDrone');
    const showRouteBtn = document.getElementById('showFullRoute');
    
    followDroneBtn?.addEventListener('click', () => this.followDrone());
    showRouteBtn?.addEventListener('click', () => this.showFullRoute());
  }

  startDeliverySimulation() {
    const { pickupOption } = window.orderData;
    
    if (pickupOption === 'home') {
      this.simulateHomePickup();
    } else {
      this.simulateStationPickup();
    }
  }

  simulateHomePickup() {
    // Step 1: Drone going to pickup (5 seconds)
    setTimeout(() => {
      this.updateStatus('pickup-enroute', '🚁 Drone heading to pickup location...', '5-8 minutes');
    }, 2000);

    // Step 2: Package picked up (10 seconds)
    setTimeout(() => {
      this.updateStatus('picked-up', '📦 Package picked up! Heading to destination...', '3-6 minutes');
      this.updateProgressStep('picked-up');
      this.startMapTracking();
    }, 8000);

    // Step 3: In transit (12 seconds)
    setTimeout(() => {
      this.updateStatus('in-transit', '🚁 Drone flying to your location!', '2-4 minutes');
      this.updateProgressStep('in-transit');
    }, 12000);
  }

  simulateStationPickup() {
    // Step 1: Package at station (2 seconds)
    setTimeout(() => {
      this.updateStatus('at-station', '📍 Package received at station...', '2-3 minutes');
    }, 1000);

    // Step 2: Package picked up (5 seconds)  
    setTimeout(() => {
      this.updateStatus('picked-up', '📦 Package loaded in drone!', '3-5 minutes');
      this.updateProgressStep('picked-up');
    }, 4000);

    // Step 3: Start delivery (7 seconds)
    setTimeout(() => {
      this.updateStatus('in-transit', '🚁 Drone starting delivery flight!', '2-4 minutes');
      this.updateProgressStep('in-transit');
      this.startMapTracking();
    }, 7000);
  }

  updateStatus(status, message, eta) {
    this.currentStatus = status;
    
    document.getElementById('statusMessage').textContent = message;
    document.getElementById('etaText').textContent = `ETA: ${eta}`;
    
    // Update status icon
    const statusIcon = document.getElementById('statusIcon');
    const icons = {
      'pickup-enroute': '🚁',
      'picked-up': '📦',
      'in-transit': '✈️',
      'delivered': '🎉'
    };
    statusIcon.textContent = icons[status] || '🚁';
    
    console.log(`Status updated: ${status} - ${message}`);
  }

  updateProgressStep(step) {
    const stepElement = document.getElementById(`step${step.charAt(0).toUpperCase() + step.slice(1).replace('-', '')}`);
    if (stepElement) {
      stepElement.classList.add('completed');
    }
  }

  startMapTracking() {
    // Show map section
    document.getElementById('mapSection').style.display = 'block';
    
    // Initialize map after a short delay
    setTimeout(() => {
      this.initializeMap();
      this.startDroneAnimation();
    }, 1000);
  }

  initializeMap() {
    const { pickupCoords, deliveryCoords } = window.orderData;
    
    // Calculate center point between pickup and delivery
    const centerLat = (pickupCoords.lat + deliveryCoords.lat) / 2;
    const centerLng = (pickupCoords.lng + deliveryCoords.lng) / 2;
    
    // Initialize map
    this.map = L.map('deliveryMap').setView([centerLat, centerLng], 12);
    
    // Add Mumbai-focused tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(this.map);

    // Create custom icons
    const pickupIcon = L.divIcon({
      html: '<div class="custom-marker pickup-marker">🟢<span>Pickup</span></div>',
      className: 'custom-div-icon',
      iconSize: [60, 40],
      iconAnchor: [30, 40]
    });

    const deliveryIcon = L.divIcon({
      html: '<div class="custom-marker delivery-marker">🔴<span>Delivery</span></div>',
      className: 'custom-div-icon',
      iconSize: [60, 40],
      iconAnchor: [30, 40]
    });

    const droneIcon = L.divIcon({
      html: '<div class="drone-marker">🚁<div class="pulse-ring"></div></div>',
      className: 'drone-div-icon',
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    // Add markers
    this.pickupMarker = L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupIcon })
      .addTo(this.map)
      .bindPopup('<b>📦 Pickup Location</b><br>Starting point');

    this.deliveryMarker = L.marker([deliveryCoords.lat, deliveryCoords.lng], { icon: deliveryIcon })
      .addTo(this.map)
      .bindPopup('<b>🎯 Delivery Location</b><br>Final destination');

    // Add route line
    this.routeLine = L.polyline([
      [pickupCoords.lat, pickupCoords.lng],
      [deliveryCoords.lat, deliveryCoords.lng]
    ], {
      color: '#FF6B35',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(this.map);

    // Add drone marker (initially at pickup)
    this.droneMarker = L.marker([pickupCoords.lat, pickupCoords.lng], { icon: droneIcon })
      .addTo(this.map)
      .bindPopup('<b>🚁 Drone Location</b><br>Live tracking active');

    // Fit map to show entire route
    const group = new L.featureGroup([this.pickupMarker, this.deliveryMarker]);
    this.map.fitBounds(group.getBounds().pad(0.1));
  }

  startDroneAnimation() {
    const { pickupCoords, deliveryCoords, droneSpeed } = window.orderData;
    
    // Calculate total distance and steps
    const totalDistance = this.calculateDistance(pickupCoords, deliveryCoords);
    const steps = 25; // Number of animation steps
    const stepDistance = totalDistance / steps;
    const timePerStep = 2000; // 2 seconds per step as requested
    
    let currentStep = 0;
    const latDiff = (deliveryCoords.lat - pickupCoords.lat) / steps;
    const lngDiff = (deliveryCoords.lng - pickupCoords.lng) / steps;
    
    console.log(`Starting drone animation: ${steps} steps, ${timePerStep}ms per step`);
    
    this.simulationInterval = setInterval(() => {
      currentStep++;
      
      // Calculate new position
      const newLat = pickupCoords.lat + (latDiff * currentStep);
      const newLng = pickupCoords.lng + (lngDiff * currentStep);
      const newPosition = { lat: newLat, lng: newLng };
      
      // Update drone marker position
      this.droneMarker.setLatLng([newLat, newLng]);
      
      // Update drone info overlay
      this.updateDroneInfo(currentStep, steps, totalDistance);
      
      // Update database with new position
      this.updateDronePosition(newPosition);
      
      // Check if delivery is complete
      if (currentStep >= steps) {
        clearInterval(this.simulationInterval);
        this.completeDelivery();
      }
    }, timePerStep);
  }

  updateDroneInfo(currentStep, totalSteps, totalDistance) {
    const { droneSpeed } = window.orderData;
    const progress = currentStep / totalSteps;
    const remainingDistance = (totalDistance * (1 - progress)).toFixed(1);
    
    document.getElementById('droneSpeed').textContent = `${droneSpeed} km/h`;
    document.getElementById('distanceRemaining').textContent = `${remainingDistance} km`;
    
    // Update ETA based on remaining distance
    const remainingTime = Math.round((remainingDistance / droneSpeed) * 60);
    document.getElementById('etaText').textContent = `ETA: ${remainingTime} minutes`;
  }

  async updateDronePosition(position) {
    try {
      await fetch(`/api/orders/${window.orderData.orderId}/position`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(position)
      });
    } catch (error) {
      console.error('Failed to update drone position:', error);
    }
  }

  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLng = this.toRad(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  async completeDelivery() {
    // Update status to delivered
    this.updateStatus('delivered', '🎉 Package delivered successfully!', 'Completed');
    this.updateProgressStep('delivered');
    
    // Update database
    try {
      await fetch(`/api/orders/${window.orderData.orderId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          finalPosition: window.orderData.deliveryCoords 
        })
      });
    } catch (error) {
      console.error('Failed to complete delivery:', error);
    }
    
    // Show success modal after 3 seconds
    setTimeout(() => {
      this.showDeliveryModal();
    }, 3000);
  }

  showDeliveryModal() {
    const modal = document.getElementById('deliveryModal');
    const actualTime = document.getElementById('actualDeliveryTime');
    
    // Calculate actual delivery time
    const deliveryTime = Math.round(window.orderData.estimatedTime * 0.9); // Slightly faster than estimate
    actualTime.textContent = `${deliveryTime} minutes`;
    
    modal.style.display = 'flex';
  }

  followDrone() {
    if (this.droneMarker && this.map) {
      this.map.setView(this.droneMarker.getLatLng(), 15);
      
      // Update button states
      document.getElementById('followDrone').classList.add('active');
      document.getElementById('showFullRoute').classList.remove('active');
    }
  }

  showFullRoute() {
    if (this.map && this.routeLine) {
      this.map.fitBounds(this.routeLine.getBounds(), { padding: [20, 20] });
      
      // Update button states
      document.getElementById('showFullRoute').classList.add('active');
      document.getElementById('followDrone').classList.remove('active');
    }
  }
}

// Global functions for template access
function openChat() {
  alert('🤖 Live chat feature coming soon! For now, please call our support number.');
}

function reportIssue() {
  const issues = [
    'Drone seems delayed',
    'Wrong pickup location',
    'Package damage concerns',
    'Weather conditions',
    'Other issue'
  ];
  
  const selectedIssue = prompt(`Please select an issue:\n${issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')}`);
  
  if (selectedIssue) {
    alert(`Issue reported: ${issues[parseInt(selectedIssue) - 1] || 'Other issue'}. Our support team will contact you shortly.`);
  }
}

function closeModal() {
  document.getElementById('deliveryModal').style.display = 'none';
}

function goHome() {
  window.location.href = '/';
}

// Initialize tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DroneTracker();
});
