import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiX, FiSun, FiMoon, FiShoppingCart, FiUser, FiArrowRight } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const ModernNavbar = ({ cartCount = 0, user }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    { to: '/subscriptions', label: 'Plans' }
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[80] border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black">
                P
              </div>
              <div>
                <p className="text-sm font-black tracking-wide text-slate-900 dark:text-white">PINQOZA</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-0.5">Fresh. Fast. Trusted.</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {isDarkMode ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
              </button>

              <Link
                to="/cart"
                className="relative h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center"
              >
                <FiShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <Link
                  to="/account"
                  className="hidden md:inline-flex items-center gap-2 px-3 h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-semibold"
                >
                  <FiUser className="w-4 h-4" /> Account
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="hidden md:inline-flex items-center gap-2 px-3 h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-semibold"
                >
                  Sign In <FiArrowRight className="w-4 h-4" />
                </Link>
              )}

              <button
                className="md:hidden h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center"
                onClick={() => setIsMobileOpen((v) => !v)}
                aria-label="Open menu"
              >
                {isMobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileOpen && (
          <div className="md:hidden border-t border-black/5 dark:border-white/10 bg-white/95 dark:bg-slate-950/95">
            <div className="px-4 py-3 grid gap-2">
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to={user ? '/account' : '/login'}
                onClick={() => setIsMobileOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900"
              >
                {user ? 'Go to Account' : 'Sign In'}
              </Link>
            </div>
          </div>
        )}
      </header>

      <div className="h-16" />
    </>
  );
};

export default ModernNavbar;
