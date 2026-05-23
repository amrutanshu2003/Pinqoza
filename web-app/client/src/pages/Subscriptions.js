import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createSimpleSubscription } from '../services/simpleApi';
import { isAuthenticated, getAuthData } from '../util/auth';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { getUserSubscriptions, cancelSubscription } from '../services/api';
import api from '../services/api';
import SimpleQRCode from '../components/SimpleQRCode';
import ModernPlanCard from '../components/ModernPlanCard';
import DeliveryScheduleModal from '../components/DeliveryScheduleModal';

const Subscriptions = () => {
  const { isDarkMode } = useTheme();
  const { success, error: showError } = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscriptionModal, setSubscriptionModal] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [qrPlan, setQrPlan] = useState(null);
  const [showPaymentConfirmed, setShowPaymentConfirmed] = useState(false);
  const [showCancelConfirmed, setShowCancelConfirmed] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showPaymentFailed, setShowPaymentFailed] = useState(false);
  const [selectedFailedSub, setSelectedFailedSub] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { socket, joinUserRoom } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [deliveryModalSub, setDeliveryModalSub] = useState(null);

  // Lock body scroll when subscription modal or plans modal is open
  useEffect(() => {
    if (subscriptionModal || showPlansModal || showPaymentConfirmed || showSupportModal || showPaymentFailed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [subscriptionModal, showPlansModal, showPaymentConfirmed, showCancelConfirmed, showSupportModal, showPaymentFailed]);

  // Socket listener for subscription confirmation by admin
  useEffect(() => {
    if (!socket) {
      console.log('❌ Socket is null in Subscriptions component');
      return;
    }

    console.log('✅ Socket connected in Subscriptions component:', socket.id);

    // Join user room for real-time notifications
    const authData = getAuthData();
    if (authData && authData.user && authData.user._id) {
      console.log('🏠 Joining user room for:', authData.user._id);
      joinUserRoom(authData.user._id);
    } else {
      console.log('❌ No auth data or user ID found');
    }

    const handleSubscriptionConfirmed = (data) => {
      console.log('✅ Subscription confirmed by admin:', data);
      // Close QR modal
      setQrPlan(null);
      // Close subscription modal
      setSubscriptionModal(false);
      setSelectedPlan(null);
      // Close browse plans modal
      setShowPlansModal(false);
      // Show payment confirmed popup
      setShowPaymentConfirmed(true);
      // Auto close after 6 seconds, then refresh and scroll to active section
      setTimeout(() => {
        setShowPaymentConfirmed(false);
        fetchSubscriptions().then(() => {
          setTimeout(() => {
            const activeSection = document.getElementById('active-subscriptions-section');
            if (activeSection) {
              activeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 500);
        });
      }, 6000);
    };

    const handleSubscriptionFailed = (data) => {
      console.log('❌ Subscription payment failed:', data);
      // Close QR modal
      setQrPlan(null);
      // Close subscription modal
      setSubscriptionModal(false);
      setSelectedPlan(null);
      // Close browse plans modal
      setShowPlansModal(false);
      // Show failed payment popup
      setShowPaymentFailed(true);
      // Auto close after 6 seconds, then refresh and scroll to failed section
      setTimeout(() => {
        setShowPaymentFailed(false);
        fetchSubscriptions().then(() => {
          // Scroll to failed payment section after data refresh
          setTimeout(() => {
            const failedSection = document.getElementById('failed-payments-section');
            if (failedSection) {
              failedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 500);
        });
      }, 6000);
    };

    socket.on('subscriptionConfirmed', handleSubscriptionConfirmed);
    socket.on('subscriptionFailed', handleSubscriptionFailed);

    console.log('👂 Socket listeners registered for subscriptionConfirmed and subscriptionFailed');

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('subscriptionConfirmed', handleSubscriptionConfirmed);
      socket.off('subscriptionFailed', handleSubscriptionFailed);
    };
  }, [socket, joinUserRoom]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchSubscriptions();
  }, []);

  // Scroll to section when navigated from Home page
  useEffect(() => {
    if (!loading && location.state) {
      if (location.state.scrollToFailed) {
        const failedSection = document.getElementById('failed-payments-section');
        if (failedSection) {
          setTimeout(() => {
            failedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        }
      } else if (location.state.scrollToActive) {
        const activeSection = document.getElementById('active-subscriptions-section');
        if (activeSection) {
          setTimeout(() => {
            activeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        }
      }
      // Clear the navigation state so it doesn't re-scroll
      window.history.replaceState({}, document.title);
    }
  }, [loading, location.state]);

  const fetchSubscriptions = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const startTime = isRefresh ? Date.now() : 0;
      const res = await getUserSubscriptions();
      setSubscriptions(res.data);
      if (isRefresh) {
        const elapsed = Date.now() - startTime;
        const minDuration = 1500;
        if (elapsed < minDuration) {
          await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
        }
      }
    } catch (err) {
      setError('Failed to load subscriptions');
      console.error(err);
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSub) return;

    try {
      setCancellingId(selectedSub._id);
      console.log('Attempting to cancel subscription:', selectedSub._id, 'Status:', selectedSub.status);
      const response = await cancelSubscription(selectedSub._id);
      console.log('Cancel response:', response.data);
      setShowCancelModal(false);
      setSelectedSub(null);
      setShowCancelConfirmed(true);
      // Auto close after 6 seconds, then refresh page and scroll to My Journey
      setTimeout(() => {
        setShowCancelConfirmed(false);
        fetchSubscriptions().then(() => {
          setTimeout(() => {
            const journeySection = document.getElementById('my-journey-section');
            if (journeySection) {
              journeySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 500);
        });
      }, 6000);
    } catch (err) {
      console.error('Cancel subscription error:', err.response?.data || err.message);
      showError(err.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setCancellingId(null);
    }
  };

  const openCancelModal = (sub) => {
    setSelectedSub(sub);
    setShowCancelModal(true);
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
          text: 'text-green-400',
          border: 'border-green-500/40',
          dot: 'bg-green-400'
        };
      case 'pending':
        return {
          bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20',
          text: 'text-yellow-400',
          border: 'border-yellow-500/40',
          dot: 'bg-yellow-400'
        };
      case 'cancelled':
        return {
          bg: 'bg-gradient-to-r from-red-500/20 to-rose-500/20',
          text: 'text-red-400',
          border: 'border-red-500/40',
          dot: 'bg-red-400'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500/20 to-slate-500/20',
          text: 'text-gray-400',
          border: 'border-gray-500/40',
          dot: 'bg-gray-400'
        };
    }
  };

  const getPaymentStatusStyles = (status) => {
    switch (status) {
      case 'paid':
        return { text: 'text-green-400', icon: '✓' };
      case 'pending':
        return { text: 'text-yellow-400', icon: '⏳' };
      default:
        return { text: 'text-gray-400', icon: '—' };
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPlanDetails = (planType) => {
    const plans = {
      daily: {
        name: 'Daily Plan',
        price: 29,
        duration: 'day',
        description: 'Fresh milk every morning',
        features: [
          '500ml Fresh Milk Daily',
          '6:00 AM - 7:00 AM Delivery',
          'Pause Anytime',
          'Free Delivery'
        ],
        color: 'from-green-500 to-emerald-500',
        shadow: 'shadow-green-500/25',
        border: 'border-green-500/30',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      weekly: {
        name: 'Weekly Plan',
        price: 189,
        duration: 'week',
        description: 'Perfect for small families',
        features: [
          '3.5L Milk Per Week',
          'Flexible Delivery Days',
          '10% Discount',
          'Free Delivery'
        ],
        color: 'from-blue-500 to-cyan-500',
        shadow: 'shadow-blue-500/25',
        border: 'border-blue-500/30',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
      },
      monthly: {
        name: 'Monthly Plan',
        price: 799,
        duration: 'month',
        description: 'Best value for families',
        features: [
          '15L Milk Per Month',
          'Custom Schedule',
          '20% Discount',
          'Free Delivery + Priority'
        ],
        color: 'from-purple-500 to-pink-500',
        shadow: 'shadow-purple-500/25',
        border: 'border-purple-500/30',
        icon: 'M13 10V3L4 14h7v7l9-11h-7z'
      }
    };
    return plans[planType] || plans.daily;
  };

  const handleSubscribe = async (planType) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    setSelectedPlan(planType);
    setSubscriptionModal(true);
  };

  const createSubscriptionHandler = async () => {
    if (!selectedPlan) return;
    try {
      setLoadingSubscription(true);
      const planDetails = getPlanDetails(selectedPlan);
      const subscriptionData = {
        planType: selectedPlan,
        planName: planDetails.name,
        price: planDetails.price
      };
      const response = await createSimpleSubscription(subscriptionData);
      if (response.status === 201 || response.status === 200) {
        setQrPlan(planDetails);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create subscription');
      console.error('Subscription error:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Loading subscriptions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 relative">
      <div className="max-w-4xl mx-auto">
        {/* Modern Header */}
        <div className="text-center mb-12">
          <div className="inline-block relative group">
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 bg-clip-text text-transparent">
                My Subscriptions
              </span>
            </h1>
            {/* Animated Underline */}
            <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            View and manage your subscription plans
          </p>
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-lg`}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {subscriptions.length} Subscription{subscriptions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Filter active and cancelled subscriptions */}
        {(() => {
          const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
          const cancelledSubscriptions = subscriptions.filter(sub => sub.status === 'cancelled');
          const failedSubscriptions = subscriptions.filter(sub => sub.paymentStatus === 'failed');
          const activePlanTypes = new Set(activeSubscriptions.map(sub => sub.planType));

          return (
            <>
              {/* Active Subscriptions Section */}
              {activeSubscriptions.length > 0 ? (
                <div id="active-subscriptions-section" className="mb-12">
                  {/* Modern Section Header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isDarkMode ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' : 'bg-gradient-to-br from-green-50 to-emerald-50'
                    }`}>
                      <svg className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className={`absolute inset-0 rounded-2xl ${isDarkMode ? 'bg-green-500/10' : 'bg-green-500/5'} blur-lg animate-pulse`}></div>
                    </div>
                    <div>
                      <h2 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 bg-clip-text text-transparent">Active Subscriptions</span>
                      </h2>
                      <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Your current milk delivery plans
                      </p>
                    </div>
                    <div className={`ml-auto px-4 py-2 rounded-2xl text-sm font-bold ${
                      isDarkMode ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-600 border border-green-200'
                    }`}>
                      {activeSubscriptions.length} {activeSubscriptions.length === 1 ? 'plan' : 'plans'}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {activeSubscriptions.map((sub) => {
                      const statusStyles = getStatusStyles(sub.status);
                      const paymentStyles = getPaymentStatusStyles(sub.paymentStatus);
                      
                      // Plan-specific colors like My Journey section
                      const planColors = {
                        daily: { 
                          gradient: 'from-green-500/10 to-emerald-500/10', 
                          icon: 'from-green-500 to-emerald-500', 
                          dot: 'bg-green-500',
                          bar: 'from-green-500 to-emerald-500'
                        },
                        weekly: { 
                          gradient: 'from-blue-500/10 to-cyan-500/10', 
                          icon: 'from-blue-500 to-cyan-500', 
                          dot: 'bg-blue-500',
                          bar: 'from-blue-500 to-cyan-500'
                        },
                        monthly: { 
                          gradient: 'from-purple-500/10 to-pink-500/10', 
                          icon: 'from-purple-500 to-pink-500', 
                          dot: 'bg-purple-500',
                          bar: 'from-purple-500 to-pink-500'
                        }
                      };
                      const colors = planColors[sub.planType] || planColors.daily;

                      return (
                        <div
                          key={sub._id}
                          className={`relative rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group ${
                            isDarkMode
                              ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 border border-gray-700/40 hover:border-gray-600/60'
                              : 'bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/80 hover:border-gray-300'
                          }`}
                        >
                          {/* Animated glow on hover */}
                          <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                          
                          {/* Plan-specific color bar */}
                          <div className={`h-1.5 bg-gradient-to-r ${colors.bar}`}></div>

                          <div className="relative p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                              {/* Left section - Plan info */}
                              <div className="flex-1">
                                <div className="flex items-start gap-4 mb-4">
                                  {/* Plan icon with plan-specific gradient */}
                                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.icon} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    {sub.planType === 'daily' && (
                                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    )}
                                    {sub.planType === 'weekly' && (
                                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                    {sub.planType === 'monthly' && (
                                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                      </svg>
                                    )}
                                  </div>

                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {sub.planName || 'Subscription Plan'}
                                      </h3>
                                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles.bg} ${statusStyles.text} ${statusStyles.border} flex items-center gap-1.5`}>
                                        <span className={`w-2 h-2 rounded-full ${statusStyles.dot}`}></span>
                                        {sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1)}
                                      </span>
                                    </div>
                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      ID: <span className="font-mono">{sub.subscriptionId || 'N/A'}</span>
                                    </p>
                                  </div>
                                </div>

                                {/* Details grid with modern styling */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-105 ${
                                    isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/80'
                                  }`}>
                                    <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      Plan Type
                                    </p>
                                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                      {sub.planType || 'N/A'}
                                    </p>
                                  </div>
                                  <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-105 ${
                                    isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/80'
                                  }`}>
                                    <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      Duration
                                    </p>
                                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                      {sub.duration || 'N/A'}
                                    </p>
                                  </div>
                                  <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-105 ${
                                    isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/80'
                                  }`}>
                                    <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      Start Date
                                    </p>
                                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                      {formatDate(sub.startDate)}
                                    </p>
                                  </div>
                                  <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-105 ${
                                    isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/80'
                                  }`}>
                                    <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      End Date
                                    </p>
                                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                      {formatDate(sub.endDate)}
                                    </p>
                                  </div>
                                </div>

                                {/* Payment status with modern styling */}
                                <div className="mt-4 flex items-center gap-2">
                                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Payment:
                                  </span>
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-300 group-hover:scale-105 ${
                                    sub.paymentStatus === 'paid'
                                      ? 'bg-green-500/10 text-green-400'
                                      : 'bg-yellow-500/10 text-yellow-400'
                                  }`}>
                                    <span>{paymentStyles.icon}</span>
                                    {sub.paymentStatus?.charAt(0).toUpperCase() + sub.paymentStatus?.slice(1)}
                                  </span>
                                </div>
                              </div>

                              {/* Right section - Price and actions */}
                              <div className="flex flex-col items-end gap-4 lg:border-l-2 lg:pl-6 lg:min-w-[200px]">
                                <div className={`text-center lg:text-right w-full p-4 rounded-2xl transition-all duration-300 group-hover:scale-105 ${
                                  isDarkMode
                                    ? `bg-gradient-to-br ${colors.gradient} border border-gray-600/30`
                                    : `bg-gradient-to-br ${colors.gradient} border border-gray-200`
                                }`}>
                                  <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Total Amount
                                  </p>
                                  <div className="flex items-baseline justify-center lg:justify-end gap-1">
                                    <span className={`text-2xl font-black bg-gradient-to-r ${colors.icon} bg-clip-text text-transparent`}>
                                      ₹{sub.pricing?.totalAmount || sub.price || 0}
                                    </span>
                                  </div>
                                  {sub.paymentStatus === 'paid' && (
                                    <div className="mt-2 flex items-center justify-center lg:justify-end gap-1">
                                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      <span className="text-xs font-semibold text-green-500">Paid</span>
                                    </div>
                                  )}
                                </div>

                                {/* Cancel button - only for active subscriptions */}
                                {sub.status === 'active' && (
                                  <div className="flex items-center gap-2 flex-wrap justify-end">
                                    {sub.type === 'delivery' && (
                                      <button
                                        onClick={() => setDeliveryModalSub(sub)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 group-hover:scale-105 ${
                                          isDarkMode
                                            ? 'bg-primary-500/10 text-primary-300 hover:bg-primary-500/20 border border-primary-500/30'
                                            : 'bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200'
                                        }`}
                                      >
                                        <span>Manage Delivery</span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => openCancelModal(sub)}
                                      disabled={cancellingId === sub._id}
                                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 group-hover:scale-105 ${
                                        isDarkMode
                                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                                          : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200'
                                      }`}
                                    >
                                      {cancellingId === sub._id ? (
                                        <>
                                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                          <span>Cancelling...</span>
                                        </>
                                      ) : (
                                        <>
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                          <span>Cancel</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={`relative text-center py-16 rounded-3xl border-2 mb-12 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 border-gray-700/50 hover:border-gray-600/60'
                    : 'bg-gradient-to-br from-white to-gray-50/80 border-gray-200/80 hover:border-gray-300'
                }`}>
                  {/* Animated glow on hover */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-500/10 to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  {/* Top gradient bar */}
                  <div className="h-1 bg-gradient-to-r from-gray-400 via-slate-400 to-gray-500 absolute top-0 left-0 right-0"></div>

                  <div className="relative">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-400/30 to-slate-400/30 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 animate-bounce-slow">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      No active subscriptions
                    </h3>
                    <p className={`text-base mb-8 max-w-md mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Choose a plan to get started on Pinqoza
                    </p>
                    <button
                      onClick={() => setShowPlansModal(true)}
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 text-white font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg shadow-primary-500/25"
                    >
                      <span>Browse Plans</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Failed Payments Section */}
              {failedSubscriptions.length > 0 && (
                <div id="failed-payments-section" className="mb-12">
                  {/* Modern Section Header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isDarkMode ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20' : 'bg-gradient-to-br from-red-50 to-rose-50'
                    }`}>
                      <svg className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className={`absolute inset-0 rounded-2xl ${isDarkMode ? 'bg-red-500/10' : 'bg-red-500/5'} blur-lg animate-pulse`}></div>
                    </div>
                    <div>
                      <h2 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <span className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent">Failed Payments</span>
                      </h2>
                      <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Payment issues that need your attention
                      </p>
                    </div>
                    <div className={`ml-auto px-4 py-2 rounded-2xl text-sm font-bold ${
                      isDarkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      {failedSubscriptions.length} {failedSubscriptions.length === 1 ? 'issue' : 'issues'}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {failedSubscriptions.map((sub) => {
                      const planColors = {
                        daily: { gradient: 'from-green-500/10 to-emerald-500/10', icon: 'from-green-500 to-emerald-500', dot: 'bg-green-500', bar: 'from-green-500 to-emerald-500' },
                        weekly: { gradient: 'from-blue-500/10 to-cyan-500/10', icon: 'from-blue-500 to-cyan-500', dot: 'bg-blue-500', bar: 'from-blue-500 to-cyan-500' },
                        monthly: { gradient: 'from-purple-500/10 to-pink-500/10', icon: 'from-purple-500 to-pink-500', dot: 'bg-purple-500', bar: 'from-purple-500 to-pink-500' }
                      };
                      const colors = planColors[sub.planType] || planColors.daily;

                      return (
                        <div
                          key={sub._id}
                          className={`relative rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group ${
                            isDarkMode
                              ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 border border-gray-700/40 hover:border-gray-600/60'
                              : 'bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/80 hover:border-gray-300'
                          }`}
                        >
                          {/* Animated glow on hover */}
                          <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                          
                          {/* Plan-specific color bar */}
                          <div className={`h-1.5 bg-gradient-to-r ${colors.bar}`}></div>

                          <div className="relative p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                              {/* Left section - Plan info */}
                              <div className="flex-1">
                                <div className="flex items-start gap-4 mb-4">
                                  {/* Plan icon */}
                                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.icon} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    {sub.planType === 'daily' && (
                                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    )}
                                    {sub.planType === 'weekly' && (
                                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                    {sub.planType === 'monthly' && (
                                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                      </svg>
                                    )}
                                  </div>

                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {sub.planName || 'Subscription Plan'}
                                      </h3>
                                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border-red-500/40 flex items-center gap-1.5`}>
                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                        Payment Failed
                                      </span>
                                    </div>
                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      ID: <span className="font-mono">{sub.subscriptionId || 'N/A'}</span>
                                    </p>
                                  </div>
                                </div>

                                {/* Details grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-105 ${
                                    isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/80'
                                  }`}>
                                    <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      Plan Type
                                    </p>
                                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                      {sub.planType || 'N/A'}
                                    </p>
                                  </div>
                                  <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-105 ${
                                    isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/80'
                                  }`}>
                                    <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      Duration
                                    </p>
                                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                      {sub.duration || 'N/A'}
                                    </p>
                                  </div>
                                  <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-105 ${
                                    isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/80'
                                  }`}>
                                    <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      Start Date
                                    </p>
                                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                      {formatDate(sub.startDate)}
                                    </p>
                                  </div>
                                  <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-105 ${
                                    isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/80'
                                  }`}>
                                    <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      Amount Due
                                    </p>
                                    <p className={`text-sm font-semibold text-red-500`}>
                                      ₹{sub.pricing?.totalAmount || sub.price || 0}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Right section - Contact Support */}
                              <div className="flex flex-col items-end gap-4 lg:border-l-2 lg:pl-6 lg:min-w-[200px] border-gray-200/50">
                                <div className={`text-center lg:text-right w-full p-4 rounded-2xl transition-all duration-300 group-hover:scale-105 ${
                                  isDarkMode
                                    ? 'bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20'
                                    : 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-200'
                                }`}>
                                  <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Payment Status
                                  </p>
                                  <div className="flex items-center justify-center lg:justify-end gap-2">
                                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span className="text-lg font-bold text-red-500">Failed</span>
                                  </div>
                                </div>

                                {/* Contact Support Button */}
                                <button
                                  onClick={() => { setSelectedFailedSub(sub); setShowSupportModal(true); }}
                                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold hover:from-red-600 hover:to-rose-600 transition-all duration-300 hover:scale-105 shadow-lg shadow-red-500/25"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                  <span>Contact Support</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subscription History Section */}
              {cancelledSubscriptions.length > 0 && (
                <div id="my-journey-section" className="relative">
                  {/* Section Header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isDarkMode ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' : 'bg-gradient-to-br from-amber-50 to-orange-50'
                    }`}>
                      <svg className={`w-6 h-6 ${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className={`absolute inset-0 rounded-2xl ${isDarkMode ? 'bg-amber-500/10' : 'bg-amber-500/5'} blur-lg animate-pulse`}></div>
                    </div>
                    <div>
                      <h2 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">My Journey</span>
                      </h2>
                      <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Your subscription timeline & memories
                      </p>
                    </div>
                    <div className={`ml-auto px-4 py-2 rounded-2xl text-sm font-bold ${
                      isDarkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {cancelledSubscriptions.length} {cancelledSubscriptions.length === 1 ? 'plan' : 'plans'}
                    </div>
                  </div>

                  {/* Timeline Cards */}
                  <div className="relative space-y-6">
                    {/* Vertical timeline line */}
                    <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${isDarkMode ? 'bg-gradient-to-b from-amber-500/40 via-orange-500/20 to-transparent' : 'bg-gradient-to-b from-amber-300/40 via-orange-300/20 to-transparent'}`}></div>

                    {cancelledSubscriptions.map((sub, index) => {
                      const paymentStyles = getPaymentStatusStyles(sub.paymentStatus);
                      const planColors = {
                        daily: { gradient: 'from-green-500/10 to-emerald-500/10', icon: 'from-green-500 to-emerald-500', dot: 'bg-green-500' },
                        weekly: { gradient: 'from-blue-500/10 to-cyan-500/10', icon: 'from-blue-500 to-cyan-500', dot: 'bg-blue-500' },
                        monthly: { gradient: 'from-purple-500/10 to-pink-500/10', icon: 'from-purple-500 to-pink-500', dot: 'bg-purple-500' }
                      };
                      const colors = planColors[sub.planType] || planColors.daily;

                      return (
                        <div key={sub._id} className="relative pl-16 group">
                          {/* Timeline dot */}
                          <div className={`absolute left-4 top-6 w-4 h-4 rounded-full border-4 ${isDarkMode ? 'border-gray-900' : 'border-white'} ${colors.dot} z-10 group-hover:scale-125 transition-transform duration-300`}></div>

                          {/* Card */}
                          <div className={`relative rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
                            isDarkMode
                              ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 border border-gray-700/40 hover:border-gray-600/60'
                              : 'bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/80 hover:border-gray-300'
                          }`}>
                            {/* Animated glow on hover */}
                            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                            {/* Top gradient bar */}
                            <div className={`h-1 bg-gradient-to-r ${colors.icon}`}></div>

                            <div className="relative p-6">
                              <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                                {/* Left - Plan Info */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    {/* Plan icon */}
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors.icon} flex items-center justify-center shadow-lg`}>
                                      {sub.planType === 'daily' && (
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      )}
                                      {sub.planType === 'weekly' && (
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      )}
                                      {sub.planType === 'monthly' && (
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                      )}
                                    </div>
                                    <div>
                                      <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {sub.planName || 'Subscription Plan'}
                                      </h3>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r ${colors.gradient} ${
                                          isDarkMode ? 'text-gray-300 border border-gray-600/30' : 'text-gray-600 border border-gray-200'
                                        }`}>
                                          {sub.planType || 'N/A'}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                                          isDarkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-500 border border-red-200'
                                        }`}>
                                          Cancelled
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Details row */}
                                  <div className="flex flex-wrap items-center gap-4 ml-15">
                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/80'}`}>
                                      <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {formatDate(sub.startDate)} — {formatDate(sub.endDate)}
                                      </span>
                                    </div>
                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                                      sub.paymentStatus === 'paid' ? 'bg-green-500/10' : 'bg-yellow-500/10'
                                    }`}>
                                      <span>{paymentStyles.icon}</span>
                                      <span className={`text-sm font-semibold ${sub.paymentStatus === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {sub.paymentStatus?.charAt(0).toUpperCase() + sub.paymentStatus?.slice(1)}
                                      </span>
                                    </div>
                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/80'}`}>
                                      <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                        ₹{sub.pricing?.totalAmount || sub.price || 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right - Re-subscribe CTA (only if user has no active subscriptions) */}
                                {activeSubscriptions.length === 0 && (
                                  <button
                                    onClick={() => handleSubscribe(sub.planType)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all hover:scale-105 bg-gradient-to-r ${colors.icon} text-white shadow-lg hover:shadow-xl`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Subscribe Again
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* Cancel Confirmation Modal - Modern Glass UI */}
        {showCancelModal && selectedSub && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            {/* Glass backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setShowCancelModal(false)}></div>

            {/* Modal card */}
            <div className={`relative w-full max-w-md rounded-3xl border p-8 shadow-2xl overflow-hidden animate-[scaleIn_0.4s_ease-out] ${
              isDarkMode
                ? 'bg-gray-900/40 border-white/10 backdrop-blur-2xl'
                : 'bg-white/30 border-white/40 backdrop-blur-2xl'
            }`}>
              {/* Animated gradient glow */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-rose-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>

              <div className="relative text-center">
                {/* Warning icon */}
                <div className="relative mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-red-400/20 to-rose-500/20 border border-red-500/30 flex items-center justify-center animate-[popIn_0.5s_ease-out_0.2s_both]">
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Cancel Subscription?
                </h3>
                <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Are you sure you want to cancel your
                </p>
                <p className="text-sm mb-1">
                  <span className="font-bold bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent">{selectedSub.planName}</span>
                </p>
                <p className={`text-xs mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className={`flex-1 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                      isDarkMode
                        ? 'bg-white/10 text-gray-300 border border-white/10 hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30 hover:shadow-green-500/10'
                        : 'bg-white/40 text-gray-700 border border-white/50 hover:bg-green-500/20 hover:text-green-600 hover:border-green-500/30 hover:shadow-green-500/20'
                    }`}
                  >
                    Keep Plan
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    className="flex-1 px-4 py-3.5 rounded-2xl font-semibold bg-gradient-to-r from-red-500 to-rose-500 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/30 hover:from-red-600 hover:to-rose-600"
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Browse Plans Modal - Glass Effect */}
        {showPlansModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowPlansModal(false)}></div>
            <div className={`relative w-full max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-hide rounded-3xl p-6 md:p-8 ${
              isDarkMode ? 'bg-gray-900/80 border border-gray-700/50' : 'bg-white/80 border border-gray-200/50'
            } backdrop-blur-xl shadow-2xl`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Choose Your Plan
                  </h2>
                  <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Select the perfect milk delivery plan for your family
                  </p>
                </div>
                <button
                  onClick={() => setShowPlansModal(false)}
                  className={`p-2 rounded-xl transition-all ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['daily', 'weekly', 'monthly'].map((planType) => {
                  const plan = getPlanDetails(planType);
                  return (
                    <ModernPlanCard
                      key={planType}
                      name={plan.name}
                      price={plan.price}
                      duration={plan.duration}
                      description={plan.description}
                      features={plan.features}
                      color={plan.color}
                      icon={plan.icon}
                      badge={planType === 'monthly' ? 'BEST VALUE' : null}
                      badgeColor="from-purple-500 to-pink-500"
                      onSubscribe={() => handleSubscribe(planType)}
                    />
                  );
                })}
              </div>

              {/* Footer Note */}
              <div className="mt-8 text-center">
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  All plans include: Pause/Resume anytime • No cancellation fees • 24/7 support
                </p>
              </div>
            </div>
          </div>
        )}

        {subscriptionModal && selectedPlan && (

        <>

          {(() => {

            const planDetails = getPlanDetails(selectedPlan);

            return planDetails ? (



                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">



            {/* Animated Background Elements */}



            <div className="absolute inset-0 overflow-hidden pointer-events-none">



              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full blur-3xl animate-pulse"></div>



              <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-secondary-500/20 to-primary-500/20 rounded-full blur-3xl animate-pulse animation-delay-2"></div>



            </div>



            



            <div className={`relative max-w-md w-full rounded-3xl shadow-2xl transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] scale-100 opacity-100 overflow-hidden ${



              isDarkMode ? 'bg-gray-900/95 border border-gray-700/50 backdrop-blur-xl' : 'bg-white/95 border border-gray-200/50 backdrop-blur-xl'



            }`}>

             {/* Modal Glow Effect */}



              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-primary-500/10 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>



              



              {/* Modal Edge Glow */}



              <div className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-r from-primary-500/30 via-secondary-500/30 to-primary-500/30 opacity-20 pointer-events-none"></div>



            



            {/* Modal Header */}



            <div className="relative p-4 border-b border-gray-200/20 dark:border-gray-700/20">



              {/* Header Gradient Background */}



              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-secondary-500/5 to-primary-500/5 rounded-t-3xl"></div>



              



              <div className="relative flex items-center justify-between">



                <div className="flex items-center space-x-3">



                  {/* Animated Icon */}



                  <div className="relative">



                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center transform transition-transform duration-300 hover:scale-110">



                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />



                      </svg>



                    </div>



                    {/* Icon Glow */}



                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 to-secondary-500/30 rounded-xl blur-lg animate-pulse"></div>



                  </div>



                  



                  <div className="drop-shadow-[0_0_10px_rgba(56,189,248,0.7)]">



                    <h3 className={`text-2xl font-bold tracking-wide text-white`}>



                      Confirm Subscription



                    </h3>



                  </div>



                </div>



                



                <button



                  onClick={() => setSubscriptionModal(false)}



                  className={`group relative p-2 rounded-full transition-all duration-300 transform hover:scale-110 hover:rotate-90 ${



                    isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/50'



                  }`}



                >



                  <svg className={`w-5 h-5 transition-colors duration-300 ${



                    isDarkMode ? 'text-gray-400 group-hover:text-red-400' : 'text-gray-600 group-hover:text-red-500'



                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">



                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />



                  </svg>



                  {/* Button Glow */}



                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>



                </button>



              </div>



            </div>



            {/* Modal Body */}

            <div className="p-6 space-y-4">



                    {/* Plan Summary */}



                    <div className={`group relative p-4 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-lg transform hover:-translate-y-2 hover:scale-[1.02] ${

                      isDarkMode ? 'bg-gradient-to-br from-gray-800/50 to-gray-700/50 hover:from-gray-700/50 hover:to-gray-600/50' : 'bg-gradient-to-br from-gray-50 to-white hover:from-white hover:to-gray-50'

                    } border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>



                      {/* Card Gradient Overlay */}



                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-secondary-500/5 to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>



                      



                      <div className="relative flex items-center justify-between mb-1">



                        <div className="flex items-center space-x-2">



                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110">



                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />



                            </svg>



                          </div>



                          <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>



                            {planDetails.name}



                          </h4>



                        </div>



                        <div className="text-right">



                          <div className="relative">



                            {/* Price Glow Background */}



                            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-lg blur-lg -z-10"></div>



                            {/* Price Text */}



                            <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 bg-clip-text text-transparent drop-shadow-lg">



                              ₹{planDetails.price}



                            </div>



                          </div>



                          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mt-1`}>



                            per {planDetails.duration}



                          </div>



                        </div>



                      </div>



                      



                      {/* Plan Features */}



                      <div className="relative space-y-1 mt-2">



                        {planDetails.features.map((feature, index) => (



                          <div key={index} className="flex items-center transform transition-all duration-300 hover:translate-x-1">



                            <div className="relative">



                              <svg className="w-3 h-3 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />



                              </svg>



                              {/* Checkmark Glow */}



                              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-sm animate-pulse"></div>



                            </div>



                            <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>



                              {feature}



                            </span>



                          </div>



                        ))}



                      </div>



                    </div>



                    {/* Important Info */}



                    <div className={`group relative p-4 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-lg transform hover:-translate-y-2 hover:scale-[1.02] ${

                      isDarkMode ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/40 hover:from-blue-800/40 hover:to-blue-700/50 border border-blue-800/50' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100/50 hover:to-blue-200/50 border border-blue-200'

                    }`}>



                      {/* Info Gradient Overlay */}



                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>



                      



                      <div className="relative flex items-start">



                        <div className="relative">



                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">



                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />



                            </svg>



                          </div>



                          {/* Icon Glow */}



                          <div className="absolute inset-0 bg-blue-500/30 rounded-lg blur-lg animate-pulse"></div>



                        </div>



                        <div className="ml-2">



                          <h5 className={`font-semibold mb-1 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent`}>



                            Important Information



                          </h5>



                          <ul className={`text-xs space-y-0.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>



                            <li className="flex items-center transform transition-all duration-300 hover:translate-x-1">



                              <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>



                              Subscription starts immediately



                            </li>



                            <li className="flex items-center transform transition-all duration-300 hover:translate-x-1">



                              <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>



                              You can pause/resume anytime



                            </li>



                            <li className="flex items-center transform transition-all duration-300 hover:translate-x-1">



                              <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>



                              No cancellation fees



                            </li>



                            <li className="flex items-center transform transition-all duration-300 hover:translate-x-1">



                              <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>



                              Free delivery included



                            </li>



                          </ul>



                        </div>



                      </div>



                    </div>



                    {/* Payment Info */}



                    <div className={`group relative p-4 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-lg transform hover:-translate-y-2 hover:scale-[1.02] ${

                      isDarkMode ? 'bg-gradient-to-br from-yellow-900/20 to-amber-900/20 hover:from-yellow-800/30 hover:to-amber-800/30 border border-yellow-800/30' : 'bg-gradient-to-br from-yellow-50 to-amber-50 hover:from-yellow-100/50 hover:to-amber-100/50 border border-yellow-200/50'

                    }`}>



                      {/* Payment Gradient Overlay */}



                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-amber-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>



                      



                      <div className="relative flex items-center">



                        <div className="relative">



                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110">



                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />



                            </svg>



                          </div>



                          {/* Icon Glow */}



                          <div className="absolute inset-0 bg-yellow-500/30 rounded-lg blur-lg animate-pulse"></div>



                        </div>



                        <div className="ml-2">



                          <h5 className={`font-semibold text-sm bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent`}>



                            Payment Method



                          </h5>



                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>



                            Auto-debit from your registered payment method



                          </p>



                        </div>



                      </div>



                    </div>



                  </div>



            {/* Action Buttons */}

            <div className="relative p-4 border-t border-gray-200/20 dark:border-gray-700/20 mt-4">

              <div className="flex gap-3">

                <button

                  onClick={() => setSubscriptionModal(false)}

                  className={`group relative flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-500 transform hover:scale-105 hover:-translate-y-0.5 overflow-hidden ${

                    isDarkMode 

                      ? 'bg-gray-700/80 hover:bg-gray-600/80 text-white border border-gray-600/50' 

                      : 'bg-gray-100/80 hover:bg-gray-200/80 text-gray-800 border border-gray-300/50'

                  }`}

                >

                  <span className="relative flex items-center justify-center">

                    <svg className="w-4 h-4 mr-2 transform transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

                    </svg>

                    Cancel

                  </span>

                  {/* Button Glow */}

                  <div className="absolute inset-0 bg-gradient-to-r from-gray-500/20 to-gray-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                </button>



                <button

                  onClick={createSubscriptionHandler}

                  disabled={loadingSubscription}

                  className="group relative flex-1 py-3 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-500 transform hover:scale-105 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"

                >

                  {loadingSubscription ? (

                    <span className="relative flex items-center justify-center">

                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">

                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>

                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>

                      </svg>

                      <span className="relative">Processing...</span>

                    </span>

                  ) : (

                    <span className="relative flex items-center justify-center">

                      <svg className="w-4 h-4 mr-2 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />

                      </svg>

                      Confirm Subscription

                    </span>

                  )}

                  {/* Button Glow */}

                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/30 via-secondary-500/30 to-primary-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                </button>

              </div>

            </div>



          </div>

          </div>



            ) : null

          })()}

        </>
      )}

      </div>

      {/* QR Code Modal */}
      {qrPlan && (
        <SimpleQRCode
          plan={qrPlan}
          onClose={() => setQrPlan(null)}
        />
      )}

      {/* Cancel Confirmed Glass Modal */}
      {showCancelConfirmed && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          {/* Glass backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl"></div>

          {/* Modal card */}
          <div className={`relative w-full max-w-sm rounded-3xl border p-8 text-center shadow-2xl overflow-hidden animate-[scaleIn_0.4s_ease-out] ${
            isDarkMode
              ? 'bg-gray-900/40 border-white/10 backdrop-blur-2xl'
              : 'bg-white/30 border-white/40 backdrop-blur-2xl'
          }`}>

            {/* Crying sad face */}
            <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center animate-[popIn_0.5s_ease-out_0.2s_both]">
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                {/* Background circle - slate blue for sadness */}
                <circle cx="12" cy="12" r="11" fill={isDarkMode ? '#1e293b' : '#e2e8f0'} opacity="0.6" />
                <circle cx="12" cy="12" r="11" fill="url(#sadGrad)" opacity="0.4" />
                <defs>
                  <linearGradient id="sadGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                </defs>
                {/* Sad face mouth */}
                <path d="M9.172 16.172a4 4 0 015.656 0" stroke={isDarkMode ? '#c7d2fe' : '#6366f1'} strokeWidth={1.5} strokeLinecap="round" />
                {/* Eyes */}
                <circle cx="9" cy="9.5" r="1.5" fill={isDarkMode ? '#c7d2fe' : '#6366f1'} />
                <circle cx="15" cy="9.5" r="1.5" fill={isDarkMode ? '#c7d2fe' : '#6366f1'} />
                {/* Left tear drop - drips one by one from outer side */}
                <ellipse cx="7.5" cy="11" rx="0.8" ry="1.2" fill="#93c5fd" opacity="0">
                  <animate attributeName="opacity" values="0;0;1;1;0;0;0;0;0;0" dur="3s" repeatCount="indefinite" />
                  <animateTransform attributeName="transform" type="translate" values="0,0;0,0;0,0;0,4;0,6;0,6;0,6;0,6;0,6;0,6" dur="3s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="7.5" cy="11" rx="0.6" ry="0.9" fill="#93c5fd" opacity="0">
                  <animate attributeName="opacity" values="0;0;0;0;0;0;0;1;1;0" dur="3s" repeatCount="indefinite" />
                  <animateTransform attributeName="transform" type="translate" values="0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,4;0,6" dur="3s" repeatCount="indefinite" />
                </ellipse>
                {/* Right tear drop - drips one by one from outer side */}
                <ellipse cx="16.5" cy="11" rx="0.8" ry="1.2" fill="#93c5fd" opacity="0">
                  <animate attributeName="opacity" values="0;0;0;1;1;0;0;0;0;0" dur="3s" repeatCount="indefinite" />
                  <animateTransform attributeName="transform" type="translate" values="0,0;0,0;0,0;0,0;0,4;0,6;0,6;0,6;0,6;0,6" dur="3s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="16.5" cy="11" rx="0.6" ry="0.9" fill="#93c5fd" opacity="0">
                  <animate attributeName="opacity" values="0;0;0;0;0;0;0;0;1;0" dur="3s" repeatCount="indefinite" />
                  <animateTransform attributeName="transform" type="translate" values="0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,5;0,5" dur="3s" repeatCount="indefinite" />
                </ellipse>
              </svg>
            </div>

            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Sorry to See You Go!
            </h2>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Your subscription has been cancelled.
            </p>
            <p className={`text-xs mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              You can resubscribe anytime from the plans page.
            </p>

            {/* Progress bar */}
            <div className="relative h-1.5 w-full rounded-full overflow-hidden bg-gray-200/20">
              <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-400 to-rose-500 animate-[shrinkWidth_6s_linear_forwards]"></div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmed Glass Modal */}
      {showPaymentConfirmed && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          {/* Glass backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl"></div>

          {/* Modal card */}
          <div className={`relative w-full max-w-sm rounded-3xl border p-8 text-center shadow-2xl overflow-hidden animate-[scaleIn_0.4s_ease-out] ${
            isDarkMode
              ? 'bg-gray-900/40 border-white/10 backdrop-blur-2xl'
              : 'bg-white/30 border-white/40 backdrop-blur-2xl'
          }`}>
            
            {/* Thumbs up icon */}
            <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center animate-[popIn_0.5s_ease-out_0.2s_both,happyPulse_1.2s_ease-in-out_0.7s_infinite]">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30`}>
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 20h2V9H2v11zm20-9a2 2 0 00-2-2h-6.31l.95-4.57.03-.32a1.49 1.49 0 00-.44-1.06L13.17 2 7.59 7.59C7.22 7.95 7 8.45 7 9v10a2 2 0 002 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                </svg>
              </div>
            </div>

            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Payment Confirmed!
            </h2>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Your subscription is now active. Refreshing your subscriptions...
            </p>

            {/* Progress bar */}
            <div className="relative h-1.5 w-full rounded-full overflow-hidden bg-gray-200/20">
              <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-[shrinkWidth_6s_linear_forwards]"></div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Failed Glass Modal */}
      {showPaymentFailed && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          {/* Glass backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl"></div>

          {/* Modal card */}
          <div className={`relative w-full max-w-sm rounded-3xl border p-8 text-center shadow-2xl overflow-hidden animate-[scaleIn_0.4s_ease-out] ${
            isDarkMode
              ? 'bg-gray-900/40 border-white/10 backdrop-blur-2xl'
              : 'bg-white/30 border-white/40 backdrop-blur-2xl'
          }`}>

            {/* Cross circle */}
            <div className="relative mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/30 animate-[popIn_0.5s_ease-out_0.2s_both]">
              <svg className="w-12 h-12 text-white animate-[crossDraw_0.4s_ease-out_0.5s_both]" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Payment Verification Failed!
            </h2>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Your subscription payment could not be verified. Redirecting to failed payments...
            </p>

            {/* Progress bar */}
            <div className="relative h-1.5 w-full rounded-full overflow-hidden bg-gray-200/20">
              <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-400 to-rose-500 animate-[shrinkWidth_6s_linear_forwards]"></div>
            </div>
          </div>
        </div>
      )}

      {/* Support Contact Modal */}
      {showSupportModal && selectedFailedSub && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowSupportModal(false)}></div>
          <div className={`relative w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl transform transition-all duration-500 ease-out scale-100 ${
            isDarkMode
              ? 'bg-gray-900/90 border border-gray-700/50 backdrop-blur-xl'
              : 'bg-white/90 border border-gray-200/50 backdrop-blur-xl'
          }`}>
            {/* Close button */}
            <button
              onClick={() => setShowSupportModal(false)}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                isDarkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                isDarkMode
                  ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20'
                  : 'bg-gradient-to-br from-red-50 to-rose-50'
              }`}>
                <svg className={`w-7 h-7 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Contact Support
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  We're here to help with your payment issue
                </p>
              </div>
            </div>

            {/* Subscription Details */}
            <div className={`rounded-2xl p-4 mb-6 ${
              isDarkMode
                ? 'bg-gray-800/50 border border-gray-700/50'
                : 'bg-gray-50 border border-gray-200/50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Plan</span>
                <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedFailedSub.planName || 'Subscription Plan'}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Subscription ID</span>
                <span className="text-sm font-mono">{selectedFailedSub.subscriptionId || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Amount Due</span>
                <span className="text-sm font-bold text-red-500">₹{selectedFailedSub.pricing?.totalAmount || selectedFailedSub.price || 0}</span>
              </div>
            </div>

            {/* Contact Options */}
            <div className="space-y-4 mb-6">
              {/* WhatsApp */}
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                  isDarkMode
                    ? 'bg-green-500/10 border border-green-500/20 hover:bg-green-500/20'
                    : 'bg-green-50 border border-green-200 hover:bg-green-100'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.004 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>WhatsApp Support</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chat with us directly</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>

              {/* Phone */}
              <a
                href="tel:+919876543210"
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                  isDarkMode
                    ? 'bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20'
                    : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Call Support</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>+91 98765 43210</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>

              {/* Email */}
              <a
                href="mailto:support@pinqoza.com"
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                  isDarkMode
                    ? 'bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20'
                    : 'bg-amber-50 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email Support</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>support@pinqoza.com</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Message */}
            <div className={`rounded-2xl p-4 ${
              isDarkMode
                ? 'bg-gray-800/50 border border-gray-700/50'
                : 'bg-gray-50 border border-gray-200/50'
            }`}>
              <p className={`text-sm text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Our support team is available <span className="font-semibold text-green-500">24/7</span> to assist you with your payment issues
              </p>
            </div>
          </div>
        </div>
      )}

      <DeliveryScheduleModal
        open={Boolean(deliveryModalSub)}
        subscription={deliveryModalSub}
        isDarkMode={isDarkMode}
        onClose={() => setDeliveryModalSub(null)}
        onUpdated={() => fetchSubscriptions(true)}
      />

    </div>

  );
}

export default Subscriptions;
