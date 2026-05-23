import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FaCheckCircle, FaCreditCard, FaHome, FaShoppingBag, FaShareAlt } from 'react-icons/fa';

const OrderSuccess = () => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const orderId = location.state?.orderId || location.search?.match(/orderId=([^&]*)/)?.[1];
  const paymentMethod = location.state?.paymentMethod || 'online';
  const amount = location.state?.amount;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for smooth transition
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-20 left-20 w-72 h-72 rounded-full opacity-20 animate-pulse ${isDarkMode ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
        <div className={`absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-20 animate-pulse delay-1000 ${isDarkMode ? 'bg-purple-600' : 'bg-purple-400'}`}></div>
      </div>

      {/* Success Card - COD Style */}
      <div className={`relative w-full max-w-md rounded-3xl shadow-2xl p-8 backdrop-blur-xl border-2 ${
        isDarkMode 
          ? 'bg-gray-800/90 border-white/10' 
          : 'bg-white/95 border-white/20'
      }`}>
        
        {/* Success Animation Icon */}
        <div className="text-center mb-8">
          <div className="relative mx-auto w-28 h-28 mb-4">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-4 border-green-300 rounded-full animate-spin"></div>
            {/* Inner success circle */}
            <div className="absolute inset-2 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl">
              <FaCheckCircle className="w-12 h-12 text-white" />
            </div>
            {/* Animated ping rings */}
            <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-30"></div>
          </div>
          
          {/* Title */}
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Order Confirmed!
          </h1>
          <div className={`w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-green-400 to-green-600`}></div>
        </div>

        {/* Online Payment Info Card */}
        <div className={`rounded-2xl p-6 mb-6 border-2 ${
          isDarkMode 
            ? 'bg-green-900/20 border-green-700' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-green-800' : 'bg-green-100'}`}>
              <FaCreditCard className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <span className={`text-lg font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
              Online Payment
            </span>
          </div>
          
          {amount && (
            <div className="text-center">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Amount Paid</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                ₹{amount}
              </p>
            </div>
          )}
        </div>

        {/* Order ID */}
        <div className={`rounded-xl p-4 mb-6 text-center ${
          isDarkMode 
            ? 'bg-gray-700/50 border border-gray-600' 
            : 'bg-gray-100 border border-gray-200'
        }`}>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Order ID</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            #{orderId?.slice(-8)}
          </p>
        </div>

        {/* Status Steps */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
              <FaCheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Payment Received</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your payment has been verified</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <FaShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Order Processing</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Preparing for delivery</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
              <FaHome className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Delivery</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Arriving in 2-3 days</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            to="/orders"
            className={`block w-full py-3 px-4 rounded-xl font-semibold text-center transition-all transform hover:scale-[1.02] ${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
            } shadow-lg`}
          >
            View My Orders
          </Link>
          
          <Link
            to="/products"
            className={`block w-full py-3 px-4 rounded-xl font-semibold text-center transition-all transform hover:scale-[1.02] border-2 ${
              isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Continue Shopping
          </Link>
          
          <button
            onClick={() => {
              const text = `I just placed an order with Pinqoza! Order ID: #${orderId?.slice(-8)}`;
              if (navigator.share) {
                navigator.share({ title: 'Order Placed!', text, url: window.location.href });
              } else {
                navigator.clipboard.writeText(text);
                alert('Order details copied!');
              }
            }}
            className={`block w-full py-3 px-4 rounded-xl font-semibold text-center transition-all transform hover:scale-[1.02] ${
              isDarkMode 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            } shadow-lg`}
          >
            <span className="flex items-center justify-center gap-2">
              <FaShareAlt className="w-4 h-4" />
              Share Order
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
