import React, { useMemo, useState, useEffect, useRef } from 'react';

const STATUS_OPTIONS = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_OPTIONS = ['pending', 'paid', 'failed', 'refunded'];

// Get gradient colors for fallback background
const getCategoryGradient = (category, isDarkMode) => {
  const gradients = {
    milk: isDarkMode ? 'from-blue-800 to-blue-600' : 'from-blue-200 to-blue-400',
    ghee: isDarkMode ? 'from-amber-800 to-amber-600' : 'from-amber-200 to-amber-400',
    cheese: isDarkMode ? 'from-yellow-800 to-yellow-600' : 'from-yellow-200 to-yellow-400',
    butter: isDarkMode ? 'from-orange-800 to-orange-600' : 'from-orange-200 to-orange-400',
    curd: isDarkMode ? 'from-green-800 to-green-600' : 'from-green-200 to-green-400',
    paneer: isDarkMode ? 'from-purple-800 to-purple-600' : 'from-purple-200 to-purple-400',
    cream: isDarkMode ? 'from-pink-800 to-pink-600' : 'from-pink-200 to-pink-400',
    yogurt: isDarkMode ? 'from-teal-800 to-teal-600' : 'from-teal-200 to-teal-400',
    lassi: isDarkMode ? 'from-cyan-800 to-cyan-600' : 'from-cyan-200 to-cyan-400',
    buttermilk: isDarkMode ? 'from-lime-800 to-lime-600' : 'from-lime-200 to-lime-400',
    sweets: isDarkMode ? 'from-rose-800 to-pink-600' : 'from-rose-200 to-pink-300',
    cake: isDarkMode ? 'from-fuchsia-800 to-pink-600' : 'from-fuchsia-200 to-pink-400'
  };
  return gradients[category] || (isDarkMode ? 'from-gray-700 to-gray-500' : 'from-gray-200 to-gray-400');
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

const fmtDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
};

// Custom Status Dropdown Component with Glassmorphism
const StatusDropdown = ({ value, onChange, options, isDarkMode, color = 'blue' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getStatusStyles = () => {
    const styles = {
      blue: isDarkMode ? 'bg-blue-500/20 border-blue-400/50 text-blue-300' : 'bg-blue-500/15 border-blue-400/40 text-blue-600',
      green: isDarkMode ? 'bg-green-500/20 border-green-400/50 text-green-300' : 'bg-green-500/15 border-green-400/40 text-green-600',
      orange: isDarkMode ? 'bg-orange-500/20 border-orange-400/50 text-orange-300' : 'bg-orange-500/15 border-orange-400/40 text-orange-600',
      purple: isDarkMode ? 'bg-purple-500/20 border-purple-400/50 text-purple-300' : 'bg-purple-500/15 border-purple-400/40 text-purple-600',
      red: isDarkMode ? 'bg-red-500/20 border-red-400/50 text-red-300' : 'bg-red-500/15 border-red-400/40 text-red-600'
    };
    return styles[color] || styles.blue;
  };

  return (
    <div className="relative shrink-0 w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-sm font-semibold rounded-lg px-3 py-2 pr-8 border-2 backdrop-blur-xl shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] flex items-center justify-between ${getStatusStyles()}`}
      >
        <span className="truncate capitalize">{value}</span>
        <svg 
          className={`w-3.5 h-3.5 opacity-70 absolute right-2 top-1/2 -translate-y-1/2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div 
          className={`absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-50 ${isDarkMode ? 'bg-gray-900/90 border border-gray-600/50' : 'bg-white/90 border border-gray-300/50'} backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]`}
          style={{
            animation: 'dropdownSmooth 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            WebkitBackdropFilter: 'blur(20px)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {options.map((option, index) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm font-semibold capitalize transition-all duration-150 cursor-pointer ${value === option ? (isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50') : ''} ${isDarkMode ? 'text-gray-200 hover:bg-gray-700/30' : 'text-gray-700 hover:bg-gray-100/50'}`}
              style={{
                animationDelay: `${index * 40}ms`,
                animation: 'optionSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1) backwards'
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      
      <style>{`
        @keyframes dropdownSmooth {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes optionSlide {
          0% {
            opacity: 0;
            transform: translateX(-10px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default function OrderDetailsModal({
  open,
  onClose,
  order,
  mode, // 'customer' | 'admin'
  onUpdateStatus,
  onUpdatePayment,
  onUpdateTracking,
  onDeleteOrder
}) {
  const [trackingForm, setTrackingForm] = useState({
    trackingNumber: '',
    currentLocation: '',
    status: '',
    location: '',
    description: '',
    estimatedDelivery: ''
  });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [errorPopupOpen, setErrorPopupOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const items = useMemo(() => {
    if (!order) return [];
    if (mode === 'admin') return order.items || [];
    return order.orderItems || [];
  }, [mode, order]);

  if (!open || !order) return null;

  const orderId = mode === 'admin' ? order.orderId || order._id : order._id;
  const userLabel =
    mode === 'customer'
      ? (order.user?.email || order.user?.name || order.user?._id || '-')
      : (order.userId || '-');

  const address = order.shippingAddress || {};
  const tracking = order.tracking || {};
  const trackingUpdates = tracking.updates || [];

  const isDarkMode = document.documentElement.classList.contains('dark');
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-3xl rounded-2xl border-2 overflow-hidden animate-in fade-in zoom-in-95 duration-300" 
           style={{ 
             background: isDarkMode ? 'rgba(17, 24, 39, 0.85)' : 'rgba(255, 255, 255, 0.85)',
             backdropFilter: 'blur(24px)',
             WebkitBackdropFilter: 'blur(24px)',
             borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.6)',
             boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
           }}>
        <div className="flex items-start justify-between gap-4 p-5 border-b" style={{ borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.4)' }}>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Order Details
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
              <span className="font-medium text-gray-900 dark:text-gray-100">Order:</span> {orderId}
              <span className="mx-2">•</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">User:</span> {userLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onDeleteOrder && (
              <button
                onClick={() => {
                  const status = order.orderStatus?.toLowerCase();
                  if (status !== 'delivered' && status !== 'cancelled') {
                    setErrorMessage('Only delivered or cancelled orders can be deleted.');
                    setErrorPopupOpen(true);
                  } else {
                    setConfirmDeleteOpen(true);
                  }
                }}
                className="px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 backdrop-blur-md border-2 shadow-lg flex items-center gap-1.5 text-white"
                style={{ 
                  background: 'rgba(239, 68, 68, 0.25)', 
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.4)';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.25)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
            <button 
              onClick={onClose} 
              className="px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 backdrop-blur-md border-2 shadow-lg flex items-center gap-1.5"
              style={{ 
                background: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(156, 163, 175, 0.2)', 
                borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(156, 163, 175, 0.4)',
                color: isDarkMode ? '#e5e7eb' : '#374151',
                boxShadow: isDarkMode ? '0 4px 15px rgba(0,0,0,0.3)' : '0 4px 15px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.background = isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(156, 163, 175, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.background = isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(156, 163, 175, 0.2)';
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
        </div>

        {/* Confirm Delete Modal (glass) */}
        {confirmDeleteOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
            <div className="w-full max-w-md rounded-2xl border-2 overflow-hidden animate-in fade-in zoom-in-95 duration-300"
                 style={{ 
                   background: isDarkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                   backdropFilter: 'blur(24px)',
                   WebkitBackdropFilter: 'blur(24px)',
                   borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.4)',
                   boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)'
                 }}>
              <div className="p-5 border-b" style={{ borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)' }}>
                <h4 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Delete order?
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-200 mt-2">
                  This will permanently delete the order from the database. This action cannot be undone.
                </p>
              </div>
              <div className="p-5 flex items-center justify-end gap-2">
                <button
                  className="px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 backdrop-blur-md border-2 shadow-lg"
                  style={{ 
                    background: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(156, 163, 175, 0.2)', 
                    borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(156, 163, 175, 0.4)',
                    color: isDarkMode ? '#e5e7eb' : '#374151'
                  }}
                  disabled={deleteBusy}
                  onClick={() => setConfirmDeleteOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 backdrop-blur-md border-2 shadow-lg text-white disabled:opacity-60"
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.3)', 
                    borderColor: 'rgba(239, 68, 68, 0.5)',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                  }}
                  disabled={deleteBusy}
                  onClick={async () => {
                    try {
                      setDeleteBusy(true);
                      await onDeleteOrder?.(order, mode);
                      setConfirmDeleteOpen(false);
                    } catch (e) {
                      // Error is already surfaced by parent handler; keep modal open.
                    } finally {
                      setDeleteBusy(false);
                    }
                  }}
                >
                  {deleteBusy ? 'Deleting...' : 'Confirm delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Popup for non-deletable orders (glass) */}
        {errorPopupOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
            <div className="w-full max-w-md rounded-2xl border-2 overflow-hidden animate-in fade-in zoom-in-95 duration-300"
                 style={{ 
                   background: isDarkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                   backdropFilter: 'blur(24px)',
                   WebkitBackdropFilter: 'blur(24px)',
                   borderColor: isDarkMode ? 'rgba(251, 146, 60, 0.5)' : 'rgba(251, 146, 60, 0.4)',
                   boxShadow: '0 25px 50px -12px rgba(251, 146, 60, 0.25)'
                 }}>
              <div className="p-5 border-b" style={{ borderColor: isDarkMode ? 'rgba(251, 146, 60, 0.3)' : 'rgba(251, 146, 60, 0.2)' }}>
                <h4 className="text-lg font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Cannot Delete Order
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-200 mt-2">
                  {errorMessage}
                </p>
              </div>
              <div className="p-5 flex items-center justify-end gap-2">
                <button
                  className="px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 backdrop-blur-md border-2 shadow-lg text-white"
                  style={{ 
                    background: 'rgba(251, 146, 60, 0.3)', 
                    borderColor: 'rgba(251, 146, 60, 0.5)',
                    boxShadow: '0 4px 15px rgba(251, 146, 60, 0.3)'
                  }}
                  onClick={() => setErrorPopupOpen(false)}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-h-[75vh] overflow-y-auto scrollbar-hide">
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-4 border-2 backdrop-blur-md" style={{ background: isDarkMode ? 'rgba(31, 41, 55, 0.6)' : 'rgba(249, 250, 251, 0.7)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.5)' }}>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Summary
              </h4>
              <div className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Status:</span> {order.orderStatus}
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Payment:</span>{' '}
                  {mode === 'admin' ? (order.isPaid ? 'paid' : 'pending') : order.paymentStatus}
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Total:</span> ₹{order.totalPrice}
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Items:</span> {order.totalItems}
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Created:</span> {fmtDateTime(order.createdAt)}
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Delivered:</span> {fmtDateTime(order.deliveredAt)}
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4 border-2 backdrop-blur-md" style={{ background: isDarkMode ? 'rgba(31, 41, 55, 0.6)' : 'rgba(249, 250, 251, 0.7)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.5)' }}>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Shipping
              </h4>
              <div className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <div>{address.street || '-'}</div>
                <div>
                  {[address.city, address.state, address.pincode].filter(Boolean).join(', ') || '-'}
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Phone:</span> {address.phone || '-'}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-xl p-4 border-2 backdrop-blur-md" style={{ background: isDarkMode ? 'rgba(31, 41, 55, 0.6)' : 'rgba(249, 250, 251, 0.7)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.5)' }}>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Items
              </h4>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 transition-all duration-200 hover:scale-[1.01]"
                    style={{
                      background: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(255, 255, 255, 0.6)',
                      borderColor: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.25)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: isDarkMode ? '0 4px 12px rgba(139, 92, 246, 0.1)' : '0 4px 12px rgba(139, 92, 246, 0.08)'
                    }}
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      {/* Product Image */}
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                        {it.image ? (
                          <img 
                            src={it.image} 
                            alt={it.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        
                        {/* Fallback Image based on category */}
                        <div 
                          className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getCategoryGradient(it.category || it.product?.category || deriveCategoryFromName(it.name), isDarkMode)} ${it.image ? 'hidden' : 'flex'}`}
                        >
                          <span className="text-lg">{getCategoryEmoji(it.category || it.product?.category || deriveCategoryFromName(it.name))}</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{it.name || '-'}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          ₹{it.price} • Qty {it.quantity} {it.unit || ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-bold px-3 py-1 rounded-lg" style={{ 
                      background: isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)',
                      color: isDarkMode ? '#c4b5fd' : '#7c3aed'
                    }}>
                      ₹{(Number(it.price || 0) * Number(it.quantity || 0)).toFixed(0)}
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="text-sm text-gray-600 dark:text-gray-300 text-center py-4">No items</div>}
              </div>
            </div>

            <div className="rounded-xl p-4 border-2 backdrop-blur-md" style={{ background: isDarkMode ? 'rgba(31, 41, 55, 0.6)' : 'rgba(249, 250, 251, 0.7)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.5)' }}>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Actions
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Order status</label>
                  <StatusDropdown 
                    value={order.orderStatus}
                    onChange={(status) => onUpdateStatus?.(order, status)}
                    options={STATUS_OPTIONS}
                    isDarkMode={isDarkMode}
                    color="blue"
                  />
                </div>

                {mode === 'customer' && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Payment status</label>
                    <StatusDropdown 
                      value={order.paymentStatus || 'pending'}
                      onChange={(status) => onUpdatePayment?.(order, status)}
                      options={PAYMENT_OPTIONS}
                      isDarkMode={isDarkMode}
                      color="green"
                    />
                  </div>
                )}

                {mode === 'admin' && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Paid</label>
                    <StatusDropdown 
                      value={order.isPaid ? 'paid' : 'pending'}
                      onChange={(status) => onUpdatePayment?.(order, status)}
                      options={['pending', 'paid']}
                      isDarkMode={isDarkMode}
                      color="purple"
                    />
                  </div>
                )}
              </div>
            </div>

            {mode === 'customer' && (
              <div className="rounded-xl p-4 border-2 backdrop-blur-md" style={{ background: isDarkMode ? 'rgba(31, 41, 55, 0.6)' : 'rgba(249, 250, 251, 0.7)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.5)' }}>
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.806-.984A1 1 0 0020 7m-6 13V7" />
                  </svg>
                  Tracking
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Tracking number</label>
                      <input
                        className="w-full rounded-lg border-2 px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                        style={{
                          background: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.6)',
                          borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.5)',
                          color: isDarkMode ? '#e5e7eb' : '#374151',
                          backdropFilter: 'blur(8px)'
                        }}
                        value={trackingForm.trackingNumber}
                        onChange={(e) => setTrackingForm((p) => ({ ...p, trackingNumber: e.target.value }))}
                        placeholder={tracking.trackingNumber || ''}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Current location</label>
                      <input
                        className="w-full rounded-lg border-2 px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                        style={{
                          background: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.6)',
                          borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.5)',
                          color: isDarkMode ? '#e5e7eb' : '#374151',
                          backdropFilter: 'blur(8px)'
                        }}
                        value={trackingForm.currentLocation}
                        onChange={(e) => setTrackingForm((p) => ({ ...p, currentLocation: e.target.value }))}
                        placeholder={tracking.currentLocation || ''}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Update status</label>
                      <input
                        className="w-full rounded-lg border-2 px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                        style={{
                          background: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.6)',
                          borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.5)',
                          color: isDarkMode ? '#e5e7eb' : '#374151',
                          backdropFilter: 'blur(8px)'
                        }}
                        value={trackingForm.status}
                        onChange={(e) => setTrackingForm((p) => ({ ...p, status: e.target.value }))}
                        placeholder="shipped / in transit / out for delivery..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Update location</label>
                      <input
                        className="w-full rounded-lg border-2 px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                        style={{
                          background: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.6)',
                          borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.5)',
                          color: isDarkMode ? '#e5e7eb' : '#374151',
                          backdropFilter: 'blur(8px)'
                        }}
                        value={trackingForm.location}
                        onChange={(e) => setTrackingForm((p) => ({ ...p, location: e.target.value }))}
                        placeholder="Nagpur / Hub..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Update note</label>
                    <input
                      className="w-full rounded-lg border-2 px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                      style={{
                        background: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.6)',
                        borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.5)',
                        color: isDarkMode ? '#e5e7eb' : '#374151',
                        backdropFilter: 'blur(8px)'
                      }}
                      value={trackingForm.description}
                      onChange={(e) => setTrackingForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Package handed to courier..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Estimated delivery</label>
                    <input
                      className="w-full rounded-lg border-2 px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                      style={{
                        background: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.6)',
                        borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.5)',
                        color: isDarkMode ? '#e5e7eb' : '#374151',
                        backdropFilter: 'blur(8px)'
                      }}
                      type="datetime-local"
                      value={trackingForm.estimatedDelivery}
                      onChange={(e) => setTrackingForm((p) => ({ ...p, estimatedDelivery: e.target.value }))}
                    />
                  </div>

                  <button
                    className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] backdrop-blur-md border-2 shadow-lg flex items-center justify-center gap-2"
                    style={{ 
                      background: isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)', 
                      borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.4)',
                      color: isDarkMode ? '#93c5fd' : '#2563eb',
                      boxShadow: isDarkMode ? '0 4px 15px rgba(59, 130, 246, 0.3)' : '0 4px 15px rgba(59, 130, 246, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.02)';
                      e.target.style.background = isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.background = isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)';
                    }}
                    onClick={() => {
                      onUpdateTracking?.(order, trackingForm);
                      setTrackingForm({
                        trackingNumber: '',
                        currentLocation: '',
                        status: '',
                        location: '',
                        description: '',
                        estimatedDelivery: ''
                      });
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save tracking update
                  </button>

                  <div className="mt-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Timeline</div>
                    <div className="space-y-2">
                      {trackingUpdates
                        .slice()
                        .reverse()
                        .map((u, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border-2 px-3 py-2"
                            style={{
                              background: isDarkMode ? 'rgba(31, 41, 55, 0.4)' : 'rgba(255, 255, 255, 0.5)',
                              borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.4)',
                              backdropFilter: 'blur(8px)'
                            }}
                          >
                            <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {fmtDateTime(u.timestamp)}
                            </div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                              <span className="font-semibold" style={{ color: isDarkMode ? '#60a5fa' : '#2563eb' }}>{u.status}</span>
                              {u.location ? ` • ${u.location}` : ''}
                            </div>
                            {u.description && <div className="text-sm text-gray-700 dark:text-gray-200 mt-1">{u.description}</div>}
                          </div>
                        ))}
                      {trackingUpdates.length === 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-300">No tracking updates</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

