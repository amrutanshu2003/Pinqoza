import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {
  const { isDarkMode } = useTheme();

  return (
    <footer className="mt-14 border-t border-black/5 dark:border-white/10 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Pinqoza</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Premium shopping experience designed for trust, speed, and repeat purchase.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Explore</h4>
            <div className="mt-3 grid gap-2 text-sm">
              <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Home</Link>
              <Link to="/about" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">About</Link>
              <Link to="/contact" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Contact</Link>
              <Link to="/subscriptions" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Plans</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Help</h4>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
              <p>Delivery Support</p>
              <p>Payment Security</p>
              <p>Order Tracking</p>
              <p>Customer Care</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Newsletter</h4>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Offers and updates directly in your inbox.</p>
            <div className="mt-3 flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
              <button className="px-3 h-10 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-bold">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-black/5 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} Pinqoza. All rights reserved.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Crafted for real-world growth and customer delight.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
