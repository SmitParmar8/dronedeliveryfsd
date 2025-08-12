class OrderFlow {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;
    this.orderData = {
      locations: {
        pickup: { address: '', coordinates: { lat: 19.0760, lng: 72.8777 } },
        delivery: { address: '', coordinates: { lat: 19.1136, lng: 72.8697 } }
      },
      parcelDetails: {
        title: '',
        type: '',
        weight: 0.5,
        description: ''
      },
      recommendedDrone: null,
      pickupOption: 'station',
      scheduledTime: '',
      distance: 0,
      pricing: null
    };
    
    this.init();
  }

  init() {
    // Set minimum datetime for scheduling
    this.setMinDateTime();
    
    // Auto-calculate distance when locations change
    this.setupLocationListeners();
    
    // Setup pickup option listeners
    this.setupPickupListeners();
    
    // Initial step setup
    this.updateStepProgress();
  }

  setMinDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Minimum 30 minutes from now
    const minDateTime = now.toISOString().slice(0, 16);
    
    const scheduledTimeInput = document.getElementById('scheduledTime');
    if (scheduledTimeInput) {
      scheduledTimeInput.min = minDateTime;
      
      // Set default to 1 hour from now
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      scheduledTimeInput.value = oneHourLater.toISOString().slice(0, 16);
    }
  }

  setupLocationListeners() {
    const pickupInput = document.getElementById('pickupLocation');
    const deliveryInput = document.getElementById('deliveryLocation');
    
    if (pickupInput && deliveryInput) {
      pickupInput.addEventListener('input', () => this.handleLocationChange());
      deliveryInput.addEventListener('input', () => this.handleLocationChange());
      
      // Add Mumbai area suggestions
      pickupInput.addEventListener('focus', () => this.showLocationSuggestions('pickup'));
      deliveryInput.addEventListener('focus', () => this.showLocationSuggestions('delivery'));
    }
  }

  showLocationSuggestions(type) {
    const mumbaiAreas = [
      'Bandra West, Mumbai',
      'Andheri East, Mumbai', 
      'Powai, Mumbai',
      'Worli, Mumbai',
      'Colaba, Mumbai',
      'Juhu, Mumbai',
      'Malad West, Mumbai',
      'Thane West, Mumbai',
      'Borivali East, Mumbai',
      'Ghatkopar West, Mumbai',
      'Santacruz East, Mumbai',
      'Lower Parel, Mumbai'
    ];

    const suggestionsContainer = document.getElementById(type + 'Suggestions');
    if (suggestionsContainer) {
      suggestionsContainer.innerHTML = mumbaiAreas
        .map(area => `<div class="suggestion-item" onclick="orderFlow.selectLocation('${type}', '${area}')">${area}</div>`)
        .join('');
      suggestionsContainer.style.display = 'block';
    }
  }

  selectLocation(type, address) {
    const input = document.getElementById(type + 'Location');
    if (input) {
      input.value = address;
      this.orderData.locations[type].address = address;
      
      // Hide suggestions
      const suggestionsContainer = document.getElementById(type + 'Suggestions');
      if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
      }
      
      this.handleLocationChange();
    }
  }

  handleLocationChange() {
    const pickup = document.getElementById('pickupLocation').value;
    const delivery = document.getElementById('deliveryLocation').value;
    
    if (pickup && delivery) {
      // Simulate distance calculation for Mumbai
      const distance = this.calculateMumbaiDistance(pickup, delivery);
      this.orderData.distance = distance;
      
      // Show distance estimate
      this.showDistanceEstimate(distance);
    }
  }

  calculateMumbaiDistance(pickup, delivery) {
    // Simulate realistic Mumbai distances based on common routes
    const distances = {
      'short': [5, 8, 12, 15],
      'medium': [18, 22, 25, 28],
      'long': [30, 35, 40, 45]
    };
    
    // Randomly select based on different area combinations
    const randomCategory = Math.random() < 0.4 ? 'short' : Math.random() < 0.7 ? 'medium' : 'long';
    const categoryDistances = distances[randomCategory];
    return categoryDistances[Math.floor(Math.random() * categoryDistances.length)];
  }

  showDistanceEstimate(distance) {
    const estimateDiv = document.getElementById('distanceEstimate');
    const distanceText = document.getElementById('estimatedDistance');
    const timeText = document.getElementById('estimatedTime');
    
    if (estimateDiv && distanceText && timeText) {
      distanceText.textContent = `${distance} km`;
      timeText.textContent = `${Math.round(distance * 2)} min`; // 2 min per km
      estimateDiv.style.display = 'block';
    }
  }

  setupPickupListeners() {
    const homePickup = document.getElementById('homePickup');
    const stationDrop = document.getElementById('stationDrop');
    
    if (homePickup && stationDrop) {
      homePickup.addEventListener('change', () => {
        if (homePickup.checked) {
          this.orderData.pickupOption = 'home';
        }
      });
      
      stationDrop.addEventListener('change', () => {
        if (stationDrop.checked) {
          this.orderData.pickupOption = 'station';
        }
      });
    }
  }

  updateStepProgress() {
    // Update step indicators
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
      const stepNumber = index + 1;
      step.classList.remove('active', 'completed');
      
      if (stepNumber === this.currentStep) {
        step.classList.add('active');
      } else if (stepNumber < this.currentStep) {
        step.classList.add('completed');
      }
    });
  }

  async recommendDrone() {
  // Validate parcel details
  const title = document.getElementById('parcelTitle').value;
  const type = document.getElementById('parcelType').value;
  const weight = parseFloat(document.getElementById('parcelWeight').value);
  
  console.log('Recommendation request data:', { title, type, weight, distance: this.orderData.distance });
  
  if (!title || !type || !weight || weight <= 0) {
    alert('Please fill in all parcel details correctly');
    return;
  }
  
  if (!this.orderData.distance || this.orderData.distance <= 0) {
    alert('Please enter both pickup and delivery locations first');
    return;
  }
  
  // Update order data
  this.orderData.parcelDetails = { title, type, weight, description: document.getElementById('parcelDescription').value };
  
  try {
    this.showLoading('Finding the perfect drone for your package...');
    
    const requestData = {
      parcelType: type,
      weight: weight,
      distance: this.orderData.distance
    };
    
    console.log('Sending API request:', requestData);
    
    const response = await fetch('/api/drones/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    const data = await response.json();
    console.log('API response:', data);
    
    if (data.success) {
      this.orderData.recommendedDrone = data.recommendedDrone;
      this.displayDroneRecommendation(data.recommendedDrone, data.alternatives);
      this.nextStep(3);
    } else {
      alert(data.message || 'No suitable drone found for your requirements');
      console.error('Recommendation failed:', data);
    }
  } catch (error) {
    console.error('Error recommending drone:', error);
    alert('Failed to find suitable drone. Please try again.');
  } finally {
    this.hideLoading();
  }
}


  displayDroneRecommendation(drone, alternatives = []) {
    const container = document.getElementById('droneRecommendation');
    if (!container) return;
    
    container.innerHTML = `
      <div class="recommended-drone-card">
        <div class="drone-visual-small">
          <div class="drone-icon-large">${drone.image}</div>
          <div class="recommendation-badge">✅ Best Match</div>
        </div>
        
        <div class="drone-details-full">
          <div class="drone-header">
            <h3>${drone.name}</h3>
            <span class="drone-model">${drone.model}</span>
          </div>
          
          <div class="drone-capabilities">
            <div class="capability">
              <span class="cap-icon">⚖️</span>
              <span>Can carry up to ${drone.maxWeight} kg (Your package: ${this.orderData.parcelDetails.weight} kg)</span>
            </div>
            <div class="capability">
              <span class="cap-icon">📏</span>
              <span>Range: ${drone.maxRange} km (Distance: ${this.orderData.distance} km)</span>
            </div>
            <div class="capability">
              <span class="cap-icon">🔋</span>
              <span>Battery: ${drone.batteryLife}</span>
            </div>
            <div class="capability">
              <span class="cap-icon">💰</span>
              <span>Rate: ₹${drone.pricePerKm}/km</span>
            </div>
          </div>
          
          <p class="drone-description">${drone.description}</p>
          
          <div class="delivery-estimate">
            <div class="estimate-item">
              <span class="estimate-label">Estimated Delivery Time:</span>
              <span class="estimate-value">${Math.round(this.orderData.distance / drone.speed * 60)} minutes</span>
            </div>
            <div class="estimate-item">
              <span class="estimate-label">Delivery Cost:</span>
              <span class="estimate-value">₹${this.orderData.distance * drone.pricePerKm}</span>
            </div>
          </div>
        </div>
      </div>
      
      ${alternatives.length > 0 ? `
        <div class="alternative-drones">
          <h4>Alternative Options:</h4>
          <div class="alternatives-grid">
            ${alternatives.map(alt => `
              <div class="alternative-drone">
                <span class="alt-icon">${alt.image}</span>
                <span class="alt-name">${alt.name}</span>
                <span class="alt-price">₹${alt.pricePerKm}/km</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  showLoading(message) {
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner">🚁</div>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.remove();
    }
  }

  nextStep(step) {
    // Hide current step
    document.getElementById(`step${this.currentStep}`).classList.remove('active');
    
    // Show next step
    this.currentStep = step;
    document.getElementById(`step${this.currentStep}`).classList.add('active');
    
    // Update progress
    this.updateStepProgress();
    
    // Special handling for payment step
    if (step === 5) {
      this.generatePaymentSummary();
    }
  }

  previousStep(step) {
    // Hide current step
    document.getElementById(`step${this.currentStep}`).classList.remove('active');
    
    // Show previous step
    this.currentStep = step;
    document.getElementById(`step${this.currentStep}`).classList.add('active');
    
    // Update progress
    this.updateStepProgress();
  }

  generatePaymentSummary() {
    const scheduledTime = document.getElementById('scheduledTime').value;
    this.orderData.scheduledTime = scheduledTime;
    
    // Calculate pricing
    const baseFare = 50;
    const distanceFare = this.orderData.distance * this.orderData.recommendedDrone.pricePerKm;
    const pickupFee = this.orderData.pickupOption === 'home' ? 100 : 0;
    const total = baseFare + distanceFare + pickupFee;
    
    this.orderData.pricing = { baseFare, distanceFare, pickupFee, total };
    
    // Update order summary
    const orderSummary = document.getElementById('orderSummary');
    if (orderSummary) {
      orderSummary.innerHTML = `
        <h3>📋 Order Summary</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">From:</span>
            <span class="summary-value">${this.orderData.locations.pickup.address}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">To:</span>
            <span class="summary-value">${this.orderData.locations.delivery.address}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Package:</span>
            <span class="summary-value">${this.orderData.parcelDetails.title}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Weight:</span>
            <span class="summary-value">${this.orderData.parcelDetails.weight} kg</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Drone:</span>
            <span class="summary-value">${this.orderData.recommendedDrone.name}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Pickup:</span>
            <span class="summary-value">${this.orderData.pickupOption === 'home' ? 'Home Pickup' : 'Station Drop'}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Schedule:</span>
            <span class="summary-value">${new Date(scheduledTime).toLocaleString('en-IN')}</span>
          </div>
        </div>
      `;
    }
    
    // Update pricing breakdown
    const pricingBreakdown = document.getElementById('pricingBreakdown');
    if (pricingBreakdown) {
      pricingBreakdown.innerHTML = `
        <h3>💰 Pricing Breakdown</h3>
        <div class="pricing-items">
          <div class="pricing-item">
            <span>Base Delivery Fee:</span>
            <span>₹${baseFare}</span>
          </div>
          <div class="pricing-item">
            <span>Distance Charge (${this.orderData.distance} km × ₹${this.orderData.recommendedDrone.pricePerKm}):</span>
            <span>₹${distanceFare}</span>
          </div>
          ${pickupFee > 0 ? `
            <div class="pricing-item">
              <span>Home Pickup Fee:</span>
              <span>₹${pickupFee}</span>
            </div>
          ` : ''}
          <div class="pricing-item total-price">
            <span>Total Amount:</span>
            <span>₹${total}</span>
          </div>
        </div>
      `;
    }
    
    // Update pay button
    const totalAmount = document.getElementById('totalAmount');
    if (totalAmount) {
      totalAmount.textContent = `₹${total}`;
    }
  }

  async processPayment() {
    try {
      this.showLoading('Processing your payment and creating order...');
      
      // Create order in database
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...this.orderData,
          recommendedDrone: this.orderData.recommendedDrone._id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Redirect to tracking page
        window.location.href = `/tracking/${data.order.orderId}`;
      } else {
        alert('Failed to create order. Please try again.');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Payment failed. Please check your connection and try again.');
    } finally {
      this.hideLoading();
    }
  }
}

// Global functions for template access
let orderFlow;

function nextStep(step) {
  orderFlow.nextStep(step);
}

function previousStep(step) {
  orderFlow.previousStep(step);
}

function recommendDrone() {
  orderFlow.recommendDrone();
}

function processPayment() {
  orderFlow.processPayment();
}

// Initialize order flow when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  orderFlow = new OrderFlow();
});
