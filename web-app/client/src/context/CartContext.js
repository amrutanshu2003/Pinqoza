import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCart } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [cart, setCart] = useState(null);
  const { isAuthenticated } = useAuth();

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCartCount(0);
        setCart(null);
        return;
      }
      const response = await getCart();
      setCart(response.data);
      setCartCount(response.data.totalItems || 0);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartCount(0);
      setCart(null);
    }
  };

  const updateCartCount = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Immediate update for logout
      setCartCount(0);
      setCart(null);
    } else {
      fetchCartCount();
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCartCount();

    // Listen for storage changes (when user logs out)
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        // Token was removed (user logged out)
        setCartCount(0);
        setCart(null);
      } else if (e.key === 'token' && e.newValue) {
        // Token was added (user logged in)
        fetchCartCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, cart, setCart, updateCartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
