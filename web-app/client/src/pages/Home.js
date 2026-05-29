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
  const [whyChooseIndex, setWhyChooseIndex] = useState(0);
  const [pauseWhyChoose, setPauseWhyChoose] = useState(false);
  const [whyChooseVisible, setWhyChooseVisible] = useState(false);
  const whyChooseSectionRef = React.useRef(null);

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
      { title: '10-Min Checkout', body: 'Fast cart flow with secure one-tap checkout.', icon: '\u26A1', tag: 'FAST' },
      { title: 'Live Tracking', body: 'Track your order in real-time after purchase.', icon: '\uD83D\uDCCD', tag: 'TRACK' },
      { title: 'Safe Payments', body: 'UPI, cards and wallet with secure encryption.', icon: '\uD83D\uDD12', tag: 'SAFE' },
      { title: 'Daily Offers', body: 'Fresh personalized deals every single day.', icon: '\uD83C\uDFAF', tag: 'DEALS' },
      { title: 'Always Support', body: 'Quick chat and support when you need help.', icon: '\uD83D\uDCAC', tag: '24x7' },
      { title: 'Trusted Quality', body: 'Verified sellers and quality checks on every order.', icon: '\u2705', tag: 'TRUST' }
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

  useEffect(() => {
    if (pauseWhyChoose) return undefined;
    const intervalId = setInterval(() => {
      setWhyChooseIndex((prev) => (prev + 1) % whyChooseCards.length);
    }, 4200);
    return () => clearInterval(intervalId);
  }, [pauseWhyChoose, whyChooseCards.length]);

  useEffect(() => {
    const el = whyChooseSectionRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setWhyChooseVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
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

      {/* Trending */}
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
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Popular picks people are buying today.</p>
          </div>
          <Link to="/products?sort=rating_desc" className={`absolute right-0 bottom-0 text-sm font-semibold ${isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>
            Explore
          </Link>
        </div>

        {loading ? (
          <div className={`mt-4 rounded-2xl p-10 text-center ${isDarkMode ? 'bg-gray-900/60 border border-white/10 text-gray-200' : 'bg-white border border-gray-200 text-gray-700'}`}>
            Loading…
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
            No trending products yet. Seed the marketplace data to see products here.
          </div>
        )}
      </section>

      <section className="pt-2" ref={whyChooseSectionRef}>
        <style>{`
          @keyframes wcu-bounce {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-8px); }
          }
          .wcu-track {
            display: flex;
            transition: transform 1.4s cubic-bezier(0.22, 1, 0.36, 1);
            will-change: transform;
          }
          .wcu-slide {
            flex: 0 0 100%;
          }
          @media (min-width: 768px) {
            .wcu-slide { flex: 0 0 33.333%; }
          }
          .wcu-active-icon {
            animation: wcu-bounce 2.8s ease-in-out infinite;
          }
        `}</style>

        {/* Heading */
        <div className="text-center mb-8">
          <h2 className={`inline-block relative text-3xl md:text-4xl font-black tracking-tight ${
            isDarkMode
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-blue-300'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-500'
          }`}>
            Why Choose Us
          </h2>
          <p className={`mt-3 text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Trusted by thousands — here's what makes Pinqoza different.
          </p>
        </div>

        {/* Slider */}
        <div
          className="relative px-6"
          onMouseEnter={() => setPauseWhyChoose(true)}
          onMouseLeave={() => setPauseWhyChoose(false)}
        >
          {/* Viewport */}
          <div className="overflow-hidden">
            {/* Track */}
            <div
              className="wcu-track"
              style={{ transform: `translateX(-${(whyChooseIndex % whyChooseCards.length) * (100 / 3)}%)` }}
            >
              {[...whyChooseCards, ...whyChooseCards].map((item, idx) => {
                const isActive = (idx % whyChooseCards.length) === (whyChooseIndex % whyChooseCards.length);
                return (
                  <div key={`${item.title}-${idx}`} className="wcu-slide px-2 py-2">
                    <div className={`relative rounded-2xl border p-6 h-full min-h-[200px] flex flex-col gap-3 transition-all duration-500 ${
                      isActive
                        ? isDarkMode
                          ? 'border-cyan-400/55 bg-gradient-to-br from-[#081e3f] via-[#0c2a58] to-[#0e3870] shadow-[0_16px_48px_-12px_rgba(34,211,238,0.5)] -translate-y-1'
                          : 'border-sky-400/70 bg-gradient-to-br from-[#dbeafe] via-[#bfdbfe] to-[#c7d9ff] shadow-[0_16px_48px_-12px_rgba(14,165,233,0.4)] -translate-y-1'
                        : isDarkMode
                          ? 'border-white/8 bg-gradient-to-br from-[#060f1e] to-[#0c1f3a] opacity-60'
                          : 'border-gray-200 bg-gradient-to-br from-white to-[#eaf4ff] opacity-65'
                    }`}>

                      {/* Shimmer on active */}
                      {isActive && (
                        <div className="absolute top-0 left-8 right-8 h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
                      )}

                      {/* Icon + Tag row */}
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                          isActive
                            ? isDarkMode
                              ? 'bg-cyan-400/15 ring-1 ring-cyan-300/40 wcu-active-icon'
                              : 'bg-sky-200/70 ring-1 ring-sky-400/50 wcu-active-icon'
                            : isDarkMode ? 'bg-white/5' : 'bg-gray-100'
                        }`}>
                          {item.icon}
                        </div>
                        <span className={`text-[9px] font-black tracking-[0.2em] uppercase px-2 py-0.5 rounded ${
                          isActive
                            ? isDarkMode ? 'bg-cyan-400/20 text-cyan-200' : 'bg-sky-200 text-sky-700'
                            : isDarkMode ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'
                        }`}>{item.tag}</span>
                      </div>

                      {/* Title */}
                      <h3 className={`text-base font-extrabold leading-snug ${
                        isActive
                          ? isDarkMode ? 'text-white' : 'text-gray-900'
                          : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>{item.title}</h3>

                      {/* Body */}
                      <p className={`text-xs leading-relaxed flex-1 ${
                        isActive
                          ? isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          : isDarkMode ? 'text-gray-600' : 'text-gray-400'
                      }`}>{item.body}</p>

                      {/* Card counter */}
                      <div className={`text-[9px] font-bold tabular-nums ${
                        isActive
                          ? isDarkMode ? 'text-cyan-400/50' : 'text-sky-500/50'
                          : isDarkMode ? 'text-white/8' : 'text-gray-200'
                      }`}>
                        {String((idx % whyChooseCards.length) + 1).padStart(2, '0')} / {String(whyChooseCards.length).padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Left Arrow */}
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setWhyChooseIndex((p) => (p - 1 + whyChooseCards.length) % whyChooseCards.length)}
            className={`absolute -left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center border shadow-md transition-all duration-200 ${
              isDarkMode
                ? 'bg-gray-900/90 border-white/15 text-gray-300 hover:border-cyan-400/60 hover:text-cyan-300'
                : 'bg-white border-gray-200 text-gray-600 hover:border-sky-400 hover:text-sky-600'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setWhyChooseIndex((p) => (p + 1) % whyChooseCards.length)}
            className={`absolute -right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center border shadow-md transition-all duration-200 ${
              isDarkMode
                ? 'bg-gray-900/90 border-white/15 text-gray-300 hover:border-cyan-400/60 hover:text-cyan-300'
                : 'bg-white border-gray-200 text-gray-600 hover:border-sky-400 hover:text-sky-600'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Dot indicators */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {whyChooseCards.map((_, dot) => {
            const isActive = (whyChooseIndex % whyChooseCards.length) === dot;
            return (
              <button
                key={dot}
                type="button"
                aria-label={`Go to slide ${dot + 1}`}
                onClick={() => setWhyChooseIndex(dot)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? isDarkMode ? 'w-7 bg-cyan-400' : 'w-7 bg-sky-500'
                    : isDarkMode ? 'w-2 bg-white/20 hover:bg-white/35' : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            );
          })}
      </section>

      {/* Campaign strip */}
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

    </div>
  );
};

export default Home;
﻿

