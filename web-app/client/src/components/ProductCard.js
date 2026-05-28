import React, { useMemo, useState } from 'react';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { addToCart, getWishlist, toggleWishlist } from '../services/api';
import { isAuthenticated } from '../util/auth';
import { useCart } from '../context/CartContext';
import useToast from '../hooks/useToast';

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

  return new Set(source.map(getItemProductId).filter(Boolean).map((id) => String(id)));
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

const getCategoryLabel = (category) => {
  if (!category) return 'Product';
  return String(category).replace(/-/g, ' ');
};

const ProductCard = ({ product, onCartUpdate, index = 0, isDetailView = false }) => {
  const [adding, setAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const { updateCartCount } = useCart();
  const { showSuccessToast, showErrorToast } = useToast();
  const navigate = useNavigate();

  const productId = product?._id ? String(product._id) : '';
  const imageSrc = typeof product?.image === 'string' ? product.image.trim() : '';
  const hasValidImageSrc =
    Boolean(imageSrc) &&
    (imageSrc.startsWith('http://') ||
      imageSrc.startsWith('https://') ||
      imageSrc.startsWith('/') ||
      imageSrc.startsWith('data:image/') ||
      /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(imageSrc));
  const categoryLabel = getCategoryLabel(product?.category);
  const ratingValue = Number(product?.ratings ?? product?.rating ?? 0);
  const ratingText = ratingValue > 0 ? ratingValue.toFixed(1) : 'New';
  const reviewsCount = Number(product?.numReviews ?? product?.reviews ?? 0);
  const isOutOfStock = Number(product?.stock ?? 0) <= 0;
  const animationDelay = `${index * 0.035}s`;

  const fallbackInitials = useMemo(() => {
    const words = String(product?.name || categoryLabel || 'Product')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    return words.map((word) => word[0]?.toUpperCase()).join('') || 'P';
  }, [categoryLabel, product?.name]);

  React.useEffect(() => {
    let active = true;

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
      if (updatedId !== productId) return;
      setIsWishlisted(Boolean(event?.detail?.isWishlisted));
    };

    window.addEventListener('wishlist-updated', onWishlistUpdated);
    return () => {
      active = false;
      window.removeEventListener('wishlist-updated', onWishlistUpdated);
    };
  }, [productId]);

  React.useEffect(() => {
    setImageLoadFailed(false);
  }, [imageSrc, productId]);

  const handleCardClick = () => {
    if (isDetailView || !productId) return;
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated()) {
      window.location.href = '/cart';
      return;
    }

    try {
      setAdding(true);
      await addToCart(productId, 1);
      onCartUpdate?.();
      updateCartCount();
      showSuccessToast(`${product?.name || 'Product'} added to cart!`);
    } catch (error) {
      if (!error.response) showErrorToast('Network error. Please check your connection.');
      else showErrorToast(error.response?.data?.message || 'Error adding to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    try {
      setWishlistLoading(true);
      await toggleWishlist(productId);
      const next = !isWishlisted;
      setIsWishlisted(next);

      const ids = (await ensureWishlistCache()) || new Set();
      if (next) ids.add(productId);
      else ids.delete(productId);
      wishlistCacheIds = ids;

      window.dispatchEvent(
        new CustomEvent('wishlist-updated', {
          detail: { productId, isWishlisted: next }
        })
      );
    } catch (_error) {
      showErrorToast('Wishlist error. Please try again.');
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div
      className={`group relative h-full transition-transform duration-300 ${
        isDetailView ? '' : 'hover:-translate-y-1'
      }`}
      style={{ animationDelay }}
    >
      <div className="pointer-events-none absolute -inset-2 rounded-[1.45rem] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(34,211,238,0.75),rgba(16,185,129,0.45),rgba(56,189,248,0.55),rgba(34,211,238,0.75))] opacity-30 blur-lg transition-opacity duration-300 group-hover:opacity-95" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_120%,rgba(45,212,191,0.28),transparent_62%)] opacity-80 blur-md" />
      <article
      className={`relative z-10 h-full overflow-hidden rounded-xl sm:rounded-2xl bg-[linear-gradient(165deg,#060e19_0%,#0b1b31_58%,#102742_100%)] text-white ring-1 ring-white/10 transition duration-300 ${
        isDetailView ? '' : 'cursor-pointer group-hover:ring-cyan-300/45'
      }`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter') handleCardClick();
      }}
      >
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_90%_92%,rgba(16,185,129,0.1),transparent_32%)]" />
      <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden bg-[#101927]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-14 bg-gradient-to-b from-cyan-200/12 to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-[#07111f]/30 via-transparent to-transparent" />
        {hasValidImageSrc && !imageLoadFailed ? (
          <img
            src={imageSrc}
            alt={product?.name || 'Product'}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]"
            loading="lazy"
            onError={() => setImageLoadFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-400 text-4xl font-black text-slate-800">
            {fallbackInitials}
          </div>
        )}

        <div className="absolute left-2 top-2 sm:left-3 sm:top-3 z-10 rounded-full border border-white/15 bg-black/55 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {categoryLabel}
        </div>

        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
          className={`absolute right-2 top-2 sm:right-3 sm:top-3 z-10 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/20 transition-all ${
            isWishlisted
              ? 'bg-rose-500 text-white shadow-[0_8px_22px_-10px_rgba(244,63,94,0.75)]'
              : 'bg-black/50 text-white hover:bg-white hover:text-rose-500'
          }`}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <FiHeart className={isWishlisted ? 'fill-current' : ''} />
        </button>
      </div>

      <div className="relative z-10 flex min-h-[208px] sm:min-h-[260px] flex-col p-3 sm:p-4">
        <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/35 to-transparent" />
        <div className="min-h-[56px] sm:min-h-[70px]">
          <p className="mb-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-cyan-300/90">
            {product?.brand || 'Pinqoza Fresh'}
          </p>
          <h3 className="line-clamp-2 text-[0.95rem] sm:text-[1.15rem] font-black leading-tight text-white transition-colors duration-300 group-hover:text-cyan-50">
            {product?.name || 'Product'}
          </h3>
        </div>

        <div className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-white shadow-[0_8px_18px_-12px_rgba(16,185,129,0.85)]">
            {ratingText}
            <FiStar className="fill-current" />
          </span>
          <span className="text-[10px] sm:text-xs text-slate-400">{reviewsCount > 0 ? `${reviewsCount} reviews` : 'No reviews yet'}</span>
          {!isOutOfStock ? (
            <span className="ml-auto rounded-md bg-cyan-300/10 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-cyan-200">
              Fast
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 sm:gap-3 pt-3 sm:pt-5">
          <div className="rounded-lg sm:rounded-xl border border-white/10 bg-white/[0.075] px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-inner shadow-white/[0.04]">
            <p className="text-[1.75rem] sm:text-3xl font-black leading-none text-white">Rs {product?.price ?? '--'}</p>
            <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-400">/{product?.unit || 'unit'}</p>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding || isOutOfStock}
            className={`group/cta relative inline-flex h-9 sm:h-11 items-center gap-1.5 sm:gap-2 overflow-hidden rounded-lg sm:rounded-xl px-3 sm:px-4 text-[12px] sm:text-sm font-black transition-all ${
              isOutOfStock
                ? 'cursor-not-allowed bg-slate-700 text-slate-400'
                : 'bg-gradient-to-r from-cyan-300 via-emerald-300 to-sky-400 text-[#062131] shadow-[0_12px_30px_-14px_rgba(45,212,191,0.95)] hover:scale-[1.03] hover:from-cyan-200 hover:via-emerald-200 hover:to-sky-300'
            }`}
          >
            {!isOutOfStock ? (
              <span className="pointer-events-none absolute inset-y-0 -left-8 w-6 rotate-12 bg-white/40 blur-sm transition-all duration-500 group-hover/cta:left-[calc(100%+10px)]" />
            ) : null}
            {adding ? 'Adding' : 'Add'}
            <FiShoppingCart className="text-base sm:text-lg" />
          </button>
        </div>

        <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-slate-400">
          {isOutOfStock ? (
            'Currently unavailable'
          ) : (
            <>
              <span className="font-semibold text-emerald-400">In stock</span> and ready to deliver
            </>
          )}
        </p>
        {!isOutOfStock ? (
          <p className="mt-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-cyan-300/70">
            Secure checkout
          </p>
        ) : null}
      </div>
      </article>
    </div>
  );
};

export default ProductCard;
