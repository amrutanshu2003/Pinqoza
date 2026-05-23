import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('user');
    if (token && userInfo) {
      setUser(JSON.parse(userInfo));
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    const oldToken = localStorage.getItem('token');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Notify other components and tabs about logout
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'token',
      oldValue: oldToken,
      newValue: null,
      storageArea: localStorage
    }));
    window.dispatchEvent(new CustomEvent('mm_logged_out'));
  };

  useEffect(() => {
    checkAuthStatus();

    // Listen for storage changes (when user logs in/out from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Log out user when navigating back before the login history entry.
    const handlePopState = (e) => {
      // If there's no state or our login marker is missing while we are authenticated, logout.
      if (!e.state || !e.state.mm_logged_in) {
        const token = localStorage.getItem('token');
        if (!token) return; // already logged out
        // Use existing logout to clear data and notify other components
        logout();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Enhance login to mark history so back navigation logs out
  const originalLogin = login;
  const enhancedLogin = (userData) => {
    originalLogin(userData);
    try {
      // push a history entry marking the login state
      window.history.pushState({ mm_logged_in: true }, '');
    } catch (e) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login: enhancedLogin, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
