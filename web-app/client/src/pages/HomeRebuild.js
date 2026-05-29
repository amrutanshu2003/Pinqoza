import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getFeaturedProducts, getProductCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import SubscriptionPlans from '../components/SubscriptionPlans';
import { useTheme } from '../context/ThemeContext';

const HomeRebuild = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchDraft, setSearchDraft] = useState('');
  const [whyChooseIndex, setWhyChooseIndex] = useState(0);
  const [pauseWhyChoose, setPauseWhyChoose] = useState(false);
  const [whyChooseResetting, setWhyChooseResetting] = useState(false);

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

  const whyChooseCards = useMemo(
    () => [
      { title: '10-Min Checkout', body: 'Fast cart flow with secure one-tap checkout.', tag: 'FAST' },
      { title: 'Live Tracking', body: 'Track your order in real-time after purchase.', tag: 'TRACK' },
      { title: 'Safe Payments', body: 'UPI, cards and wallet with secure encryption.', tag: 'SAFE' },
      { title: 'Daily Offers', body: 'Fresh personalized deals every single day.', tag: 'DEALS' },
      { title: 'Always Support', body: 'Quick chat and support when you need help.', tag: '24x7' },
      { title: 'Trusted Quality', body: 'Verified sellers and quality checks on every order.', tag: 'TRUST' }
    ],
    []
  );
  const whyChooseSlides = useMemo(() => [...whyChooseCards, whyChooseCards[0]], [whyChooseCards]);

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

  useEffect(() => {
    if (pauseWhyChoose) return undefined;
    const intervalId = setInterval(() => {
      setWhyChooseIndex((prev) => prev + 1);
    }, 4200);
    return () => clearInterval(intervalId);
  }, [pauseWhyChoose]);

  useEffect(() => {
    if (whyChooseIndex !== whyChooseCards.length) return undefined;
    const id = setTimeout(() => {
      setWhyChooseResetting(true);
      setWhyChooseIndex(0);
      requestAnimationFrame(() => setWhyChooseResetting(false));
    }, 850);
    return () => clearTimeout(id);
  }, [whyChooseIndex, whyChooseCards.length]);

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

      <section className="pt-1">
        <div className="relative flex items-end justify-center gap-4">
          <div className="w-full text-center">
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
            className={`group absolute right-0 bottom-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition-all duration-300 ${
              isDarkMode
                ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-300/20 hover:border-cyan-200/60 hover:-translate-y-0.5'
                : 'border-sky-300/60 bg-sky-100/80 text-sky-800 hover:bg-sky-200/90 hover:border-sky-400 hover:-translate-y-0.5'
            }`}
          >
            <span>View all</span>
            <span className="transform-gpu transition-transform duration-300 group-hover:translate-x-1">{'\u2192'}</span>
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
        <div className="relative flex items-end justify-center gap-4">
          <div className="w-full text-center">
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

      <section className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'border-cyan-400/20 bg-[linear-gradient(100deg,#061124_0%,#0a1f3d_45%,#0a3850_100%)]' : 'border-sky-200 bg-[linear-gradient(100deg,#eef7ff_0%,#e3f3ff_45%,#d7f0ff_100%)]'}`}>
        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold tracking-wide ${isDarkMode ? 'bg-cyan-300/20 text-cyan-100' : 'bg-white/80 text-sky-700'}`}>LIMITED OFFER</div>
            <h3 className={`mt-3 text-2xl md:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Weekend Mega Sale up to 60% OFF</h3>
            <p className={`mt-2 text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Best prices on groceries, beauty, electronics and home essentials.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/products?sort=discount_desc" className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_14px_30px_-14px_rgba(6,182,212,0.9)] hover:-translate-y-0.5 transition-transform">
              Shop Deals
            </Link>
            <Link to="/products?featured=true" className={`px-5 py-3 rounded-2xl font-bold border ${isDarkMode ? 'border-white/20 text-gray-100 hover:bg-white/10' : 'border-sky-200 text-gray-900 hover:bg-white/80'} transition`}>
              Featured Picks
            </Link>
          </div>
        </div>
      </section>

      <section className="pt-1">
        <div className="text-center">
          <h2 className={`group/heading inline-block relative pb-1 leading-[1.15] text-3xl md:text-4xl font-black tracking-tight ${
            isDarkMode
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-blue-300'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-500'
          }`}>
            Why Choose Us
            <span className="pointer-events-none absolute left-0 -bottom-2 h-[2px] w-full origin-center scale-x-0 bg-gradient-to-r from-transparent via-cyan-300 to-transparent transition-transform duration-500 ease-out group-hover/heading:scale-x-100" />
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-2 h-[7px] w-2/3 rounded-full bg-cyan-300/35 blur-md opacity-0 transition-opacity duration-500 ease-out group-hover/heading:opacity-100" />
          </h2>
          <p className={`mt-3 text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Swipe left to right and explore why users trust Pinqoza every day.</p>
        </div>
        <div
          className="mt-6 relative overflow-hidden rounded-3xl py-2"
          onMouseEnter={() => setPauseWhyChoose(true)}
          onMouseLeave={() => setPauseWhyChoose(false)}
        >
          <div
            className={`flex ${whyChooseResetting ? '' : 'transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]'}`}
            style={{ transform: `translateX(-${whyChooseIndex * 100}%)` }}
          >
            {whyChooseSlides.map((item) => (
              <article key={item.title} className="w-full flex-shrink-0 flex justify-center px-2 py-2">
                <div
                  className={`group relative w-full max-w-[278px] rounded-[2rem] border-2 p-5 md:p-6 transition-all duration-500 ${
                    isDarkMode
                      ? 'min-h-[330px] border-cyan-200/80 bg-[linear-gradient(160deg,#050a12_0%,#0a1a31_52%,#03080f_100%)] shadow-[0_0_0_1px_rgba(56,189,248,0.22),0_0_32px_-12px_rgba(56,189,248,0.42)] hover:-translate-y-0.5 hover:scale-[1.01] hover:border-cyan-100/95 hover:shadow-[0_0_0_1px_rgba(103,232,249,0.45),0_0_44px_-10px_rgba(56,189,248,0.8)]'
                      : 'min-h-[300px] border-sky-300/75 bg-[linear-gradient(160deg,#f5fbff_0%,#e7f3ff_58%,#deefff_100%)] hover:-translate-y-0.5 hover:scale-[1.01] hover:border-sky-400 hover:shadow-[0_26px_48px_-24px_rgba(14,165,233,0.55)]'
                  }`}
                >
                  <span className={`pointer-events-none absolute -inset-[1px] rounded-[2rem] opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 ${isDarkMode ? 'bg-[radial-gradient(circle_at_50%_6%,rgba(56,189,248,0.24),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(34,211,238,0.3),transparent_62%)]' : 'bg-[radial-gradient(circle_at_50%_6%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.2),transparent_62%)]'}`} />
                  <div className="flex flex-col items-center text-center">
                    <div className="relative w-[96px] h-[96px]">
                        <span className="pointer-events-none absolute z-0 inset-0 rounded-[1.9rem] bg-[linear-gradient(180deg,#116ea3_0%,#0b4f7f_48%,#073252_100%)] shadow-[0_18px_34px_-14px_rgba(4,66,108,0.95)]" />
                      <span className="pointer-events-none absolute z-10 inset-[6px] rounded-[1.7rem] bg-[#0a223a]/28" />
                      <span className={`pointer-events-none absolute -inset-1 rounded-[2rem] blur-md ${isDarkMode ? 'bg-cyan-300/35' : 'bg-sky-300/30'}`} />
                      <div className={`absolute z-20 inset-[5px] flex items-center justify-center rounded-[1.8rem] ${
                        isDarkMode
                          ? 'bg-[linear-gradient(160deg,#33c6ff_0%,#20a8ef_58%,#178fd6_100%)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.26),inset_0_2px_0_rgba(255,255,255,0.14)]'
                          : 'bg-[linear-gradient(160deg,#67d5ff_0%,#39b7f5_60%,#259de7_100%)]'
                      }`}>
                        <span className={`absolute w-[34px] h-[34px] rounded-full border-[4px] ${isDarkMode ? 'border-cyan-100/75' : 'border-sky-700/60'}`} />
                        <span className={`relative flex items-center justify-center w-[23px] h-[23px] ${isDarkMode ? 'text-cyan-100' : 'text-sky-800'}`}>
                          {item.tag === 'FAST' && (
                            <svg viewBox="0 0 24 24" className="w-[21px] h-[21px]" fill="currentColor" aria-hidden="true">
                              <path d="M14.2 2.8 7 13h4.3l-1 8.2L17 11h-4.3l1.5-8.2Z" />
                            </svg>
                          )}
                          {item.tag === 'TRACK' && (
                            <svg viewBox="0 0 24 24" className="w-[21px] h-[21px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M12 21s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z" />
                              <circle cx="12" cy="11" r="2.2" />
                            </svg>
                          )}
                          {item.tag === 'SAFE' && (
                            <svg viewBox="0 0 24 24" className="w-[21px] h-[21px]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <rect x="5" y="11" width="14" height="9" rx="2" />
                              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                            </svg>
                          )}
                          {item.tag === 'DEALS' && (
                            <svg viewBox="0 0 24 24" className="w-[21px] h-[21px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3.4 13.4a2 2 0 0 1 0-2.8L10.6 3.4a2 2 0 0 1 1.4-.6h6a2 2 0 0 1 2 2v6a2 2 0 0 1-.6 1.4Z" />
                              <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
                            </svg>
                          )}
                          {item.tag === '24x7' && (
                            <svg viewBox="0 0 24 24" className="w-[21px] h-[21px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M4 12a8 8 0 0 1 16 0" />
                              <rect x="3" y="12" width="4" height="7" rx="2" />
                              <rect x="17" y="12" width="4" height="7" rx="2" />
                              <path d="M8 19h5a3 3 0 0 0 3-3v-1" />
                            </svg>
                          )}
                          {item.tag === 'TRUST' && (
                            <svg viewBox="0 0 24 24" className="w-[21px] h-[21px]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="m5 13 4 4L19 7" />
                            </svg>
                          )}
                        </span>
                      </div>
                    </div>
                    <span className={`mt-5 inline-flex px-2.5 py-1 rounded-lg text-[11px] font-extrabold tracking-wider ${isDarkMode ? 'bg-cyan-300/20 text-cyan-100' : 'bg-sky-100 text-sky-700'}`}>{item.tag}</span>
                  </div>
                  <h3 className={`mt-5 text-[1.75rem] leading-none font-black text-center ${isDarkMode ? 'text-cyan-300' : 'text-sky-700'}`}>{item.title}</h3>
                  <p className={`mt-4 text-[1rem] leading-8 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
          <span className={`pointer-events-none absolute inset-x-0 bottom-0 h-16 ${isDarkMode ? 'bg-[radial-gradient(120%_100%_at_50%_100%,rgba(34,211,238,0.16),transparent_70%)]' : 'bg-[radial-gradient(120%_100%_at_50%_100%,rgba(14,165,233,0.14),transparent_70%)]'}`} />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          {whyChooseCards.map((_, dot) => (
            <button
              key={dot}
              type="button"
              onClick={() => {
                setWhyChooseResetting(false);
                setWhyChooseIndex(dot);
              }}
              aria-label={`Go to slide ${dot + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                (whyChooseIndex % whyChooseCards.length) === dot
                  ? isDarkMode ? 'w-6 bg-cyan-300' : 'w-6 bg-sky-500'
                  : isDarkMode ? 'w-2 bg-white/25' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </section>

      <section className="pt-2">
        <div className="text-center">
          <h2 className={`group/heading inline-block relative pb-1 leading-[1.15] text-3xl md:text-4xl font-black tracking-tight ${
            isDarkMode
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-blue-300'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-500'
          }`}>
            Subscription Plans
            <span className="pointer-events-none absolute left-0 -bottom-2 h-[2px] w-full origin-center scale-x-0 bg-gradient-to-r from-transparent via-cyan-300 to-transparent transition-transform duration-500 ease-out group-hover/heading:scale-x-100" />
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-2 h-[7px] w-2/3 rounded-full bg-cyan-300/35 blur-md opacity-0 transition-opacity duration-500 ease-out group-hover/heading:opacity-100" />
          </h2>
          <p className={`mt-3 text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Same plans UI as Browse Plans from My Subscriptions.
          </p>
        </div>
        <div className={`mt-6 rounded-3xl border ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white/80'}`}>
          <SubscriptionPlans onSelectPlan={() => navigate('/subscriptions')} />
        </div>
      </section>
    </div>
  );
};

export default HomeRebuild;

