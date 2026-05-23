import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getFeaturedProducts, getProductCategories, getProducts } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';

const Products = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [homeFeed, setHomeFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        const res = await getProductCategories();
        if (!active) return;
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        if (!active) return;
        setCategories([]);
      }
    };

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);

        if (!search.trim() && !category) {
          const feedRes = await getFeaturedProducts();
          if (!active) return;
          setHomeFeed(Array.isArray(feedRes.data) ? feedRes.data : []);
          setProducts([]);
        } else {
          const res = await getProducts({ search: search.trim(), category, sort: 'rating_desc', limit: 40 });
          if (!active) return;
          setProducts(Array.isArray(res.data?.products) ? res.data.products : []);
          setHomeFeed([]);
        }
      } catch (error) {
        if (!active) return;
        setProducts([]);
        setHomeFeed([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [search, category]);

  useEffect(() => {
    if (!socket) return undefined;

    const applyStockUpdates = (payload) => {
      const updates = Array.isArray(payload?.updates) ? payload.updates : [];
      if (updates.length === 0) return;
      const stockMap = new Map(updates.map((item) => [String(item.productId), item.stock]));

      setProducts((prev) =>
        prev.map((product) =>
          stockMap.has(String(product._id))
            ? { ...product, stock: Number(stockMap.get(String(product._id))) }
            : product
        )
      );
      setHomeFeed((prev) =>
        prev.map((product) =>
          stockMap.has(String(product._id))
            ? { ...product, stock: Number(stockMap.get(String(product._id))) }
            : product
        )
      );
    };

    socket.on('productsStockUpdated', applyStockUpdates);
    return () => {
      socket.off('productsStockUpdated', applyStockUpdates);
    };
  }, [socket]);

  const visibleProducts = useMemo(() => (search.trim() || category ? products : []), [search, category, products]);

  const setCategory = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (cat) params.set('category', cat);
    else params.delete('category');
    params.delete('page');
    setSearchParams(params);
  };

  const hasFilters = Boolean(search.trim() || category);

  return (
    <div className="space-y-6">
      <section className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-gray-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Products</h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Dedicated product detail page nahi hai. Search ya category se listing khulegi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`px-4 py-2 rounded-xl border text-sm font-semibold ${isDarkMode ? 'border-white/10 text-gray-200 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            Home
          </button>
        </div>

        {categories.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${!category ? 'bg-blue-600 text-white border-blue-600' : isDarkMode ? 'border-white/10 text-gray-200' : 'border-gray-300 text-gray-700'}`}
            >
              All
            </button>
            {categories.slice(0, 10).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${category === cat ? 'bg-blue-600 text-white border-blue-600' : isDarkMode ? 'border-white/10 text-gray-200' : 'border-gray-300 text-gray-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section>
        {hasFilters ? (
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-3`}>
            {loading ? 'Searching products...' : `${visibleProducts.length} product(s) found`}
          </p>
        ) : null}

        {!hasFilters ? (
          <div className={`rounded-xl border p-8 text-center ${isDarkMode ? 'border-white/10 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
            Product dekhne ke liye search karo ya category select karo.
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`h-64 rounded-xl animate-pulse ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
            ))}
          </div>
        ) : visibleProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleProducts.map((product, idx) => (
              <ProductCard key={product._id || idx} product={product} index={idx} />
            ))}
          </div>
        ) : (
          <div className={`rounded-xl border p-8 text-center ${isDarkMode ? 'border-white/10 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
            Koi product nahi mila.
          </div>
        )}
      </section>
    </div>
  );
};

export default Products;
