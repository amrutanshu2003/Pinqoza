import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';

const LimitedEdition = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { updateCartCount } = useCart();

  // Limited edition products
  const limitedProducts = [
    {
      _id: 'limited-1',
      name: 'Royal Gold Milk',
      description: 'Premium quality',
      price: 149,
      originalPrice: 149,
      discount: 0,
      category: 'milk',
      image: 'ðŸ‘‘',
      stock: 50,
      rating: 5.0,
      reviews: 89
    },
    {
      _id: 'limited-2',
      name: 'Anniversary Pack',
      description: 'Special edition',
      price: 599,
      originalPrice: 599,
      discount: 0,
      category: 'sweets',
      image: 'ðŸŽ€',
      stock: 25,
      rating: 4.9,
      reviews: 67
    },
    {
      _id: 'limited-3',
      name: 'Diamond Collection',
      description: 'Ultra premium',
      price: 999,
      originalPrice: 999,
      discount: 0,
      category: 'sweets',
      image: 'ðŸ’Ž',
      stock: 10,
      rating: 5.0,
      reviews: 45
    }
  ];

  const updateCart = () => {
    updateCartCount();
  };

  return (
    <div className="fade-in min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-black dark:via-purple-900/20 dark:to-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block relative group mb-6">
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Limited Edition Collection
              </span>
            </h1>
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Exclusive collections with limited availability
          </p>
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-lg`}>
            <span className="mr-2">ðŸ’Ž</span>
            {limitedProducts.length} Exclusive Products Available
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-8 mb-12">
          {limitedProducts.map((product, index) => (
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
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            â† Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default LimitedEdition;

