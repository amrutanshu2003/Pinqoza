import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Success = () => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const orderId = location.state?.orderId;
  const paymentMethod = location.state?.paymentMethod || 'cod';
  const amount = location.state?.amount;
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleShareOrder = () => {
    const text = `I just placed an order with Pinqoza! Order ID: #${orderId?.slice(-8)}`;
    if (navigator.share) {
      navigator.share({
        title: 'Order Placed Successfully',
        text: text,
        url: window.location.href
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(text);
      alert('Order details copied to clipboard!');
    }
  };

  return (
    <div className="fade-in min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary-200 dark:bg-gray-700 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary-200 dark:bg-gray-700 rounded-full opacity-20 animate-pulse delay-1000"></div>
      </div>

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              <div 
                className={`w-2 h-2 rounded-full ${
                  ['bg-green-400', 'bg-blue-400', 'bg-yellow-400', 'bg-red-400', 'bg-purple-400'][Math.floor(Math.random() * 5)]
                }`}
              ></div>
            </div>
          ))}
        </div>
      )}

      <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-12 shadow-2xl max-w-lg w-full transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-[1.02]`}>
        {/* Success Icon with Enhanced Animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl animate-pulse">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {/* Enhanced Animated Rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-green-200 dark:border-green-800 animate-ping"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border-2 border-green-300 dark:border-green-700 animate-ping delay-300"></div>
          </div>
        </div>

        <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Order Placed Successfully!
          </span>
        </h1>
        
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6 text-lg leading-relaxed`}>
          {paymentMethod === 'online' 
            ? `Thank you for your payment of ₹${amount}. Your order has been verified and confirmed.`
            : "Thank you for your order. We've received your order and will process it soon."
          }
        </p>

        {orderId && (
          <div className={`inline-flex items-center px-6 py-3 rounded-full ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'} mb-8`}>
            <svg className={`w-5 h-5 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Order ID: <span className="font-bold text-primary-600 dark:text-primary-400">#{orderId.slice(-8)}</span>
            </span>
          </div>
        )}

        <div className="space-y-4 mb-8">
          {/* Order Details */}
          <div className={`mt-8 space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className="flex items-center justify-center gap-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
                <svg className={`w-6 h-6 ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Estimated Delivery</p>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Within 2-3 business days</p>
              </div>
            </div>

            {paymentMethod === 'online' ? (
              <div className="flex items-center justify-center gap-4 p-4 bg-green-50 dark:bg-gray-800/30 rounded-xl border-2 border-green-200 dark:border-green-800">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100 dark:bg-gray-700">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Online Payment Completed</p>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>₹{amount} paid via UPI</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-secondary-500/20' : 'bg-secondary-100'}`}>
                  <svg className={`w-6 h-6 ${isDarkMode ? 'text-secondary-400' : 'text-secondary-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Cash on Delivery</p>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pay when you receive</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Link 
              to="/products" 
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-bold hover:from-primary-600 hover:to-secondary-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl text-center"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Continue Shopping
              </span>
            </Link>
            <Link 
              to="/account" 
              className={`flex-1 px-6 py-3 rounded-xl font-bold transform hover:scale-[1.02] transition-all duration-200 text-center ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View Orders
              </span>
            </Link>
          </div>

          {/* Share Order Button */}
          <button
            onClick={handleShareOrder}
            className={`w-full px-6 py-3 rounded-xl font-bold transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
            } shadow-lg hover:shadow-xl`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share Order
          </button>
        </div>

        {/* Contact Info */}
      </div>

      {/* Enhanced Contact Info */}
      <div className={`mt-8 text-center p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800/30' : 'bg-gray-100'} max-w-lg w-full`}>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>Need help? Contact us at:</p>
        <div className="flex items-center justify-center gap-2 mb-4">
          <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>support@pinqoza.com</p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>+91 98765 43210</span>
          </div>
          <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>9 AM - 9 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Success;
