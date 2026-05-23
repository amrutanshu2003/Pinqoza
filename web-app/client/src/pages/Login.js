import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { saveAuthData, consumeIntendedUrl, getSafeRedirectUrl } from '../util/auth';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [shakeEmail, setShakeEmail] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);
  const [googleHintEmail, setGoogleHintEmail] = useState('');
  const [googleHintName, setGoogleHintName] = useState('');
  const [googleHintPicture, setGoogleHintPicture] = useState('');
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { updateCartCount } = useCart();

  useEffect(() => {
    const syncGoogleHints = () => {
      setGoogleHintEmail(String(localStorage.getItem('mm_google_email_hint') || '').trim());
      setGoogleHintName(String(localStorage.getItem('mm_google_name_hint') || '').trim());
      setGoogleHintPicture(String(localStorage.getItem('mm_google_picture_hint') || '').trim());
    };

    syncGoogleHints();
    window.addEventListener('focus', syncGoogleHints);
    window.addEventListener('storage', syncGoogleHints);

    return () => {
      window.removeEventListener('focus', syncGoogleHints);
      window.removeEventListener('storage', syncGoogleHints);
    };
  }, []);

  const handleGoogleContinue = () => {
    const intended = getSafeRedirectUrl(localStorage.getItem('intendedUrl'), '/');
    window.location.href = `${API_URL}/users/auth/google?redirect=${encodeURIComponent(intended)}`;
  };

  const getGoogleDisplayName = () => {
    if (googleHintName) return googleHintName;
    if (!googleHintEmail) return '';
    return googleHintEmail.split('@')[0];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    if (name === 'email') {
      setEmailError('');
      setShakeEmail(false);
    }
    if (name === 'password') {
      setPasswordError('');
      setShakePassword(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email) {
      setEmailError('Email is required');
      setShakeEmail(true);
      setTimeout(() => setShakeEmail(false), 360);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setEmailError('Please enter a valid email address');
      setShakeEmail(true);
      setTimeout(() => setShakeEmail(false), 360);
      return;
    }

    if (!formData.password) {
      setPasswordError('Password is required');
      setShakePassword(true);
      setTimeout(() => setShakePassword(false), 360);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setEmailError('');
      setPasswordError('');
      
      const res = await login(formData);
      saveAuthData(res.data.token, res.data);
      updateCartCount(); // Update cart count after login
      
      navigate(consumeIntendedUrl('/'), { replace: true });
      
      // Call onLogin after navigation to avoid conflicts
      onLogin(res.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      setError(message);

      if (message.toLowerCase().includes('invalid email')) {
        setEmailError('Invalid email');
        setShakeEmail(true);
        setTimeout(() => setShakeEmail(false), 360);
      } else if (message.toLowerCase().includes('invalid password')) {
        setPasswordError('Invalid password');
        setShakePassword(true);
        setTimeout(() => setShakePassword(false), 360);
      } else {
        setPasswordError(message);
        setShakePassword(true);
        setTimeout(() => setShakePassword(false), 360);
      }
    } finally {
      setLoading(false);
    }
  };

  const lightBgStyle = !isDarkMode ? { background: 'radial-gradient(circle at top, #e6f7ff 0%, #f8fbff 45%, #ffffff 100%)' } : undefined;

  return (
    <div className={`fade-in min-h-screen flex items-center justify-center px-4 py-8 ${isDarkMode ? 'bg-black' : 'bg-white'}`} style={lightBgStyle}>
      <style>
        {`
          .login-input-dark:-webkit-autofill,
          .login-input-dark:-webkit-autofill:hover,
          .login-input-dark:-webkit-autofill:focus {
            -webkit-text-fill-color: #ffffff;
            -webkit-box-shadow: 0 0 0px 1000px #121212 inset;
            box-shadow: 0 0 0px 1000px #121212 inset;
            caret-color: #ffffff;
            transition: background-color 9999s ease-in-out 0s;
          }

          .login-input-light:-webkit-autofill,
          .login-input-light:-webkit-autofill:hover,
          .login-input-light:-webkit-autofill:focus {
            -webkit-text-fill-color: #0f172a;
            -webkit-box-shadow: 0 0 0px 1000px #ffffff inset;
            box-shadow: 0 0 0px 1000px #ffffff inset;
            caret-color: #0f172a;
            transition: background-color 9999s ease-in-out 0s;
          }

          /* Hide native password reveal/clear so only custom eye icon appears */
          input[type="password"]::-ms-reveal,
          input[type="password"]::-ms-clear {
            display: none;
          }

          @keyframes fieldShake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }

          .field-shake {
            animation: fieldShake 0.36s ease-in-out;
          }
        `}
      </style>
      <div className={`w-full max-w-md relative rounded-3xl p-8 sm:p-9 border backdrop-blur-2xl shadow-2xl ${isDarkMode ? 'bg-[#0a0a0a] border-white/10' : 'bg-white/90 border-slate-200'}`}>
        <div className={`absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl pointer-events-none ${isDarkMode ? 'bg-cyan-500/20' : 'bg-cyan-400/25'}`}></div>
        <div className={`absolute -bottom-8 -left-8 h-28 w-28 rounded-full blur-3xl pointer-events-none ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-300/25'}`}></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Sign In
          </h1>
          <p className={isDarkMode ? 'text-gray-300' : 'text-slate-600'}>
            Welcome back to Pinqoza
          </p>
        </div>

        {error && false && (
          <div className={`mb-6 p-3 rounded-xl border text-sm relative z-10 ${isDarkMode ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-300 text-red-700'}`}>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate autoComplete="on" className="space-y-5 relative z-10">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                Email Address
              </label>
              <div className={`relative ${shakeEmail ? 'field-shake' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200 ${isDarkMode ? 'login-input-dark bg-[#121212] text-white placeholder-gray-400' : 'login-input-light bg-white text-slate-900 placeholder-slate-400'} ${emailError ? 'border-red-500' : (isDarkMode ? 'border-gray-700' : 'border-slate-300')}`}
                  placeholder="your@email.com"
                />
              </div>
              {emailError && <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{emailError}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                Password
              </label>
              <div className={`relative ${shakePassword ? 'field-shake' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-14 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200 ${isDarkMode ? 'login-input-dark bg-[#121212] text-white placeholder-gray-400' : 'login-input-light bg-white text-slate-900 placeholder-slate-400'} ${passwordError ? 'border-red-500' : (isDarkMode ? 'border-gray-700' : 'border-slate-300')}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className={`absolute inset-y-0 right-0 w-12 flex items-center justify-center transition-colors ${isDarkMode ? 'text-gray-400 hover:text-cyan-300' : 'text-slate-500 hover:text-cyan-700'}`}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4-10-7 0-1.249.616-2.456 1.667-3.5M9.88 9.88a3 3 0 104.24 4.24M6.1 6.1L3 3m18 18l-3.1-3.1M9.88 9.88L6.1 6.1m8.02 8.02l3.78 3.78M14.12 14.12L9.88 9.88M21 12c0-3-4.477-7-10-7-1.45 0-2.825.275-4.055.77" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{passwordError}</p>}
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-cyan-300 hover:text-cyan-200' : 'text-cyan-700 hover:text-cyan-900'}`}>
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>

            <div className="relative py-2">
              <div className={`absolute inset-0 flex items-center ${isDarkMode ? 'opacity-60' : 'opacity-100'}`}>
                <div className={`w-full border-t ${isDarkMode ? 'border-gray-800' : 'border-slate-200'}`}></div>
              </div>
              <div className="relative flex justify-center">
                <span className={`px-3 text-xs font-medium ${isDarkMode ? 'bg-[#0b0b0b] text-gray-400' : 'bg-white text-slate-500'}`}>
                  OR
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleContinue}
              className={`w-full h-[64px] p-0 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 shadow-lg border overflow-hidden ${
                isDarkMode
                  ? 'bg-[#0b0b0b] text-white border-gray-800 hover:border-gray-700'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
              }`}
            >
              {googleHintEmail ? (
                <span className={`flex items-stretch w-full h-full ${isDarkMode ? 'bg-blue-600' : 'bg-[#1a73e8]'} text-white`}>
                  <span className="w-10 h-10 rounded-full bg-white/15 mx-3 self-center flex items-center justify-center text-sm font-semibold">
                    {googleHintPicture ? (
                      <img
                        src={googleHintPicture}
                        alt={getGoogleDisplayName() || 'Google user'}
                        className="w-10 h-10 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      getGoogleDisplayName().slice(0, 1).toUpperCase() || 'G'
                    )}
                  </span>
                  <span className="flex flex-col items-start justify-center py-2 pr-3 min-w-0 flex-1">
                    <span className="text-[17px] font-semibold leading-5 truncate max-w-[210px]">Continue as {getGoogleDisplayName()}</span>
                    <span className="text-[13px] leading-4 text-blue-100 flex items-center gap-1 truncate max-w-[210px]">
                      <span className="truncate">{googleHintEmail}</span>
                      <svg className="w-4 h-4 text-blue-100 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </span>
                  <span className={`ml-auto px-4 flex items-center justify-center border-l ${isDarkMode ? 'bg-white/95 border-blue-300/40' : 'bg-white border-blue-200'} `}>
                    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.764 32.659 29.275 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 19.007 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4c-7.682 0-14.354 4.337-17.694 10.691z"/>
                      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.253 0-9.73-3.318-11.282-7.946l-6.52 5.025C9.505 39.556 16.227 44 24 44z"/>
                      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.714 2.01-2.087 3.783-3.984 5.065l.003-.002 6.19 5.238C36.98 39.224 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                    </svg>
                  </span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.764 32.659 29.275 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 19.007 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4c-7.682 0-14.354 4.337-17.694 10.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.253 0-9.73-3.318-11.282-7.946l-6.52 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.714 2.01-2.087 3.783-3.984 5.065l.003-.002 6.19 5.238C36.98 39.224 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                  Continue with Google
                </span>
              )}
            </button>

        </form>

        <div className="text-center mt-7 relative z-10">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
            Don't have an account?{' '}
            <Link to="/register" className={`font-semibold transition-colors duration-200 ${isDarkMode ? 'text-cyan-300 hover:text-cyan-200' : 'text-cyan-700 hover:text-cyan-900'}`}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
