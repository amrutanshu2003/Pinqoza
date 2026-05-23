import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  getAdminOrders,
  getAdminCustomerOrders,
  getAdminProducts,
  getAdminUsers,
  getPendingPayments,
  updateAdminOrder,
  deleteAdminOrder,
  deleteAdminCustomerOrder,
  updateAdminCustomerOrderStatus,
  updateAdminCustomerOrderTracking,
  adminLogin,
  verifyAdminGateAccess,
  updateAdminUserRole,
  updateAdminUserDeleted,
  adminLogout,
  updateAdminProductImage,
  removeAdminProductImage,
  resetAdminProductImagePlaceholder,
  seedOwnCatalog,
  importProductsCsv,
  downloadProductsCsvTemplate,
  getAdminSubscriptions,
  getAdminPendingSubscriptions,
  verifySubscriptionPayment,
  rejectSubscription,
  updateAdminSubscription
} from '../services/api';
import OrderDetailsModal from '../components/admin/OrderDetailsModal';
import AdminPaymentDashboard from '../components/admin/AdminPaymentDashboard';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import ADMIN_PATH from '../config/adminPath';
// Direct import to avoid bundling issues
const checkIsAdminAuthenticated = () => {
  const adminToken = localStorage.getItem('adminToken');
  return !!adminToken;
};

// Auto logout configuration
const AUTO_LOGOUT_OPTIONS = [
  { key: '15s', label: '15 sec', ms: 15000 },
  { key: '30s', label: '30 sec', ms: 30000 },
  { key: '1m', label: '1 min', ms: 60000 },
  { key: '3m', label: '3 min', ms: 180000 },
  { key: '5m', label: '5 min', ms: 300000 },
  { key: '15m', label: '15 min', ms: 900000 },
  { key: '30m', label: '30 min', ms: 1800000 },
  { key: '1h', label: '1 hr', ms: 3600000 },
  { key: '2h', label: '2 hrs', ms: 7200000 },
  { key: '3h', label: '3 hrs', ms: 10800000 },
  { key: '5h', label: '5 hrs', ms: 18000000 },
  { key: 'off', label: 'Off', ms: null }
];

// ===== Status Dropdown Component with smooth animation =====
const StatusDropdown = ({ value, onChange, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const statusOptions = [
    { value: 'processing', label: '⚙️ Processing', color: 'blue' },
    { value: 'confirmed', label: '✅ Confirmed', color: 'indigo' },
    { value: 'shipped', label: '🚚 Shipped', color: 'purple' },
    { value: 'delivered', label: '📦 Delivered', color: 'green' },
    { value: 'cancelled', label: '❌ Cancelled', color: 'red' }
  ];

  const getStatusStyles = (status) => {
    const styles = {
      blue: isDarkMode ? 'bg-blue-500/20 border-blue-400/50 text-blue-300' : 'bg-blue-500/15 border-blue-400/40 text-blue-600',
      indigo: isDarkMode ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-300' : 'bg-indigo-500/15 border-indigo-400/40 text-indigo-600',
      purple: isDarkMode ? 'bg-purple-500/20 border-purple-400/50 text-purple-300' : 'bg-purple-500/15 border-purple-400/40 text-purple-600',
      green: isDarkMode ? 'bg-green-500/20 border-green-400/50 text-green-300' : 'bg-green-500/15 border-green-400/40 text-green-600',
      red: isDarkMode ? 'bg-red-500/20 border-red-400/50 text-red-300' : 'bg-red-500/15 border-red-400/40 text-red-600'
    };
    return styles[statusOptions.find(opt => opt.value === value)?.color || 'blue'];
  };

  const getOptionStyles = (option) => {
    const baseStyles = 'w-full text-left px-2 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer';
    const hoverStyles = {
      blue: isDarkMode ? 'hover:bg-blue-500/30 text-blue-300' : 'hover:bg-blue-500/20 text-blue-700',
      indigo: isDarkMode ? 'hover:bg-indigo-500/30 text-indigo-300' : 'hover:bg-indigo-500/20 text-indigo-700',
      purple: isDarkMode ? 'hover:bg-purple-500/30 text-purple-300' : 'hover:bg-purple-500/20 text-purple-700',
      green: isDarkMode ? 'hover:bg-green-500/30 text-green-300' : 'hover:bg-green-500/20 text-green-700',
      red: isDarkMode ? 'hover:bg-red-500/30 text-red-300' : 'hover:bg-red-500/20 text-red-700'
    };
    const isSelected = option.value === value;
    const selectedBg = isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50';
    return `${baseStyles} ${hoverStyles[option.color]} ${isSelected ? selectedBg : ''}`;
  };
  
  const parseOptionLabel = (label) => {
    const match = label.match(/^([^\s]+)\s+(.+)$/);
    return match ? { icon: match[1], text: match[2] } : { icon: '', text: label };
  };

  const selectedOption = statusOptions.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label.replace(/^[^\s]+\s*/, '') : value;
  
  return (
    <div className="relative shrink-0 w-[110px]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-xs font-semibold rounded-lg px-2 py-1 pr-6 border-2 backdrop-blur-xl shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 flex items-center justify-between ${getStatusStyles()}`}
      >
        <span className="truncate text-[11px]">{displayLabel}</span>
        <svg 
          className={`w-3 h-3 opacity-70 absolute right-1.5 top-1/2 -translate-y-1/2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div 
          className={`absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50 ${isDarkMode ? 'bg-gray-900/80 border border-gray-600/50' : 'bg-white/80 border border-gray-300/50'} backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]`}
          style={{
            animation: 'dropdownSmooth 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            WebkitBackdropFilter: 'blur(20px)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {statusOptions.map((option, index) => {
            const { icon, text } = parseOptionLabel(option.label);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={getOptionStyles(option)}
                style={{
                  animationDelay: `${index * 40}ms`,
                  animation: 'optionSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1) backwards'
                }}
              >
                <span className="text-xs leading-none">{icon}</span>
                <span className="truncate">{text}</span>
              </button>
            );
          })}
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


const Admin = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { socket } = useSocket();

  // Redirect non-admin users
  useEffect(() => {
    if (!checkIsAdminAuthenticated()) {
      navigate(ADMIN_PATH);
    }
  }, [navigate]);


  const [activeTab, setActiveTab] = useState('orders');
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [visibleUsersCount, setVisibleUsersCount] = useState(6);
  const usersTableRef = useRef(null);
  const [visibleOrdersCount, setVisibleOrdersCount] = useState(6);
  const ordersTableRef = useRef(null);
  
  // Subscription states
  const [subscriptions, setSubscriptions] = useState([]);
  const [pendingSubscriptions, setPendingSubscriptions] = useState([]);
  const [pendingSubscriptionsCount, setPendingSubscriptionsCount] = useState(0);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [subscriptionView, setSubscriptionView] = useState('all'); // 'all' or 'pending'

  // Fetch pending payments count for badge
  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await getPendingPayments();
      const data = Array.isArray(response.data) ? response.data : [];
      setPendingPaymentsCount(data.length);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  }, []);

  // Fetch pending subscriptions count for badge
  const fetchPendingSubscriptionsCount = useCallback(async () => {
    try {
      const response = await getAdminPendingSubscriptions();
      const data = Array.isArray(response.data) ? response.data : [];
      setPendingSubscriptionsCount(data.length);
      setPendingSubscriptions(data);
    } catch (error) {
      console.error('Error fetching pending subscriptions count:', error);
      // Don't show error if admin is not authenticated
      if (error.message !== 'Admin authentication required') {
        console.error('Unexpected error:', error);
      }
    }
  }, []);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    try {
      const response = await getAdminSubscriptions();
      const data = Array.isArray(response.data.subscriptions) ? response.data.subscriptions : [];
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      // Don't show error if admin is not authenticated
      if (error.message !== 'Admin authentication required') {
        console.error('Unexpected error:', error);
      }
    }
  }, []);

  // Auto-refresh pending count every 5 seconds
  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 5000);
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  // Auto-refresh pending subscriptions count every 5 seconds
  useEffect(() => {
    fetchPendingSubscriptionsCount();
    const interval = setInterval(fetchPendingSubscriptionsCount, 5000);
    return () => clearInterval(interval);
  }, [fetchPendingSubscriptionsCount]);

  // Fetch users count for badge
  const fetchUsersCount = useCallback(async () => {
    try {
      const response = await getAdminUsers();
      const data = Array.isArray(response.data) ? response.data : [];
      return data.length;
    } catch (error) {
      console.error('Error fetching users count:', error);
      return 0;
    }
  }, []);

  // Socket listener for new users
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ Socket not connected');
      return;
    }

    console.log('✅ Socket connected, listening for newUser events');

    // Listen for new user registration
    socket.on('newUser', (data) => {
      console.log('👤 New user registered:', data);
      setNewUsersCount(prev => prev + 1);
    });

    return () => {
      socket.off('newUser');
    };
  }, [socket]);

  const [orders, setOrders] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerOrdersMeta, setCustomerOrdersMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [products, setProducts] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState('');
  const [isCatalogWorking, setIsCatalogWorking] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ordersView, setOrdersView] = useState('customer'); // 'customer' | 'admin'
  
  // Reset counts when viewing tabs
  useEffect(() => {
    if (activeTab === 'users') {
      console.log('👥 Users tab opened, resetting badge');
      setNewUsersCount(0);
      setVisibleUsersCount(Math.max(0, filteredUsers.length - 6));
    } else if (activeTab === 'orders') {
      console.log('📦 Orders tab opened');
      const currentList = ordersView === 'customer' ? filteredCustomerOrders : filteredOrders;
      setVisibleOrdersCount(Math.max(0, currentList.length - 6));
    } else if (activeTab === 'subscriptions') {
      console.log('💳 Subscriptions tab opened, resetting badge');
      setPendingSubscriptionsCount(0);
      fetchSubscriptions();
      fetchPendingSubscriptionsCount();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, ordersView]);

  // Handle scroll detection on users table
  const handleUsersScroll = (e) => {
    const target = e.target;
    const scrollTop = target.scrollTop;
    const clientHeight = target.clientHeight;
    
    // Calculate approximate visible users based on scroll position
    // Each row is roughly ~60-70px height
    const rowHeight = 65;
    const scrolledRows = Math.floor(scrollTop / rowHeight);
    const visibleRows = Math.floor(clientHeight / rowHeight);
    const currentVisibleEnd = scrolledRows + visibleRows;
    
    // Update visible count for indicator
    const currentList = activeTab === 'users' ? filteredUsers : 
                       ordersView === 'customer' ? filteredCustomerOrders : filteredOrders;
    const remainingBelow = Math.max(0, currentList.length - currentVisibleEnd);
    setVisibleUsersCount(remainingBelow);
    
    // At top - show initial remaining count
    const isAtTop = scrollTop < 10;
    if (isAtTop) {
      setVisibleUsersCount(Math.max(0, currentList.length - 6));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  };

  // Handle scroll detection on orders table
  const handleOrdersScroll = (e) => {
    const target = e.target;
    const scrollTop = target.scrollTop;
    const clientHeight = target.clientHeight;
    
    const rowHeight = 65;
    const scrolledRows = Math.floor(scrollTop / rowHeight);
    const visibleRows = Math.floor(clientHeight / rowHeight);
    const currentVisibleEnd = scrolledRows + visibleRows;
    
    const currentList = ordersView === 'customer' ? filteredCustomerOrders : filteredOrders;
    const remainingBelow = Math.max(0, currentList.length - currentVisibleEnd);
    setVisibleOrdersCount(remainingBelow);
    
    const isAtTop = scrollTop < 10;
    if (isAtTop) {
      setVisibleOrdersCount(Math.max(0, currentList.length - 6));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  };

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderMode, setSelectedOrderMode] = useState('customer'); // 'customer' | 'admin'
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminAccessKey, setAdminAccessKey] = useState('');
  const [adminAccessError, setAdminAccessError] = useState('');
  const [isAdminGateChecking, setIsAdminGateChecking] = useState(false);
  const [isAdminGateUnlocked, setIsAdminGateUnlocked] = useState(
    () => sessionStorage.getItem('mm_admin_gate') === 'ok'
  );
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Auto logout state
  const [selectedTimeout, setSelectedTimeout] = useState('15m');
  const [countdown, setCountdown] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const activityTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown when scrolling
  useEffect(() => {
    const handleScroll = () => {
      setIsDropdownOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Format time display
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Get current timeout option
  const getCurrentTimeout = () => {
    return AUTO_LOGOUT_OPTIONS.find(opt => opt.key === selectedTimeout) || AUTO_LOGOUT_OPTIONS[5];
  };

  // Reset activity timer
  const resetActivityTimer = () => {
    const timeout = getCurrentTimeout().ms;
    if (!timeout) return;
    
    setCountdown(timeout);
    setShowWarning(false);
    
    // Clear existing timers
    if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    // Set activity timer
    activityTimerRef.current = setTimeout(() => {
      handleAutoLogout();
    }, timeout);
    
    // Start countdown
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        const remaining = prev - 1000;
        if (remaining <= 0) {
          handleAutoLogout();
          return 0;
        }
        
        // Show warning when 20% time remaining or less than 10 seconds
        const threshold = Math.max(10000, timeout * 0.2);
        if (remaining <= threshold) {
          setShowWarning(true);
        }
        
        return remaining;
      });
    }, 1000);
  };

  // Handle auto logout
  const handleAutoLogout = () => {
    console.log('🚨 Auto logout triggered');
    
    // Clear timers
    if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    // Logout admin
    adminLogout();
    setIsAdminAuthenticated(false);
    setOrders([]);
    setProducts([]);
    setUsers([]);
    setCountdown(0);
    setShowWarning(false);
    
    // Notify navbar
    window.dispatchEvent(new CustomEvent('adminAuthChange', { detail: { isAuthenticated: false } }));
  };

  // Handle activity events
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    
    const handleActivity = () => {
      resetActivityTimer();
    };
    
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'touchmove'];
    events.forEach(event => window.addEventListener(event, handleActivity));
    
    // Initialize timer
    resetActivityTimer();
    
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAdminAuthenticated, selectedTimeout]);

  
  useEffect(() => {
    // Check if admin is already logged in
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      setIsAdminAuthenticated(true);
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoginError('');
      const res = await adminLogin(loginForm);
      if (res.data && res.data.token) {
        setIsAdminAuthenticated(true);
        fetchData();
        // Notify navbar of admin login
        window.dispatchEvent(new CustomEvent('adminAuthChange', { detail: { isAuthenticated: true } }));
      }
    } catch (error) {
      setLoginError(error.response?.data?.message || 'Login failed');
    }
  };

  const handleAdminGate = async (e) => {
    e.preventDefault();
    try {
      setIsAdminGateChecking(true);
      setAdminAccessError('');
      await verifyAdminGateAccess(adminAccessKey.trim());
      sessionStorage.setItem('mm_admin_gate', 'ok');
      setIsAdminGateUnlocked(true);
    } catch (error) {
      setAdminAccessError(error?.response?.data?.message || 'Invalid access key');
    } finally {
      setIsAdminGateChecking(false);
    }
  };


  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, customerOrdersRes, productsRes, usersRes] = await Promise.all([
        getAdminOrders(),
        getAdminCustomerOrders({ page: 1, limit: 50 }),
        getAdminProducts(),
        getAdminUsers()
      ]);
      setOrders(ordersRes.data);
      setCustomerOrders(customerOrdersRes.data?.items || []);
      setCustomerOrdersMeta({
        page: customerOrdersRes.data?.page || 1,
        limit: customerOrdersRes.data?.limit || 50,
        total: customerOrdersRes.data?.total || 0,
        totalPages: customerOrdersRes.data?.totalPages || 0
      });
      setProducts(productsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        adminLogout();
        setIsAdminAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdminOrderStatus = async (orderId, status) => {
    try {
      await updateAdminOrder(orderId, { orderStatus: status });
      fetchData();
    } catch (error) {
      alert('Error updating order');
    }
  };

  const handleSeedOwnCatalog = async () => {
    const ok = window.confirm('Create/update 3000 Pinqoza catalog products with broad categories and subcategories?');
    if (!ok) return;

    try {
      setIsCatalogWorking(true);
      setCatalogStatus('Generating catalog...');
      const res = await seedOwnCatalog(3000);
      setCatalogStatus(res.data?.message || 'Catalog generated successfully');
      await fetchData();
    } catch (error) {
      setCatalogStatus(error?.response?.data?.message || 'Catalog generation failed');
    } finally {
      setIsCatalogWorking(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await downloadProductsCsvTemplate();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'products-template.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setCatalogStatus(error?.response?.data?.message || 'Template download failed');
    }
  };

  const handleImportCsvFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsCatalogWorking(true);
      setCatalogStatus(`Importing ${file.name}...`);
      const csv = await file.text();
      const res = await importProductsCsv(csv);
      setCatalogStatus(res.data?.message || 'CSV imported successfully');
      await fetchData();
    } catch (error) {
      setCatalogStatus(error?.response?.data?.message || 'CSV import failed');
    } finally {
      event.target.value = '';
      setIsCatalogWorking(false);
    }
  };

  const handleProductImageUpload = async (productId, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCatalogStatus('Please select an image file');
      return;
    }

    try {
      setIsCatalogWorking(true);
      setCatalogStatus(`Uploading image for product ${productId.slice(-6)}...`);
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const maxDim = 1200;
            const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            const width = Math.max(1, Math.round(img.width * scale));
            const height = Math.max(1, Math.round(img.height * scale));

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Image processing failed'));
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.78);
            resolve(compressed);
          };
          img.onerror = () => reject(new Error('Failed to parse image'));
          img.src = String(reader.result || '');
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });

      await updateAdminProductImage(productId, dataUrl);
      setCatalogStatus('Product image updated');
      await fetchData();
    } catch (error) {
      const status = error?.response?.status;
      if (status === 413) {
        setCatalogStatus('Image too large. Try a smaller image file.');
      } else {
        setCatalogStatus(error?.response?.data?.message || error?.message || 'Image upload failed');
      }
    } finally {
      setIsCatalogWorking(false);
    }
  };

  const handleRemoveProductImage = async (productId) => {
    try {
      setIsCatalogWorking(true);
      setCatalogStatus(`Removing image for product ${productId.slice(-6)}...`);
      await removeAdminProductImage(productId);
      setCatalogStatus('Product image removed');
      await fetchData();
    } catch (error) {
      setCatalogStatus(error?.response?.data?.message || 'Failed to remove image');
    } finally {
      setIsCatalogWorking(false);
    }
  };

  const createFallbackPlaceholder = (product) => {
    const palette = {
      milk: ['#dbeafe', '#2563eb'],
      ghee: ['#fef3c7', '#d97706'],
      cheese: ['#fef9c3', '#ca8a04'],
      butter: ['#fff7ed', '#ea580c'],
      curd: ['#ecfeff', '#0891b2'],
      paneer: ['#f8fafc', '#64748b'],
      cream: ['#faf5ff', '#9333ea'],
      yogurt: ['#fdf2f8', '#db2777'],
      lassi: ['#f0fdf4', '#16a34a'],
      buttermilk: ['#eff6ff', '#0284c7'],
      sweets: ['#fff1f2', '#e11d48'],
      cake: ['#fdf4ff', '#c026d3'],
      groceries: ['#f7fee7', '#65a30d'],
      fashion: ['#eef2ff', '#4f46e5'],
      electronics: ['#f1f5f9', '#0f172a'],
      home: ['#fefce8', '#a16207'],
      beauty: ['#fce7f3', '#be185d'],
      accessories: ['#f5f3ff', '#7c3aed']
    };
    const category = String(product?.category || 'other');
    const [bg, accent] = palette[category] || ['#f3f4f6', '#374151'];
    const title = String(product?.name || 'Product').replace(/[<>&"]/g, '').slice(0, 28);
    const sub = String(product?.subcategory || 'general').replace(/[<>&"]/g, '').toUpperCase().slice(0, 16);
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" rx="52" fill="${bg}"/>
  <rect x="205" y="150" width="390" height="500" rx="46" fill="#fff" stroke="${accent}" stroke-width="10"/>
  <rect x="245" y="220" width="310" height="130" rx="24" fill="${accent}" opacity="0.15"/>
  <rect x="270" y="390" width="260" height="150" rx="22" fill="${accent}"/>
  <text x="400" y="455" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#fff">${sub}</text>
  <text x="400" y="705" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#111827">${title}</text>
</svg>`.trim();
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  };

  const handleResetProductImage = async (product) => {
    try {
      setIsCatalogWorking(true);
      setCatalogStatus(`Resetting placeholder image for product ${product._id.slice(-6)}...`);
      try {
        await resetAdminProductImagePlaceholder(product._id);
      } catch (error) {
        if (error?.response?.status === 404) {
          const fallbackImage = createFallbackPlaceholder(product);
          await updateAdminProductImage(product._id, fallbackImage);
        } else {
          throw error;
        }
      }
      setCatalogStatus('Placeholder image restored');
      await fetchData();
    } catch (error) {
      setCatalogStatus(error?.response?.data?.message || 'Failed to reset placeholder');
    } finally {
      setIsCatalogWorking(false);
    }
  };

  const handleOpenOrderDetails = (order, mode) => {
    setSelectedOrder(order);
    setSelectedOrderMode(mode);
    setIsOrderModalOpen(true);
  };

  const handleUpdateCustomerOrderStatus = async (order, status) => {
    try {
      const res = await updateAdminCustomerOrderStatus(order._id, status);
      setSelectedOrder(res.data);
      setCustomerOrders((prev) => prev.map((o) => (o._id === res.data._id ? res.data : o)));
    } catch (error) {
      alert('Error updating order status');
    }
  };


  const handleUpdateCustomerOrderTracking = async (order, trackingData) => {
    try {
      const res = await updateAdminCustomerOrderTracking(order._id, trackingData);
      setSelectedOrder(res.data);
      setCustomerOrders((prev) => prev.map((o) => (o._id === res.data._id ? res.data : o)));
    } catch (error) {
      alert('Error updating tracking');
    }
  };


  const handleToggleUserAdmin = async (userId, nextIsAdmin) => {
    try {
      await updateAdminUserRole(userId, nextIsAdmin);
      fetchData();
    } catch (error) {
      alert('Error updating user role');
    }
  };

  const handleToggleUserDeleted = async (userId, nextIsDeleted) => {
    try {
      await updateAdminUserDeleted(userId, nextIsDeleted);
      fetchData();
    } catch (error) {
      alert('Error updating user status');
    }
  };

  const handleViewUserOrders = async (user) => {
    setActiveTab('orders');
    setOrdersView('customer');
    setSearchTerm(user?.email || user?._id || '');
    try {
      const response = await getAdminCustomerOrders(user._id);
      const data = Array.isArray(response.data) ? response.data : [];
      setCustomerOrders(data);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      setCustomerOrders([]);
    }
  };

  const handleVerifySubscription = async (subscription) => {
    const transactionId = prompt('Enter Transaction ID:', `TXN_${Date.now()}`);
    if (!transactionId) return;

    const notes = prompt('Enter verification notes (optional):', 'Payment verified by admin');
    
    try {
      await verifySubscriptionPayment(subscription._id, transactionId, notes);
      
      // Update local state
      setSubscriptions(prev => 
        prev.map(sub => 
          sub._id === subscription._id 
            ? { ...sub, paymentStatus: 'paid', status: 'active', transactionId, adminNotes: notes }
            : sub
        )
      );
      
      setPendingSubscriptions(prev => 
        prev.filter(sub => sub._id !== subscription._id)
      );
      
      setPendingSubscriptionsCount(prev => Math.max(0, prev - 1));
      
      alert('Subscription payment verified successfully!');
    } catch (error) {
      console.error('Error verifying subscription:', error);
      alert('Error verifying subscription: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRejectSubscription = async (subscription) => {
    const reason = prompt('Enter rejection reason:', 'Payment verification failed');
    if (!reason) return;
    
    if (!window.confirm(`Are you sure you want to reject this subscription? Reason: ${reason}`)) {
      return;
    }
    
    try {
      await rejectSubscription(subscription._id, reason);
      
      // Update local state
      setSubscriptions(prev => 
        prev.map(sub => 
          sub._id === subscription._id 
            ? { ...sub, paymentStatus: 'failed', status: 'cancelled', adminNotes: reason }
            : sub
        )
      );
      
      setPendingSubscriptions(prev => 
        prev.filter(sub => sub._id !== subscription._id)
      );
      
      setPendingSubscriptionsCount(prev => Math.max(0, prev - 1));
      
      alert('Subscription rejected successfully!');
    } catch (error) {
      console.error('Error rejecting subscription:', error);
      alert('Error rejecting subscription: ' + (error.response?.data?.message || error.message));
      // keep fallback searchTerm filtering; don't break UI
    }
  };

  const getStatusClass = (status) => {
    const classes = {
      processing: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders.filter(
    (o) =>
      o._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.orderStatus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomerOrders = customerOrders.filter((o) => {
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      o._id?.toLowerCase().includes(q) ||
      o.orderStatus?.toLowerCase().includes(q) ||
      o.paymentStatus?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.user?.phone?.toLowerCase().includes(q)
    );
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = orders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const stats = [
    { label: 'Total Orders', value: orders.length, color: 'text-blue-600' },
    { label: 'Total Products', value: products.length, color: 'text-green-600' },
    { label: 'Total Users', value: users.length, color: 'text-purple-600' },
    { label: 'Revenue', value: `₹${totalRevenue}`, color: 'text-amber-600' }
  ];

  // Admin Login Form
  if (!isAdminAuthenticated) {
    if (!isAdminGateUnlocked) {
      return (
        <div className="fade-in min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black flex items-center justify-center px-4">
          <div className={`w-full max-w-md`}>
            <div className={`relative p-8 rounded-3xl ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-white/10' : 'bg-white/70 backdrop-blur-xl border border-gray-200'} shadow-xl`}>
              <div className="text-center mb-8 relative z-10">
                <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Restricted Admin Access</h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Enter access key before admin login</p>
              </div>

              {adminAccessError ? (
                <div className={`mb-4 p-3 rounded-xl border ${isDarkMode ? 'bg-red-900/50 border-red-700 text-red-300' : 'bg-red-100 border-red-400 text-red-700'}`}>
                  {adminAccessError}
                </div>
              ) : null}

              <form onSubmit={handleAdminGate} className="space-y-4">
                <input
                  type="password"
                  value={adminAccessKey}
                  onChange={(e) => setAdminAccessKey(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500'} focus:outline-none`}
                  placeholder="Enter admin access key"
                  required
                />
                <button
                  type="submit"
                  disabled={isAdminGateChecking}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-orange-600 disabled:opacity-70"
                >
                  {isAdminGateChecking ? 'Checking...' : 'Continue'}
                </button>
              </form>

              <div className="text-center mt-6 relative z-10">
                <Link to="/" className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}>
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fade-in min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black flex items-center justify-center px-4">
        <div className={`w-full max-w-md`}>
          {/* Modern Admin Login Card */}
          <div className={`relative p-8 rounded-3xl ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-white/10' : 'bg-white/70 backdrop-blur-xl border border-gray-200'} shadow-xl`}>
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full rounded-3xl overflow-hidden pointer-events-none">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full blur-xl"></div>
            </div>

            {/* Header */}
            <div className="text-center mb-8 relative z-10">
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Admin Login
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Separate Admin Panel Database
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className={`mb-6 p-4 rounded-xl border ${isDarkMode ? 'bg-red-900/50 border-red-700 text-red-300' : 'bg-red-100 border-red-400 text-red-700'} backdrop-blur-sm relative z-10`}>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {loginError}
                </div>
              </div>
            )}

            {/* Admin Login Form */}
            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 ${isDarkMode ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500'} backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200`}
                    placeholder="admin@pinqoza.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 ${isDarkMode ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500'} backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200`}
                    placeholder="Enter admin password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-orange-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-red-500/30"
              >
                Login to Admin Panel
              </button>
            </form>

            {/* Footer */}
            <div className="text-center mt-8 relative z-10">
              <Link 
                to="/" 
                className={`inline-flex items-center ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'} transition-colors duration-200`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fade-in min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black pt-20">

      <OrderDetailsModal
        open={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        order={selectedOrder}
        mode={selectedOrderMode}
        onUpdateStatus={(order, nextStatus) => {
          if (selectedOrderMode === 'customer') return handleUpdateCustomerOrderStatus(order, nextStatus);
          return updateAdminOrder(order._id, { orderStatus: nextStatus })
            .then((res) => {
              setSelectedOrder(res.data);
              setOrders((prev) => prev.map((o) => (o._id === res.data._id ? res.data : o)));
            })
            .catch(() => alert('Error updating order status'));
        }}
        onUpdateTracking={(order, trackingData) => {
          if (selectedOrderMode === 'customer') return handleUpdateCustomerOrderTracking(order, trackingData);
          return null;
        }}
        onDeleteOrder={(order, mode) => {
          if (mode === 'customer') {
            return deleteAdminCustomerOrder(order._id)
              .then(() => {
                setIsOrderModalOpen(false);
                setSelectedOrder(null);
                setCustomerOrders((prev) => prev.filter((o) => o._id !== order._id));
              })
              .catch((e) => {
                alert(e?.response?.data?.message || e?.message || 'Error deleting order');
                throw e;
              });
          }

          return deleteAdminOrder(order._id)
            .then(() => {
              setIsOrderModalOpen(false);
              setSelectedOrder(null);
              setOrders((prev) => prev.filter((o) => o._id !== order._id));
            })
            .catch((e) => {
              alert(e?.response?.data?.message || e?.message || 'Error deleting order');
              throw e;
            });
        }}
      />

      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-8 shadow-xl`}>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Admin Dashboard
            </h1>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Separate Admin Database
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Auto Countdown Timer & Status */}
          <div className="flex items-center gap-6">
            {/* Auto Countdown Timer */}
            <div className="relative group">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-gray-50 to-white dark:from-black dark:to-black border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2">
                  <div className={`relative w-3 h-3 rounded-full ${showWarning ? 'bg-red-500' : 'bg-green-500'}`}>
                    <div className={`absolute inset-0 rounded-full ${showWarning ? 'bg-red-500' : 'bg-green-500'} animate-ping opacity-75`}></div>
                    <div className={`absolute inset-0 rounded-full ${showWarning ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>
                      Auto Countdown
                    </span>
                    {getCurrentTimeout().ms ? (
                      <div className={`text-lg font-bold font-mono tracking-wider ${
                        showWarning 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {formatTime(countdown)}
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Disabled
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Subtle glow effect */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${
                showWarning 
                  ? 'bg-red-500 shadow-lg shadow-red-500/25' 
                  : 'bg-blue-500 shadow-lg shadow-blue-500/25'
              }`}></div>
            </div>

            {/* Auto Status */}
            <div className="relative group">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-gray-50 to-white dark:from-black dark:to-black border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex flex-col">
                  <span className={`text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>
                    Auto Status
                  </span>
                  <div className={`text-sm font-bold ${
                    getCurrentTimeout().ms 
                      ? showWarning 
                        ? 'text-orange-600 dark:text-orange-400' 
                        : 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {getCurrentTimeout().ms 
                      ? showWarning 
                        ? '⚠️ Warning' 
                        : '✅ Active'
                      : '⏸️ Off'
                    }
                  </div>
                </div>
                {/* Status indicator bar */}
                <div className={`w-1 h-6 rounded-full ${
                  getCurrentTimeout().ms 
                    ? showWarning 
                      ? 'bg-orange-500' 
                      : 'bg-green-500'
                    : 'bg-gray-400'
                }`}></div>
              </div>
              {/* Subtle glow effect */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${
                getCurrentTimeout().ms 
                  ? showWarning 
                    ? 'bg-orange-500 shadow-lg shadow-orange-500/25' 
                    : 'bg-green-500 shadow-lg shadow-green-500/25'
                  : 'bg-gray-400 shadow-lg shadow-gray-400/25'
              }`}></div>
            </div>
          </div>

          {/* Auto logout dropdown */}
          <div className="relative z-[90]" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-sm rounded-xl px-3 py-2
                       bg-gradient-to-br from-white to-gray-50 text-gray-900 
                       border border-gray-200 shadow-sm hover:shadow-md
                       dark:from-black dark:to-black dark:text-gray-100
                       dark:border-gray-600 dark:shadow-none dark:hover:shadow-lg
                       dark:hover:from-gray-750 dark:to-black
                       dark:focus:ring-primary-400"
              aria-label="Select auto logout timer"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <span className="font-medium">
                {getCurrentTimeout().label}
              </span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && createPortal(
              <div
                className="fixed w-40 rounded-xl overflow-hidden
                         bg-white/75 dark:bg-black/55
                         supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-black/45
                         backdrop-blur-md
                         border border-gray-200/70 dark:border-gray-700/60
                         shadow-xl shadow-black/5 dark:shadow-black/30 z-[9999]
                         animate-in fade-in slide-in-from-top-2 duration-200"
                role="listbox"
                style={{
                  top: dropdownRef.current?.getBoundingClientRect().bottom + 8 || 'auto',
                  left: dropdownRef.current?.getBoundingClientRect().left || 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="max-h-64 overflow-y-auto py-1 scrollbar-hide">
                  {AUTO_LOGOUT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setSelectedTimeout(opt.key);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between
                               transition-colors duration-150
                               ${
                                 selectedTimeout === opt.key
                                   ? 'bg-primary-50 dark:bg-black/30 text-primary-700 dark:text-primary-300'
                                   : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                               }`}
                      role="option"
                      aria-selected={selectedTimeout === opt.key}
                    >
                      <span>{opt.label}</span>
                      {selectedTimeout === opt.key && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className={`group relative p-6 rounded-2xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10 text-center">
              <div className={`text-3xl font-bold mb-2 ${
                stat.color === 'text-blue-600' ? 'text-blue-600 dark:text-blue-400' :
                stat.color === 'text-green-600' ? 'text-green-600 dark:text-green-400' :
                stat.color === 'text-purple-600' ? 'text-purple-600 dark:text-purple-400' :
                'text-amber-600 dark:text-amber-400'
              }`}>
                {stat.value}
              </div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className={`flex gap-2 mb-8 p-2 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-white/10' : 'bg-white/70 border border-gray-200'} backdrop-blur-xl shadow-lg`}>
        {['orders', 'products', 'users', 'payments', 'subscriptions'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-6 py-3 font-medium capitalize rounded-xl transition-all duration-200 ${
              activeTab === tab
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg transform scale-[1.02]'
                : `${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`
            }`}
          >
            <span className="flex items-center gap-2">
              {tab}
              {/* Show count badge for payments tab */}
              {tab === 'payments' && pendingPaymentsCount > 0 && (
                <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold bg-white text-red-600 rounded-full animate-pulse">
                  {pendingPaymentsCount > 99 ? '99+' : pendingPaymentsCount}
                </span>
              )}
              {/* Show count badge for users tab - new registrations */}
              {tab === 'users' && newUsersCount > 0 ? (
                <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold bg-white text-purple-600 rounded-full animate-pulse shadow-lg ring-2 ring-purple-500/50">
                  {newUsersCount > 99 ? '99+' : newUsersCount}
                </span>
              ) : tab === 'users' && (
                <span className="hidden" data-debug-count={newUsersCount}>0</span>
              )}
              {/* Show count badge for subscriptions tab - pending payments */}
              {tab === 'subscriptions' && pendingSubscriptionsCount > 0 && (
                <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold bg-white text-green-600 rounded-full animate-pulse shadow-lg ring-2 ring-green-500/50">
                  {pendingSubscriptionsCount > 99 ? '99+' : pendingSubscriptionsCount}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Search + actions */}
      <div className={`flex items-center gap-4 mb-8 p-4 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-white/10' : 'bg-white/70 border border-gray-200'} backdrop-blur-xl shadow-lg`}>
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 ${isDarkMode ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500'} backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200`}
          />
        </div>
        <button 
          onClick={fetchData} 
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-orange-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-red-500/30 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`btn text-sm ${
                ordersView === 'customer' ? 'btn-primary' : 'btn-secondary'
              }`}
              onClick={() => setOrdersView('customer')}
            >
              Customer Orders
            </button>
            <button
              className={`btn text-sm ${
                ordersView === 'admin' ? 'btn-primary' : 'btn-secondary'
              }`}
              onClick={() => setOrdersView('admin')}
            >
              Admin Orders
            </button>

            {ordersView === 'customer' && (
              <div className="text-sm text-gray-600 dark:text-gray-300 ml-auto">
                Showing {filteredCustomerOrders.length} / {customerOrdersMeta.total} customer orders
              </div>
            )}
          </div>

          <div className={`orders-table-container rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl shadow-xl overflow-hidden flex flex-col max-h-[600px]`}>
            <div className="overflow-x-hidden">
              {ordersView === 'customer' ? (
                <table className="w-full">
                  <thead className={`${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/80'} backdrop-blur-sm border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Order ID</th>
                      <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>User</th>
                      <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Items</th>
                      <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Total</th>
                      <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Payment</th>
                      <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Status</th>
                      <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Date</th>
                      <th className={`px-6 py-4 text-left text-sm font-bold w-[200px] ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody 
                    ref={ordersTableRef}
                    onScroll={handleOrdersScroll}
                    className={`divide-y ${isDarkMode ? 'divide-white/10' : 'divide-gray-200'}`}
                  >
                    {filteredCustomerOrders.map((order, index) => (
                      <tr key={order._id} className={`transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/80'} ${index === 0 ? 'border-t-0' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'} flex items-center justify-center`}>
                              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                            </div>
                            <span className={`text-sm font-mono font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>#{order._id.slice(-8)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 hover:scale-110 cursor-pointer backdrop-blur-md border-2 ${isDarkMode ? 'bg-gradient-to-br from-rose-600/30 to-pink-600/30 border-rose-400/50 text-rose-200' : 'bg-gradient-to-br from-rose-100 to-pink-100 border-rose-300/50 text-rose-700'}`}>
                                {order.user?.name ? order.user.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} truncate`} title={order.user?.name || 'Unknown User'}>
                                {order.user?.name || 'Unknown User'}
                              </div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate`} title={order.user?.email || 'No email'}>
                                {order.user?.email || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'} flex items-center justify-center`}>
                              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{order.totalItems} items</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} flex items-center justify-center`}>
                              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>₹{order.totalPrice}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${order.paymentStatus === 'paid' ? (isDarkMode ? 'bg-green-900/30' : 'bg-green-100') : (isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100')} flex items-center justify-center`}>
                              <svg className={`w-4 h-4 ${order.paymentStatus === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            </div>
                            <span className={`text-sm font-medium ${order.paymentStatus === 'paid' ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-yellow-400' : 'text-yellow-600')}`}>{order.paymentStatus || 'pending'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusClass(order.orderStatus)}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'} flex items-center justify-center`}>
                              <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenOrderDetails(order, 'customer')}
                              className={`shrink-0 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 backdrop-blur-md border-2 shadow-lg flex items-center gap-1 ${isDarkMode ? 'bg-rose-500/20 border-rose-400/50 text-rose-300 hover:bg-rose-500/30' : 'bg-rose-500/15 border-rose-400/40 text-rose-600 hover:bg-rose-500/25'}`}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                            <StatusDropdown 
                              value={order.orderStatus}
                              onChange={(status) => handleUpdateCustomerOrderStatus(order, status)}
                              isDarkMode={isDarkMode}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-gray-800 dark:text-gray-100">
                  <thead className="bg-gray-50 dark:bg-black">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Order ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Items</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Paid</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold w-[180px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody 
                    ref={ordersTableRef}
                    onScroll={handleOrdersScroll}
                    className="divide-y divide-gray-200 dark:divide-gray-700"
                  >
                    {filteredOrders.map((order, index) => (
                      <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <td className="px-4 py-3 text-sm">#{(order.orderId || order._id).toString().slice(-8)}</td>
                        <td className="px-4 py-3 text-sm">{order.totalItems} items</td>
                        <td className="px-4 py-3 text-sm">₹{order.totalPrice}</td>
                        <td className="px-4 py-3 text-sm">{order.isPaid ? 'paid' : 'pending'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(order.orderStatus)}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenOrderDetails(order, 'admin')}
                              className={`shrink-0 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 backdrop-blur-md border-2 shadow-lg flex items-center gap-1 ${isDarkMode ? 'bg-blue-500/20 border-blue-400/50 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-500/15 border-blue-400/40 text-blue-600 hover:bg-blue-500/25'}`}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                            <StatusDropdown 
                              value={order.orderStatus}
                              onChange={(status) => handleUpdateAdminOrderStatus(order._id, status)}
                              isDarkMode={isDarkMode}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {ordersView === 'customer' && filteredCustomerOrders.length === 0 && (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">No customer orders found</div>
            )}
            {ordersView === 'admin' && filteredOrders.length === 0 && (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">No admin orders found</div>
            )}
            {/* Scrollable table body styles for orders */}
            <style>{`
              .orders-table-container {
                overflow-x: hidden !important;
              }
              .orders-table-container tbody {
                display: block;
                max-height: 450px;
                overflow-y: auto;
                overflow-x: hidden;
                scrollbar-width: none;
                -ms-overflow-style: none;
              }
              .orders-table-container tbody::-webkit-scrollbar {
                display: none;
              }
              .orders-table-container thead, .orders-table-container tbody tr {
                display: table;
                width: 100%;
                table-layout: fixed;
              }
              .orders-table-container th:last-child,
              .orders-table-container td:last-child {
                width: 220px;
                min-width: 220px;
              }
              /* Admin orders table specific */
              table:nth-of-type(2) th:last-child,
              table:nth-of-type(2) td:last-child {
                width: 200px;
                min-width: 200px;
              }
            `}</style>
            {/* Orders scroll indicator - shows remaining orders dynamically */}
            {((ordersView === 'customer' && filteredCustomerOrders.length > 6) || 
              (ordersView === 'admin' && filteredOrders.length > 6)) && 
              visibleOrdersCount > 0 && (
              <div 
                onClick={() => {
                  ordersTableRef.current?.scrollTo({ top: ordersTableRef.current.scrollHeight, behavior: 'smooth' });
                }}
                className={`text-center py-2 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${isDarkMode ? 'text-gray-400 border-white/10' : 'text-gray-500 border-gray-200'} border-t`}
              >
                <div className="flex items-center justify-center gap-1 animate-bounce">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  {visibleOrdersCount} more orders below
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl shadow-lg`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Catalog Power</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Generate own-brand products now, or upload a CSV later to update names, prices, stock, and images.
                </p>
                {catalogStatus && (
                  <p className={`mt-2 text-sm font-medium ${catalogStatus.toLowerCase().includes('failed') ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                    {catalogStatus}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSeedOwnCatalog}
                  disabled={isCatalogWorking}
                  className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold disabled:opacity-60 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg"
                >
                  {isCatalogWorking ? 'Working...' : 'Generate 3000 Products'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={isCatalogWorking}
                  className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${isDarkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                >
                  CSV Template
                </button>
                <label className={`px-4 py-2.5 rounded-xl font-semibold cursor-pointer transition-all duration-200 ${isDarkMode ? 'bg-blue-900/40 text-blue-200 hover:bg-blue-900/60' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                  Import CSV
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleImportCsvFile}
                    disabled={isCatalogWorking}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl shadow-xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/80'} backdrop-blur-sm border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Product</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Category</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Price</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Stock</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Status</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-white/10' : 'divide-gray-200'}`}>
                {filteredProducts.slice(0, 10).map((product, index) => (
                  <tr key={product._id} className={`transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/80'} ${index === 0 ? 'border-t-0' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-xl shadow-sm"
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                              <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{product.name}</div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID: {product._id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'} flex items-center justify-center`}>
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <span className={`text-sm font-medium capitalize ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{product.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} flex items-center justify-center`}>
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>₹{product.price}</div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>per {product.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${product.stock > 10 ? (isDarkMode ? 'bg-green-900/30' : 'bg-green-100') : product.stock > 0 ? (isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100') : (isDarkMode ? 'bg-red-900/30' : 'bg-red-100')} flex items-center justify-center`}>
                          <svg className={`w-4 h-4 ${product.stock > 10 ? 'text-green-600 dark:text-green-400' : product.stock > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${product.stock > 10 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : product.stock > 0 ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>{product.stock}</div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>units</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                        product.stock > 0 
                          ? 'bg-green-100 text-green-800 dark:bg-black/30 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-black/30 dark:text-red-300'
                      }`}>
                        <div className="w-1.5 h-1.5 rounded-full mr-1.5 ${
                          product.stock > 0 ? 'bg-green-500' : 'bg-red-500'
                        }"></div>
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <label className={`inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${isDarkMode ? 'bg-blue-900/40 text-blue-200 hover:bg-blue-900/60' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isCatalogWorking}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handleProductImageUpload(product._id, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          disabled={isCatalogWorking}
                          onClick={() => handleRemoveProductImage(product._id)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${isDarkMode ? 'bg-red-900/40 text-red-200 hover:bg-red-900/60' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          disabled={isCatalogWorking}
                          onClick={() => handleResetProductImage(product)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${isDarkMode ? 'bg-amber-900/40 text-amber-200 hover:bg-amber-900/60' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                        >
                          Placeholder
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && <div className="p-8 text-center text-gray-600 dark:text-gray-400">No products found</div>}
        </div>
        </div>
      )}

      {activeTab === 'users' && (
          <div className={`users-table-container rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl shadow-xl overflow-hidden flex flex-col max-h-[600px]`}>
          <div className="overflow-x-hidden">
            <table className="w-full">
              <thead className={`${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/80'} backdrop-blur-sm border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Name</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Email</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Role</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Joined</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Actions</th>
                </tr>
              </thead>
              <tbody 
                ref={usersTableRef}
                onScroll={handleUsersScroll}
                className={`divide-y ${isDarkMode ? 'divide-white/10' : 'divide-gray-200'}`}
              >
                {filteredUsers.map((user, index) => (
                  <tr key={user._id} className={`transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/80'} ${index === 0 ? 'border-t-0' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 hover:scale-110 cursor-pointer backdrop-blur-md border-2 ${isDarkMode ? 'bg-gradient-to-br from-purple-600/30 to-blue-600/30 border-purple-400/50 text-purple-200' : 'bg-gradient-to-br from-purple-100 to-blue-100 border-purple-300/50 text-purple-700'}`}>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${user.isAdmin ? 'bg-purple-500 border-gray-900 dark:border-gray-800' : 'bg-green-500 border-gray-900 dark:border-gray-800'}`}></div>
                        </div>
                        <div className="min-w-0">
                          <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} truncate`} title={user.name}>
                            {user.name}
                          </div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID: {user._id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'} flex items-center justify-center`}>
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${user.isAdmin ? (isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100') : (isDarkMode ? 'bg-gray-700' : 'bg-gray-200')} flex items-center justify-center`}>
                          <svg className={`w-4 h-4 ${user.isAdmin ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {user.isAdmin ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            )}
                          </svg>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                          user.isAdmin
                            ? 'bg-purple-100 text-purple-800 dark:bg-black/30 dark:text-purple-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-black/40 dark:text-gray-300'
                        }`}>
                          <div className="w-1.5 h-1.5 rounded-full mr-1.5 ${
                            user.isAdmin ? 'bg-purple-500' : 'bg-gray-500'
                          }"></div>
                          {user.isAdmin ? 'admin' : 'user'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} flex items-center justify-center`}>
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleViewUserOrders(user)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${isDarkMode ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                        >
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            View Orders
                          </div>
                        </button>

                        <button
                          onClick={() => handleToggleUserAdmin(user._id, !user.isAdmin)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${user.isAdmin ? (isDarkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-700 hover:bg-red-200') : (isDarkMode ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50' : 'bg-purple-100 text-purple-700 hover:bg-purple-200')}`}
                        >
                          {user.isAdmin ? 'Set User' : 'Set Admin'}
                        </button>

                        <button
                          onClick={() => handleToggleUserDeleted(user._id, !user.isDeleted)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${user.isDeleted ? (isDarkMode ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-100 text-green-700 hover:bg-green-200') : (isDarkMode ? 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/50' : 'bg-orange-100 text-orange-700 hover:bg-orange-200')}`}
                        >
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {user.isDeleted ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              )}
                            </svg>
                            {user.isDeleted ? 'Restore' : 'Soft Delete'}
                          </div>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Scrollable table body with hidden scrollbar */}
          <style>{`
            .users-table-container {
              overflow-x: hidden !important;
            }
            .users-table-container tbody {
              display: block;
              max-height: 450px;
              overflow-y: auto;
              overflow-x: hidden;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .users-table-container tbody::-webkit-scrollbar {
              display: none;
            }
            .users-table-container thead, .users-table-container tbody tr {
              display: table;
              width: 100%;
              table-layout: fixed;
            }
          `}</style>
          {filteredUsers.length === 0 && <div className="p-8 text-center text-gray-600 dark:text-gray-400">No users found</div>}
          {/* Scroll indicator - shows remaining users dynamically */}
          {filteredUsers.length > 6 && visibleUsersCount > 0 && (
            <div 
              onClick={() => {
                usersTableRef.current?.scrollTo({ top: usersTableRef.current.scrollHeight, behavior: 'smooth' });
              }}
              className={`text-center py-2 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${isDarkMode ? 'text-gray-400 border-white/10' : 'text-gray-500 border-gray-200'} border-t`}
            >
              <div className="flex items-center justify-center gap-1 animate-bounce">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                {visibleUsersCount} more users below
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <AdminPaymentDashboard />
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Subscription View Toggle */}
          <div className={`flex gap-2 p-1 rounded-xl ${isDarkMode ? 'bg-gray-800/50 border border-white/10' : 'bg-white/70 border border-gray-200'} backdrop-blur-xl shadow-lg`}>
            {[
              { key: 'all', label: 'All Subscriptions', count: subscriptions.length },
              { key: 'pending', label: 'Pending Payment', count: pendingSubscriptions.length }
            ].map((view) => (
              <button
                key={view.key}
                onClick={() => setSubscriptionView(view.key)}
                className={`flex-1 px-4 py-2.5 font-medium rounded-lg transition-all duration-200 ${
                  subscriptionView === view.key
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-[1.02]'
                    : `${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{view.label}</span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    subscriptionView === view.key
                      ? 'bg-white/20 text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {view.count}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Subscriptions Table */}
          <div className={`subscriptions-table-container rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl shadow-xl overflow-hidden flex flex-col max-h-[600px]`}>
            <div className="overflow-x-hidden">
              <table className="w-full">
                <thead className={`${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/80'} backdrop-blur-sm border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Subscription ID
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      User
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Plan
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Amount
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Status
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Payment
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-white/10' : 'divide-gray-200'}`}>
                  {(subscriptionView === 'all' ? subscriptions : pendingSubscriptions).map((subscription) => (
                    <tr 
                      key={subscription._id}
                      className={`${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors duration-150`}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {subscription.subscriptionId?.slice(-12)?.toUpperCase()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap`}>
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-3`}>
                            {subscription.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {subscription.user?.name || 'Unknown'}
                            </div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {subscription.user?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap`}>
                        <div>
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {subscription.planName}
                          </div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {subscription.duration}
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400`}>
                        ₹{subscription.pricing?.totalAmount || 0}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap`}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          subscription.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-black/30 dark:text-green-300'
                            : subscription.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-black/30 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-black/30 dark:text-gray-300'
                        }`}>
                          {subscription.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap`}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          subscription.paymentStatus === 'paid' 
                            ? 'bg-green-100 text-green-800 dark:bg-black/30 dark:text-green-300'
                            : subscription.paymentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-black/30 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-black/30 dark:text-red-300'
                        }`}>
                          {subscription.paymentStatus?.toUpperCase()}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium`}>
                        <div className="flex items-center gap-2">
                          {subscription.paymentStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleVerifySubscription(subscription)}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium"
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => handleRejectSubscription(subscription)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedSubscription(subscription)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {(subscriptionView === 'all' ? subscriptions : pendingSubscriptions).length === 0 && (
                <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="text-6xl mb-4">📋</div>
                  <div className="text-lg font-medium mb-2">No subscriptions found</div>
                  <div className="text-sm">
                    {subscriptionView === 'pending' 
                      ? 'No pending subscription payments to review'
                      : 'No subscriptions found'
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
