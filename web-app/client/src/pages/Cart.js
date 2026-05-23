import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeCartItem, clearCart } from '../services/api';
import { isAuthenticated } from '../util/auth';
import { useTheme } from '../context/ThemeContext';
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { showErrorToast, toasts, removeToast, updateCartCount } = useToast();
  const { updateCartCount: updateCartCountContext } = useCart();

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

  // Derive category from product name if not available
  const deriveCategoryFromName = (name) => {
    const lowerName = name?.toLowerCase() || '';
    if (lowerName.includes('milk')) return 'milk';
    if (lowerName.includes('ghee')) return 'ghee';
    if (lowerName.includes('cheese')) return 'cheese';
    if (lowerName.includes('butter')) return 'butter';
    if (lowerName.includes('curd')) return 'curd';
    if (lowerName.includes('paneer')) return 'paneer';
    if (lowerName.includes('cream') || lowerName.includes('creme') || lowerName.includes('fraiche')) return 'cream';
    if (lowerName.includes('yogurt')) return 'yogurt';
    if (lowerName.includes('lassi')) return 'lassi';
    if (lowerName.includes('buttermilk')) return 'buttermilk';
    return 'milk';
  };

  useEffect(() => {
    if (isAuthenticated()) {
      fetchCart();
    }
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await getCart();
      setCart(res.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      if (newQuantity < 1) {
        await handleRemoveItem(itemId);
      } else {
        const res = await updateCartItem(itemId, newQuantity);
        setCart(res.data);
        updateCartCountContext();
      }
    } catch (error) {
      showErrorToast(error.response?.data?.message || 'Error updating quantity');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const res = await removeCartItem(itemId);
      setCart(res.data);
      updateCartCountContext();
    } catch (error) {
      showErrorToast(error.response?.data?.message || 'Error removing item');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;
    
    try {
      await clearCart();
      setCart({ items: [], totalPrice: 0, totalItems: 0 });
      updateCartCountContext();
    } catch (error) {
      showErrorToast(error.response?.data?.message || 'Error clearing cart');
    }
  };

  const handleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === cart?.items?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cart?.items?.map(item => item._id) || []);
    }
  };

  const getSelectedItemsData = () => {
    return cart?.items?.filter(item => selectedItems.includes(item._id)) || [];
  };

  const getSelectedItemsTotal = () => {
    return getSelectedItemsData().reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    if (selectedItems.length === 0) {
      showErrorToast('Please select at least one item to checkout');
      return;
    }
    
    // Store selected items in sessionStorage for checkout
    sessionStorage.setItem('selectedItems', JSON.stringify(getSelectedItemsData()));
    navigate('/checkout');
  };

  if (!isAuthenticated()) {
    return (
      <div className={`fade-in min-h-screen flex items-center justify-center px-4 py-8 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className={`relative text-center p-8 sm:p-10 rounded-3xl ${isDarkMode ? 'bg-[#0a0f1d] border border-white/10' : 'bg-white border border-slate-200'} shadow-2xl max-w-lg w-full overflow-hidden`}>
          <div className={`absolute -top-10 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none ${isDarkMode ? 'bg-cyan-500/20' : 'bg-cyan-300/30'}`}></div>
          <div className={`absolute -bottom-10 -left-12 w-40 h-40 rounded-full blur-3xl pointer-events-none ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-300/30'}`}></div>

          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5 ${isDarkMode ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
            Secure Cart Access
          </div>

          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>

          <h3 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Login Required
          </h3>
          <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-slate-600'} mb-7`}>
            Please login to view your cart and continue checkout securely.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link 
              to="/login" 
              className="w-full px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transform hover:scale-[1.02] transition-all duration-200"
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

  if (!cart || cart.items.length === 0) {
    return (
      <div className="fade-in min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black flex items-center justify-center px-4">
        <div className={`text-center py-20 rounded-3xl ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-white/10' : 'bg-white/70 backdrop-blur-xl border border-gray-200'} shadow-xl max-w-md w-full`}>
          <div className="w-32 h-32 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Your cart is empty
          </h3>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
            Add some awesome products to your cart!
          </p>
          <Link 
            to="/products" 
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/30 transform hover:scale-[1.02] transition-all duration-200"
          >
            Browse Products
          </Link>
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
                Shopping Cart
              </span>
            </h1>
            {/* Animated Underline */}
            <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Review your cart items
          </p>
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-lg`}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cart.totalItems} Items in Cart
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Select All Header */}
            <div className={`p-4 rounded-xl border-2 ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === cart.items.length && cart.items.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-primary-600 border-2 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                  />
                  <span className={`ml-3 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} group-hover:text-primary-600 transition-colors`}>
                    Select All ({cart.items.length} items)
                  </span>
                </label>
                <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedItems.length > 0 && (
                    <span className="text-primary-600 dark:text-primary-400">
                      {selectedItems.length} selected
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {cart.items.map((item) => (
              <div key={item._id} className={`group relative overflow-hidden transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-[1.02] rounded-2xl border-2 ${selectedItems.includes(item._id) ? 'border-primary-500 bg-primary-50/50 dark:bg-black/30' : 'border-gray-200/50 dark:border-gray-700/50 hover:border-primary-500/50'} bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-black dark:via-black dark:to-black backdrop-blur-xl`}>
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <div className="flex items-center justify-center pt-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item._id)}
                        onChange={() => handleItemSelection(item._id)}
                        className="w-5 h-5 text-primary-600 border-2 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                      />
                    </div>
                    {/* Item Image */}
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      {/* Animated Background Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                      
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      
                      {/* Fallback Image based on category */}
                      <div 
                        className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getCategoryGradient(item.category || item.product?.category || deriveCategoryFromName(item.name))} ${item.image ? 'hidden' : 'flex'}`}
                      >
                        <span className="text-5xl transform transition-all duration-700 group-hover:scale-110 group-hover:rotate-12">{getCategoryEmoji(item.category || item.product?.category || deriveCategoryFromName(item.name))}</span>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg mb-1 capitalize transition-all duration-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                        {item.name}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                        ₹{item.price}/{item.unit}
                      </p>
                      
                      {/* Quantity Selector */}
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} rounded-xl overflow-hidden shadow-sm backdrop-blur-sm ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
                          <button
                            onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                            className={`w-10 h-10 flex items-center justify-center ${isDarkMode ? 'text-gray-300 hover:bg-primary-500 hover:text-white' : 'text-gray-600 hover:bg-primary-500 hover:text-white'} transition-all duration-300 font-bold cursor-pointer`}
                          >
                            -
                          </button>
                          <span className={`w-12 text-center font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                            className={`w-10 h-10 flex items-center justify-center ${isDarkMode ? 'text-gray-300 hover:bg-primary-500 hover:text-white' : 'text-gray-600 hover:bg-primary-500 hover:text-white'} transition-all duration-300 font-bold cursor-pointer`}
                          >
                            +
                          </button>
                        </div>
                        
                        {/* Item Total */}
                        <div className="flex-1 text-right">
                          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            ₹{item.price * item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item._id)}
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 bg-red-500/90 text-white hover:bg-red-600 flex-shrink-0"
                      title="Remove from cart"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className={`relative p-6 rounded-3xl ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-white/10' : 'bg-white/70 backdrop-blur-xl border border-gray-200'} shadow-xl sticky top-8`}>
              <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Order Summary
              </h3>
              
              <div className="space-y-4 mb-6">
                {/* Selected Items Summary */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <div className={`flex justify-between items-center pb-2 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Selected Items</span>
                    <span className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {selectedItems.length} of {cart.totalItems}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Selected Total</span>
                    <span className={`text-lg font-bold text-primary-600 dark:text-primary-400`}>
                      ₹{getSelectedItemsTotal()}
                    </span>
                  </div>
                </div>

                {/* Cart Total */}
                <div className={`flex justify-between items-center pb-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cart Total ({cart.totalItems} items)</span>
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>₹{cart.totalPrice}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Delivery</span>
                  <span className="text-green-600 font-bold">Free</span>
                </div>
                <div className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} my-4`}></div>
                <div className="flex justify-between items-center">
                  <span className={`text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Order Total</span>
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">₹{getSelectedItemsTotal()}</span>
                </div>
              </div>

              {/* Selection Info */}
              {selectedItems.length === 0 && (
                <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-300' : 'bg-yellow-100 border-yellow-300 text-yellow-800'} border text-sm`}>
                  Please select items to checkout
                </div>
              )}

              {/* Clear Cart Button */}
              <button
                onClick={handleClearCart}
                className={`w-full py-3 rounded-xl font-medium transform hover:scale-[1.02] transition-all duration-200 mb-3 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Clear Cart
              </button>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
                className={`w-full py-3 rounded-xl font-bold transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-primary-500/30 ${
                  selectedItems.length === 0
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600'
                }`}
              >
                {selectedItems.length === 0 ? 'Select Items to Checkout' : `Checkout ${selectedItems.length} Item${selectedItems.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Cart;
