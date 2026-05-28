import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getFeaturedProducts, getProductCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useTheme } from '../context/ThemeContext';

const HomeRebuild = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchDraft, setSearchDraft] = useState('');

  const categoryChips = useMemo(
    () => [
      { key: 'groceries', label: 'Groceries', emoji: '🛒' },
      { key: 'fashion', label: 'Fashion', emoji: '👕' },
      { key: 'electronics', label: 'Electronics', emoji: '📱' },
      { key: 'home', label: 'Home', emoji: '🏠' },
      { key: 'beauty', label: 'Beauty', emoji: '🧴' }
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
    return [...categoryChips, ...extra.map((c) => ({ key: c, label: c, emoji: '🛍️' }))];
  }, [categories, categoryChips]);

  return (
    <div className="space-y-10">
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

            <div className={`w-full md:w-[380px] rounded-3xl border overflow-hidden ${isDarkMode ? 'border-white/10 bg-black/40' : 'border-gray-200 bg-gray-50'}`}>
              <div className="p-6">
                <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  ⚡ TOP DEALS
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

      <section className="pt-1">
        <div className="flex items-end justify-between gap-4">
          <div className="text-center flex-1">
            <h2 className={`group/heading inline-block relative pb-1 leading-[1.15] text-3xl md:text-4xl font-black tracking-tight ${
              isDarkMode
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-blue-300'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-500'
            }`}>
              Top Categories
              <span className="pointer-events-none absolute left-0 -bottom-2 h-[2px] w-full origin-center scale-x-0 bg-gradient-to-r from-transparent via-cyan-300 to-transparent transition-transform duration-500 ease-out group-hover/heading:scale-x-100" />
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-2 h-[7px] w-2/3 rounded-full bg-cyan-300/35 blur-md opacity-0 transition-opacity duration-500 ease-out group-hover/heading:opacity-100" />
            </h2>
            <div className={`mt-4 text-[11px] font-extrabold tracking-[0.2em] uppercase ${isDarkMode ? 'text-cyan-200/80' : 'text-sky-700/80'}`}>CATEGORIES</div>
          </div>
          <Link
            to="/products"
            className={`group inline-flex items-center gap-2 self-end rounded-full px-4 py-2 text-sm font-semibold border transition-all duration-300 ${
              isDarkMode
                ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-300/20 hover:border-cyan-200/60 hover:-translate-y-0.5'
                : 'border-sky-300/60 bg-sky-100/80 text-sky-800 hover:bg-sky-200/90 hover:border-sky-400 hover:-translate-y-0.5'
            }`}
          >
            <span>View all</span>
            <span className="transform-gpu transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-4 sm:gap-5">
          {visibleCategories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => goToProducts({ category: c.key })}
              className={`group relative w-full flex flex-col items-center justify-center min-h-[168px] sm:min-h-[192px] rounded-2xl border transition-all duration-500 overflow-hidden ${
                isDarkMode
                  ? 'border-white/10 bg-[linear-gradient(165deg,#081325_0%,#0d1e37_62%,#12294b_100%)] text-gray-100 hover:border-cyan-300/60 hover:-translate-y-1.5 hover:shadow-[0_26px_55px_-28px_rgba(34,211,238,0.88)]'
                  : 'border-gray-200 bg-[linear-gradient(165deg,#ffffff_0%,#eef6ff_62%,#e3f2ff_100%)] text-gray-800 hover:border-cyan-300/60 hover:-translate-y-1.5 hover:shadow-[0_22px_46px_-26px_rgba(14,165,233,0.5)]'
              }`}
            >
              <span className={`pointer-events-none absolute -inset-[1px] rounded-2xl opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100 ${
                isDarkMode
                  ? 'bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.52),transparent_66%)]'
                  : 'bg-[radial-gradient(circle_at_50%_45%,rgba(56,189,248,0.36),transparent_68%)]'
              }`} />
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.18),transparent_45%)]" />
              <span className="pointer-events-none absolute inset-x-4 top-3 h-px bg-gradient-to-r from-transparent via-cyan-200/45 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="pointer-events-none absolute inset-x-3 bottom-3 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative z-10 -translate-y-1.5 sm:-translate-y-2 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 ring-1 ring-white/20 shadow-[0_10px_24px_-14px_rgba(148,163,184,0.7)] text-[1.7rem] sm:text-[1.9rem] leading-none transform-gpu transition-transform duration-1000 ease-linear group-hover:scale-110 group-hover:rotate-[360deg]">
                <span className="inline-block transform-gpu transition-transform duration-1000 ease-linear group-hover:scale-110">{c.emoji}</span>
              </span>
              <span className="relative z-10 mt-3 text-sm sm:text-base font-bold capitalize leading-tight text-center transition-colors duration-300 group-hover:text-cyan-100">{c.label}</span>
              <span className={`relative z-10 mt-1 text-[10px] font-semibold uppercase tracking-wide ${
                isDarkMode ? 'text-cyan-200/75' : 'text-sky-700/70'
              }`}>
                Explore
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="pt-1">
        <div className="flex items-end justify-between gap-4">
          <div className="text-center flex-1">
            <h2 className={`group/heading inline-block relative pb-1 leading-[1.15] text-3xl md:text-4xl font-black tracking-tight ${
              isDarkMode
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-blue-300'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-500'
            }`}>
              Trending Now
              <span className="pointer-events-none absolute left-0 -bottom-2 h-[2px] w-full origin-center scale-x-0 bg-gradient-to-r from-transparent via-cyan-300 to-transparent transition-transform duration-500 ease-out group-hover/heading:scale-x-100" />
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-2 h-[7px] w-2/3 rounded-full bg-cyan-300/35 blur-md opacity-0 transition-opacity duration-500 ease-out group-hover/heading:opacity-100" />
            </h2>
            <div className={`mt-3 text-[11px] font-extrabold tracking-[0.2em] uppercase ${isDarkMode ? 'text-cyan-200/80' : 'text-sky-700/80'}`}>TRENDING</div>
          </div>
        </div>

        {loading ? (
          <div className={`mt-4 rounded-2xl p-10 text-center ${isDarkMode ? 'bg-gray-900/60 border border-white/10 text-gray-200' : 'bg-white border border-gray-200 text-gray-700'}`}>
            Loading...
          </div>
        ) : featuredProducts.length ? (
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {featuredProducts.slice(0, 8).map((p, idx) => (
              <div key={p._id} className={`${isDarkMode ? 'bg-gray-900/40' : 'bg-white'} rounded-2xl border ${isDarkMode ? 'border-white/10' : 'border-gray-200'} overflow-hidden`}>
                <ProductCard product={p} index={idx} />
              </div>
            ))}
          </div>
        ) : (
          <div className={`mt-4 rounded-2xl p-10 text-center ${isDarkMode ? 'bg-gray-900/60 border border-white/10 text-gray-200' : 'bg-white border border-gray-200 text-gray-700'}`}>
            No trending products yet.
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeRebuild;

