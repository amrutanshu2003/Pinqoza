import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to headers if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const register = async (userData) => {
  const res = await api.post('/users/register', userData);
  return res;
};

export const sendRegisterOtp = async (userData) => {
  const res = await api.post('/users/register/send-otp', userData);
  return res;
};

export const verifyRegisterOtp = async (email, otp) => {
  const res = await api.post('/users/register/verify-otp', { email, otp });
  return res;
};

export const login = async (credentials) => {
  const res = await api.post('/users/login', credentials);
  return res;
};

export const getProfile = async () => {
  const res = await api.get('/users/profile');
  return res;
};

export const updateProfile = async (userData) => {
  const res = await api.put('/users/profile', userData);
  return res;
};

export const logoutAllDevices = async () => {
  const res = await api.post('/users/logout-all-devices');
  return res;
};

export const deleteProfile = async () => {
  const res = await api.delete('/users/profile');
  return res;
};

export const requestDeleteAccount = async (password) => {
  const res = await api.post('/users/delete-request', { password });
  return res;
};

export const cancelDeleteRequest = async () => {
  const res = await api.post('/users/cancel-delete');
  return res;
};

// Password Reset APIs
export const forgotPassword = async (email) => {
  const res = await api.post('/users/forgot-password', { email });
  return res;
};

export const sendForgotPasswordOtp = async (email) => {
  const res = await api.post('/users/forgot-password/send-otp', { email });
  return res;
};

export const verifyForgotPasswordOtp = async (email, otp) => {
  const res = await api.post('/users/forgot-password/verify-otp', { email, otp });
  return res;
};

export const resetPasswordWithOtp = async (email, otp, password) => {
  const res = await api.post('/users/forgot-password/reset-with-otp', { email, otp, password });
  return res;
};

export const resetPassword = async (token, password) => {
  const res = await api.post(`/users/reset-password/${token}`, { password });
  return res;
};

// Address APIs
export const getAddresses = async () => {
  const res = await api.get('/users/addresses');
  return res;
};

export const addAddress = async (addressData) => {
  const res = await api.post('/users/addresses', addressData);
  return res;
};

export const updateAddress = async (id, addressData) => {
  const res = await api.put(`/users/addresses/${id}`, addressData);
  return res;
};

export const deleteAddress = async (id) => {
  const res = await api.delete(`/users/addresses/${id}`);
  return res;
};

export const setDefaultAddress = async (id) => {
  const res = await api.put(`/users/addresses/${id}/default`);
  return res;
};

// Coupon APIs
export const validateCoupon = async (code, amount) => {
  const res = await api.post('/coupons/validate', { code, amount });
  return res;
};

// Admin APIs
export const getUsers = async () => {
  const res = await api.get('/users');
  return res;
};

// Product APIs
// Backward-compatible signature:
// - getProducts(category, search, page)
// - getProducts({ category, search, page, limit, minPrice, maxPrice, minRating, sort })
export const getProducts = async (categoryOrParams = '', search = '', page = 1) => {
  const params =
    categoryOrParams && typeof categoryOrParams === 'object'
      ? categoryOrParams
      : { category: categoryOrParams, search, page };

  const res = await api.get('/products', { params });
  return res;
};

export const getFeaturedProducts = async () => {
  const res = await api.get('/products/featured');
  return res;
};

export const getProductCategories = async () => {
  const res = await api.get('/products/categories');
  return res;
};

export const getProductById = async (id) => {
  const res = await api.get(`/products/${id}`);
  return res;
};

export const searchProducts = async (query, limit = 10) => {
  const res = await api.get('/products/search', {
    params: { q: query, limit }
  });
  return res;
};

// Contact
export const sendContactMessage = async ({ name, email, message }) => {
  const res = await api.post('/contact', { name, email, message });
  return res;
};

// Product Reviews APIs
export const getProductReviews = async (productId) => {
  const res = await api.get(`/products/${productId}/reviews`);
  return res;
};

export const addProductReview = async (productId, rating, comment) => {
  const res = await api.post(`/products/${productId}/reviews`, { rating, comment });
  return res;
};

// Q&A APIs
export const getProductQuestions = async (productId) => {
  const res = await api.get(`/questions/product/${productId}`);
  return res;
};

export const askQuestion = async (productId, question) => {
  const res = await api.post('/questions', { productId, question });
  return res;
};

export const answerQuestion = async (questionId, answer) => {
  const res = await api.post(`/questions/${questionId}/answer`, { answer });
  return res;
};

export const getMyQuestions = async () => {
  const res = await api.get('/questions/my-questions');
  return res;
};

export const deleteQuestion = async (questionId) => {
  const res = await api.delete(`/questions/${questionId}`);
  return res;
};

// Wishlist APIs
export const getWishlist = async () => {
  const res = await api.get('/wishlist');
  return res;
};

export const addToWishlist = async (productId) => {
  const res = await api.post('/wishlist', { productId });
  return res;
};

export const removeFromWishlist = async (productId) => {
  const res = await api.delete(`/wishlist/${productId}`);
  return res;
};

export const toggleWishlist = async (productId) => {
  const res = await api.post(`/wishlist/toggle/${productId}`);
  return res;
};

// Cart APIs
export const getCart = async () => {
  const res = await api.get('/cart');
  return res;
};

export const addToCart = async (productId, quantity = 1) => {
  const res = await api.post('/cart', { productId, quantity });
  return res;
};

export const updateCartItem = async (itemId, quantity) => {
  const res = await api.put(`/cart/${itemId}`, { quantity });
  return res;
};

export const removeCartItem = async (itemId) => {
  const res = await api.delete(`/cart/${itemId}`);
  return res;
};

export const clearCart = async () => {
  const res = await api.delete('/cart');
  return res;
};

// Order APIs
export const createOrder = async (orderData) => {
  const res = await api.post('/orders', orderData);
  return res;
};

export const getOrders = async () => {
  const res = await api.get('/orders');
  return res;
};

export const getOrderById = async (id) => {
  const res = await api.get(`/orders/${id}`);
  return res;
};

export const deleteOrder = async (id) => {
  const res = await api.delete(`/orders/${id}`);
  return res;
};

export const getAdminOrderById = async (id) => {
  const res = await adminApi.get(`/orders/${id}`);
  return res;
};

export const updateOrderStatus = async (id, orderStatus) => {
  const res = await api.put(`/orders/${id}/status`, { orderStatus });
  return res;
};

export const cancelOrder = async (id) => {
  const res = await api.post(`/orders/${id}/cancel`);
  return res;
};

export const reorder = async (id) => {
  const res = await api.post(`/orders/${id}/reorder`);
  return res;
};

// Admin Panel APIs (separate database)
// Create separate admin API instance
const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add admin token to headers
adminApi.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }
  return config;
});

// Add response interceptor to handle 401 errors and auto logout
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto logout admin on 401 (token expired/invalid)
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      // Dispatch custom event for same-tab updates (only if window is available)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('adminAuthChange'));
      }
    }
    return Promise.reject(error);
  }
);

// Admin Auth APIs
export const adminLogin = async (credentials) => {
  const res = await adminApi.post('/admin/login', credentials);
  if (res.data.token) {
    localStorage.setItem('adminToken', res.data.token);
    localStorage.setItem('adminUser', JSON.stringify(res.data));
    // Dispatch custom event for same-tab updates (only if window is available)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('adminAuthChange'));
    }
  }
  return res;
};

export const adminLogout = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  // Dispatch custom event for same-tab updates (only if window is available)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('adminAuthChange'));
  }
};

/**
 * Admin User APIs (customer users)
 */

// Admin User - fetch all customer users
export const getAdminUsers = async () => {
  const res = await adminApi.get('/admin/users');
  return res;
};

// Admin User - toggle customer user's isAdmin role
export const updateAdminUserRole = async (userId, isAdmin) => {
  const res = await adminApi.put(`/admin/users/${userId}/role`, { isAdmin });
  return res;
};

// Admin User - soft delete / restore customer user
export const updateAdminUserDeleted = async (userId, isDeleted) => {
  const res = await adminApi.put(`/admin/users/${userId}/deleted`, { isDeleted });
  return res;
};

// Admin Product APIs
export const getAdminProducts = async () => {
  const res = await adminApi.get('/admin/products');
  return res;
};

export const createAdminProduct = async (productData) => {
  const res = await adminApi.post('/admin/products', productData);
  return res;
};

export const updateAdminProduct = async (id, productData) => {
  const res = await adminApi.put(`/admin/products/${id}`, productData);
  return res;
};

export const updateAdminProductImage = async (id, image) => {
  try {
    const res = await adminApi.put(`/admin/products/${id}/image`, { image });
    return res;
  } catch (error) {
    // Backward compatibility: if new image route is unavailable, fallback to generic product update.
    if (error?.response?.status === 404) {
      const fallbackRes = await adminApi.put(`/admin/products/${id}`, { image });
      return fallbackRes;
    }
    throw error;
  }
};

export const removeAdminProductImage = async (id) => {
  try {
    const res = await adminApi.delete(`/admin/products/${id}/image`);
    return res;
  } catch (error) {
    if (error?.response?.status === 404) {
      const fallbackRes = await adminApi.put(`/admin/products/${id}`, { image: '' });
      return fallbackRes;
    }
    throw error;
  }
};

export const resetAdminProductImagePlaceholder = async (id) => {
  const res = await adminApi.put(`/admin/products/${id}/image/reset`);
  return res;
};

export const deleteAdminProduct = async (id) => {
  const res = await adminApi.delete(`/admin/products/${id}`);
  return res;
};

export const seedOwnCatalog = async (count = 1000) => {
  const res = await adminApi.post('/admin/catalog/seed-own', { count });
  return res;
};

export const importProductsCsv = async (csv) => {
  const res = await adminApi.post('/admin/catalog/import-csv', { csv });
  return res;
};

export const downloadProductsCsvTemplate = async () => {
  const res = await adminApi.get('/admin/catalog/template', { responseType: 'text' });
  return res;
};

// Admin Order APIs
export const getAdminOrders = async () => {
  const res = await adminApi.get('/admin/orders');
  return res;
};

export const updateAdminOrder = async (id, orderData) => {
  const res = await adminApi.put(`/admin/orders/${id}`, orderData);
  return res;
};

export const deleteAdminOrder = async (id) => {
  const res = await adminApi.delete(`/admin/orders/${id}`);
  return res;
};

/**
 * Customer Orders (main DB) - Admin APIs
 */
export const getAdminCustomerOrders = async (params = {}) => {
  const res = await adminApi.get('/admin/customer-orders', { params });
  return res;
};

export const getAdminCustomerOrderById = async (id) => {
  const res = await adminApi.get(`/admin/customer-orders/${id}`);
  return res;
};

export const deleteAdminCustomerOrder = async (id) => {
  const res = await adminApi.delete(`/admin/customer-orders/${id}`);
  return res;
};

export const updateAdminCustomerOrderStatus = async (id, orderStatus) => {
  const res = await adminApi.put(`/admin/customer-orders/${id}/status`, { orderStatus });
  return res;
};


export const updateAdminCustomerOrderTracking = async (id, trackingData) => {
  const res = await adminApi.put(`/admin/customer-orders/${id}/tracking`, trackingData);
  return res;
};


// Payment Management APIs (Admin)
export const getPendingPayments = async () => {
  const res = await adminApi.get('/admin/payment/pending');
  return res;
};

// Debug/Test API
export const testPaymentSystem = async () => {
  const res = await adminApi.get('/admin/payment/test');
  return res;
};

export const verifyPayment = async (orderId, transactionId, notes) => {
  const res = await adminApi.post(`/admin/payment/verify/${orderId}`, { transactionId, notes });
  return res;
};

export const confirmOrder = async (orderId, notes) => {
  const res = await adminApi.post(`/admin/payment/confirm/${orderId}`, { notes });
  return res;
};

export const rejectOrder = async (orderId, reason) => {
  const res = await adminApi.post(`/admin/payment/reject/${orderId}`, { reason });
  return res;
};

// Subscription APIs
export const createSubscription = async (subscriptionData) => {
  const res = await api.post('/subscriptions', subscriptionData);
  return res;
};

export const getUserSubscriptions = async () => {
  const res = await api.get('/subscriptions');
  return res;
};

export const updateSubscription = async (id, subscriptionData) => {
  const res = await api.put(`/subscriptions/${id}`, subscriptionData);
  return res;
};

export const cancelSubscription = async (id) => {
  const res = await api.put(`/subscriptions/${id}/cancel`);
  return res;
};

export const pauseSubscription = async (id) => {
  const res = await api.put(`/subscriptions/${id}/pause`);
  return res;
};

export const resumeSubscription = async (id) => {
  const res = await api.put(`/subscriptions/${id}/resume`);
  return res;
};

export const verifyAdminGateAccess = async (key) => {
  const res = await adminApi.post('/admin/gate-verify', { key });
  return res;
};

export const updateDeliverySchedule = async (id, schedule) => {
  const res = await api.put(`/subscriptions/${id}/schedule`, schedule);
  return res;
};

export const setVacationMode = async (id, from, to) => {
  const res = await api.put(`/subscriptions/${id}/vacation`, { from, to });
  return res;
};

export const clearVacationMode = async (id) => {
  const res = await api.delete(`/subscriptions/${id}/vacation`);
  return res;
};

export const skipDeliveryDate = async (id, date) => {
  const res = await api.post(`/subscriptions/${id}/skip`, { date });
  return res;
};

// Admin Subscription APIs
export const getAdminSubscriptions = async () => {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    throw new Error('Admin authentication required');
  }
  const res = await adminApi.get('/admin/subscriptions');
  return res;
};

export const getAdminPendingSubscriptions = async () => {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    throw new Error('Admin authentication required');
  }
  const res = await adminApi.get('/admin/subscriptions/pending');
  return res;
};

export const verifySubscriptionPayment = async (subscriptionId, transactionId, notes) => {
  const res = await adminApi.post(`/admin/subscriptions/verify/${subscriptionId}`, { transactionId, notes });
  return res;
};

export const rejectSubscription = async (subscriptionId, reason) => {
  const res = await adminApi.post(`/admin/subscriptions/reject/${subscriptionId}`, { reason });
  return res;
};

export const updateAdminSubscription = async (subscriptionId, subscriptionData) => {
  const res = await adminApi.put(`/admin/subscriptions/${subscriptionId}`, subscriptionData);
  return res;
};

export const getAdminSubscriptionById = async (subscriptionId) => {
  const res = await adminApi.get(`/admin/subscriptions/${subscriptionId}`);
  return res;
};

export default api;
