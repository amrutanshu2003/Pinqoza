import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const HomeRebuild = () => {
  const { isDarkMode } = useTheme();

  const highlights = [
    { title: 'Fast Delivery', desc: 'Order aaj, same-day doorstep delivery.' },
    { title: 'Fresh Quality', desc: 'Daily-checked products with premium quality.' },
    { title: 'Best Value', desc: 'Smart bundles, better prices, real savings.' }
  ];

  const categories = [
    { name: 'Daily Essentials', emoji: '??' },
    { name: 'Premium Dairy', emoji: '??' },
    { name: 'Family Combos', emoji: '??' },
    { name: 'Healthy Picks', emoji: '??' }
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-cyan-400/25 blur-3xl animate-blob" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl animate-blob animation-delay-2000" />

      <section className="relative rounded-3xl border border-white/30 dark:border-white/10 bg-gradient-to-br from-cyan-50 via-white to-blue-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-6 md:p-10 shadow-xl">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              TRUSTED BY MODERN FAMILIES
            </p>
            <h1 className="mt-4 text-3xl md:text-5xl font-black leading-tight text-slate-900 dark:text-white">
              Make Shopping Feel
              <span className="block text-cyan-600 dark:text-cyan-400">Effortless & Premium</span>
            </h1>
            <p className="mt-4 text-slate-600 dark:text-slate-300 text-sm md:text-base max-w-xl">
              Pinqoza is designed to feel smooth, fast, and delightful so users stay longer, trust faster, and buy confidently.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register" className="px-5 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-bold">
                Start Shopping
              </Link>
              <Link to="/subscriptions" className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-700 dark:text-slate-100">
                View Membership Plans
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 rounded-2xl p-5 bg-slate-900 text-white dark:bg-slate-800 shadow-lg">
              <p className="text-xs uppercase tracking-wider text-cyan-300">Today Special</p>
              <h3 className="mt-2 text-2xl font-black">Fresh Deals Zone</h3>
              <p className="mt-1 text-sm text-slate-200">Smart bundles crafted for family savings.</p>
            </div>
            {highlights.map((item) => (
              <div key={item.title} className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{item.title}</h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat, idx) => (
          <div
            key={cat.name}
            className="rounded-2xl p-4 border border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/75 hover:-translate-y-1 transition-transform duration-300"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="text-2xl">{cat.emoji}</div>
            <h3 className="mt-2 text-sm font-extrabold text-slate-900 dark:text-white">{cat.name}</h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Curated for speed, quality, and repeat orders.</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-3xl p-6 md:p-8 bg-gradient-to-r from-slate-900 to-blue-900 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black">Build trust. Increase retention. Grow sales.</h2>
            <p className="mt-2 text-sm text-blue-100">Exactly the kind of real-world experience that keeps people coming back.</p>
          </div>
          <Link to="/contact" className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm">
            Contact Pinqoza Team
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomeRebuild;
