import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrderById, cancelOrder, reorder } from '../services/api';
import { isAuthenticated } from '../util/auth';
import { useTheme } from '../context/ThemeContext';

const OrderDetails = () => {
  const { isDarkMode } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
    if (lowerName.includes('cake') || lowerName.includes('milk cake')) return 'cake';

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
    if (lowerName.includes('sweet') || lowerName.includes('rasgulla') || lowerName.includes('gulab') || lowerName.includes('kaju') || lowerName.includes('rasmalai')) return 'sweets';
    return 'milk';
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await getOrderById(id);
      setOrder(res.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      navigate('/account');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    const classes = {
      processing: 'bg-blue-100 text-blue-800 dark:bg-black/30 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      confirmed: 'bg-indigo-100 text-indigo-800 dark:bg-black/30 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-black/30 dark:text-purple-300 border-purple-300 dark:border-purple-700',
      delivered: 'bg-green-100 text-green-800 dark:bg-black/30 dark:text-green-300 border-green-300 dark:border-green-700',
      cancelled: 'bg-red-100 text-red-800 dark:bg-black/30 dark:text-red-300 border-red-300 dark:border-red-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-black/30 dark:text-gray-300 border-gray-300 dark:border-gray-700';
  };

const getStepNumber = (status) => {
    const steps = {
      processing: 1,
      confirmed: 2,
      shipped: 3,
      delivered: 4,
      cancelled: 0
    };
    return steps[status] || 0;
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      setActionLoading(true);
      await cancelOrder(id);
      fetchOrder();
    } catch (error) {
      alert(error.response?.data?.message || 'Error cancelling order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReorder = async () => {
    try {
      setActionLoading(true);
      await reorder(id);
      navigate('/cart');
    } catch (error) {
      alert(error.response?.data?.message || 'Error reordering');
    } finally {
      setActionLoading(false);
    }
  };

  const canCancel = ['processing', 'confirmed'].includes(order?.orderStatus);

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

  if (!order) {
    return (
      <div className="fade-in min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black flex items-center justify-center px-4">
        <div className={`text-center py-20 rounded-3xl ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-white/10' : 'bg-white/70 backdrop-blur-xl border border-gray-200'} shadow-xl max-w-md w-full`}>
          <div className="w-32 h-32 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-red-100 to-red-200 dark:from-black/30 dark:to-black/30 flex items-center justify-center">
            <svg className="w-16 h-16 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Order not found
          </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
            The order you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            to="/account" 
            className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium hover:from-primary-600 hover:to-secondary-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Back to Account
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getStepNumber(order.orderStatus);

  return (
    <div className="fade-in min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Modern Header */}
        <div className="mb-8">
          <Link 
            to="/account" 
            className={`inline-flex items-center px-4 py-2 rounded-xl font-medium transform hover:scale-[1.02] transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Orders
          </Link>
        </div>

        {/* Order Header */}
        <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-8 shadow-xl mb-8 transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-[1.01]`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Order #{order._id.slice(-8).toUpperCase()}
                  </h1>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <span className={`px-6 py-3 rounded-2xl font-bold border-2 ${getStatusClass(order.orderStatus)}`}>
                {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-6">
            {canCancel && (
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-red-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Cancelling...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel Order
                  </span>
                )}
              </button>
            )}
            {order.orderStatus === 'delivered' && (
              <button
                onClick={handleReorder}
                disabled={actionLoading}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-bold hover:from-primary-600 hover:to-secondary-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Reorder
                  </span>
                )}
              </button>
            )}
        </div>
      </div>

      {/* Order Tracking Progress */}
      {order.orderStatus !== 'cancelled' && (
        <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-8 shadow-xl mb-8 transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-[1.01]`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Order Tracking
            </h2>
          </div>
          
          {/* Progress Steps */}
          <div className="relative mb-8">
            <div className="flex items-center justify-between">
              {['Processing', 'Confirmed', 'Shipped', 'Delivered'].map((step, index) => (
                <div key={step} className="flex flex-col items-center flex-1 relative z-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    currentStep > index
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'
                      : currentStep === index + 1
                        ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg ring-4 ring-primary-500/20'
                        : `${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`
                  }`}>
                    {currentStep > index + 1 ? (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`mt-3 text-sm font-medium ${
                    currentStep > index
                      ? 'text-green-600 dark:text-green-400'
                      : currentStep === index + 1
                        ? 'text-primary-600 dark:text-primary-400'
                        : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Progress Line */}
            <div className={`absolute top-6 left-0 right-0 h-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} -z-0 transform -translate-y-1/2`}>
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Tracking Info */}
          {order.tracking && order.tracking.trackingNumber && (
            <div className={`mt-8 pt-8 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Tracking Number</p>
                  <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{order.tracking.trackingNumber}</p>
                </div>
                {order.tracking.estimatedDelivery && (
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Estimated Delivery</p>
                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {new Date(order.tracking.estimatedDelivery).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                )}
                {order.tracking.currentLocation && (
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'} lg:col-span-1 md:col-span-2`}>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Current Location</p>
                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{order.tracking.currentLocation}</p>
                  </div>
                )}
              </div>

              {/* Tracking Timeline */}
              {order.tracking.updates && order.tracking.updates.length > 0 && (
                <div className="mt-8">
                  <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Tracking Timeline</h3>
                  <div className="space-y-6">
                    {order.tracking.updates.map((update, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${
                            index === 0 
                              ? 'bg-primary-500 ring-4 ring-primary-500/20' 
                              : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                          }`}></div>
                          {index < order.tracking.updates.length - 1 && (
                            <div className={`w-0.5 h-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} mt-2`}></div>
                          )}
                        </div>
                        <div className={`flex-1 pb-6 p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/30'}`}>
                          <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{update.status}</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{update.description}</p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                            {new Date(update.timestamp).toLocaleString('en-IN')}
                          </p>
                          {update.location && (
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>📍 {update.location}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-8 shadow-xl transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-[1.01]`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Order Items
              </h2>
            </div>
            
            <div className="space-y-4">
              {order.orderItems.map((item, index) => (
                <div key={index} className={`group relative overflow-hidden rounded-2xl border-2 ${isDarkMode ? 'border-gray-700/50 bg-gray-900/30' : 'border-gray-200/50 bg-white/50'} backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}>
                  <div className="flex items-center gap-6">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-2xl"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback Image based on category */}
                    <div 
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br ${getCategoryGradient(item.category || item.product?.category || deriveCategoryFromName(item.name))} ${item.image ? 'hidden' : 'flex'}`}
                    >
                      <span className="text-4xl transform transition-all duration-700 group-hover:scale-110 group-hover:rotate-12">{getCategoryEmoji(item.category || item.product?.category || deriveCategoryFromName(item.name))}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>{item.name}</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Qty: <span className="font-medium">{item.quantity}</span> {item.unit}
                        </span>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          ₹{item.price}/{item.unit}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-8 pt-8 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Subtotal</span>
                  <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>₹{order.totalPrice - 40}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Delivery</span>
                  <span className="font-bold text-green-600 dark:text-green-400">Free</span>
                </div>
                <div className={`flex justify-between items-center pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Total</span>
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">₹{order.totalPrice}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="lg:col-span-1">
          <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-8 shadow-xl transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-[1.01]`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Shipping Address
              </h2>
            </div>
            
            <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} space-y-3`}>
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
                  {order.shippingAddress?.street}
                </p>
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{order.shippingAddress?.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default OrderDetails;
