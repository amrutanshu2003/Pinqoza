import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const { isDarkMode } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);
    
    // Auto close after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 300); // Wait for exit animation
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = 'fixed top-20 right-4 z-[40] p-4 rounded-xl shadow-2xl backdrop-blur-xl border transform transition-all duration-300 max-w-sm';
    
    const typeStyles = {
      info: isDarkMode 
        ? 'bg-blue-900/90 border-blue-700/50 text-blue-100' 
        : 'bg-blue-50 border-blue-200 text-blue-800',
      success: isDarkMode 
        ? 'bg-green-900/90 border-green-700/50 text-green-100' 
        : 'bg-green-50 border-green-200 text-green-800',
      warning: isDarkMode 
        ? 'bg-yellow-900/90 border-yellow-700/50 text-yellow-100' 
        : 'bg-yellow-50 border-yellow-200 text-yellow-800',
      error: isDarkMode 
        ? 'bg-red-900/90 border-red-700/50 text-red-100' 
        : 'bg-red-50 border-red-200 text-red-800'
    };

    return `${baseStyles} ${typeStyles[type]}`;
  };

  const getIcon = () => {
    const iconClass = 'w-5 h-5 flex-shrink-0';
    
    switch(type) {
      case 'info':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={getToastStyles()}
      style={{
        transform: isVisible ? 'translateX(0)' : 'translateX(400px)',
        opacity: isVisible ? 1 : 0
      }}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <p className="text-sm font-medium flex-1">
          {message}
        </p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
            isDarkMode 
              ? 'hover:bg-white/10 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
