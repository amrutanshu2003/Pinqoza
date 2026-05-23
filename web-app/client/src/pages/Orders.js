import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrders, deleteOrder } from '../services/api';
import { isAuthenticated } from '../util/auth';
import { useTheme } from '../context/ThemeContext';

const Orders = () => {
  const { isDarkMode } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, orderId: null, orderNumber: '' });
  const [deleting, setDeleting] = useState(false);
  const [trackingModal, setTrackingModal] = useState({ show: false, order: null });
  const navigate = useNavigate();

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
    if (lowerName.includes('sweet') || lowerName.includes('rasgulla') || lowerName.includes('gulab') || lowerName.includes('kaju') || lowerName.includes('rasmalai')) return 'sweets';
    if (lowerName.includes('buttermilk')) return 'buttermilk';
    return 'milk';
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getOrders();
      setOrders(res.data);
      setError('');
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    const classes = {
      processing: 'bg-blue-100 text-blue-800 dark:bg-black/30 dark:text-blue-300',
      confirmed: 'bg-indigo-100 text-indigo-800 dark:bg-black/30 dark:text-indigo-300',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-black/30 dark:text-purple-300',
      delivered: 'bg-green-100 text-green-800 dark:bg-black/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-black/30 dark:text-red-300'
    };
    return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-black/30 dark:text-gray-300';
  };

  const handleDeleteClick = (order) => {
    setDeleteModal({ 
      show: true, 
      orderId: order._id,
      orderNumber: order._id.toString().slice(-8).toUpperCase()
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.orderId) return;
    
    setDeleting(true);
    try {
      await deleteOrder(deleteModal.orderId);
      // Remove deleted order from list
      setOrders(prev => prev.filter(o => o._id !== deleteModal.orderId));
      setDeleteModal({ show: false, orderId: null, orderNumber: '' });
    } catch (err) {
      console.error('Error deleting order:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete order';
      setError(`Delete failed: ${errorMsg}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ show: false, orderId: null, orderNumber: '' });
  };

  const handleTrackOrder = (order) => {
    setTrackingModal({ show: true, order });
  };

  const handleCloseTracking = () => {
    setTrackingModal({ show: false, order: null });
  };

  const getDeliveryStatus = (status) => {
    const statusMap = {
      'processing': { step: 1, label: 'Order Placed', time: 'Just now', completed: true },
      'confirmed': { step: 2, label: 'Order Confirmed', time: '5 mins ago', completed: true },
      'shipped': { step: 3, label: 'Out for Delivery', time: '30 mins ago', completed: true },
      'delivered': { step: 4, label: 'Delivered', time: '1 hour ago', completed: true },
      'cancelled': { step: 0, label: 'Cancelled', time: '2 hours ago', completed: true }
    };
    return statusMap[status] || statusMap['processing'];
  };

  const getEstimatedDelivery = (order) => {
    const orderDate = new Date(order.createdAt);
    const estimatedDate = new Date(orderDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours from order time
    return estimatedDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

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
                All Orders
              </span>
            </h1>
            {/* Animated Underline */}
            <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            View and track all your orders
          </p>
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-lg`}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {orders.length} Order{orders.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Back to Account Button */}
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
            Back to Account
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`relative p-4 rounded-2xl mb-8 backdrop-blur-xl border transform transition-all duration-300 ${
            isDarkMode 
              ? 'bg-red-900/90 border-red-700/50 text-red-100' 
              : 'bg-red-100 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Orders Grid */}
        {orders.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div key={order._id} className={`group relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-6 shadow-xl transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-[1.02]`}>
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className={`font-bold text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      Order #{order._id.slice(-8)}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(order.orderStatus || order.status)}`}>
                    {(order.orderStatus || order.status)?.charAt(0).toUpperCase() + (order.orderStatus || order.status)?.slice(1)}
                  </span>
                </div>
                
                {/* Order Items Preview */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                      <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Show first 3 items */}
                  <div className="space-y-2">
                    {order.orderItems.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryEmoji(item.category || item.product?.category || deriveCategoryFromName(item.name))}</span>
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate max-w-[120px]`}>
                            {item.name} x {item.quantity}
                          </span>
                        </div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                    {order.orderItems.length > 3 && (
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        +{order.orderItems.length - 3} more item{order.orderItems.length - 3 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Order Total */}
                <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Amount
                    </span>
                    <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">
                      ₹{order.totalPrice}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTrackOrder(order)}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl text-sm text-center flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Track Order
                    </button>
                    
                    <Link 
                      to={`/order/${order._id}`}
                      className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium hover:from-primary-600 hover:to-secondary-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl text-sm text-center block"
                    >
                      View Details
                    </Link>
                    
                    {/* Delete Order Button */}
                    <button
                      onClick={() => handleDeleteClick(order)}
                      className={`px-4 py-3 rounded-xl font-medium transition-all transform hover:scale-[1.02] ${
                        isDarkMode 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
                          : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                      }`}
                      title="Delete Order"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className={`w-32 h-32 mx-auto mb-8 rounded-3xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'} flex items-center justify-center`}>
              <svg className={`w-16 h-16 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              No Orders Yet
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-8 max-w-md mx-auto`}>
              You haven't placed any orders yet. Start shopping on Pinqoza!
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                to="/products" 
                className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium hover:from-primary-600 hover:to-secondary-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Browse Products
              </Link>
              <Link 
                to="/account"
                className={`inline-block px-6 py-3 rounded-xl font-medium transform hover:scale-[1.02] transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Back to Account
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-3xl p-8 shadow-2xl transform animate-in fade-in zoom-in duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border border-white/10' 
              : 'bg-white border border-gray-200'
          }`}>
            {/* Warning Icon */}
            <div className="text-center mb-6">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                isDarkMode ? 'bg-red-500/20' : 'bg-red-100'
              }`}>
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Delete Order?
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Order #{deleteModal.orderNumber}
              </p>
            </div>

            <p className={`text-center mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to delete this order? This action cannot be undone.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={deleting}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  isDarkMode 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                } disabled:opacity-50`}
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Tracker Modal */}
      {trackingModal.show && trackingModal.order && (
        <>
          {/* Disable background scroll */}
          <style jsx>{`
            body {
              overflow: hidden;
            }
          `}</style>
          
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
            <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl transform animate-in fade-in zoom-in duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] scale-100 opacity-100 overflow-hidden max-h-[85vh] ${
              isDarkMode 
                ? 'bg-gray-900/95 border border-gray-700/50 backdrop-blur-xl' 
                : 'bg-white/95 border border-gray-200/50 backdrop-blur-xl'
            }`}>
            {/* Modal Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/20 dark:border-gray-700/20">
                <div>
                  <h3 className={`text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1`}>
                    Track Your Order
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Order #{trackingModal.order._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={handleCloseTracking}
                  className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                    isDarkMode ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300' : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="max-h-[calc(85vh-180px)] overflow-y-auto scrollbar-hide pb-4">
                {/* Delivery Progress */}
                <div className={`relative p-6 rounded-2xl mb-6 bg-gradient-to-br ${
                  isDarkMode 
                    ? 'from-blue-900/20 to-cyan-900/20 border border-blue-700/30' 
                    : 'from-blue-50 to-cyan-50 border border-blue-200/50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Delivery Status
                      </h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Est. by {getEstimatedDelivery(trackingModal.order)}
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusClass(trackingModal.order.orderStatus || trackingModal.order.status)} shadow-lg`}>
                      {(trackingModal.order.orderStatus || trackingModal.order.status)?.charAt(0).toUpperCase() + (trackingModal.order.orderStatus || trackingModal.order.status)?.slice(1)}
                    </div>
                  </div>

                  {/* Progress Steps */}
                  <div className="relative">
                    <div className="absolute left-4 top-8 bottom-8 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full opacity-30"></div>
                    
                    {[
                      { step: 1, label: 'Order Placed', icon: '📝', completed: true },
                      { step: 2, label: 'Order Confirmed', icon: '✅', completed: true },
                      { step: 3, label: 'Preparing', icon: '👨‍🍳', completed: ['processing', 'confirmed', 'shipped', 'delivered'].includes(trackingModal.order.orderStatus || trackingModal.order.status) },
                      { step: 4, label: 'Out for Delivery', icon: '🚚', completed: ['shipped', 'delivered'].includes(trackingModal.order.orderStatus || trackingModal.order.status) },
                      { step: 5, label: 'Delivered', icon: '📦', completed: (trackingModal.order.orderStatus || trackingModal.order.status) === 'delivered' }
                    ].map((item, index) => (
                      <div key={item.step} className="relative flex items-center mb-6 last:mb-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                          item.completed 
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25' 
                            : 'bg-gray-200 dark:bg-black text-gray-400'
                        }`}>
                          <span className="text-sm">{item.icon}</span>
                        </div>
                        <div className="ml-4">
                          <h5 className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {item.label}
                          </h5>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {item.completed ? 'Completed' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Details */}
                <div className={`p-6 rounded-2xl mb-6 bg-gradient-to-br ${
                  isDarkMode 
                    ? 'from-gray-800/50 to-gray-700/50 border border-gray-600/30' 
                    : 'from-gray-50 to-white border border-gray-200/50'
                }`}>
                  <h4 className={`font-semibold text-base mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Order Details
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        📅 Order Date
                      </span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {new Date(trackingModal.order.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        💰 Total Amount
                      </span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        ₹{trackingModal.order.totalPrice}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        💳 Payment Method
                      </span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {trackingModal.order.paymentMethod === 'cod' ? '💵 COD' : '🌐 Online'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        📍 Delivery Address
                      </span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} max-w-[180px] text-right`}>
                        {trackingModal.order.shippingAddress?.address || '🏠 Home Delivery'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Partner Info */}
                {['shipped', 'delivered'].includes(trackingModal.order.orderStatus || trackingModal.order.status) && (
                  <div className={`p-6 rounded-2xl mb-6 bg-gradient-to-br ${
                    isDarkMode 
                      ? 'from-green-900/20 to-emerald-900/20 border border-green-700/30' 
                      : 'from-green-50 to-emerald-50 border border-green-200/50'
                  }`}>
                    <h4 className={`font-semibold text-base mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      Delivery Partner
                    </h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg`}>
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h5 className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            Raj Kumar
                          </h5>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            🚚 Delivery Executive
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                          isDarkMode ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400' : 'bg-green-100 hover:bg-green-200 text-green-600'
                        }`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </button>
                        <button className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                          isDarkMode ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400' : 'bg-green-100 hover:bg-green-200 text-green-600'
                        }`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200/20 dark:border-gray-700/20 sticky bottom-0 bg-inherit">
                <button
                  onClick={handleCloseTracking}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] ${
                    isDarkMode 
                      ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600/30' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200/50'
                  }`}
                >
                  Close
                </button>
                <button className="flex-1 py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-blue-500/25">
                  Contact Support
                </button>
              </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Orders;
