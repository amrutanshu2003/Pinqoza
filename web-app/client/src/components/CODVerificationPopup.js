import React, { useState, useEffect } from 'react';
import { getOrderById } from '../services/api';
import SUCCESS_PATH from '../config/successPath';

const CODVerificationPopup = ({ orderId }) => {
  console.log('ðŸ” CODVerificationPopup rendered with orderId:', orderId);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const fetchOrderStatus = async () => {
    try {
      const response = await getOrderById(orderId);
      const orderData = response.data;
      setOrder(orderData);
      
      // If order is confirmed, redirect to success page
      if (orderData.status === 'confirmed' || orderData.orderPlaced === true) {
        window.location.href = `${SUCCESS_PATH}?orderId=${orderId}&fromVerification=true`;
      }
    } catch (error) {
      console.error('Error fetching order status:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderStatus();
      // Start polling for order status updates
      const interval = setInterval(fetchOrderStatus, 3000); // Check every 3 seconds
      
      // Start countdown for estimated time
      const countdownInterval = setInterval(() => {
        setCountdown(prev => prev + 1);
      }, 1000);
      
      return () => {
        clearInterval(interval);
        clearInterval(countdownInterval);
      };
    }
  }, [orderId, fetchOrderStatus]);

  // Prevent user from closing popup and block all interactions
  useEffect(() => {
    // Disable browser back button
    const handlePopState = (event) => {
      event.preventDefault();
      window.history.pushState(null, null, window.location.pathname);
    };
    
    // Disable keyboard shortcuts
    const handleKeyDown = (event) => {
      if (event.key === 'Backspace' || (event.altKey && event.key === 'ArrowLeft')) {
        event.preventDefault();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
      }
      if (event.key === 'F5') {
        event.preventDefault();
      }
    };
    
    // Prevent right click
    const handleContextMenu = (event) => {
      event.preventDefault();
    };
    
    // Add event listeners
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    // Disable navbar interactions
    const navbar = document.querySelector('nav, header, .navbar, [class*="nav"]');
    if (navbar) {
      navbar.style.pointerEvents = 'none';
      navbar.style.opacity = '0.5';
    }
    
    // Disable all interactive elements except our modal
    const allElements = document.querySelectorAll('button, a, input, select, textarea');
    allElements.forEach(el => {
      if (!el.closest('.fixed')) {
        el.style.pointerEvents = 'none';
      }
    });
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      // Re-enable body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      // Re-enable navbar
      if (navbar) {
        navbar.style.pointerEvents = '';
        navbar.style.opacity = '';
      }
      allElements.forEach(el => {
        el.style.pointerEvents = '';
      });
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEstimatedTime = () => {
    if (countdown < 30) return 'a few seconds';
    if (countdown < 60) return 'about 1 minute';
    if (countdown < 180) return 'a few minutes';
    return 'a few more minutes';
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Glass effect background */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md"></div>
      
      {/* Popup content */}
      <div 
        className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-white/20 max-h-[90vh] overflow-y-auto scrollbar-hide"
        onContextMenu={(e) => e.preventDefault()}
      >
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        {/* Prevent close button - no close option */}
        
        {/* Loading/Verification Animation */}
        <div className="text-center">
          {/* Animated verification icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto relative">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-spin"></div>
              {/* Inner pulsing circle */}
              <div className="absolute inset-2 bg-blue-500 rounded-full animate-pulse"></div>
              {/* Check mark that appears when done */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Main message */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            We Are Verifying Your Order
          </h2>
          
          <p className="text-gray-600 mb-6">
            Please wait while we verify your order details. This usually takes {getEstimatedTime()}.
          </p>

          {/* Order details */}
          {order && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Order ID:</span>
                <span className="font-mono text-sm font-medium">{orderId}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="font-semibold text-green-600">â‚¹{order.totalPrice}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment:</span>
                <span className="font-medium">Cash on Delivery</span>
              </div>
            </div>
          )}

          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="animate-pulse">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <span>Verifying order details...</span>
            </div>
            
            {/* Animated dots */}
            <div className="flex justify-center space-x-1 mt-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>

          {/* Time elapsed */}
          <div className="text-sm text-gray-500 mb-4">
            Time elapsed: {formatTime(countdown)}
          </div>

          {/* Warning message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-500 text-lg">âš ï¸</span>
              <div className="text-left">
                <p className="text-sm text-yellow-800 font-medium">Please Do Not Close This Window</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Closing this window may interrupt the verification process
                </p>
              </div>
            </div>
          </div>

          {/* Status messages */}
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Order received successfully</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Admin verification in progress...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CODVerificationPopup;

