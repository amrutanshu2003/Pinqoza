import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getFeaturedProducts, getProductCategories, getProducts } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const HomeRebuild = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const [featured, setFeatured] = useState([]);
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCompactTabs, setIsCompactTabs] = useState(false);
  const [activeBanner, setActiveBanner] = useState(1);
  const [animateBanner, setAnimateBanner] = useState(true);
  const [isBannerHovered, setIsBannerHovered] = useState(false);
  const [isWorming, setIsWorming] = useState(false);
  const prevIndicatorRef = useRef(0);
  const [wormFromIndex, setWormFromIndex] = useState(0);
  const [isWrapJump, setIsWrapJump] = useState(false);
  const [dealNow, setDealNow] = useState(Date.now());
  const dealsScrollRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchDeltaXRef = useRef(0);

  const bannerSlides = useMemo(
    () =>
      featured
        .filter((p) => p?.image)
        .slice(0, 6)
        .map((p) => ({
          id: p._id || p.name,
          title: p.name || 'Featured Product',
          subtitle: p.category || 'Top picks',
          image: p.image
        })),
    [featured]
  );

  const flashDeals = useMemo(() => {
    const picks = featured.filter((p) => Number(p?.price) > 0).slice(0, 8);
    return picks.map((p, idx) => {
      const discount = [18, 22, 27, 15, 30, 20, 25, 12][idx % 8];
      const basePrice = Number(p.price);
      const dealPrice = Math.max(1, Math.round(basePrice * (1 - discount / 100)));
      const endsAt = Date.now() + (idx + 2) * 60 * 60 * 1000 + (idx % 3) * 17 * 60 * 1000;
      return {
        id: p._id || `${p.name}-${idx}`,
        name: p.name || 'Deal Product',
        image: p.image || '',
        discount,
        originalPrice: basePrice,
        dealPrice,
        endsAt,
        category: p.category || 'deal'
      };
    });
  }, [featured]);

  const formatDealTime = (target, now) => {
    const diff = Math.max(0, target - now);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
  };
  const loopPoint = useMemo(() => Math.max(1, bannerSlides.length + 1), [bannerSlides.length]);
  const activeIndicatorIndex = useMemo(
    () => (bannerSlides.length ? ((activeBanner - 1 + bannerSlides.length) % bannerSlides.length) : 0),
    [activeBanner, bannerSlides.length]
  );

  useEffect(() => {
    if (bannerSlides.length <= 1) return undefined;
    if (isBannerHovered) return undefined;
    const id = setInterval(() => {
      setActiveBanner((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(id);
  }, [bannerSlides.length, isBannerHovered]);

  useEffect(() => {
    const id = setInterval(() => setDealNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleBannerTransitionEnd = () => {
    if (activeBanner < loopPoint) return;
    setIsWrapJump(true);
    setAnimateBanner(false);
    setActiveBanner(1);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimateBanner(true);
        setTimeout(() => setIsWrapJump(false), 60);
      });
    });
  };

  const handleBannerTouchStart = (event) => {
    const point = event.touches?.[0];
    if (!point) return;
    touchStartXRef.current = point.clientX;
    touchDeltaXRef.current = 0;
  };

  const handleBannerTouchMove = (event) => {
    if (touchStartXRef.current == null) return;
    const point = event.touches?.[0];
    if (!point) return;
    touchDeltaXRef.current = point.clientX - touchStartXRef.current;
  };

  const handleBannerTouchEnd = () => {
    const delta = touchDeltaXRef.current;
    const threshold = 45;

    if (Math.abs(delta) >= threshold) {
      if (delta < 0) {
        setActiveBanner((prev) => prev + 1);
      } else {
        setActiveBanner((prev) => (prev <= 1 ? loopPoint - 1 : prev - 1));
      }
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  const scrollDeals = (direction = 'right') => {
    const el = dealsScrollRef.current;
    if (!el) return;
    const amount = Math.max(220, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const [featuredRes, categoriesRes] = await Promise.all([
          getFeaturedProducts(),
          getProductCategories()
        ]);
        if (!active) return;
        setFeatured(Array.isArray(featuredRes.data) ? featuredRes.data : []);
        setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      } catch (error) {
        if (!active) return;
        setFeatured([]);
        setCategories([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar { display: none; }
      .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      @keyframes skeleton-shimmer {
        0% { background-position: -220% 0; }
        100% { background-position: 220% 0; }
      }
      .skeleton-shimmer {
        background: linear-gradient(100deg, var(--sk-1) 20%, var(--sk-2) 40%, var(--sk-1) 60%);
        background-size: 220% 100%;
        animation: skeleton-shimmer 3.2s linear infinite;
        animation-delay: 0s;
      }
      .skeleton-dark {
        --sk-1: rgba(255,255,255,0.03);
        --sk-2: rgba(255,255,255,0.12);
      }
      .skeleton-light {
        --sk-1: rgba(107,114,128,0.08);
        --sk-2: rgba(107,114,128,0.2);
      }
      .skeleton-chip {
        border-radius: 10px;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    if (prevIndicatorRef.current === activeIndicatorIndex) return;
    const isLastToFirstWrap =
      bannerSlides.length > 1 &&
      prevIndicatorRef.current === bannerSlides.length - 1 &&
      activeIndicatorIndex === 0;

    if (isLastToFirstWrap) {
      prevIndicatorRef.current = activeIndicatorIndex;
      setWormFromIndex(activeIndicatorIndex);
      setIsWorming(false);
      return;
    }

    setWormFromIndex(prevIndicatorRef.current);
    prevIndicatorRef.current = activeIndicatorIndex;
    setIsWorming(true);
    const t = setTimeout(() => setIsWorming(false), 300);
    return () => clearTimeout(t);
  }, [activeIndicatorIndex, isWrapJump, bannerSlides.length]);

  const quickCategories = useMemo(() => categories.slice(0, 8), [categories]);

  useEffect(() => {
    const onScroll = () => setIsCompactTabs(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hasFilters = Boolean(search.trim() || category);
  const activeTabIndex = useMemo(() => {
    if (!category) return 0;
    const idx = quickCategories.findIndex((c) => c === category);
    return idx >= 0 ? idx + 1 : 0;
  }, [category, quickCategories]);
  const getCategoryIcon = (cat) => {
    const key = String(cat || '').toLowerCase();
    if (key.includes('milk')) return '🥛';
    if (key.includes('ghee')) return '🫙';
    if (key.includes('butter')) return '🧈';
    if (key.includes('cheese')) return '🧀';
    if (key.includes('curd') || key.includes('yogurt')) return '🥣';
    if (key.includes('paneer')) return '🧊';
    if (key.includes('cream')) return '🍦';
    if (key.includes('lassi') || key.includes('buttermilk')) return '🥤';
    if (key.includes('sweet')) return '🍬';
    return '🛍️';
  };


  useEffect(() => {
    let active = true;

    const loadFiltered = async () => {
      if (!hasFilters) {
        setSearchedProducts([]);
        return;
      }
      try {
        setLoading(true);
        const res = await getProducts({ search: search.trim(), category, sort: 'rating_desc', limit: 40 });
        if (!active) return;
        setSearchedProducts(Array.isArray(res.data?.products) ? res.data.products : []);
      } catch (error) {
        if (!active) return;
        setSearchedProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFiltered();
    return () => {
      active = false;
    };
  }, [hasFilters, search, category]);

  return (
    <div className="space-y-8">
      {quickCategories.length > 0 ? (
        <>
          <section className={`fixed top-16 left-0 right-0 z-40 backdrop-blur-md ${isDarkMode ? 'bg-black/90' : 'bg-white/90'}`}>
          <div className="overflow-x-auto hide-scrollbar">
            <div className={`relative inline-flex min-w-max items-stretch border-b border-gray-200 dark:border-gray-800 ${isCompactTabs ? '' : 'snap-x snap-mandatory'} [scroll-padding-inline:12px]`}>
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('category');
                  setSearchParams(params);
                }}
                className={`group relative ${isCompactTabs ? '' : 'snap-start'} flex-shrink-0 w-24 px-2 text-center transition-all duration-300 ${
                  isCompactTabs ? 'pt-2 pb-2' : 'pt-2 pb-3'
                } ${
                  !category ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <div className={`mx-auto w-10 rounded-xl items-center justify-center text-2xl transition-all duration-200 overflow-hidden ${isCompactTabs ? 'h-0 opacity-0 mb-0' : 'h-10 opacity-100 mb-1.5 flex'} ${!category ? (isDarkMode ? 'bg-white/10' : 'bg-blue-100') : (isDarkMode ? 'bg-white/5' : 'bg-gray-100')}`}>🛍️</div>
                <div className="text-sm leading-tight font-semibold truncate">For You</div>
              </button>

              {quickCategories.map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.set('category', cat);
                      setSearchParams(params);
                    }}
                    className={`group relative ${isCompactTabs ? '' : 'snap-start'} flex-shrink-0 w-24 px-2 text-center transition-all duration-300 ${
                      isCompactTabs ? 'pt-2 pb-2' : 'pt-2 pb-3'
                    } ${
                      active ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <div className={`mx-auto w-10 rounded-xl items-center justify-center text-2xl transition-all duration-200 overflow-hidden ${isCompactTabs ? 'h-0 opacity-0 mb-0' : 'h-10 opacity-100 mb-1.5 flex'} ${active ? (isDarkMode ? 'bg-white/10' : 'bg-blue-100') : (isDarkMode ? 'bg-white/5' : 'bg-gray-100')}`}>
                      {getCategoryIcon(cat)}
                    </div>
                    <div className="text-sm leading-tight font-medium truncate">{cat}</div>
                  </button>
                );
              })}
              <span
                className="pointer-events-none absolute bottom-0 h-1 w-[84px] rounded-full bg-blue-600 transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${activeTabIndex * 96 + 6}px)` }}
                aria-hidden="true"
              />
            </div>
          </div>
          </section>
        </>
      ) : (
        <section className={`fixed top-16 left-0 right-0 z-40 backdrop-blur-md ${isDarkMode ? 'bg-black/90' : 'bg-white/90'}`}>
          <div className="overflow-x-auto hide-scrollbar">
            <div className="flex w-max items-center gap-3 px-3 py-3 border-b border-gray-200 dark:border-gray-800">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`cat-skeleton-${idx}`}
                  className={`skeleton-chip h-10 w-20 flex-shrink-0 border ${isDarkMode ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-gray-100'}`}
                >
                  <div className={`h-full w-full rounded-[10px] skeleton-shimmer ${isDarkMode ? 'skeleton-dark' : 'skeleton-light'}`} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {bannerSlides.length > 0 ? (
        <section className="mt-44 pt-8">
          <div
            className="overflow-hidden -mx-5 sm:-mx-7 lg:-mx-10 px-2 sm:px-3 lg:px-4"
            onMouseEnter={() => setIsBannerHovered(true)}
            onMouseLeave={() => setIsBannerHovered(false)}
            onTouchStart={handleBannerTouchStart}
            onTouchMove={handleBannerTouchMove}
            onTouchEnd={handleBannerTouchEnd}
          >
            <div
              className={`flex ${animateBanner ? 'transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]' : ''}`}
              style={{ transform: `translateX(-${activeBanner * 33.3333}%)` }}
              onTransitionEnd={handleBannerTransitionEnd}
            >
              {[bannerSlides[bannerSlides.length - 1], ...bannerSlides, ...bannerSlides.slice(0, 3)].map((slide, idx) => (
                <div key={`${slide.id}-${idx}`} className="w-1/3 flex-shrink-0 px-2 md:px-2.5">
                  <button
                    type="button"
                    onClick={() => navigate('/products')}
                    className={`group relative w-full rounded-2xl overflow-hidden text-left border transform-gpu transition-all duration-500 hover:-translate-y-1.5 hover:scale-[1.01] ${
                      isDarkMode ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'
                    } hover:shadow-[0_14px_35px_-18px_rgba(59,130,246,0.45)]`}
                  >
                    <img src={slide.image} alt={slide.title} className="w-full h-40 md:h-56 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-white/0 transition-all duration-500 group-hover:ring-white/20" />
                    <div className="absolute left-5 md:left-7 top-1/2 -translate-y-1/2 text-white">
                      <p className="text-base md:text-xl font-black tracking-tight leading-tight drop-shadow-sm">{slide.title}</p>
                      <p className="text-xs md:text-sm mt-1 text-white/90 font-medium">{slide.subtitle}</p>
                    </div>
                  </button>
                </div>
              ))}
            </div>

          </div>
          {bannerSlides.length > 1 ? (
            <div className="mt-2.5 flex justify-center">
              <div className="relative flex items-center gap-2.5">
                {Array.from({ length: bannerSlides.length }).map((_, idx) => {
                  const targetIdx = idx;
                  const isActiveBaseDot = activeIndicatorIndex === targetIdx;
                  const isLastVisibleDot = idx === bannerSlides.length;
                  return (
                    <button
                      key={`dot-${idx}`}
                      type="button"
                      onClick={() => setActiveBanner(targetIdx + 1)}
                      className={`h-1.5 w-1.5 rounded-full transition-opacity duration-200 ${
                        isActiveBaseDot && !isLastVisibleDot ? 'opacity-0' : 'bg-gray-400/70'
                      }`}
                      aria-label={`Go to slide ${targetIdx + 1}`}
                    />
                  );
                })}
                {(() => {
                  const stepPx = 16;
                  const dotPillPx = 13;
                  const from = wormFromIndex * stepPx;
                  const to = activeIndicatorIndex * stepPx;
                  const left = Math.min(from, to);
                  const wormWidth = Math.abs(to - from) + dotPillPx;
                  const idleLeft = activeIndicatorIndex * stepPx;
                  return (
                    <span
                      className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gray-500 transition-[transform,width] duration-300 ease-out"
                      style={{
                        transform: `translateX(${(isWorming ? left : idleLeft) - 3}px) translateY(-50%)`,
                        width: `${isWorming ? wormWidth : dotPillPx}px`
                      }}
                    />
                  );
                })()}
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="mt-44 pt-8">
          <div className="overflow-hidden -mx-5 sm:-mx-7 lg:-mx-10 px-2 sm:px-3 lg:px-4">
            <div className="flex">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={`banner-skeleton-${idx}`} className="w-1/3 flex-shrink-0 px-2 md:px-2.5">
                  <div className={`relative w-full h-40 md:h-56 rounded-2xl border overflow-hidden ${isDarkMode ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-gray-100'}`}>
                    <div className={`absolute inset-0 skeleton-shimmer ${isDarkMode ? 'skeleton-dark' : 'skeleton-light'}`} />
                    <div className="absolute left-5 md:left-7 top-1/2 -translate-y-1/2 w-[52%] space-y-3">
                      <div className={`h-6 rounded-md ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                      <div className={`h-4 rounded-md w-[72%] ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2.5 flex justify-center">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-500/50" />
              <span className="h-1.5 w-4 rounded-full bg-gray-400/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-500/50" />
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className={`text-xl md:text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Flash Deals</h2>
            <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Limited-time prices, grab before timer ends</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/products?sort=price_asc')}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              View all
            </button>
          </div>
        </div>

        {flashDeals.length > 0 ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => scrollDeals('left')}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border backdrop-blur-xl flex items-center justify-center text-base shadow-lg transition-all duration-200 ${
                isDarkMode
                  ? 'bg-black/40 border-white/20 text-white hover:bg-black/55'
                  : 'bg-white/60 border-white/60 text-gray-800 hover:bg-white/80'
              }`}
              aria-label="Scroll flash deals left"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollDeals('right')}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border backdrop-blur-xl flex items-center justify-center text-base shadow-lg transition-all duration-200 ${
                isDarkMode
                  ? 'bg-black/40 border-white/20 text-white hover:bg-black/55'
                  : 'bg-white/60 border-white/60 text-gray-800 hover:bg-white/80'
              }`}
              aria-label="Scroll flash deals right"
            >
              ›
            </button>

            <div ref={dealsScrollRef} className="overflow-x-auto hide-scrollbar -mx-1 px-1">
            <div className="inline-flex min-w-full gap-3 md:gap-4">
              {flashDeals.map((deal) => (
                <button
                  key={deal.id}
                  type="button"
                  onClick={() => navigate('/products?search=' + encodeURIComponent(deal.name))}
                  className={`group w-[220px] md:w-[250px] shrink-0 rounded-2xl border text-left overflow-hidden ${
                    isDarkMode ? 'border-white/10 bg-gray-900/90' : 'border-gray-200 bg-white/95'
                  } shadow-[0_10px_30px_-18px_rgba(249,115,22,0.45)] hover:-translate-y-1 transition-all duration-300`}
                >
                  <div className="relative h-28 md:h-32 bg-gradient-to-r from-orange-500 to-amber-500">
                    <span className="absolute left-2 top-2 px-2 py-1 rounded-full text-[11px] font-extrabold bg-white text-orange-600">
                      {deal.discount}% OFF
                    </span>
                    {deal.image ? (
                      <img src={deal.image} alt={deal.name} className="absolute right-2 bottom-2 h-20 w-20 object-contain drop-shadow-lg" />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <div className={`text-[11px] uppercase tracking-wide mb-1 ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>{deal.category}</div>
                    <div className={`text-sm font-bold line-clamp-2 min-h-[2.5rem] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{deal.name}</div>
                    <div className="mt-2 flex items-end gap-2">
                      <span className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₹{deal.dealPrice}</span>
                      <span className={`text-xs line-through ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>₹{deal.originalPrice}</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500 text-white text-xs font-bold">
                      Ends in {formatDealTime(deal.endsAt, dealNow)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            </div>
          </div>
        ) : (
          <div className={`rounded-xl border p-4 text-sm ${isDarkMode ? 'border-white/10 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
            Deals loading...
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl md:text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Home Highlights</h2>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs md:text-sm font-semibold px-3 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Reset
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`prod-loading-skeleton-${i}`}
                className={`rounded-2xl border p-3 ${isDarkMode ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-gray-100'}`}
              >
                <div className={`h-40 rounded-xl mb-3 skeleton-shimmer ${isDarkMode ? 'skeleton-dark' : 'skeleton-light'}`} />
                <div className={`h-3 rounded mb-2 w-1/2 skeleton-shimmer ${isDarkMode ? 'skeleton-dark' : 'skeleton-light'}`} />
                <div className={`h-4 rounded mb-2 skeleton-shimmer ${isDarkMode ? 'skeleton-dark' : 'skeleton-light'}`} />
                <div className={`h-4 rounded w-2/3 mb-3 skeleton-shimmer ${isDarkMode ? 'skeleton-dark' : 'skeleton-light'}`} />
                <div className="flex items-end justify-between">
                  <div className={`h-7 rounded w-16 skeleton-shimmer ${isDarkMode ? 'skeleton-dark' : 'skeleton-light'}`} />
                  <div className={`h-9 rounded-xl w-20 skeleton-shimmer ${isDarkMode ? 'skeleton-dark' : 'skeleton-light'}`} />
                </div>
              </div>
            ))}
          </div>
        ) : hasFilters ? (
          searchedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {searchedProducts.map((product, idx) => (
                <ProductCard key={product._id || idx} product={product} index={idx} />
              ))}
            </div>
          ) : (
            <div className={`rounded-xl border p-6 text-center ${isDarkMode ? 'border-white/10 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
              Koi product nahi mila.
            </div>
          )
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.slice(0, 8).map((product, idx) => (
              <ProductCard key={product._id || idx} product={product} index={idx} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`prod-skeleton-${i}`}
                className={`rounded-2xl border p-3 ${isDarkMode ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-gray-100'}`}
              >
                <div className={`h-40 rounded-xl mb-3 skeleton-shimmer ${isDarkMode ? 'skeleton-dark' : 'skeleton-light'}`} />
                <div className={`h-3 rounded mb-2 w-1/2 skeleton-shimmer ${isDarkMode ? 'skeleton-dark' : 'skeleton-light'}`} />
                <div className={`h-4 rounded mb-2 skeleton-shimmer ${isDarkMode ? 'skeleton-dark' : 'skeleton-light'}`} />
                <div className={`h-4 rounded w-2/3 mb-3 skeleton-shimmer ${isDarkMode ? 'skeleton-dark' : 'skeleton-light'}`} />
                <div className="flex items-end justify-between">
                  <div className={`h-7 rounded w-16 skeleton-shimmer ${isDarkMode ? 'skeleton-dark' : 'skeleton-light'}`} />
                  <div className={`h-9 rounded-xl w-20 skeleton-shimmer ${isDarkMode ? 'skeleton-dark' : 'skeleton-light'}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={`rounded-2xl border p-5 md:p-6 ${isDarkMode ? 'border-white/10 bg-gray-900/80' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className={`text-xl md:text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Quick Stats</h2>
          <button
            type="button"
            onClick={() => navigate('/products?sort=rating_desc')}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Shop top rated
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Featured Picks', value: featured.length || 0 },
            { label: 'Categories', value: categories.length || 0 },
            { label: 'Flash Deals', value: flashDeals.length || 0 },
            { label: 'Search Results', value: hasFilters ? searchedProducts.length : 'Live' }
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border p-4 ${isDarkMode ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-gray-50'}`}
            >
              <p className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</p>
              <p className={`mt-2 text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {[
          {
            title: '1. Browse Fast',
            body: 'Use category tabs and smart filters to reach products quickly.',
            action: 'Explore catalog',
            to: '/products'
          },
          {
            title: '2. Add to Cart',
            body: 'Compare prices and ratings, then add best options instantly.',
            action: 'Open cart',
            to: '/cart'
          },
          {
            title: '3. Checkout Securely',
            body: 'Finish your order with safe payments and quick confirmation.',
            action: 'Go checkout',
            to: '/checkout'
          }
        ].map((step) => (
          <div
            key={step.title}
            className={`rounded-2xl border p-5 ${isDarkMode ? 'border-white/10 bg-gray-900/80' : 'border-gray-200 bg-white'}`}
          >
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{step.title}</h3>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{step.body}</p>
            <button
              type="button"
              onClick={() => navigate(step.to)}
              className={`mt-4 text-sm font-semibold ${isDarkMode ? 'text-cyan-300 hover:text-cyan-200' : 'text-blue-700 hover:text-blue-800'}`}
            >
              {step.action}
            </button>
          </div>
        ))}
      </section>

      <section
        className={`rounded-2xl border p-6 md:p-8 overflow-hidden relative ${
          isDarkMode ? 'border-cyan-500/30 bg-gradient-to-r from-cyan-900/40 to-blue-900/30' : 'border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50'
        }`}
      >
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-cyan-400/20 blur-2xl" aria-hidden="true" />
        <div className="absolute -left-8 -bottom-12 w-40 h-40 rounded-full bg-blue-500/15 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Ready for your next order?
            </h2>
            <p className={`mt-2 text-sm md:text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Fresh deals update daily. Check new arrivals and grab best prices before stock runs out.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/products?sort=created_desc')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              New arrivals
            </button>
            <button
              type="button"
              onClick={() => navigate('/wishlist')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold border ${
                isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : 'border-blue-300 text-blue-700 hover:bg-white/70'
              } transition-colors`}
            >
              View wishlist
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeRebuild;

