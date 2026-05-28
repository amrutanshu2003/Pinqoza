import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addToCart } from '../services/api';
import { useToast } from '../context/ToastContext';

const seedProducts = [
  { id: '1', name: 'Smartphone X Pro', category: 'mobiles', price: 15999, rating: 4.5 },
  { id: '2', name: 'Wireless Earbuds', category: 'electronics', price: 1299, rating: 4.2 },
  { id: '3', name: 'Men Casual Shirt', category: 'fashion', price: 799, rating: 4.1 },
  { id: '4', name: 'Non-stick Cookware Set', category: 'home', price: 2499, rating: 4.3 },
  { id: '5', name: 'Organic Grocery Combo', category: 'grocery', price: 999, rating: 4.4 },
  { id: '6', name: 'Skincare Starter Kit', category: 'beauty', price: 1499, rating: 4.0 },
  { id: '7', name: 'Mixer Grinder', category: 'appliances', price: 3299, rating: 4.2 },
  { id: '8', name: 'Kids Learning Toy', category: 'toys', price: 699, rating: 4.3 }
];

const Products = () => {
  const [params, setParams] = useSearchParams();
  const [loadingId, setLoadingId] = useState('');
  const { success, error } = useToast();

  const search = (params.get('search') || '').toLowerCase().trim();
  const category = (params.get('category') || '').toLowerCase();

  const filtered = useMemo(() => {
    return seedProducts.filter((p) => {
      const mSearch = !search || p.name.toLowerCase().includes(search);
      const mCategory = !category || p.category === category;
      return mSearch && mCategory;
    });
  }, [search, category]);

  const setCategory = (cat) => {
    const next = new URLSearchParams(params);
    if (cat) next.set('category', cat);
    else next.delete('category');
    setParams(next);
  };

  const handleAdd = async (product) => {
    try {
      setLoadingId(product.id);
      await addToCart(product.id, 1);
      success(`${product.name} added to cart`);
    } catch (e) {
      error('Unable to add to cart right now');
    } finally {
      setLoadingId('');
    }
  };

  const cats = ['mobiles', 'fashion', 'electronics', 'home', 'grocery', 'beauty'];

  return (
    <div className="space-y-4">
      <section className="rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Browse Products</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Find deals quickly and add items in one tap.</p>
      </section>

      <section className="rounded-xl p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
        <button onClick={() => setCategory('')} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${!category ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>All</button>
        {cats.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${category === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>
            {cat}
          </button>
        ))}
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
            <div className="h-32 rounded-lg bg-slate-100 dark:bg-slate-800 mb-3" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-300 capitalize mt-1">{p.category} · ⭐ {p.rating}</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-lg font-black text-slate-900 dark:text-white">Rs {p.price}</p>
              <button
                onClick={() => handleAdd(p)}
                disabled={loadingId === p.id}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold disabled:opacity-60"
              >
                {loadingId === p.id ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        ))}
      </section>

      {filtered.length === 0 && (
        <div className="rounded-xl p-8 text-center text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          No products found for this filter.
        </div>
      )}
    </div>
  );
};

export default Products;
