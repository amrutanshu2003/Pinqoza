import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import ModernNavbar from './components/ModernNavbar';
import HomeRebuild from './pages/HomeRebuild';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import GoogleOAuthCallback from './pages/GoogleOAuthCallback';
import Register from './pages/Register';
import RegisterVerifyEmail from './pages/RegisterVerifyEmail';
import Account from './pages/Account';
import Subscriptions from './pages/Subscriptions';
import Orders from './pages/Orders';
import Success from './pages/Success';
import OrderSuccess from './pages/OrderSuccess';
import OrderDetails from './pages/OrderDetails';
import Wishlist from './pages/Wishlist';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import ADMIN_PATH from './config/adminPath';
import Profile from './pages/Profile';
import FestivalSpecial from './pages/FestivalSpecial';
import SeasonalDairy from './pages/SeasonalDairy';
import LimitedEdition from './pages/LimitedEdition';
import RecipeCollection from './pages/RecipeCollection';
import About from './pages/About';
import Contact from './pages/Contact';
import Footer from './components/Footer';
import { getCart } from './services/api';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ToastContainer } from './components/ToastNotification';

function AppContent() {
  const { cartCount, updateCartCount } = useCart();
  const { user, isAuthenticated, login, logout } = useAuth();
  const { socket, joinUserRoom } = useSocket();
  const { success, toasts, removeToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      updateCartCount(); // Update cart count when app loads with existing user
      // Join user's personal room for real-time notifications
      if (user && user._id) {
        joinUserRoom(user._id);
      }
    }
  }, [isAuthenticated, user, joinUserRoom]);

  useEffect(() => {
    const handleLoggedOut = () => {
      navigate('/login', { replace: true });
    };

    window.addEventListener('mm_logged_out', handleLoggedOut);
    return () => {
      window.removeEventListener('mm_logged_out', handleLoggedOut);
    };
  }, [navigate]);

  // Set up socket event listeners for real-time order confirmation
  useEffect(() => {
    if (!socket) return;

    // Real-time order confirmation events
    const handleOrderConfirmed = (data) => {
      console.log('✅ Order confirmed by admin:', data);

      // Show success notification
      if (data.message) {
        success(data.message);
      }

      // Redirect to success page (fallback when redirectUrl isn't provided)
      if (data.redirectUrl) {
        navigate(data.redirectUrl);
      } else if (data.orderId) {
        navigate(`/order-success/${data.orderId}`);
      }
    };

    // Real-time payment confirmation events
    const handlePaymentVerified = (data) => {
      console.log('✅ Payment verified by admin:', data);

      // Show success notification
      if (data.message) {
        success(data.message);
      }

      // Redirect to success page (fallback when redirectUrl isn't provided)
      if (data.redirectUrl) {
        navigate(data.redirectUrl);
      } else if (data.orderId) {
        navigate(`/order-success/${data.orderId}`);
      }
    };

    // Register event listeners
    socket.on('orderConfirmed', handleOrderConfirmed);
    // Server emits `paymentVerified`; keep `paymentConfirmed` as a backward-compatible alias
    socket.on('paymentVerified', handlePaymentVerified);
    socket.on('paymentConfirmed', handlePaymentVerified);

    // Cleanup event listeners
    return () => {
      socket.off('orderConfirmed', handleOrderConfirmed);
      socket.off('paymentVerified', handlePaymentVerified);
      socket.off('paymentConfirmed', handlePaymentVerified);
    };
  }, [socket, navigate]);

  const handleLogin = (userData) => {
    login(userData);
    updateCartCount(); // Update cart count after login
  };

  const handleLogout = () => {
    logout();
    updateCartCount(); // Force cart count update to 0
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <ModernNavbar user={user} onLogout={handleLogout} cartCount={cartCount} />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 md:pb-8">
        <Routes>
          <Route path="/" element={<HomeRebuild />} />
          <Route path="/products" element={<Products />} />
          <Route path="/admin" element={<NotFound />} />
          <Route path={`${ADMIN_PATH}/*`} element={<Admin />} />
          <Route path="/product/:id" element={<Navigate to="/" replace />} />
          <Route path="/festival-special" element={<FestivalSpecial />} />
          <Route path="/seasonal-dairy" element={<SeasonalDairy />} />
          <Route path="/limited-edition" element={<LimitedEdition />} />
          <Route path="/recipe-collection" element={<RecipeCollection />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/oauth/google/callback" element={<GoogleOAuthCallback onLogin={handleLogin} />} />
            <Route 
              path="/register" 
              element={<Register />} 
            />
            <Route
              path="/register/verify-email"
              element={<RegisterVerifyEmail onVerified={handleLogin} />}
            />
            <Route 
              path="/account" 
              element={<Account user={user} onUpdate={handleLogin} />} 
            />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/success" element={<Success />} />
            <Route path="/order-success/:orderId" element={<OrderSuccess />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/order/:id" element={<OrderDetails />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <SocketProvider>
            <ToastProvider>
              <Router>
                <AppContent />
              </Router>
            </ToastProvider>
          </SocketProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
