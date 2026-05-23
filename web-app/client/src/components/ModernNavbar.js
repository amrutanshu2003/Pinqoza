import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiShoppingBag, FiUser, FiShoppingCart, FiHeart, FiCalendar, FiLogOut, FiCreditCard, FiMenu, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { clearAuthData, getAdminUser } from '../util/auth';
import ADMIN_PATH from '../config/adminPath';

const isAdminAuthenticated = () => !!localStorage.getItem('adminToken');

const ModernNavbar = ({ cartCount, user, onLogout }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user: authUser } = useAuth();
  const currentUser = authUser || user;

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const adminAuthState = isAdminAuthenticated();

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/products?search=${encodeURIComponent(q)}`);
    setShowMobileMenu(false);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    const isAdmin = adminAuthState || localStorage.getItem('adminToken');
    if (isAdmin) {
      localStorage.clear();
      sessionStorage.clear();
      window.dispatchEvent(new CustomEvent('adminAuthChange', { detail: { isAuthenticated: false } }));
      window.location.href = ADMIN_PATH;
      return;
    }

    if (onLogout) onLogout();
    else clearAuthData();

    sessionStorage.removeItem('intendedUrl');
    window.dispatchEvent(new CustomEvent('mm_logged_out'));
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-6">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 h-16">
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <img src="/icon.svg" alt="Pinqoza" className="w-10 h-10 rounded-lg" draggable="false" />
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">Pinqoza</span>
            </Link>

            <div className="hidden lg:block">
              <form onSubmit={onSearchSubmit} className="relative max-w-[520px] mx-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full h-10 pl-4 pr-20 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 text-sm"
                />
                <button type="submit" className="absolute right-1.5 top-1.5 h-7 px-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600">Go</button>
              </form>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button onClick={toggleTheme} className="p-2 text-gray-700 dark:text-gray-200" aria-label="Toggle theme">
                {isDarkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
              </button>
              <button onClick={() => setShowMobileMenu((v) => !v)} className="md:hidden p-2 text-gray-700 dark:text-gray-200" aria-label="Open menu">
                <FiMenu className="w-6 h-6" />
              </button>
              <div className="hidden md:flex items-center gap-3">
                <Link to="/wishlist" className="p-2 text-gray-700 dark:text-gray-200"><FiHeart className="w-5 h-5" /></Link>
                <Link to="/cart" className="relative p-2 text-gray-700 dark:text-gray-200">
                  <FiShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span>}
                </Link>
                {!currentUser && !adminAuthState ? (
                  <Link to="/login" className="px-3 py-1.5 rounded-full text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600">Get Started</Link>
                ) : (
                  <button onClick={() => setShowLogoutModal(true)} className="px-3 py-1.5 rounded-full text-sm border border-red-400/50 text-red-600 dark:text-red-400">Logout</button>
                )}
              </div>
            </div>
          </div>

          <div className="md:hidden pb-2">
            <form onSubmit={onSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full h-10 pl-4 pr-20 rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-900/90 text-sm"
              />
              <button type="submit" className="absolute right-1.5 top-1.5 h-7 px-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600">Go</button>
            </form>
          </div>

          <div className="md:hidden pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <Link to="/products?category=milk" className="shrink-0 min-w-[82px] flex flex-col items-center justify-center py-2 rounded-lg bg-white/70 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-700/70 text-xs font-medium text-gray-700 dark:text-gray-200"><span>??</span><span>Milk</span></Link>
              <Link to="/products?category=ghee" className="shrink-0 min-w-[82px] flex flex-col items-center justify-center py-2 rounded-lg bg-white/70 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-700/70 text-xs font-medium text-gray-700 dark:text-gray-200"><span>??</span><span>Ghee</span></Link>
              <Link to="/products?category=cheese" className="shrink-0 min-w-[82px] flex flex-col items-center justify-center py-2 rounded-lg bg-white/70 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-700/70 text-xs font-medium text-gray-700 dark:text-gray-200"><span>??</span><span>Cheese</span></Link>
              <Link to="/products?category=curd" className="shrink-0 min-w-[82px] flex flex-col items-center justify-center py-2 rounded-lg bg-white/70 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-700/70 text-xs font-medium text-gray-700 dark:text-gray-200"><span>??</span><span>Curd</span></Link>
              <Link to="/products?category=butter" className="shrink-0 min-w-[82px] flex flex-col items-center justify-center py-2 rounded-lg bg-white/70 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-700/70 text-xs font-medium text-gray-700 dark:text-gray-200"><span>??</span><span>Butter</span></Link>
            </div>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200/70 dark:border-gray-700/70 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl">
            <div className="px-3 py-3 space-y-2">
              <Link to="/wishlist" onClick={() => setShowMobileMenu(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 dark:border-gray-700/70 bg-white/60 dark:bg-gray-800/40 text-sm font-semibold text-gray-800 dark:text-gray-100"><FiHeart className="w-4 h-4 text-rose-500" />Wishlist</Link>
              {currentUser && <Link to="/subscriptions" onClick={() => setShowMobileMenu(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 dark:border-gray-700/70 bg-white/60 dark:bg-gray-800/40 text-sm font-semibold text-gray-800 dark:text-gray-100"><FiCalendar className="w-4 h-4 text-purple-500" />Subscription</Link>}
              {currentUser && <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/20 dark:border-gray-700/70 bg-white/60 dark:bg-gray-800/40 text-sm font-semibold text-gray-800 dark:text-gray-100"><span className="inline-flex items-center gap-3"><FiCreditCard className="w-4 h-4 text-yellow-500" />Wallet</span><span className="text-yellow-600 dark:text-yellow-300 font-bold">?250</span></div>}
              {!currentUser && !adminAuthState && <Link to="/login" onClick={() => setShowMobileMenu(false)} className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-semibold text-white">Get Started</Link>}
              {(currentUser || adminAuthState) && <button onClick={() => { setShowMobileMenu(false); setShowLogoutModal(true); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-400/50 bg-red-500/10 text-sm font-semibold text-red-600 dark:text-red-400"><FiLogOut className="w-4 h-4" />Logout</button>}
            </div>
          </div>
        )}
      </nav>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[70] border-t border-gray-200/70 dark:border-gray-700/70 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
        <div className="grid grid-cols-4 px-1 py-1">
          <Link to="/" className="flex flex-col items-center justify-center py-2 text-[11px] font-medium text-gray-700 dark:text-gray-200"><FiHome className="w-5 h-5 mb-1" />Home</Link>
          <Link to="/orders" className="flex flex-col items-center justify-center py-2 text-[11px] font-medium text-gray-700 dark:text-gray-200"><FiShoppingBag className="w-5 h-5 mb-1" />Orders</Link>
          <Link to="/account" className="flex flex-col items-center justify-center py-2 text-[11px] font-medium text-gray-700 dark:text-gray-200"><FiUser className="w-5 h-5 mb-1" />Account</Link>
          <Link to="/cart" className="relative flex flex-col items-center justify-center py-2 text-[11px] font-medium text-gray-700 dark:text-gray-200"><FiShoppingCart className="w-5 h-5 mb-1" />Cart{cartCount > 0 && <span className="absolute top-1 right-5 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span>}</Link>
        </div>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className={`relative max-w-sm w-full rounded-3xl shadow-2xl ${isDarkMode ? 'bg-gray-900/95 border border-gray-700/50' : 'bg-white/95 border border-gray-200/50'}`}>
            <div className="p-6 text-center">
              <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Logout Confirmation</h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Are you sure you want to logout?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutModal(false)} className={`flex-1 py-3 px-4 rounded-xl font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
                <button onClick={confirmLogout} className="flex-1 py-3 px-4 text-white rounded-xl font-medium bg-gradient-to-r from-blue-500 to-purple-600">Logout</button>
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
