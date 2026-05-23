import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { searchProducts, adminLogout } from '../services/api';
import { isAdmin, getAdminUser, clearAuthData } from '../util/auth';
import AdminNotifications from './AdminNotifications';
import ADMIN_PATH from '../config/adminPath';

const SuperModernNavbar = ({ cartCount, user, onLogout }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [adminAuthState, setAdminAuthState] = useState(isAdminAuthenticated());
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const handleLogout = () => {
    onLogout();
    if (isAdminAuthenticated()) {
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
      setShowSearch(false);
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
      {/* Super Modern Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-b border-white/20 dark:border-gray-800/20 shadow-2xl' 
          : 'bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-white/10 dark:border-gray-800/10 shadow-lg'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Modern Logo */}
            <Link to="/" className="flex items-center space-x-4 group">
              <div className="relative">
                {/* Logo container */}
                <div className="w-14 h-14 relative">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-30 blur-xl transition-all duration-300"></div>
                  
                  <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-500 group-hover:rotate-6 group-hover:scale-105">
                    <img
                      src="/icon.svg"
                      alt="Pinqoza"
                      className="w-full h-full"
                      draggable="false"
                    />
                  </div>
                </div>
              </div>
              
              {/* Modern Brand */}
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent transform transition-all duration-300 group-hover:scale-105">
                  Pinqoza
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wider">SHOP EVERYTHING</span>
              </div>
            </Link>

            {/* Modern Search Bar */}
            <div className="hidden lg:block flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
                    placeholder="Search phones, fashion, groceries..."
                    className="w-full px-6 py-4 pl-14 bg-gray-100 dark:bg-black border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 group-hover:bg-white dark:group-hover:bg-gray-700"
                  />
                  
                  {/* Search Icon */}
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Modern Search Dropdown */}
                  {showSearch && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-black rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-[40] backdrop-blur-xl">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Search Results</p>
                      </div>
                      {searchResults.map((product, index) => (
                        <Link
                          key={product._id}
                          to={`/products/${product._id}`}
                          onClick={() => {
                            setShowSearch(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group/item"
                        >
                          <div className="w-12 h-12 bg-gray-100 dark:bg-black rounded-xl flex items-center justify-center mr-4 group-hover/item:bg-blue-50 dark:group-hover/item:bg-blue-900/20 transition-colors">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-lg" />
                            ) : (
                              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 2v2h1v14a4 4 0 004 4h0a4 4 0 004-4V4h1V2H7zm2 2h6v14a2 2 0 01-2 2h0a2 2 0 01-2-2V4z"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">₹{product.price} • {product.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">View →</p>
                          </div>
                        </Link>
                      ))}
                      <Link
                        to={`/products?search=${encodeURIComponent(searchQuery)}`}
                        onClick={() => {
                          setShowSearch(false);
                          setSearchQuery('');
                        }}
                        className="block p-4 text-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
                      >
                        View all results →
                      </Link>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Modern Navigation Links */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link
                to="/products"
                className="relative text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-all duration-300 group"
              >
                Products
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              <Link
                to="/about"
                className="relative text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-all duration-300 group"
              >
                About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              <Link
                to="/contact"
                className="relative text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-all duration-300 group"
              >
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>

            {/* Modern Action Buttons */}
            <div className="flex items-center space-x-4">
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="relative p-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 group"
                aria-label="Toggle theme"
              >
                <div className="relative">
                  {isDarkMode ? (
                    <svg className="w-6 h-6 transform transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 transform transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </button>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative p-3 text-gray-600 dark:text-gray-300 hover:text-red-500 transition-all duration-300 group"
              >
                <div className="relative">
                  <svg className="w-6 h-6 transform transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {/* Heart Pulse Effect */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-red-500 rounded-full animate-ping opacity-0 group-hover:opacity-30"></div>
                  </div>
                </div>
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-3 text-gray-600 dark:text-gray-300 hover:text-green-600 transition-all duration-300 group"
              >
                <div className="relative">
                  <svg className="w-6 h-6 transform transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {cartCount}
                    </span>
                  )}
                  {/* Cart Glow */}
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </Link>

              {/* Admin Notifications */}
              {adminAuthState && (
                <AdminNotifications onPaymentClick={handleNotificationClick} />
              )}

              {/* User Menu */}
              {user || isAdminAuthenticated() ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110">
                      <span className="text-white font-bold text-lg">
                        {user?.name?.charAt(0) || getAdminUser()?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {user?.name || getAdminUser()?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isAdminAuthenticated() ? 'Admin' : 'Customer'}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 transform transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-black rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {user?.name || getAdminUser()?.name || 'User'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user?.email || getAdminUser()?.email || 'user@example.com'}
                        </p>
                      </div>
                      <div className="py-2">
                        {isAdminAuthenticated() && (
                          <Link
                            to={ADMIN_PATH}
                            className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            🎛️ Admin Panel
                          </Link>
                        )}
                        <Link
                          to="/account"
                          className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          👤 My Profile
                        </Link>
                        <Link
                          to="/orders"
                          className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          📦 My Orders
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          🚪 Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-all duration-300"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700">
            <div className="px-4 py-6 space-y-4">
              <Link
                to="/products"
                className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Products
              </Link>
              <Link
                to="/about"
                className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Contact
              </Link>
              {!user && !isAdminAuthenticated() && (
                <>
                  <Link
                    to="/login"
                    className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-center"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-20"></div>
    </>
  );
};

export default SuperModernNavbar;
