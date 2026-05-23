import { useState, useCallback } from 'react';

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showInfoToast = useCallback((message, duration) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  const showSuccessToast = useCallback((message, duration) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  const showWarningToast = useCallback((message, duration) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);

  const showErrorToast = useCallback((message, duration) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    showInfoToast,
    showSuccessToast,
    showWarningToast,
    showErrorToast,
    clearAllToasts,
    success: showSuccessToast,
    error: showErrorToast
  };
};

export default useToast;
