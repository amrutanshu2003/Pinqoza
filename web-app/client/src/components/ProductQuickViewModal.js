import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addToCart, getProductById } from '../services/api';
import { isAuthenticated } from '../util/auth';

const ProductQuickViewModal = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get('product');
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      return;
    }

    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getProductById(productId);
        if (!active) return;
        setProduct(res.data || null);
      } catch (e) {
        if (!active) return;
        setProduct(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [productId]);

  const closeModal = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('product');
    setSearchParams(params, { replace: true });
  };

  const openFullDetails = () => {
    if (!productId) return;
    closeModal();
    navigate(`/product/${productId}`);
  };

  const handleAdd = async () => {
    if (!product?._id) return;
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    try {
      setAdding(true);
      await addToCart(product._id, 1);
    } finally {
      setAdding(false);
    }
  };

  if (!productId) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm p-3 sm:p-6" onClick={closeModal}>
      <div
        className="mx-auto mt-8 sm:mt-16 max-w-3xl rounded-2xl border border-white/10 bg-gray-900 text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-6 sm:p-8">
            <div className="h-64 rounded-xl bg-white/10 animate-pulse" />
          </div>
        ) : product ? (
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="bg-gray-800 p-5 flex items-center justify-center min-h-[280px]">
              {product.image ? (
                <img src={product.image} alt={product.name} className="max-h-72 object-contain" />
              ) : (
                <div className="text-5xl">🛍️</div>
              )}
            </div>
            <div className="p-5 sm:p-6">
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <p className="mt-1 text-gray-300 capitalize">{product.category || 'Product'}</p>
              <p className="mt-4 text-3xl font-extrabold">₹{product.price}</p>
              <p className="text-sm text-gray-400">/{product.unit || 'unit'}</p>
              <p className="mt-4 text-sm text-gray-300 line-clamp-4">{product.description || 'Fresh product with premium quality.'}</p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleAdd}
                  disabled={adding || Number(product.stock) === 0}
                  className="h-11 px-5 rounded-xl bg-yellow-400 text-gray-900 font-bold disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                  onClick={openFullDetails}
                  className="h-11 px-5 rounded-xl border border-white/20 bg-white/10 font-semibold"
                >
                  Full Details
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-300">Product not found</div>
        )}
      </div>
    </div>
  );
};

export default ProductQuickViewModal;
