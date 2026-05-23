import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { searchProducts } from '../services/api';
import { getAdminUser, clearAuthData } from '../util/auth';
import AdminNotifications from './AdminNotifications';
import ADMIN_PATH from '../config/adminPath';

// Direct function definition to avoid import issues
const isAdminAuthenticated = () => {
  const adminToken = localStorage.getItem('adminToken');
  return !!adminToken;
};

const ModernNavbar = ({ cartCount, user, onLogout }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user: authUser } = useAuth();
  const currentUser = authUser || user;
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Check if current page is admin page
  const isAdminPage = window.location.pathname.startsWith(ADMIN_PATH);
  const [adminAuthState, setAdminAuthState] = useState(isAdminAuthenticated());
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const searchRef = useRef(null);
  const searchDebounceRef = useRef(null);
  // placeholder animation removed; keep search UX simple
  
  // Animated placeholder texts
  const placeholderTexts = [
    "",
    "🥛 ",
    "🍯🥛 ",
    "🍦🍯🥛 ",
    "🥤🍦🍯🥛 ",
    "🥣🥤🍦🍯🥛 ",
    "🧀🥤🍦🍯🧊🥛",
    "🧀🥤🍦🍯🧊🥛🧈",
    "🧀🥤🍦🍯🧊🥛🧈🫙",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤🍦",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤🍦🍯",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤🍦🍯🧊",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤🍦🍯🧊🥛",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤🍦🍯🧊🥛🧈",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤🍦🍯🧊🥛🧈🫙",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤🍦🍯🧊🥛🧈🫙🍶",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤🍦🍯🧊🥛🧈🫙",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤🍦🍯🧊🥛🧈",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤🍦🍯🧊🥛",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤🍦🍯🧊",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤🍦🍯",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤🍦",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀🥤",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶🧀",
    "🧀🥤🍦🍯🧊🥛🧈🫙🍶",
    "🧀🥤🍦🍯🧊🥛🧈🫙",
    "🧀🥤🍦🍯🧊🥛🧈",
    "🧀🥤🍦🍯🧊🥛",
    "🧀🥤🍦🍯🧊",
    "🥤🍦🍯🥛 ",
    "🍦🍯🥛 ",
    "🍯🥛 ",
    "🥛 ",
    ""
  ];
  void placeholderTexts;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle notification click
  const handleNotificationClick = (orderId) => {
    if (orderId === 'all') {
      navigate(ADMIN_PATH);
      setTimeout(() => {
        window.location.hash = '#payments';
      }, 100);
    } else {
      navigate(ADMIN_PATH);
      setTimeout(() => {
        sessionStorage.setItem('targetPayment', orderId);
        window.location.hash = '#payments';
      }, 100);
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setAdminAuthState(isAdminAuthenticated());
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('adminAuthChange', handleStorageChange);
    const interval = setInterval(handleStorageChange, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adminAuthChange', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar { display: none; }
      .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return undefined;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await searchProducts(query, 6);
        setSearchResults(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  const goToSearchPage = (queryText) => {
    const q = queryText.trim();
    if (!q) return;
    navigate(`/products?search=${encodeURIComponent(q)}`);
    setIsSearchOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    goToSearchPage(searchQuery);
  };

  return (
    <>
      {/* Modern Glass Effect Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-[60] overflow-x-clip transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/20 shadow-lg' 
          : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-white/10 dark:border-gray-800/10'
      }`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-6">
          {/* Mobile Search Bar (Top) */}
          <div className="md:hidden pt-2 pb-2" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search products..."
                className="w-full h-10 pl-11 pr-20 rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-900/90 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 h-7 px-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                Go
              </button>
            </form>
          </div>

          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group -ml-1 sm:-ml-2 z-30 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg opacity-25 blur-lg group-hover:opacity-35 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
                    <img
                      src="/icon.svg"
                      alt="Pinqoza"
                      className="w-full h-full"
                      draggable="false"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                  Pinqoza
                </span>
                <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">Shop Everything</span>
              </div>
            </Link>

            <div ref={searchRef} className="hidden lg:block w-full max-w-[32rem] xl:max-w-[40rem] min-w-0 justify-self-center relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search any product..."
                  className="w-full max-w-full h-11 pl-12 pr-28 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all shadow-sm hover:shadow-md"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 h-8 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  Search
                </button>
              </form>

              {isSearchOpen && (
                <div className="absolute top-[3.15rem] left-0 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-[90]">
                  {isSearching ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Searching...</div>
                  ) : searchQuery.trim().length < 2 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Type at least 2 letters</div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-1.5 max-h-80 overflow-y-auto hide-scrollbar">
                      {searchResults.map((product) => (
                        <button
                          key={product._id}
                          type="button"
                          onClick={() => goToSearchPage(product.name)}
                          className="w-full px-4 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-full h-full items-center justify-center text-xs font-semibold text-gray-500 dark:text-gray-400 ${product.image ? 'hidden' : 'flex'}`}
                              >
                                IMG
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{product.category || 'Product'}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => goToSearchPage(searchQuery)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-200">No exact match. Search for "{searchQuery.trim()}"</p>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Links (Desktop/Tablet) */}
            <div className="hidden md:flex items-center space-x-2 sm:space-x-3 md:space-x-4 z-30 justify-self-end">
              <Link
                to="/products"
                className="lg:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                aria-label="Search products"
                title="Search products"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>
              
              {!currentUser && (
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium"
                >
                  {/* Login */}
                </Link>
              )}

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 group"
              >
                <div className="relative">
                  <svg className="w-6 h-6 transform transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {/* Cart Pulse Effect */}
                  <span className="absolute inset-0 bg-blue-500/20 rounded-full opacity-0 group-hover:opacity-100 animate-pulse"></span>
                </div>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-bounce">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* My Orders - Visible only after login */}
              {currentUser && (
                <div className="relative group">
                  <Link
                    to="/orders"
                    className="relative p-2 text-orange-700 dark:text-orange-300 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200 group"
                    title="My Orders"
                  >
                    <div className="relative">
                      <svg className="w-6 h-6 transform transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      {/* Orders Pulse Effect */}
                      <span className="absolute inset-0 bg-orange-500/20 rounded-full opacity-0 group-hover:opacity-100 animate-pulse"></span>
                    </div>
                  </Link>
                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    My Orders
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900 dark:border-b-white"></div>
                  </div>
                </div>
              )}

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 group"
              >
                <div className="relative">
                  <svg className="w-6 h-6 transform transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {/* Heart Pulse Effect */}
                  <span className="absolute inset-0 bg-red-500/20 rounded-full opacity-0 group-hover:opacity-100 animate-pulse"></span>
                </div>
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Admin Notifications */}
              {adminAuthState && (
                <AdminNotifications onNotificationClick={handleNotificationClick} />
              )}

              {/* Quick Actions - Visible only after login */}
              {currentUser && (
                <div className="hidden lg:flex items-center space-x-2">
                  {/* Quick Order Button */}
                  <div className="relative group">
                    <Link
                      to="/products"
                      className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      title="Quick Order"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </Link>
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      Quick Order
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900 dark:border-b-white"></div>
                    </div>
                  </div>

                  {/* Delivery Tracker */}
                  <div className="relative group">
                    <button 
                      className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200"
                      title="Track Order"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </button>
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      Track Order
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900 dark:border-b-white"></div>
                    </div>
                  </div>

                  {/* Subscription Status */}
                  <div className="relative group">
                    <button
                      onClick={() => navigate('/subscriptions')}
                      className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      My Subscriptions
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900 dark:border-b-white"></div>
                    </div>
                  </div>

                  {/* Wallet Balance */}
                  <div className="relative group">
                    <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      Wallet: ₹250
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900 dark:border-b-white"></div>
                    </div>
                  </div>
                </div>
              )}

              
              {/* User Menu */}
              {currentUser || adminAuthState ? (
                <div className="relative group">
                  {adminAuthState ? (
                  // Admin User Display
                  <Link to={ADMIN_PATH} className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium">
                    {getAdminUser()?.name || 'Admin'}
                  </Link>
                ) : (
                  // Regular User Display
                  <button className="flex items-center space-x-2 p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0)}
                      </span>
                    </div>
                  </button>
                )}
                
                <div className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-300/50 dark:border-gray-600/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 ease-out transform scale-95 group-hover:scale-100" style={{ WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}>
                  {adminAuthState ? (
                    // Admin Menu Content
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{getAdminUser()?.name || 'Admin'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Administrator</p>
                    </div>
                      ) : (
                    // Regular User Menu Content
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{currentUser?.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
                    </div>
                  )}
                    <div className="py-2">
                      {adminAuthState ? (
                        // Admin Menu Options
                        <>
                          <Link
                            to={ADMIN_PATH}
                            className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors group"
                          >
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Admin Panel</span>
                          </Link>
                          <Link
                            to={ADMIN_PATH}
                            className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors group"
                          >
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            <span>Manage Orders</span>
                          </Link>
                        </>
                      ) : (
                        // Regular User Menu Options
                        <>
                          {/* Quick Actions for Mobile */}
                          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Actions</p>
                            <div className="space-y-1">
                              <Link
                                to="/products"
                                className="flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-sm font-medium">Quick Order</span>
                              </Link>
                              <button className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors w-full">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                <span className="text-sm font-medium">Track Order</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* User Info */}
                          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Account Info</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Subscription</span>
                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">Active</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Wallet</span>
                                <span className="font-bold text-yellow-600 dark:text-yellow-400">₹250</span>
                              </div>
                            </div>
                          </div>
                          
                          <Link
                            to="/profile"
                            className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors group"
                          >
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Profile</span>
                          </Link>
                          <Link
                            to="/account"
                            className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors group"
                          >
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Account</span>
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => setShowLogoutModal(true)}
                        className="flex items-center space-x-3 w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                      >
                        <svg className="w-5 h-5 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base whitespace-nowrap bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                >
                  <span className="sm:hidden">Login</span>
                  <span className="hidden sm:inline">Get Started</span>
                </Link>
              )}
            </div>

            {/* Mobile Right Actions */}
            <div className="flex md:hidden items-center justify-end gap-2 z-30">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setShowMobileMenu((prev) => !prev)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

        </div>

        {/* Mobile Menu Panel */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200/70 dark:border-gray-700/70 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl animate-[fadeIn_0.25s_ease-out]">
            <div className="px-3 py-3 space-y-2">
              <Link
                to="/cart"
                onClick={() => setShowMobileMenu(false)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/20 dark:border-gray-700/70 bg-white/60 dark:bg-gray-800/40 text-gray-800 dark:text-gray-100"
              >
                <span className="inline-flex items-center gap-3 text-sm font-semibold">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" /></svg>
                  Cart
                </span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{cartCount > 0 ? cartCount : 0}</span>
              </Link>

              <Link
                to="/wishlist"
                onClick={() => setShowMobileMenu(false)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 dark:border-gray-700/70 bg-white/60 dark:bg-gray-800/40 text-sm font-semibold text-gray-800 dark:text-gray-100"
              >
                <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682" /></svg>
                Wishlist
              </Link>

              {currentUser && (
                <Link
                  to="/orders"
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 dark:border-gray-700/70 bg-white/60 dark:bg-gray-800/40 text-sm font-semibold text-gray-800 dark:text-gray-100"
                >
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12" /></svg>
                  Orders
                </Link>
              )}

              {currentUser && (
                <Link
                  to="/subscriptions"
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/20 dark:border-gray-700/70 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-sm font-semibold text-gray-800 dark:text-gray-100"
                >
                  <span className="inline-flex items-center gap-3">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10" /></svg>
                    Subscription
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300">Active</span>
                </Link>
              )}

              {currentUser && (
                <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/20 dark:border-gray-700/70 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  <span className="inline-flex items-center gap-3">
                    <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1" /></svg>
                    Wallet
                  </span>
                  <span className="text-yellow-600 dark:text-yellow-300 font-bold">₹250</span>
                </div>
              )}

              {currentUser && (
                <Link
                  to="/account"
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 dark:border-gray-700/70 bg-white/60 dark:bg-gray-800/40 text-sm font-semibold text-gray-800 dark:text-gray-100"
                >
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0" /></svg>
                  Account
                </Link>
              )}

              {!currentUser && !adminAuthState && (
                <Link
                  to="/login"
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
                >
                  Get Started
                </Link>
              )}

              {(currentUser || adminAuthState) && (
                <button
                  onClick={() => { setShowMobileMenu(false); setShowLogoutModal(true); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-400/50 bg-red-500/10 text-sm font-semibold text-red-600 dark:text-red-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Modern Logout Popup */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {isAdminPage ? (
              // Admin page - red-orange theme
              <>
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full blur-3xl animate-pulse animation-delay-2"></div>
                <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-br from-red-400/15 to-pink-500/15 rounded-full blur-2xl animate-pulse animation-delay-4"></div>
              </>
            ) : (
              // User page - blue-purple theme
              <>
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse animation-delay-2"></div>
                <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-br from-indigo-500/15 to-blue-500/15 rounded-full blur-2xl animate-pulse animation-delay-4"></div>
              </>
            )}
          </div>
          
          <div className={`relative max-w-sm w-full rounded-3xl shadow-2xl transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] scale-100 opacity-100 ${
            isDarkMode ? 'bg-gray-900/95 border border-gray-700/50 backdrop-blur-xl' : 'bg-white/95 border border-gray-200/50 backdrop-blur-xl'
          }`}>
            {/* Glass Morphism Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-3xl pointer-events-none"></div>
            <div className={`absolute inset-0 bg-gradient-to-bl from-transparent ${
              isAdminPage ? 'via-red-400/5' : 'via-blue-400/5'
            } to-transparent rounded-3xl pointer-events-none`}></div>
            
            {/* Popup Header */}
            <div className={`relative p-6 border-b ${
              isAdminPage 
                ? 'border-red-200/20 dark:border-red-700/20' 
                : 'border-blue-200/20 dark:border-blue-700/20'
            }`}>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                    isAdminPage 
                      ? 'bg-gradient-to-br from-red-500 to-orange-500' 
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  }`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  {/* Icon Glow */}
                  <div className={`absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse ${
                    isAdminPage 
                      ? 'bg-gradient-to-r from-red-400 to-orange-400' 
                      : 'bg-gradient-to-r from-blue-400 to-purple-400'
                  }`}></div>
                </div>
              </div>
            </div>
            
            {/* Popup Content */}
            <div className="relative p-6 text-center">
              <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Logout Confirmation
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Are you sure you want to logout? You will need to login again to access your account.
              </p>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-gray-700/80 hover:bg-gray-600/80 text-gray-300 border border-gray-600/50' 
                      : 'bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 border border-gray-300/50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Close modal first
                    setShowLogoutModal(false);
                    
                    // Check if admin and handle accordingly
                    const isAdmin = adminAuthState || localStorage.getItem('adminToken');
                    
                    if (isAdmin) {
                      // Admin logout - clear data and refresh page
                      localStorage.clear();
                      sessionStorage.clear();
                      
                      // Trigger admin auth change event
                      window.dispatchEvent(new CustomEvent('adminAuthChange', { detail: { isAuthenticated: false } }));
                      
                      // Force page refresh to admin login
                      setTimeout(() => {
                        window.location.href = ADMIN_PATH;
                      }, 100);
                    } else {
                      // Regular user logout: clear only user auth/session,
                      // then let App route to home and open login popup.
                      if (onLogout) {
                        onLogout();
                      } else {
                        clearAuthData();
                      }
                      sessionStorage.removeItem('intendedUrl');
                      window.dispatchEvent(new CustomEvent('mm_logged_out'));
                    }
                  }}
                  className={`flex-1 py-3 px-4 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                    isAdminPage 
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  }`}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>
    </>
  );
};

export default ModernNavbar;
