import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Try to get user-specific theme first
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.email || 'anonymous';
    const userTheme = localStorage.getItem(`theme_${userId}`);
    
    // Fallback to global theme
    const globalTheme = localStorage.getItem('theme');
    
    if (userTheme) {
      return userTheme === 'dark';
    } else if (globalTheme) {
      return globalTheme === 'dark';
    }
    
    // Check system preference as fallback
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    
    // Default to light mode
    return false;
  });

  // Save theme to both user-specific and global storage
  const saveThemePreference = (isDark) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.email || 'anonymous';
    const themeValue = isDark ? 'dark' : 'light';
    
    // Save user-specific theme
    localStorage.setItem(`theme_${userId}`, themeValue);
    
    // Save global theme for fallback
    localStorage.setItem('theme', themeValue);
    
    // Try to save to database if user is logged in
    if (user._id) {
      try {
        // Save to user preferences in database
        fetch('/api/user/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            theme: themeValue
          })
        }).catch(() => {
          // Silently fail if API call fails
          console.log('Theme preference saved locally only');
        });
      } catch (error) {
        console.log('Theme preference saved locally only');
      }
    }
  };

  // Load theme from database on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user._id) {
      try {
        fetch(`/api/user/preferences`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        .then(res => res.json())
        .then(data => {
          if (data.theme) {
            const dbTheme = data.theme === 'dark';
            setIsDarkMode(dbTheme);
          }
        })
        .catch(() => {
          // Silently fail if API call fails
          console.log('Using local theme preference');
        });
      } catch (error) {
        console.log('Using local theme preference');
      }
    }
  }, []);

  useEffect(() => {
    // Apply dark mode class to html element
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save theme preference
    saveThemePreference(isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Set theme programmatically (useful for loading user preferences)
  const setTheme = (theme) => {
    setIsDarkMode(theme === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
