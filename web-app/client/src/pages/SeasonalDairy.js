import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';

const SeasonalDairy = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { updateCartCount } = useCart();

  // Seasonal picks
  const seasonalProducts = [
    {
      _id: 'seasonal-1',
      name: 'Winter Special Milk',
      description: 'Rich & creamy',
      price: 45,
      originalPrice: 45,
      discount: 0,
      category: 'milk',
      image: 'â„ï¸',
      stock: 100,
      rating: 4.7,
      reviews: 203
    },
    {
      _id: 'seasonal-2',
      name: 'Summer Cool Milk',
      description: 'Light & refreshing',
      price: 35,
      originalPrice: 35,
      discount: 0,
      category: 'milk',
      image: 'ðŸ¥›',
      stock: 150,
      rating: 4.5,
      reviews: 178
    },
    {
      _id: 'seasonal-3',
      name: 'Monsoon Butter',
      description: 'Extra rich',
      price: 89,
      originalPrice: 89,
      discount: 0,
      category: 'butter',
      image: 'ðŸ§ˆ',
      stock: 80,
      rating: 4.8,
      reviews: 145
    }
  ];

  const updateCart = () => {
    updateCartCount();
  };

  return (
    <div className="fade-in min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 dark:from-black dark:via-blue-900/20 dark:to-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block relative group mb-6">
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Seasonal Picks
              </span>
            </h1>
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Winter & summer specialties for every season
          </p>
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-lg`}>
            <span className="mr-2">ðŸŒ¤ï¸</span>
            {seasonalProducts.length} Seasonal Products Available
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-8 mb-12">
          {seasonalProducts.map((product, index) => (
            <ProductCard
              key={product._id}
              product={product}
              onCartUpdate={updateCart}
              index={index}
            />
          ))}
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            â† Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeasonalDairy;

