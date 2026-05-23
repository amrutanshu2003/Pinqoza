import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Optional force-logout (do NOT run on every reload).
// Trigger by adding `?forceLogout=1` to the URL or setting localStorage `mm_force_logout=1`.
try {
  const url = new URL(window.location.href);
  const shouldForceLogout =
    url.searchParams.get('forceLogout') === '1' ||
    localStorage.getItem('mm_force_logout') === '1';

  if (shouldForceLogout) {
    localStorage.removeItem('mm_force_logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.dispatchEvent(new Event('adminAuthChange'));

    if (url.searchParams.get('forceLogout') === '1') {
      url.searchParams.delete('forceLogout');
      window.history.replaceState({}, document.title, url.toString());
    }
  }
} catch (e) {
  // ignore
}

// Apply saved theme on initial load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Basic PWA service worker registration (offline cache)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // Keep silent in production; console is fine for dev
      console.log('SW registration failed:', err);
    });
  });
}
