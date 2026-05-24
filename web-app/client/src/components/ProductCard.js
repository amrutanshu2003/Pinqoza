import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addToCart, getWishlist, toggleWishlist } from '../services/api';
import { isAuthenticated } from '../util/auth';
import useToast from '../hooks/useToast';
import { useCart } from '../context/CartContext';

let wishlistCacheIds = null;
let wishlistCachePromise = null;

if (typeof window !== 'undefined' && !window.__mmWishlistCacheHooked) {
  window.addEventListener('wishlist-updated', () => {
    wishlistCacheIds = null;
    wishlistCachePromise = null;
  });
  window.__mmWishlistCacheHooked = true;
}

const getItemProductId = (item) => {
  if (!item) return null;
  if (typeof item === 'string') return item;
  if (item.product && typeof item.product === 'string') return item.product;
  if (item.product && typeof item.product === 'object') return item.product._id || item.product.id || null;
  return item._id || item.id || null;
};

const normalizeWishlistIds = (payload) => {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.wishlist)
        ? payload.wishlist
        : [];

  return new Set(
    source
      .map(getItemProductId)
      .filter(Boolean)
      .map((id) => String(id))
  );
};

const ensureWishlistCache = async (force = false) => {
  if (!isAuthenticated()) {
    wishlistCacheIds = new Set();
    return wishlistCacheIds;
  }

  if (!force && wishlistCacheIds) return wishlistCacheIds;
  if (!force && wishlistCachePromise) return wishlistCachePromise;

  wishlistCachePromise = getWishlist()
    .then((res) => {
      wishlistCacheIds = normalizeWishlistIds(res?.data);
      return wishlistCacheIds;
    })
    .catch(() => {
      wishlistCacheIds = new Set();
      return wishlistCacheIds;
    })
    .finally(() => {
      wishlistCachePromise = null;
    });

  return wishlistCachePromise;
};

const ProductCard = ({ product, onCartUpdate, index = 0, isDetailView = false, variant = 'grid' }) => {
  const [adding, setAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const { showSuccessToast, showErrorToast } = useToast();
  const { updateCartCount } = useCart();
  const navigate = useNavigate();

  const animationDelay = `${index * 0.04}s`;

  React.useEffect(() => {
    let active = true;
    const productId = product?._id ? String(product._id) : null;

    if (!productId || !isAuthenticated()) {
      setIsWishlisted(false);
      return undefined;
    }

    ensureWishlistCache().then((ids) => {
      if (!active) return;
      setIsWishlisted(ids.has(productId));
    });

    const onWishlistUpdated = (event) => {
      const updatedId = String(event?.detail?.productId || '');
      if (!updatedId || updatedId !== productId) return;
      setIsWishlisted(Boolean(event?.detail?.isWishlisted));
    };

    window.addEventListener('wishlist-updated', onWishlistUpdated);
    return () => {
      active = false;
      window.removeEventListener('wishlist-updated', onWishlistUpdated);
    };
  }, [product?._id]);

  const categoryEmoji = useMemo(() => {
    const emojis = {
      milk: '🥛',
      ghee: '🍯',
      cheese: '🧀',
      butter: '🧈',
      curd: '🥣',
      paneer: '🧊',
      cream: '🍦',
      yogurt: '🍶',
      lassi: '🥤',
      buttermilk: '🫙',
      sweets: '🍬',
      cake: '🍰'
    };
    return emojis[product?.category] || '🧺';
  }, [product?.category]);

  const categoryPill = useMemo(() => {
    const classes = {
      milk: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
      ghee: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
      cheese: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200',
      butter: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200',
      curd: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200',
      paneer: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200',
      cream: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-200',
      yogurt: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-200',
      lassi: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-200',
      buttermilk: 'bg-lime-50 text-lime-700 dark:bg-lime-900/30 dark:text-lime-200',
      sweets: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200',
      cake: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-200'
    };
    return classes[product?.category] || 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200';
  }, [product?.category]);

  const ratingValue = Number(product?.ratings || 0);
  const ratingText = ratingValue > 0 ? ratingValue.toFixed(1) : 'New';
  const reviewsCount = Number(product?.numReviews || 0);

  const handleCardClick = () => {
    if (isDetailView) return;
    if (!product?._id) return;
    navigate(`/product/${product._id}`);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated()) {
      window.location.href = '/cart';
      return;
    }

    try {
      setAdding(true);
      await addToCart(product._id, 1);
      onCartUpdate?.();
      updateCartCount();
      showSuccessToast(`${product.name} added to cart!`);
    } catch (error) {
      if (!error.response) showErrorToast('Network error. Please check your connection.');
      else showErrorToast(error.response?.data?.message || 'Error adding to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    try {
      setWishlistLoading(true);
      await toggleWishlist(product._id);
      const next = !isWishlisted;
      setIsWishlisted(next);

      const id = String(product._id);
      const ids = (await ensureWishlistCache()) || new Set();
      if (next) ids.add(id);
      else ids.delete(id);
      wishlistCacheIds = ids;

      window.dispatchEvent(
        new CustomEvent('wishlist-updated', {
          detail: { productId: id, isWishlisted: next }
        })
      );
    } catch (error) {
      showErrorToast('Wishlist error. Please try again.');
    } finally {
      setWishlistLoading(false);
    }
  };

  const descriptionBullets = useMemo(() => {
    const text = String(product?.description || '').trim();
    if (!text) return [];
    return text
      .split(/[.\n•]+/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);
  }, [product?.description]);

  const PriceBlock = () => (
    <div className="text-right">
      <div className="text-2xl font-extrabold text-gray-900 dark:text-white">₹{product?.price}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">/{product?.unit || 'unit'}</div>
      <div className="mt-2">
        <button
          onClick={handleAddToCart}
          disabled={adding || product?.stock === 0}
          className={`h-10 px-4 rounded-xl font-semibold transition-all inline-flex items-center justify-center gap-2 ${
            product?.stock === 0
              ? 'bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-400 cursor-not-allowed'
              : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-sm'
          }`}
        >
          {adding ? 'Adding…' : 'Add to cart'}
        </button>
      </div>
    </div>
  );

  const TitleBlock = () => (
    <>
      <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{product?.brand || 'Pinqoza'}</div>
      <div className="font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">{product?.name}</div>
      <div className="mt-1 flex items-center gap-2">
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-600 text-white text-xs font-bold">
          <span>{ratingText}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.719c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {reviewsCount > 0 ? `${reviewsCount} Ratings & Reviews` : 'No reviews yet'}
        </div>
      </div>
    </>
  );

  if (variant === 'list') {
    return (
      <div
        className={`w-full p-4 md:p-5 grid grid-cols-12 gap-4 items-start ${
          isDetailView ? '' : 'cursor-pointer'
        }`}
        style={{ animationDelay }}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCardClick();
        }}
      >
        {/* Image */}
        <div className="col-span-12 sm:col-span-3 md:col-span-2">
          <div className="relative rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-white/5 dark:to-white/0 border border-gray-200/70 dark:border-white/10 overflow-hidden">
            <div className="aspect-square w-full flex items-center justify-center">
              {product?.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/80 dark:bg-white/10 flex items-center justify-center text-4xl">
                  {categoryEmoji}
                </div>
              )}
            </div>

            <button
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={`absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur border transition-colors ${
                isWishlisted
                  ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20'
                  : 'bg-white/90 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 border-gray-200/70 dark:border-white/10 hover:text-red-500'
              }`}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="col-span-12 sm:col-span-6 md:col-span-7">
          <div className="flex items-start justify-between gap-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${categoryPill}`}>
              <span aria-hidden>{categoryEmoji}</span>
              <span className="capitalize">{product?.category || 'product'}</span>
            </span>
            {product?.stock === 0 ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200">
                Out of stock
              </span>
            ) : null}
          </div>

          <div className="mt-2">
            <TitleBlock />
          </div>

          {descriptionBullets.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc pl-5">
              {descriptionBullets.map((b, i) => (
                <li key={i} className="leading-snug">
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Price */}
        <div className="col-span-12 sm:col-span-3 md:col-span-3">
          <PriceBlock />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group h-full rounded-2xl overflow-hidden border transition-shadow ${
        isDetailView ? '' : 'cursor-pointer'
      } ${'border-gray-200/70 hover:shadow-lg hover:shadow-black/5 dark:border-white/10 dark:hover:shadow-black/30'} bg-white/90 dark:bg-gray-900/80 backdrop-blur`}
      style={{ animationDelay }}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleCardClick();
      }}
    >
      <div className="relative bg-gradient-to-br from-gray-50 to-white dark:from-white/5 dark:to-white/0">
        <div className="aspect-square w-full overflow-hidden">
          {product?.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain p-5 transition-transform duration-200 group-hover:scale-[1.02]"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-white/80 dark:bg-white/10 flex items-center justify-center text-4xl">
                {categoryEmoji}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur border transition-colors ${
            isWishlisted
              ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20'
              : 'bg-white/90 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 border-gray-200/70 dark:border-white/10 hover:text-red-500'
          }`}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${categoryPill}`}>
            <span aria-hidden>{categoryEmoji}</span>
            <span className="capitalize">{product?.category || 'product'}</span>
          </span>

          {product?.stock === 0 ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200">
              Out of stock
            </span>
          ) : null}
        </div>

        <div className="min-h-[2.75rem]">
          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{product?.brand || 'Pinqoza'}</div>
          <div className="font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">{product?.name}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-600 text-white text-xs font-bold">
            <span>{ratingText}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.719c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{reviewsCount > 0 ? `${reviewsCount} reviews` : 'No reviews yet'}</div>
        </div>

        <div className="flex items-end justify-between gap-3 pt-1">
          <div>
            <div className="text-xl font-extrabold text-gray-900 dark:text-white">₹{product?.price}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">/{product?.unit || 'unit'}</div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={adding || product?.stock === 0}
            className={`h-10 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              product?.stock === 0
                ? 'bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-400 cursor-not-allowed'
                : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-sm'
            }`}
          >
            {adding ? 'Adding…' : 'Add'}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          {product?.stock > 0 ? (
            <span>
              <span className="font-semibold text-green-700 dark:text-green-300">In stock</span> • fast delivery
            </span>
          ) : (
            <span>Currently unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
