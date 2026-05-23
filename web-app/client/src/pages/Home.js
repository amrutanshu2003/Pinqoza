import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getFeaturedProducts, getProductCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useTheme } from '../context/ThemeContext';

const Home = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchDraft, setSearchDraft] = useState('');

  const categoryChips = useMemo(
    () => [
      { key: 'groceries', label: 'Groceries', emoji: '\uD83D\uDED2' },
      { key: 'fashion', label: 'Fashion', emoji: '\uD83D\uDC55' },
      { key: 'electronics', label: 'Electronics', emoji: '\uD83D\uDCF1' },
      { key: 'home', label: 'Home', emoji: '\uD83C\uDFE0' },
      { key: 'beauty', label: 'Beauty', emoji: '\uD83E\uDDF4' }
    ],
    []
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [featuredRes, categoriesRes] = await Promise.all([getFeaturedProducts(), getProductCategories()]);
        if (!mounted) return;
        setFeaturedProducts(Array.isArray(featuredRes.data) ? featuredRes.data : []);
        setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      } catch (e) {
        if (!mounted) return;
        setFeaturedProducts([]);
        setCategories([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const goToProducts = (params) => {
    const sp = new URLSearchParams(params);
    setSearchParams(sp);
    navigate(`/products?${sp.toString()}`);
  };

  const visibleCategories = useMemo(() => {
    const preferred = new Set(categoryChips.map((c) => c.key));
    const extra = categories.filter((c) => !preferred.has(c)).slice(0, 6);
    return [...categoryChips, ...extra.map((c) => ({ key: c, label: c, emoji: '\uD83D\uDECD\uFE0F' }))];
  }, [categories, categoryChips]);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className={`rounded-3xl overflow-hidden border ${isDarkMode ? 'border-white/10 bg-gray-900/60' : 'border-gray-200 bg-white'}`}>
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-2xl">
              <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pinqoza Marketplace</div>
              <h1 className={`mt-2 text-3xl md:text-5xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Shop everything you need, in one place.
              </h1>
              <p className={`mt-4 text-base md:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Groceries, fashion, electronics, home, beauty and more. Fast delivery and great deals.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = searchDraft.trim();
                  if (!q) return;
                  goToProducts({ search: q });
                }}
                className="mt-6"
              >
                <div className={`flex items-center gap-2 p-2 rounded-2xl border ${isDarkMode ? 'border-white/10 bg-black/40' : 'border-gray-200 bg-gray-50'}`}>
                  <input
                    value={searchDraft}
                    onChange={(e) => setSearchDraft(e.target.value)}
                    placeholder="Search products, brands, categories..."
                    className={`flex-1 bg-transparent outline-none px-3 py-2 ${isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                  />
                  <button type="submit" className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold">
                    Search
                  </button>
                </div>
              </form>

              <div className="mt-5 flex flex-wrap gap-2">
                {categoryChips.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => goToProducts({ category: c.key })}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold border transition ${
                      isDarkMode ? 'border-white/10 text-gray-200 hover:bg-white/5' : 'border-gray-200 text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{c.emoji}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Deals card */}
            <div className={`w-full md:w-[380px] rounded-3xl border overflow-hidden ${isDarkMode ? 'border-white/10 bg-black/40' : 'border-gray-200 bg-gray-50'}`}>
              <div className="p-6">
                <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  {'\u26A1'} TOP DEALS
                </div>
                <div className={`mt-3 text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Save more everyday</div>
                <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Discover trending items and best-value picks across categories.
                </div>
                <div className="mt-5 flex gap-3">
                  <Link to="/products?sort=price_asc" className="flex-1 text-center px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold">
                    View Deals
                  </Link>
                  <Link
                    to="/contact"
                    className={`flex-1 text-center px-4 py-2 rounded-2xl font-semibold border ${
                      isDarkMode ? 'border-white/10 text-gray-200 hover:bg-white/5' : 'border-gray-300 text-gray-800 hover:bg-white'
                    }`}
                  >
                    Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>CATEGORIES</div>
            <h2 className={`mt-1 text-2xl md:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Top Categories</h2>
          </div>
          <Link to="/products" className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>
            View all
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {visibleCategories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => goToProducts({ category: c.key })}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold border transition ${
                isDarkMode ? 'border-white/10 text-gray-200 hover:bg-white/5' : 'border-gray-200 text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{c.emoji}</span>
              <span className="capitalize">{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>TRENDING</div>
            <h2 className={`mt-1 text-2xl md:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Trending Now</h2>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Popular picks people are buying today.</p>
          </div>
          <Link to="/products?sort=rating_desc" className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>
            Explore
          </Link>
        </div>

        {loading ? (
          <div className={`mt-4 rounded-2xl p-10 text-center ${isDarkMode ? 'bg-gray-900/60 border border-white/10 text-gray-200' : 'bg-white border border-gray-200 text-gray-700'}`}>
            Loading…
          </div>
        ) : featuredProducts.length ? (
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.slice(0, 8).map((p, idx) => (
              <div key={p._id} className={`${isDarkMode ? 'bg-gray-900/40' : 'bg-white'} rounded-2xl border ${isDarkMode ? 'border-white/10' : 'border-gray-200'} overflow-hidden`}>
                <ProductCard product={p} index={idx} />
              </div>
            ))}
          </div>
        ) : (
          <div className={`mt-4 rounded-2xl p-10 text-center ${isDarkMode ? 'bg-gray-900/60 border border-white/10 text-gray-200' : 'bg-white border border-gray-200 text-gray-700'}`}>
            No trending products yet. Seed the marketplace data to see products here.
          </div>
        )}
      </section>

      {/* Trust blocks */}
      <section className={`rounded-3xl border p-6 md:p-8 ${isDarkMode ? 'border-white/10 bg-gray-900/60' : 'border-gray-200 bg-white'}`}>
        <div className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>WHY PINQOZA</div>
        <div className={`mt-1 text-2xl md:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Shop with confidence</div>
        <div className="mt-5 grid md:grid-cols-3 gap-4">
          {[
            { title: 'Fast Delivery', body: 'Quick and reliable doorstep delivery.', icon: '\u26A1' },
            { title: 'Secure Payments', body: 'Multiple payment options with safety in mind.', icon: '\uD83D\uDD12' },
            { title: 'Support', body: 'We are here to help you when you need it.', icon: '\uD83D\uDCAC' }
          ].map((b) => (
            <div key={b.title} className={`rounded-2xl p-5 border ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold">
                  {b.icon}
                </div>
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{b.title}</div>
              </div>
              <div className={`mt-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{b.body}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
﻿
