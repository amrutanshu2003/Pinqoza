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

  const bannerSlides = useMemo(() => {
    const list = featured
      .filter((p) => p?.image)
      .slice(0, 6)
      .map((p) => ({
        id: p._id || p.name,
        title: p.name || 'Featured Product',
        subtitle: p.category || 'Top picks',
        image: p.image
      }));

    if (list.length >= 3) return list;
    return [
      ...list,
      { id: 'fallback-1', title: 'Best Deals Live', subtitle: 'Fresh picks for you', image: '/icon.svg' },
      { id: 'fallback-2', title: 'Trending Products', subtitle: 'Grab top offers', image: '/icon.svg' },
      { id: 'fallback-3', title: 'New Arrivals', subtitle: 'Shop latest collection', image: '/icon.svg' }
    ].slice(0, 3);
  }, [featured]);
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

  useEffect(() => {
    const onScroll = () => setIsCompactTabs(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const quickCategories = useMemo(() => categories.slice(0, 8), [categories]);
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
        <section className={`sticky top-16 z-40 backdrop-blur-md ${isDarkMode ? 'bg-black/90' : 'bg-white/90'}`}>
          <div className="overflow-x-hidden">
            <div className={`relative inline-flex min-w-full items-stretch border-b border-gray-200 dark:border-gray-800 ${isCompactTabs ? '' : 'snap-x snap-mandatory'} [scroll-padding-inline:12px]`}>
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('category');
                  setSearchParams(params);
                }}
                className={`group relative ${isCompactTabs ? '' : 'snap-start'} flex-shrink-0 w-24 px-2 pt-2 pb-3 text-center transition-all duration-300 ${
                  !category ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <div className={`mx-auto mb-1.5 w-10 h-10 rounded-xl items-center justify-center text-2xl ${isCompactTabs ? 'hidden' : 'flex'} ${!category ? (isDarkMode ? 'bg-white/10' : 'bg-blue-100') : (isDarkMode ? 'bg-white/5' : 'bg-gray-100')}`}>🛍️</div>
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
                    className={`group relative ${isCompactTabs ? '' : 'snap-start'} flex-shrink-0 w-24 px-2 pt-2 pb-3 text-center transition-all duration-300 ${
                      active ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <div className={`mx-auto mb-1.5 w-10 h-10 rounded-xl items-center justify-center text-2xl ${isCompactTabs ? 'hidden' : 'flex'} ${active ? (isDarkMode ? 'bg-white/10' : 'bg-blue-100') : (isDarkMode ? 'bg-white/5' : 'bg-gray-100')}`}>
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
      ) : null}

      {bannerSlides.length > 0 ? (
        <section className="mt-3">
          <div
            className="overflow-hidden -mx-5 sm:-mx-7 lg:-mx-10 px-2 sm:px-3 lg:px-4"
            onMouseEnter={() => setIsBannerHovered(true)}
            onMouseLeave={() => setIsBannerHovered(false)}
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
      ) : null}

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
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-64 rounded-xl animate-pulse ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
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
          <div className={`rounded-xl border p-6 text-center ${isDarkMode ? 'border-white/10 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
            Products abhi empty hain. Naye products add hone ke baad yahan show honge.
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeRebuild;
