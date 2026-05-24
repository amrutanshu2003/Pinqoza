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
    </div>
  );
};

export default HomeRebuild;

