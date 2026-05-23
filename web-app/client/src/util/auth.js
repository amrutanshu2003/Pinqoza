// Auth utility functions

export const saveAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getAuthData = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return {
    token,
    user: user ? JSON.parse(user) : null
  };
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

export const isAdmin = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return false;
  const user = JSON.parse(userStr);
  return user && user.isAdmin;
};

// Check if admin is authenticated (separate admin system)
export const isAdminAuthenticated = () => {
  const adminToken = localStorage.getItem('adminToken');
  return !!adminToken;
};

// Get admin user data
export const getAdminUser = () => {
  const adminUserStr = localStorage.getItem('adminUser');
  return adminUserStr ? JSON.parse(adminUserStr) : null;
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const logout = () => {
  clearAuthData();
};

export const getCurrentIntendedUrl = () => {
  return window.location.pathname + window.location.search + window.location.hash;
};

export const getSafeRedirectUrl = (intendedUrl, fallback = '/') => {
  if (!intendedUrl || typeof intendedUrl !== 'string') {
    return fallback;
  }

  const redirectUrl = intendedUrl.trim();
  const isLoginRoute =
    redirectUrl === '/login' ||
    redirectUrl.startsWith('/login?') ||
    redirectUrl.startsWith('/login#');

  if (!redirectUrl.startsWith('/') || redirectUrl.startsWith('//') || isLoginRoute) {
    return fallback;
  }

  return redirectUrl;
};

export const saveIntendedUrl = (intendedUrl) => {
  const redirectUrl = getSafeRedirectUrl(intendedUrl || getCurrentIntendedUrl());
  localStorage.setItem('intendedUrl', redirectUrl);
  return redirectUrl;
};

export const consumeIntendedUrl = (fallback = '/') => {
  const redirectUrl = getSafeRedirectUrl(localStorage.getItem('intendedUrl'), fallback);
  localStorage.removeItem('intendedUrl');
  return redirectUrl;
};

export const requireLogin = (intendedUrl) => {
  try {
    saveIntendedUrl(intendedUrl);
    sessionStorage.setItem('mm_open_login_popup', '1');
    window.dispatchEvent(new CustomEvent('mm_require_login'));
  } catch (e) {
    console.warn('requireLogin failed', e);
  }
};

// Admin logout helper (clears admin tokens)
export const adminLogout = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
};

export default {
  saveAuthData,
  getAuthData,
  isAuthenticated,
  isAdmin,
  isAdminAuthenticated,
  getAdminUser,
  getToken,
  clearAuthData,
  logout,
  getCurrentIntendedUrl,
  getSafeRedirectUrl,
  saveIntendedUrl,
  consumeIntendedUrl,
  requireLogin,
  adminLogout
};
