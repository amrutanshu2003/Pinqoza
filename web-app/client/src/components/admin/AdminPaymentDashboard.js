import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { 
  getPendingPayments, 
  verifyPayment, 
  confirmOrder, 
  rejectOrder
} from '../../services/api';
import { getPendingSubscriptions, confirmSubscriptionPayment } from '../../services/simpleApi';

const AdminPaymentDashboard = () => {
  const { isDarkMode } = useTheme();
  const { socket } = useSocket();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'online', 'cod'
  const [newPaymentAlert, setNewPaymentAlert] = useState({ online: false, cod: false });
  const [previousCounts, setPreviousCounts] = useState({ online: 0, cod: 0, total: 0 });
  const [pendingSubscriptions, setPendingSubscriptions] = useState([]);
  const [subscriptionAlert, setSubscriptionAlert] = useState(false);
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' | 'subscriptions'

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
    fetchPendingPayments();
    fetchPendingSubscriptions();
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchPendingPayments();
      fetchPendingSubscriptions();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Track count changes for animation
  useEffect(() => {
    if (Array.isArray(pendingPayments)) {
      const onlineCount = pendingPayments.filter(p => p.paymentMethod === 'online').length;
      const codCount = pendingPayments.filter(p => p.paymentMethod === 'cod').length;
      const totalAmount = pendingPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      
      // Check if counts increased
      if (onlineCount > previousCounts.online) {
        setNewPaymentAlert(prev => ({ ...prev, online: true }));
        setTimeout(() => setNewPaymentAlert(prev => ({ ...prev, online: false })), 3000);
      }
      if (codCount > previousCounts.cod) {
        setNewPaymentAlert(prev => ({ ...prev, cod: true }));
        setTimeout(() => setNewPaymentAlert(prev => ({ ...prev, cod: false })), 3000);
      }
      
      setPreviousCounts({ online: onlineCount, cod: codCount, total: totalAmount });
    }
  }, [pendingPayments]);

  // Socket listener for real-time new orders
  useEffect(() => {
    if (socket) {
      const handleNewOrder = (data) => {
        console.log('🆕 New order received:', data);
        // Refresh payments list
        fetchPendingPayments();
        
        // Show alert based on payment method
        if (data.paymentMethod === 'online') {
          setNewPaymentAlert(prev => ({ ...prev, online: true }));
          setTimeout(() => setNewPaymentAlert(prev => ({ ...prev, online: false })), 3000);
        } else if (data.paymentMethod === 'cod') {
          setNewPaymentAlert(prev => ({ ...prev, cod: true }));
          setTimeout(() => setNewPaymentAlert(prev => ({ ...prev, cod: false })), 3000);
        }
      };

      socket.on('newOrder', handleNewOrder);
      socket.on('paymentPending', handleNewOrder);

      // Listen for new subscription notifications
      const handleNewSubscription = (data) => {
        console.log('🆕 New subscription received:', data);
        fetchPendingSubscriptions();
        setSubscriptionAlert(true);
        setTimeout(() => setSubscriptionAlert(false), 3000);
      };
      socket.on('newSubscription', handleNewSubscription);

      return () => {
        socket.off('newOrder', handleNewOrder);
        socket.off('paymentPending', handleNewOrder);
        socket.off('newSubscription', handleNewSubscription);
      };
    }
  }, [socket]);

  const fetchPendingSubscriptions = async () => {
    try {
      const response = await getPendingSubscriptions();
      const data = Array.isArray(response.data) ? response.data : [];
      setPendingSubscriptions(data);
    } catch (error) {
      console.error('Error fetching pending subscriptions:', error);
      setPendingSubscriptions([]);
    }
  };

  const handleConfirmSubscription = async (subscriptionId) => {
    setProcessing(prev => ({ ...prev, [subscriptionId]: 'confirming' }));
    try {
      await confirmSubscriptionPayment(subscriptionId, notes);
      alert('Subscription confirmed successfully!');
      setPendingSubscriptions(prev => Array.isArray(prev) ? prev.filter(s => s._id !== subscriptionId) : []);
      setSelectedOrder(null);
      setNotes('');
    } catch (error) {
      console.error('Error confirming subscription:', error);
      alert('Error confirming subscription. Please try again.');
    } finally {
      setProcessing(prev => ({ ...prev, [subscriptionId]: false }));
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const response = await getPendingPayments();
      const data = Array.isArray(response.data) ? response.data : [];
      setPendingPayments(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      setPendingPayments([]);
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (orderId) => {
    if (!transactionId.trim()) {
      alert('Please enter a transaction ID');
      return;
    }

    setProcessing(prev => ({ ...prev, [orderId]: 'verifying' }));
    try {
      await verifyPayment(orderId, transactionId, notes);
      alert('Payment verified successfully!');
      setPendingPayments(prev => Array.isArray(prev) ? prev.filter(p => p._id !== orderId) : []);
      setSelectedOrder(null);
      setTransactionId('');
      setNotes('');
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Error verifying payment. Please try again.');
    } finally {
      setProcessing(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleConfirmOrder = async (orderId) => {
    setProcessing(prev => ({ ...prev, [orderId]: 'confirming' }));
    try {
      await confirmOrder(orderId, notes);
      alert('Order confirmed successfully!');
      setPendingPayments(prev => Array.isArray(prev) ? prev.filter(p => p._id !== orderId) : []);
      setSelectedOrder(null);
      setNotes('');
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Error confirming order. Please try again.');
    } finally {
      setProcessing(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleRejectOrder = async (orderId) => {
    if (!rejectReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }

    setProcessing(prev => ({ ...prev, [orderId]: 'rejecting' }));
    try {
      await rejectOrder(orderId, rejectReason);
      alert('Order rejected successfully!');
      setPendingPayments(prev => Array.isArray(prev) ? prev.filter(p => p._id !== orderId) : []);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Error rejecting order. Please try again.');
    } finally {
      setProcessing(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const filteredPayments = Array.isArray(pendingPayments) 
    ? pendingPayments.filter(payment => {
        if (filter === 'all') return true;
        return payment.paymentMethod === filter;
      })
    : [];

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-white/10' : 'bg-white border border-gray-200'} backdrop-blur-xl`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {activeTab === 'payments' ? 'Payment Verification' : 'Subscription Verifications'}
            </h2>
            <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {activeTab === 'payments'
                ? `${Array.isArray(pendingPayments) ? pendingPayments.length : 0} pending orders awaiting verification`
                : `${pendingSubscriptions.length} pending subscriptions awaiting payment confirmation`
              }
            </p>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab('payments'); setSelectedOrder(null); }}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all relative ${
                activeTab === 'payments'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Payments
              {newPaymentAlert.online || newPaymentAlert.cod ? (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
              ) : null}
            </button>
            <button
              onClick={() => { setActiveTab('subscriptions'); setSelectedOrder(null); }}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all relative ${
                activeTab === 'subscriptions'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Subscriptions
              {subscriptionAlert ? (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
              ) : null}
            </button>
            <button
              onClick={() => activeTab === 'payments' ? fetchPendingPayments() : fetchPendingSubscriptions()}
              disabled={loading}
              className={`p-2 rounded-xl transition-all ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:bg-gray-50'
              }`}
              title="Refresh"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Payment Filter Buttons - Only show when Payments tab is active */}
        {activeTab === 'payments' && (
          <div className="flex gap-2 mt-4">
            {['all', 'online', 'cod'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${
                  filter === f
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'payments' && (
      <>
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        {/* Online Payments Card */}
        <div className={`relative p-4 rounded-2xl transition-all duration-300 ${isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'} ${newPaymentAlert.online ? 'scale-105 shadow-lg shadow-blue-500/30' : ''}`}>
          {/* New Payment Pulse Badge */}
          {newPaymentAlert.online && (
            <div className="absolute -top-2 -right-2">
              <span className="flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-blue-500 text-white text-xs items-center justify-center font-bold">
                  +1
                </span>
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-3xl font-bold text-blue-500 transition-all ${newPaymentAlert.online ? 'scale-110' : ''}`}>
                {Array.isArray(pendingPayments) ? pendingPayments.filter(p => p.paymentMethod === 'online').length : 0}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Online Payments</div>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* COD Orders Card */}
        <div className={`relative p-4 rounded-2xl transition-all duration-300 ${isDarkMode ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-100'} ${newPaymentAlert.cod ? 'scale-105 shadow-lg shadow-orange-500/30' : ''}`}>
          {/* New Payment Pulse Badge */}
          {newPaymentAlert.cod && (
            <div className="absolute -top-2 -right-2">
              <span className="flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-orange-500 text-white text-xs items-center justify-center font-bold">
                  +1
                </span>
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-3xl font-bold text-orange-500 transition-all ${newPaymentAlert.cod ? 'scale-110' : ''}`}>
                {Array.isArray(pendingPayments) ? pendingPayments.filter(p => p.paymentMethod === 'cod').length : 0}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>COD Orders</div>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Total Amount Card */}
        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-500">
                ₹{Array.isArray(pendingPayments) ? pendingPayments.reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString('en-IN') : 0}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</div>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments Header with Total */}
      <div className={`flex items-center justify-between p-4 rounded-2xl mb-4 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10' 
          : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Pending Amount
            </p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              ₹{Array.isArray(filteredPayments) ? filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString('en-IN') : 0}
            </p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl text-center ${
          isDarkMode 
            ? 'bg-gray-700/50 border border-gray-600' 
            : 'bg-white border border-gray-200'
        }`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pending Orders</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {filteredPayments.length}
          </p>
        </div>
      </div>

      {/* Pending Payments List */}
      {filteredPayments.length === 0 ? (
        <div className={`p-16 text-center rounded-2xl ${isDarkMode ? 'bg-gray-800/30 border border-white/5' : 'bg-gray-50 border border-gray-100'}`}>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            All Caught Up!
          </h3>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No pending payments to verify
          </p>
          <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            New orders will appear here automatically
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPayments.map((payment) => (
            <div
              key={payment._id}
              className={`p-6 rounded-2xl transition-all hover:shadow-lg ${
                isDarkMode 
                  ? 'bg-gray-800/50 border border-white/10 hover:border-white/20' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      payment.paymentMethod === 'online'
                        ? 'bg-blue-100 text-blue-700 dark:bg-black/30 dark:text-blue-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-black/30 dark:text-orange-400'
                    }`}>
                      {payment.paymentMethod === 'online' ? '💳 Online' : '💰 COD'}
                    </span>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(payment.createdAt)}
                    </span>
                  </div>
                  
                  <h3 className={`font-semibold text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Order #{payment._id.toString().slice(-8).toUpperCase()}
                  </h3>
                  
                  <div className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="font-medium">Customer:</span> {payment.user?.name || 'N/A'} ({payment.user?.phone || 'N/A'})
                  </div>
                  
                  <div className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="font-medium">Items:</span> {payment.items?.length || 0} items | 
                    <span className="font-medium ml-2">Amount:</span> ₹{payment.amount}
                  </div>

                  {/* Items List */}
                  <div className={`text-xs mb-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    {payment.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between mb-2 last:mb-0">
                        <div className="flex items-center gap-2">
                          {/* Product Image */}
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-full h-full object-cover"
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
                              <span className="text-xl">{getCategoryEmoji(item.category || item.product?.category || deriveCategoryFromName(item.name))}</span>
                            </div>
                          </div>
                          <span>{item.name} x {item.quantity}</span>
                        </div>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address */}
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    📍 {payment.shippingAddress?.street}, {payment.shippingAddress?.city}, {payment.shippingAddress?.state} - {payment.shippingAddress?.pincode}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 min-w-[200px]">
                  {selectedOrder === payment._id ? (
                    // Expanded Action Form
                    <div className="space-y-3">
                      {payment.paymentMethod === 'online' && (
                        <input
                          type="text"
                          placeholder="Transaction ID *"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                          }`}
                        />
                      )}
                      <textarea
                        placeholder="Notes (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows="2"
                        className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                        }`}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => payment.paymentMethod === 'online' 
                            ? handleVerifyPayment(payment._id)
                            : handleConfirmOrder(payment._id)
                          }
                          disabled={processing[payment._id]}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {processing[payment._id] ? (
                            <span className="animate-spin">⏳</span>
                          ) : payment.paymentMethod === 'online' ? (
                            'Verify & Confirm'
                          ) : (
                            'Confirm Order'
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="px-4 py-2 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Collapsed Action Buttons
                    <>
                      <button
                        onClick={() => setSelectedOrder(payment._id)}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${
                          payment.paymentMethod === 'online'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                        }`}
                      >
                        {payment.paymentMethod === 'online' ? 'Verify Payment' : 'Confirm Order'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrder(payment._id);
                          setShowRejectModal(true);
                        }}
                        className={`px-6 py-2 rounded-xl font-medium border-2 transition-all ${
                          isDarkMode
                            ? 'border-red-500 text-red-400 hover:bg-red-500/10'
                            : 'border-red-500 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {activeTab === 'subscriptions' && (
      <>
      {/* Subscription Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`relative p-4 rounded-2xl transition-all duration-300 ${isDarkMode ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-100'} ${subscriptionAlert ? 'scale-105 shadow-lg shadow-purple-500/30' : ''}`}>
          {subscriptionAlert && (
            <div className="absolute -top-2 -right-2">
              <span className="flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-purple-500 text-white text-xs items-center justify-center font-bold">
                  +1
                </span>
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-3xl font-bold text-purple-500 transition-all ${subscriptionAlert ? 'scale-110' : ''}`}>
                {pendingSubscriptions.length}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending Subscriptions</div>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-pink-500/10 border border-pink-500/20' : 'bg-pink-50 border border-pink-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-pink-500">
                ₹{Array.isArray(pendingSubscriptions) ? pendingSubscriptions.reduce((acc, s) => acc + (s.pricing?.totalAmount || 0), 0).toLocaleString('en-IN') : 0}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Subscription Amount</div>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-pink-500/20' : 'bg-pink-100'}`}>
              <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Subscriptions List */}

        {pendingSubscriptions.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl ${isDarkMode ? 'bg-gray-800/30 border border-white/5' : 'bg-gray-50 border border-gray-100'}`}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              No Pending Subscriptions
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              New subscription payments will appear here
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingSubscriptions.map((subscription) => (
              <div
                key={subscription._id}
                className={`p-6 rounded-2xl transition-all hover:shadow-lg ${
                  isDarkMode
                    ? 'bg-gray-800/50 border border-white/10 hover:border-white/20'
                    : 'bg-white border border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 dark:bg-black/30 dark:text-purple-400">
                        🎯 Subscription
                      </span>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(subscription.createdAt)}
                      </span>
                    </div>
                    <h3 className={`font-semibold text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {subscription.planName}
                    </h3>
                    <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="font-medium">Customer:</span> {subscription.user?.name || 'N/A'} ({subscription.user?.phone || 'N/A'})
                    </div>
                    <div className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="font-medium">Plan Type:</span> {subscription.planType} | 
                      <span className="font-medium ml-2">Amount:</span> ₹{subscription.pricing?.totalAmount}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:items-end">
                    {selectedOrder === subscription._id ? (
                      <div className="w-full lg:w-80 space-y-2">
                        <textarea
                          placeholder="Notes (optional)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows="2"
                          className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                          }`}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirmSubscription(subscription._id)}
                            disabled={processing[subscription._id]}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {processing[subscription._id] ? (
                              <span className="animate-spin">⏳</span>
                            ) : (
                              'Confirm Payment'
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedOrder(null)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedOrder(subscription._id)}
                        className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all"
                      >
                        Confirm Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-white/10' : 'bg-white border border-gray-200'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Reject Order
            </h3>
            <textarea
              placeholder="Enter rejection reason *"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows="3"
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
              }`}
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleRejectOrder(selectedOrder)}
                disabled={processing[selectedOrder]}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 transition-all"
              >
                {processing[selectedOrder] ? 'Rejecting...' : 'Reject Order'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedOrder(null);
                }}
                className={`flex-1 px-4 py-3 rounded-xl font-medium border-2 transition-all ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentDashboard;
