import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const NotFound = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <div className="text-center max-w-2xl mx-auto">
        {/* Animated Background Elements */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 bg-purple-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>
          
          {/* Main 404 Display */}
          <div className="relative z-10">
            <div className="text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
              404
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className={`text-4xl font-bold mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          Oops! Page Not Found
        </h1>
        
        <p className={`text-xl mb-8 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          The page you're looking for seems to have vanished into the digital void.
        </p>

        {/* Search Suggestions */}
        <div className={`mb-8 p-6 rounded-2xl ${
          isDarkMode 
            ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
            : 'bg-white/70 backdrop-blur-xl border border-gray-200'
        } shadow-xl`}>
          <h3 className={`text-lg font-semibold mb-3 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            🥛 Looking for something?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['🫙Milk', '🍯Ghee', '🧀Cheese', '🧈Butter'].map((item, index) => (
              <Link
                key={index}
                to={`/products?search=${encodeURIComponent(item.toLowerCase().replace(' ', ''))}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            🏠 Go Home
          </Link>
          
          <Link
            to="/products"
            className={`px-8 py-3 font-semibold rounded-xl transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl ${
              isDarkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            🛒 Browse Products
          </Link>
        </div>

        {/* Fun Animation */}
        <div className="mt-12 relative">
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
          </div>
          <p className={`text-sm mt-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Even our milk bottles are looking for this page...
          </p>
        </div>

        {/* Footer Info */}
        <div className={`mt-8 pt-8 border-t ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Need help? <Link to="/contact" className="text-blue-500 hover:text-blue-600 font-medium">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
