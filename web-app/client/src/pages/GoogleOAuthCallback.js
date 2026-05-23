import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../services/api';
import { consumeIntendedUrl, getSafeRedirectUrl, saveAuthData } from '../util/auth';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';

const GoogleOAuthCallback = ({ onLogin }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { updateCartCount } = useCart();
  const [error, setError] = useState('');

  const params = useMemo(() => new URLSearchParams(window.location.search), []);

  useEffect(() => {
    const oauthError = params.get('error');
    const token = params.get('token');
    const redirectParam = params.get('redirect');
    const hintEmail = params.get('hint_email');
    const hintName = params.get('hint_name');
    const hintPicture = params.get('hint_picture');

    const fallbackRedirect = consumeIntendedUrl('/');
    const redirectTo = getSafeRedirectUrl(redirectParam, fallbackRedirect);

    if (hintEmail) {
      localStorage.setItem('mm_google_email_hint', String(hintEmail).trim().toLowerCase());
    }
    if (hintName) {
      localStorage.setItem('mm_google_name_hint', String(hintName).trim());
    }
    if (hintPicture) {
      localStorage.setItem('mm_google_picture_hint', String(hintPicture).trim());
    }

    if (oauthError) {
      setError('Google login failed. Please try again.');
      setTimeout(() => navigate('/login', { replace: true }), 900);
      return;
    }

    if (!token) {
      setError('Google login failed (missing token).');
      setTimeout(() => navigate('/login', { replace: true }), 900);
      return;
    }

    // Set token early so API interceptor includes it.
    localStorage.setItem('token', token);

    (async () => {
      try {
        const profileRes = await getProfile();
        const userData = { ...profileRes.data, token };
        if (userData?.email) {
          localStorage.setItem('mm_google_email_hint', String(userData.email).trim().toLowerCase());
        }
        if (userData?.name) {
          localStorage.setItem('mm_google_name_hint', String(userData.name).trim());
        }
        saveAuthData(token, userData);
        updateCartCount();
        if (typeof onLogin === 'function') {
          onLogin(userData);
        }
        navigate(redirectTo, { replace: true });
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Unable to finish Google login. Please try again.');
        setTimeout(() => navigate('/login', { replace: true }), 900);
      }
    })();
  }, [navigate, onLogin, params, updateCartCount]);

  return (
    <div className={`fade-in min-h-screen flex items-center justify-center px-4 py-8 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <div className={`w-full max-w-md p-6 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-[#0b0b0b] border-gray-900 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow">
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold">Signing you in…</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
              Finishing Google authentication
            </div>
          </div>
        </div>

        {error && (
          <div className={`mt-5 p-3 rounded-xl border text-sm ${isDarkMode ? 'bg-red-900/20 border-red-900 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleOAuthCallback;
