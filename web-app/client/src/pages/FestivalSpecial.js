import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';

const FestivalSpecial = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { updateCartCount } = useCart();

  // Festival special products
  const festivalProducts = [
    {
      _id: 'festival-1',
      name: 'Diwali Festive Pack',
      description: 'Special mithai ingredients',
      price: 299,
      originalPrice: 374,
      discount: 20,
      category: 'sweets',
      image: '🪔',
      stock: 50,
      rating: 4.8,
      reviews: 124
    },
    {
      _id: 'festival-2',
      name: 'Holi Colors Pack',
      description: 'Natural food colors',
      price: 199,
      originalPrice: 234,
      discount: 15,
      category: 'sweets',
      image: '🎨',
      stock: 75,
      rating: 4.6,
      reviews: 89
    },
    {
      _id: 'festival-3',
      name: 'Eid Special',
      description: 'Premium festive sweets',
      price: 399,
      originalPrice: 532,
      discount: 25,
      category: 'sweets',
      image: '🌙',
      stock: 40,
      rating: 4.9,
      reviews: 156
    }
  ];

  const updateCart = () => {
    updateCartCount();
  };

  return (
    <div className="fade-in min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-black dark:via-red-900/20 dark:to-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block relative group mb-6">
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <span className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-clip-text text-transparent">
                Festival Special Collection
              </span>
            </h1>
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Celebrate festivals with our special collections
          </p>
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-lg`}>
            <span className="mr-2">🎉</span>
            {festivalProducts.length} Special Products Available
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {festivalProducts.map((product, index) => (
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
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default FestivalSpecial;
