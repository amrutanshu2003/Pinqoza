import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getWishlist, removeFromWishlist, addToCart } from '../services/api';
import { isAuthenticated } from '../util/auth';
import ProductCard from '../components/ProductCard';
import { useTheme } from '../context/ThemeContext';

const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useTheme();

  // Get gradient colors for fallback background
  const getCategoryGradient = (category) => {
    const gradients = {
      milk: 'from-blue-200 to-blue-400 dark:from-blue-600 dark:to-blue-800',
      ghee: 'from-amber-200 to-amber-400 dark:from-amber-600 dark:to-amber-800',
      cheese: 'from-yellow-200 to-yellow-400 dark:from-yellow-600 dark:to-yellow-800',
      butter: 'from-orange-200 to-orange-400 dark:from-orange-600 dark:to-orange-800',
      curd: 'from-green-200 to-green-400 dark:from-green-600 dark:to-green-800',
      paneer: 'from-purple-200 to-purple-400 dark:from-purple-600 dark:to-purple-800',
      cream: 'from-pink-200 to-pink-400 dark:from-pink-600 dark:to-pink-800',
      yogurt: 'from-teal-200 to-teal-400 dark:from-teal-600 dark:to-teal-800',
      lassi: 'from-cyan-200 to-cyan-400 dark:from-cyan-600 dark:to-cyan-800',
      buttermilk: 'from-lime-200 to-lime-400 dark:from-lime-600 dark:to-lime-800',
      sweets: 'from-rose-200 to-pink-300 dark:from-rose-600 dark:to-pink-800',
      cake: 'from-fuchsia-200 to-pink-400 dark:from-fuchsia-600 dark:to-pink-800'
    };
    return gradients[category] || 'from-gray-200 to-gray-400 dark:from-gray-600 dark:to-gray-800';
  };

  // Get emoji for each category
  const getCategoryEmoji = (category) => {
    const emojis = {
      milk: '🥛',
      ghee: '🍯',
      cheese: '🧀',
      butter: '🧈',
      curd: '🥣',
      paneer: '🧊',
      cream: '🍦',
      yogurt: '🍶',
      lassi: '🥤',
      buttermilk: '🫙',
      sweets: '🍬',
      cake: '🍰'
    };
    return emojis[category] || '🥛';
  };

  useEffect(() => {
    if (isAuthenticated()) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await getWishlist();
      setWishlist(res.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      window.dispatchEvent(
        new CustomEvent('wishlist-updated', {
          detail: { productId: String(productId), isWishlisted: false }
        })
      );
      fetchWishlist();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleMoveToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      await removeFromWishlist(productId);
      window.dispatchEvent(
        new CustomEvent('wishlist-updated', {
          detail: { productId: String(productId), isWishlisted: false }
        })
      );
      navigate('/cart');
    } catch (error) {
      console.error('Error moving to cart:', error);
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className={`fade-in min-h-screen flex items-center justify-center px-4 py-8 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className={`relative text-center p-8 sm:p-10 rounded-3xl ${isDarkMode ? 'bg-[#140a16] border border-white/10' : 'bg-white border border-slate-200'} shadow-2xl max-w-lg w-full overflow-hidden`}>
          <div className={`absolute -top-10 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none ${isDarkMode ? 'bg-rose-500/20' : 'bg-rose-300/30'}`}></div>
          <div className={`absolute -bottom-10 -left-12 w-40 h-40 rounded-full blur-3xl pointer-events-none ${isDarkMode ? 'bg-pink-600/20' : 'bg-pink-300/30'}`}></div>

          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5 ${isDarkMode ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
            Saved Favorites
          </div>

          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>

          <h3 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Login Required
          </h3>
          <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-slate-600'} mb-7`}>
            Please login to access your wishlist and saved products.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link 
              to="/login" 
              className="w-full px-6 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-rose-500/25 transform hover:scale-[1.02] transition-all duration-200"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className={`w-full px-6 py-3.5 rounded-xl font-semibold transform hover:scale-[1.02] transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fade-in min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Modern Header */}
        <div className="text-center mb-12">
          <div className="inline-block relative group">
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 bg-clip-text text-transparent">
                My Wishlist
              </span>
            </h1>
            {/* Animated Underline */}
            <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Your favorite products in one place
          </p>
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-lg`}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {wishlist.items?.length || 0} Items Saved
          </div>
        </div>

        {wishlist.items && wishlist.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.items.map((item) => (
              <div key={item._id} className={`group relative overflow-hidden transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-105 hover:-translate-y-2 rounded-[2.5rem] border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-primary-500/50 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 backdrop-blur-xl`}>
                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(item.product?._id)}
                  className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 bg-red-500/90 text-white hover:bg-red-600"
                  title="Remove from wishlist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {item.product ? (
                  <div className="p-6 flex flex-col h-full">
                    {/* Product Image */}
                    <Link to={`/products/${item.product._id}`} className="block relative">
                      <div className="relative h-48 overflow-hidden rounded-t-[2.3rem] mb-4">
                        {/* Animated Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        
                        {item.product.image ? (
                          <img 
                            src={item.product.image} 
                            alt={item.product.name}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        
                        {/* Fallback Image based on category */}
                        <div 
                          className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getCategoryGradient(item.product.category)} ${item.product.image ? 'hidden' : 'flex'}`}
                        >
                          <span className="text-6xl transform transition-all duration-700 group-hover:scale-110 group-hover:rotate-12">{getCategoryEmoji(item.product.category)}</span>
                        </div>
                      </div>
                    </Link>
                    
                    {/* Product Info */}
                    <div className="flex-grow">
                      <Link to={`/products/${item.product._id}`} className="block">
                        <h3 className={`font-bold text-lg mb-2 capitalize transition-all duration-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                          {item.product.name}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">₹{item.product.price}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/{item.product.unit}</span>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <button
                      onClick={() => handleMoveToCart(item.product._id)}
                      className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold py-3 rounded-xl hover:from-primary-600 hover:to-secondary-600 transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Move to Cart
                    </button>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      Product not available
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-20 rounded-3xl ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-white/10' : 'bg-white/70 backdrop-blur-xl border border-gray-200'} shadow-xl`}>
            <div className="w-32 h-32 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-red-100 to-pink-100 dark:from-black/30 dark:to-black/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Your wishlist is empty
            </h3>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Start adding some products to your wishlist!
            </p>
            <Link 
              to="/products" 
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/30 transform hover:scale-[1.02] transition-all duration-200"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
