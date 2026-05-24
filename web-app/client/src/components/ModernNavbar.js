import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiShoppingBag,
  FiUser,
  FiShoppingCart,
  FiHeart,
  FiCalendar,
  FiLogOut,
  FiCreditCard,
  FiMenu,
  FiSun,
  FiMoon,
  FiSearch,
  FiBox,
  FiChevronRight
} from 'react-icons/fi';
import { MdLocalDrink, MdIcecream, MdBakeryDining } from 'react-icons/md';
import { GiMilkCarton, GiButter, GiCheeseWedge } from 'react-icons/gi';
import { FaRegUserCircle } from 'react-icons/fa';
import { RiFileList3Line } from 'react-icons/ri';
import { TbLayoutGridAdd } from 'react-icons/tb';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { searchProducts } from '../services/api';
import { clearAuthData } from '../util/auth';
import ADMIN_PATH from '../config/adminPath';

const isAdminAuthenticated = () => !!localStorage.getItem('adminToken');

const categories = [
  { label: 'Milk', value: 'milk', icon: GiMilkCarton },
  { label: 'Ghee', value: 'ghee', icon: MdLocalDrink },
  { label: 'Cheese', value: 'cheese', icon: GiCheeseWedge },
  { label: 'Curd', value: 'curd', icon: MdIcecream },
  { label: 'Butter', value: 'butter', icon: GiButter },
  { label: 'Paneer', value: 'paneer', icon: MdBakeryDining },
  { label: 'Yogurt', value: 'yogurt', icon: MdLocalDrink },
  { label: 'Cream', value: 'cream', icon: FiBox },
  { label: 'Sweets', value: 'sweets', icon: MdBakeryDining },
  { label: 'Grocery', value: 'grocery', icon: FiShoppingBag }
];

const ModernNavbar = ({ cartCount, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user: authUser } = useAuth();
  const currentUser = authUser || user;

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDesktopAccountMenu, setShowDesktopAccountMenu] = useState(false);

  const searchWrapRef = useRef(null);
  const desktopMenuRef = useRef(null);
  const adminAuthState = isAdminAuthenticated();

  const canShowSuggestions = isSearchOpen && searchQuery.trim().length > 0;
  const activeCategory = new URLSearchParams(location.search).get('category') || '';
  const userInitial = (currentUser?.name || currentUser?.email || 'U').trim().charAt(0).toUpperCase();

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await searchProducts(trimmed, 8);
        const payload = res?.data;
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.products)
            ? payload.products
            : Array.isArray(payload?.results)
              ? payload.results
              : [];
        setSearchResults(items);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('touchstart', closeOnOutside);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('touchstart', closeOnOutside);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const closeDesktopMenuOnOutside = (event) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target)) {
        setShowDesktopAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', closeDesktopMenuOnOutside);
    return () => document.removeEventListener('mousedown', closeDesktopMenuOnOutside);
  }, []);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/products?search=${encodeURIComponent(q)}`);
    setIsSearchOpen(false);
    setShowMobileMenu(false);
  };

  const openSuggestion = (item) => {
    const productId = item?._id || item?.id;
    if (productId) {
      navigate(`/product/${productId}`);
    } else {
      const term = item?.name || searchQuery.trim();
      navigate(`/products?search=${encodeURIComponent(term)}`);
    }
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
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

  const searchDropdown = useMemo(
    () => (
      <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[80] rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-xl overflow-hidden">
        {isSearching && <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Searching...</div>}
        {!isSearching && searchQuery.trim().length < 2 && (
          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Type at least 2 letters</div>
        )}
        {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No products found</div>
        )}
        {!isSearching && searchResults.map((item, idx) => (
          <button
            key={item?._id || item?.id || `${item?.name || 'item'}-${idx}`}
            type="button"
            onClick={() => openSuggestion(item)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-blue-50/80 dark:hover:bg-gray-800/70"
          >
            <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{item?.name || 'Product'}</span>
            <FiChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        ))}
      </div>
    ),
    [isSearching, searchQuery, searchResults]
  );

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-6">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 h-16">
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <img src="/icon.svg" alt="Pinqoza" className="w-10 h-10 rounded-lg" draggable="false" />
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">Pinqoza</span>
            </Link>

            <div className="hidden lg:block" ref={searchWrapRef}>
              <form onSubmit={onSearchSubmit} className="relative max-w-[520px] mx-auto">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search products..."
                  className="w-full h-10 pl-10 pr-20 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 text-sm"
                />
                <button type="submit" className="absolute right-1.5 top-1.5 h-7 px-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600">Go</button>
                {canShowSuggestions && searchDropdown}
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
                  <div
                    className="relative"
                    ref={desktopMenuRef}
                    onMouseEnter={() => setShowDesktopAccountMenu(true)}
                  >
                    <button
                      type="button"
                      onClick={() => setShowDesktopAccountMenu(true)}
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-md"
                      aria-label="Account menu"
                    >
                      {userInitial}
                    </button>
                    {showDesktopAccountMenu && (
                      <div className="absolute right-0 top-full mt-5 w-56 rounded-2xl border border-white/15 bg-slate-900/90 backdrop-blur-md shadow-2xl overflow-hidden animate-[fadeIn_.22s_ease-out] z-[120]">
                        <Link to="/account" className="relative flex items-center gap-3 px-4 py-3 text-sm text-slate-100 hover:bg-cyan-500/15 transition-colors">
                          <FaRegUserCircle className="w-4 h-4 text-cyan-400" /> Account
                        </Link>
                        <Link to="/orders" className="relative flex items-center gap-3 px-4 py-3 text-sm text-slate-100 hover:bg-amber-500/15 transition-colors">
                          <RiFileList3Line className="w-4 h-4 text-amber-400" /> Orders
                        </Link>
                        <Link to="/subscriptions" className="relative flex items-center gap-3 px-4 py-3 text-sm text-slate-100 hover:bg-violet-500/15 transition-colors">
                          <TbLayoutGridAdd className="w-4 h-4 text-violet-400" /> Subscription
                        </Link>
                        <button
                          type="button"
                          onClick={() => setShowLogoutModal(true)}
                          className="relative w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <FiLogOut className="w-4 h-4 text-rose-500" /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="md:hidden pb-2" ref={searchWrapRef}>
            <form onSubmit={onSearchSubmit} className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search products..."
                className="w-full h-10 pl-10 pr-20 rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-900/90 text-sm"
              />
              <button type="submit" className="absolute right-1.5 top-1.5 h-7 px-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600">Go</button>
              {canShowSuggestions && searchDropdown}
            </form>
          </div>

          <div className={`md:hidden pb-2 -mx-2 px-2 border-b transition-all duration-300 ${
            isScrolled
              ? 'bg-white/95 dark:bg-gray-900/95 border-gray-200/70 dark:border-gray-700/70'
              : 'bg-black border-white/10'
          }`}>
            <div className={`flex flex-wrap items-center scrollbar-hide transition-all duration-300 ${
              isScrolled
                ? 'gap-2 pb-0.5 overflow-hidden'
                : 'gap-3 pb-1 overflow-hidden'
            }`}>
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory.toLowerCase() === category.value.toLowerCase();
                return (
                  <Link
                    key={category.value}
                    to={`/products?category=${encodeURIComponent(category.value)}`}
                    className={`shrink-0 min-w-[72px] flex items-center justify-center text-[12px] font-semibold transition-all duration-300 ${
                      isScrolled ? 'px-3 py-1.5 rounded-full border' : 'pt-2 pb-1 border-b-2'
                    } ${
                      isActive
                        ? isScrolled
                          ? 'text-blue-700 dark:text-blue-300 border-blue-500 bg-blue-50/80 dark:bg-blue-500/10'
                          : 'text-white border-blue-500'
                        : isScrolled
                          ? 'text-gray-700 dark:text-gray-300 border-gray-300/80 dark:border-gray-600'
                          : 'text-gray-400 border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-all duration-200 ${isScrolled ? 'opacity-0 w-0 mr-0' : `opacity-100 mb-1 ${isActive ? 'text-blue-400' : 'text-gray-500'}`}`} />
                    <span>{category.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200/70 dark:border-gray-700/70 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl">
            <div className="px-3 py-3 space-y-2">
              <Link to="/wishlist" onClick={() => setShowMobileMenu(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 dark:border-gray-700/70 bg-white/60 dark:bg-gray-800/40 text-sm font-semibold text-gray-800 dark:text-gray-100"><FiHeart className="w-4 h-4 text-rose-500" />Wishlist</Link>
              {currentUser && <Link to="/subscriptions" onClick={() => setShowMobileMenu(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 dark:border-gray-700/70 bg-white/60 dark:bg-gray-800/40 text-sm font-semibold text-gray-800 dark:text-gray-100"><FiCalendar className="w-4 h-4 text-purple-500" />Subscription</Link>}
              {currentUser && <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/20 dark:border-gray-700/70 bg-white/60 dark:bg-gray-800/40 text-sm font-semibold text-gray-800 dark:text-gray-100"><span className="inline-flex items-center gap-3"><FiCreditCard className="w-4 h-4 text-yellow-500" />Wallet</span><span className="text-yellow-600 dark:text-yellow-300 font-bold">Rs250</span></div>}
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

      <div className="h-16"></div>
    </>
  );
};

export default ModernNavbar;
