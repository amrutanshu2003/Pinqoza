import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { searchProducts } from '../services/api';
import { getAdminUser } from '../util/auth';
import AdminNotifications from './AdminNotifications';
import ADMIN_PATH from '../config/adminPath';

// Direct function definition to avoid import issues
const isAdminAuthenticated = () => {
  const adminToken = localStorage.getItem('adminToken');
  return !!adminToken;
};

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { cartCount, updateCartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [adminAuthState, setAdminAuthState] = useState(isAdminAuthenticated());
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        console.log('Click outside search, closing dropdown');
        setShowSearch(false);
      }
    };

    // Use setTimeout to avoid immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle admin auth changes
  useEffect(() => {
    const handleAuthChange = (event) => {
      setAdminAuthState(event.detail?.isAuthenticated || false);
    };

    window.addEventListener('adminAuthChange', handleAuthChange);
    return () => window.removeEventListener('adminAuthChange', handleAuthChange);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle notification click - redirect to admin payments
  const handleNotificationClick = (orderId) => {
    if (orderId === 'all') {
      // Navigate to admin and go to payments tab
      navigate(ADMIN_PATH);
      setTimeout(() => {
        // This will be handled by Admin component
        window.location.hash = '#payments';
      }, 100);
    } else {
      // Navigate to admin and go to specific payment
      navigate(ADMIN_PATH);
      setTimeout(() => {
        // Store target order ID in sessionStorage for Admin component
        sessionStorage.setItem('targetPayment', orderId);
        window.location.hash = '#payments';
      }, 100);
    }
  };

  
  const handleLogout = () => {
    onLogout();
    updateCartCount(); // Trigger cart count update to 0
    if (adminAuthState) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setAdminAuthState(false);
      window.location.href = ADMIN_PATH;
    } else {
      navigate('/');
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const res = await searchProducts(query, 5);
        setSearchResults(res.data);
        setShowSearch(true);
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      setSearchResults([]);
      // Keep dropdown open to show quick suggestions
      setShowSearch(true);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <>
    <style>{`
      @keyframes mobileDrawerIn {
        from { transform: translateX(100%); opacity: 0.9; }
        to { transform: translateX(0); opacity: 1; }
      }
    `}</style>
    <nav className="fixed top-3 left-0 right-0 z-[60] transition-all duration-500 px-4">
      {/* Full Glass Effect Container - Ultra Modern Floating Style */}
      <div className={`relative mx-auto max-w-7xl ${isDarkMode ? 'bg-gray-900/68' : 'bg-white/82'} backdrop-blur-[34px] rounded-[2rem] border ${isDarkMode ? 'border-white/20' : 'border-white/60'} shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)]`}>
        {/* Glass Reflection Effect */}
        <div className={`absolute inset-0 bg-gradient-to-b ${isDarkMode ? 'from-white/10 via-white/5 to-transparent' : 'from-white/80 via-white/40 to-transparent'} pointer-events-none rounded-[2rem]`}></div>
        
        {/* Animated Shimmer Effect */}
        <div className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? 'from-transparent via-primary-500/10 via-secondary-500/10 to-transparent' : 'from-transparent via-primary-400/15 via-secondary-400/15 to-transparent'} animate-gradient-x pointer-events-none rounded-[2rem]`}></div>
        
        {/* Floating Particles Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2rem]">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${isDarkMode ? 'bg-primary-500/30' : 'bg-primary-400/40'} animate-float`}
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>
        
        {/* Top Highlight Line */}
        <div className={`absolute inset-x-0 top-0 h-[2px] ${isDarkMode ? 'bg-gradient-to-r from-transparent via-primary-500/50 via-secondary-500/50 to-transparent' : 'bg-gradient-to-r from-transparent via-primary-400/60 via-secondary-400/60 to-transparent'}`}></div>
        
        {/* Bottom Soft Glow */}
        <div className={`absolute inset-x-0 bottom-0 h-8 ${isDarkMode ? 'bg-gradient-to-t from-primary-500/10 to-transparent' : 'bg-gradient-to-t from-primary-400/20 to-transparent'} blur-xl`}></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-3 md:px-4">
          <div className="flex items-center h-16 gap-3">
          <Link to="/" className="flex items-center space-x-2 md:space-x-3 group shrink-0">
            <div className="relative">
              {/* Logo */}
              <div className="w-10 h-10 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="absolute inset-0 rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 group-hover:rotate-6 group-hover:scale-105">
                  <img
                    src="/icon.svg"
                    alt="Pinqoza"
                    className="w-full h-full"
                    draggable="false"
                  />
                </div>
              </div>
            </div>
            <div className="hidden sm:flex flex-col min-w-0">
              <span className={`text-lg md:text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent truncate ${isDarkMode ? 'from-white to-gray-300' : 'from-primary-600 to-secondary-600'}`}>
                Pinqoza
              </span>
              <span className={`text-[11px] md:text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Shop Everything</span>
            </div>
          </Link>

          <form ref={searchRef} onSubmit={handleSearchSubmit} className="hidden md:block relative w-[220px] lg:flex-1 lg:min-w-[220px] lg:max-w-[520px] xl:max-w-[620px]" style={{ zIndex: 100 }}>
            <div 
              className="relative group cursor-text"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Search bar clicked, opening dropdown');
                searchInputRef.current?.focus();
                setShowSearch(true);
              }}
            >
              {/* Search Input with Modern Glass Effect */}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={(e) => {
                  e.stopPropagation();
                  console.log('Input focused, showSearch:', true);
                  setShowSearch(true);
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Search products..."
                className={`w-full pl-11 ${searchQuery.length > 0 ? 'pr-20' : 'pr-4'} py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 backdrop-blur-sm border transition-all duration-300 ${isDarkMode ? 'bg-gray-800/60 border-white/20 text-white placeholder-gray-400 focus:bg-gray-800/80' : 'bg-white/70 border-white/60 text-gray-800 placeholder-gray-500 focus:bg-white/90'} shadow-sm group-hover:shadow-md cursor-text`}
              />
              {/* Search Icon */}
              <div className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-white/10 group-hover:bg-white/20' : 'bg-primary-50 group-hover:bg-primary-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-colors duration-300 ${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-primary-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Clear Search Icon - Shows when there's text */}
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                    setSearchResults([]);
                    searchInputRef.current?.focus();
                  }}
                  className={`absolute right-10 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-700'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

            </div>

            {/* Enhanced Glass Search Dropdown */}
            {showSearch && (
              <div 
                className={`absolute top-[calc(100%+12px)] left-0 w-80 ${isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl shadow-2xl rounded-2xl max-h-80 overflow-y-auto border ${isDarkMode ? 'border-white/20' : 'border-gray-200'} scrollbar-hide`} 
                style={{ 
                  zIndex: 99999,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {/* Glass Shine */}
                <div className={`absolute inset-0 bg-gradient-to-b ${isDarkMode ? 'from-white/5 to-transparent' : 'from-white/40 to-transparent'} pointer-events-none`} />
                
                {/* Search Results */}
                {searchQuery.length >= 2 && searchResults.length > 0 ? (
                  <div className="relative z-10 p-3">
                    <div className={`text-xs font-semibold mb-2 px-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Products</div>
                    {searchResults.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => {
                          navigate(`/products?search=${encodeURIComponent(product.name)}`);
                          setShowSearch(false);
                          setSearchQuery('');
                        }}
                        className={`flex items-center p-3 rounded-xl transition-all duration-200 group cursor-pointer ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-primary-50/80'}`}
                      >
                        {/* Product Icon/Image */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 text-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} overflow-hidden`}>
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>🥛</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{product.name}</p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>₹{product.price} • {product.category}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    ))}
                    <Link
                      to={`/products?search=${encodeURIComponent(searchQuery)}`}
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                      }}
                      className={`block p-3 mt-2 text-center text-sm font-medium rounded-xl transition-all duration-200 ${isDarkMode ? 'text-primary-400 hover:bg-white/10' : 'text-primary-600 hover:bg-primary-50'}`}
                    >
                      View all results
                    </Link>
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="relative z-10 p-8 text-center">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No products found</p>
                  </div>
                ) : (
                  /* Quick Suggestions */
                  <div className="relative z-10 p-3">
                    <div className={`text-xs font-semibold mb-2 px-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quick Search</div>
                    <div className="space-y-1">
                      {[
                        { term: 'Groceries', icon: '🛒', desc: 'Daily essentials' },
                        { term: 'Desi Ghee', icon: '🧈', desc: 'Pure & natural' },
                        { term: 'Paneer', icon: '🧀', desc: 'Fresh cottage cheese' },
                        { term: 'Curd', icon: '🥣', desc: 'Probiotic rich' }
                      ].map((item) => (
                        <div
                          key={item.term}
                          onClick={() => {
                            setSearchQuery(item.term);
                            navigate(`/products?search=${encodeURIComponent(item.term)}`);
                            setShowSearch(false);
                          }}
                          className={`flex items-center p-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-primary-50/80'}`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mr-3 text-lg ${isDarkMode ? 'bg-gray-800' : 'bg-primary-100'}`}>
                            {item.icon}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{item.term}</p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</p>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>

          <div className="hidden md:flex items-center space-x-1 ml-1 lg:ml-2">
            <Link 
              to="/" 
              className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 group ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'}`}
            >
              <span className="relative z-10">Home</span>
              {/* Animated Underline */}
              <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
            </Link>
            <Link 
              to="/products" 
              className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 group ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'}`}
            >
              <span className="relative z-10">Products</span>
              {/* Animated Underline */}
              <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1 lg:space-x-2 shrink-0 ml-auto">
            <button
              onClick={toggleTheme}
              className={`hidden md:inline-flex relative p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 group overflow-hidden ${isDarkMode ? 'text-gray-300 hover:text-yellow-400 hover:bg-white/10' : 'text-gray-600 hover:text-primary-600 hover:bg-primary-100/50'}`}
              aria-label="Toggle dark mode"
            >
              {/* Button Glow Effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/30 to-primary-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12 group-hover:animate-shimmer"></span>
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <Link to="/wishlist" className={`hidden md:inline-flex relative p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 group overflow-hidden ${isDarkMode ? 'text-gray-300 hover:text-red-400 hover:bg-white/10' : 'text-gray-600 hover:text-red-500 hover:bg-red-50/50'}`}>
              {/* Heart Pulse Effect */}
              <span className="absolute inset-0 bg-red-500/20 rounded-xl opacity-0 group-hover:opacity-100 animate-pulse"></span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            <Link to="/cart" className={`relative p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 group overflow-hidden ${isDarkMode ? 'text-gray-300 hover:text-primary-400 hover:bg-white/10' : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'}`}>
              {/* Cart Glow Effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/20 to-primary-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md border border-white dark:border-gray-900">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {user || adminAuthState ? (
              <div className="flex items-center space-x-4">
                {/* Admin Notification Bell - Only show when admin is authenticated */}
                {adminAuthState && (
                  <AdminNotifications onPaymentClick={handleNotificationClick} />
                )}
                
                {adminAuthState && (
                  <Link to={ADMIN_PATH} className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium">
                    {getAdminUser()?.name || 'Admin'}
                  </Link>
                )}
                {user && !adminAuthState && (
                  <Link to="/account" className="text-gray-600 hover:text-primary-600 transition-colors dark:text-gray-300 dark:hover:text-primary-400 max-w-[170px]">
                    <span className="flex items-center space-x-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span
                        className="hidden lg:inline-block max-w-[140px] xl:max-w-[180px] truncate align-bottom"
                        title={user.name || ''}
                      >
                        {user.name}
                      </span>
                    </span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className={`p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110 ${isDarkMode ? 'text-gray-300 hover:text-red-400 hover:bg-white/10' : 'text-gray-600 hover:text-red-500 hover:bg-red-50/50'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 lg:space-x-2">
                <Link 
                  to="/login" 
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50/50'}`}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg hover:shadow-primary-500/30 transform hover:scale-105`}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowMobileMenu((v) => !v)}
            className={`md:hidden ml-auto p-2.5 rounded-xl transition-all duration-300 ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50/50'}`}
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSearchSubmit} className="md:hidden pb-3" ref={searchRef}>
          <div className={`flex items-center rounded-2xl px-3 py-2 border ${isDarkMode ? 'bg-gray-800/70 border-white/10' : 'bg-white/70 border-gray-200'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchQuery}
              onChange={handleSearch}
              onFocus={() => setShowSearch(true)}
              placeholder="Search products..."
              className={`ml-2 w-full bg-transparent outline-none text-sm ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'}`}
            />
          </div>
        </form>
        </div>
      </div>
      <div className={`md:hidden fixed inset-0 z-[120] transition-all duration-300 ${showMobileMenu ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div
            className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-300 ${showMobileMenu ? 'bg-black/45 opacity-100' : 'bg-black/0 opacity-0'}`}
            onClick={() => setShowMobileMenu(false)}
          />
          <div
            className={`absolute top-0 right-0 h-full w-[86%] max-w-sm ${isDarkMode ? 'bg-gray-900/98 border-l border-white/10' : 'bg-white/98 border-l border-gray-200'} backdrop-blur-xl shadow-2xl p-4 transform transition-transform duration-300 ease-out ${showMobileMenu ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={() => setShowMobileMenu(false)}
                className={`group relative inline-flex items-center p-2.5 rounded-xl border transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'text-gray-200 border-white/10 bg-white/5 hover:bg-white/10' : 'text-gray-700 border-gray-200 bg-white hover:bg-gray-100'} shadow-sm`}
                aria-label="Close menu"
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className={`hidden md:inline-block pointer-events-none absolute -bottom-7 right-0 whitespace-nowrap text-[11px] font-semibold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-800 text-white'}`}>
                  Close
                </span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <Link to="/" onClick={() => setShowMobileMenu(false)} className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}><span>🏠</span>Home</Link>
              <Link to="/products" onClick={() => setShowMobileMenu(false)} className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}><span>🛍️</span>Products</Link>
              <Link to="/wishlist" onClick={() => setShowMobileMenu(false)} className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}><span>❤️</span>Wishlist</Link>
              <Link to="/cart" onClick={() => setShowMobileMenu(false)} className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}><span>🛒</span>Cart</Link>
              {user || adminAuthState ? (
                <>
                  <Link to="/account" onClick={() => setShowMobileMenu(false)} className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}><span>👤</span>Account</Link>
                  <button onClick={() => { setShowMobileMenu(false); handleLogout(); }} className={`px-4 py-3 rounded-xl text-sm font-semibold text-left flex items-center gap-3 transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'}`}><span>🚪</span>Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setShowMobileMenu(false)} className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}><span>🔐</span>Login</Link>
                  <Link to="/register" onClick={() => setShowMobileMenu(false)} className="px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-500 to-secondary-500 text-white flex items-center gap-3 transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"><span>✨</span>Sign Up</Link>
                </>
              )}
              <button
                onClick={toggleTheme}
                className={`px-4 py-3 rounded-xl text-sm font-semibold text-left flex items-center gap-3 transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}
              >
                <span>🌗</span>Toggle Theme
              </button>
            </div>
          </div>
        </div>
    </nav>
    <div className="h-36 md:h-28"></div>
    </>
  );
};

export default Navbar;
