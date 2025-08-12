class PastOrdersManager {
  constructor() {
    this.currentFilter = 'all';
    this.currentSort = 'newest';
    this.selectedRating = 0;
    this.currentOrderId = null;
    
    this.init();
  }

  init() {
    // Setup filter tabs
    this.setupFilterTabs();
    
    // Setup search functionality
    this.setupSearch();
    
    // Setup sorting
    this.setupSorting();
    
    // Setup rating stars
    this.setupRatingStars();
    
    // Load initial data
    this.applyFilters();
  }

  setupFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        filterTabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Update current filter
        this.currentFilter = tab.dataset.filter;
        
        // Apply filters
        this.applyFilters();
      });
    });
  }

  setupSearch() {
    const searchInput = document.getElementById('orderSearch');
    let searchTimeout;
    
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.searchOrders(e.target.value);
      }, 300);
    });
  }

  setupSorting() {
    const sortSelect = document.getElementById('sortOrders');
    sortSelect?.addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.sortOrders();
    });
  }

  setupRatingStars() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        this.selectedRating = parseInt(star.dataset.rating);
        this.updateStarDisplay();
      });
      
      star.addEventListener('mouseenter', () => {
        this.highlightStars(parseInt(star.dataset.rating));
      });
    });
    
    const starRating = document.getElementById('starRating');
    starRating?.addEventListener('mouseleave', () => {
      this.updateStarDisplay();
    });
  }

  applyFilters() {
    const orderCards = document.querySelectorAll('.order-card');
    let visibleCount = 0;
    
    orderCards.forEach(card => {
      const status = card.dataset.status;
      const shouldShow = this.currentFilter === 'all' || status === this.currentFilter;
      
      if (shouldShow) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });
    
    // Show empty state if no orders match filter
    this.updateEmptyState(visibleCount);
  }

  searchOrders(searchTerm) {
    const orderCards = document.querySelectorAll('.order-card');
    const searchLower = searchTerm.toLowerCase();
    let visibleCount = 0;
    
    orderCards.forEach(card => {
      if (this.currentFilter !== 'all' && card.dataset.status !== this.currentFilter) {
        return;
      }
      
      const orderId = card.dataset.orderId.toLowerCase();
      const packageTitle = card.querySelector('.package-title')?.textContent?.toLowerCase() || '';
      const addresses = Array.from(card.querySelectorAll('.route-address'))
        .map(addr => addr.textContent.toLowerCase()).join(' ');
      
      const matches = orderId.includes(searchLower) || 
                     packageTitle.includes(searchLower) || 
                     addresses.includes(searchLower);
      
      if (matches || searchTerm === '') {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });
    
    this.updateEmptyState(visibleCount);
  }

  sortOrders() {
    const ordersList = document.getElementById('ordersList');
    const orderCards = Array.from(document.querySelectorAll('.order-card'));
    
    orderCards.sort((a, b) => {
      switch (this.currentSort) {
        case 'newest':
          return new Date(b.querySelector('.order-date').textContent) - 
                 new Date(a.querySelector('.order-date').textContent);
        
        case 'oldest':
          return new Date(a.querySelector('.order-date').textContent) - 
                 new Date(b.querySelector('.order-date').textContent);
        
        case 'amount-high':
          const amountA = parseFloat(a.querySelector('.stat-value:last-child').textContent.replace('₹', ''));
          const amountB = parseFloat(b.querySelector('.stat-value:last-child').textContent.replace('₹', ''));
          return amountB - amountA;
        
        case 'amount-low':
          const amountA2 = parseFloat(a.querySelector('.stat-value:last-child').textContent.replace('₹', ''));
          const amountB2 = parseFloat(b.querySelector('.stat-value:last-child').textContent.replace('₹', ''));
          return amountA2 - amountB2;
        
        default:
          return 0;
      }
    });
    
    // Re-append sorted cards
    orderCards.forEach(card => ordersList.appendChild(card));
  }

  updateEmptyState(visibleCount) {
    const emptyState = document.querySelector('.empty-state');
    const ordersList = document.getElementById('ordersList');
    
    if (visibleCount === 0 && !emptyState) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      emptyDiv.innerHTML = `
        <div class="empty-icon">🔍</div>
        <h3>No Orders Found</h3>
        <p>No orders match your current filter or search criteria.</p>
        <button class="empty-cta-btn" onclick="pastOrdersManager.resetFilters()">
          Clear Filters
        </button>
      `;
      ordersList.appendChild(emptyDiv);
    } else if (visibleCount > 0 && emptyState) {
      emptyState.remove();
    }
  }

  resetFilters() {
    document.querySelector('.filter-tab[data-filter="all"]').click();
    document.getElementById('orderSearch').value = '';
    document.getElementById('sortOrders').value = 'newest';
    this.applyFilters();
  }

  highlightStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
      if (index < rating) {
        star.style.opacity = '1';
        star.style.transform = 'scale(1.2)';
      } else {
        star.style.opacity = '0.3';
        star.style.transform = 'scale(1)';
      }
    });
  }

  updateStarDisplay() {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
      if (index < this.selectedRating) {
        star.style.opacity = '1';
        star.style.transform = 'scale(1.1)';
      } else {
        star.style.opacity = '0.3';
        star.style.transform = 'scale(1)';
      }
    });
  }
}

// Global functions for template access
let pastOrdersManager;

function downloadReceipt(orderId) {
  // Simulate receipt download
  const receiptData = {
    orderId: orderId,
    timestamp: new Date().toISOString(),
    service: 'DroneExpress Mumbai'
  };
  
  const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt-${orderId}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  
  // Show success message
  showToast('📄 Receipt downloaded successfully!');
}

function reorderPackage(orderId) {
  if (confirm('🔄 Would you like to reorder this package with the same details?')) {
    // In a real app, this would pre-fill the order form
    window.location.href = `/order?reorder=${orderId}`;
  }
}

function rateDelivery(orderId) {
  pastOrdersManager.currentOrderId = orderId;
  pastOrdersManager.selectedRating = 0;
  pastOrdersManager.updateStarDisplay();
  document.getElementById('ratingModal').style.display = 'flex';
}

function closeRatingModal() {
  document.getElementById('ratingModal').style.display = 'none';
  pastOrdersManager.selectedRating = 0;
  document.getElementById('ratingComment').value = '';
}

function submitRating() {
  if (pastOrdersManager.selectedRating === 0) {
    alert('Please select a star rating');
    return;
  }
  
  const comment = document.getElementById('ratingComment').value;
  
  // Simulate API call to save rating
  console.log('Rating submitted:', {
    orderId: pastOrdersManager.currentOrderId,
    rating: pastOrdersManager.selectedRating,
    comment: comment
  });
  
  showToast('⭐ Thank you for your feedback!');
  closeRatingModal();
}

function shareTracking(orderId) {
  const trackingUrl = `${window.location.origin}/tracking/${orderId}`;
  
  if (navigator.share) {
    navigator.share({
      title: `Track Drone Delivery #${orderId}`,
      text: 'Follow my package live as it flies across Mumbai!',
      url: trackingUrl
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(trackingUrl).then(() => {
      showToast('📤 Tracking link copied to clipboard!');
    });
  }
}

function viewOrderDetails(orderId) {
  // In a real app, this would show a detailed modal
  alert(`📋 Detailed view for order #${orderId} coming soon!`);
}

function cancelOrder(orderId) {
  if (confirm('❌ Are you sure you want to cancel this order?')) {
    // Simulate API call
    showToast('❌ Order cancellation requested. You will receive a confirmation shortly.');
  }
}

function openSupport() {
  const supportOptions = [
    'Call +91 98765 43210',
    'Email support@droneexpress.com',
    'Live Chat (coming soon)',
    'WhatsApp Support'
  ];
  
  const choice = prompt(`Choose support option:\n${supportOptions.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`);
  
  if (choice === '1') {
    window.open('tel:+919876543210');
  } else if (choice === '2') {
    window.open('mailto:support@droneexpress.com');
  }
}

function downloadHistory() {
  // Simulate CSV export
  const csvContent = "data:text/csv;charset=utf-8,Order ID,Date,Status,Amount\n";
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'drone-delivery-history.csv';
  a.click();
  
  URL.revokeObjectURL(url);
  showToast('📊 Order history exported successfully!');
}

function shareApp() {
  const shareData = {
    title: 'DroneExpress Mumbai',
    text: 'Experience the future of delivery with drone service in Mumbai! Fast, eco-friendly, and reliable.',
    url: window.location.origin
  };
  
  if (navigator.share) {
    navigator.share(shareData);
  } else {
    navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`).then(() => {
      showToast('📤 App link copied to clipboard!');
    });
  }
}

function showToast(message) {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  pastOrdersManager = new PastOrdersManager();
});
