import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sendRegisterOtp } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const Register = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const isGoogleSignup = query.get('google') === '1';
  const googleEmail = query.get('email') || '';
  const googleName = query.get('name') || '';
  const googleRedirect = query.get('redirect') || '/';
  const googlePicture = query.get('picture') || '';

  const [formData, setFormData] = useState({
    name: googleName,
    email: googleEmail,
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showExistsPopup, setShowExistsPopup] = useState(false);
  const [existsMessage, setExistsMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [shakeName, setShakeName] = useState(false);
  const [shakeEmail, setShakeEmail] = useState(false);
  const [shakePhone, setShakePhone] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [shakePassword, setShakePassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [shakeConfirmPassword, setShakeConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!isGoogleSignup) return;
    if (googleEmail) localStorage.setItem('mm_google_email_hint', googleEmail.trim().toLowerCase());
    if (googleName) localStorage.setItem('mm_google_name_hint', googleName.trim());
    if (googlePicture) localStorage.setItem('mm_google_picture_hint', googlePicture.trim());
  }, [googleEmail, googleName, googlePicture, isGoogleSignup]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setFormData(prev => ({
      ...prev,
      [name]: nextValue
    }));
    setError('');
    if (name === 'name') {
      setNameError('');
      setShakeName(false);
    }
    if (name === 'email') {
      setEmailError('');
      setShakeEmail(false);
    }
    if (name === 'phone') {
      setPhoneError('');
      setShakePhone(false);
    }
    if (name === 'password' || name === 'confirmPassword') {
      setConfirmPasswordError('');
      setShakeConfirmPassword(false);
      if (name === 'password') {
        setPasswordError('');
        setShakePassword(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setNameError('Full name is required');
      setShakeName(true);
      setTimeout(() => setShakeName(false), 400);
      return;
    }

    if (!formData.email.trim()) {
      setEmailError('Email is required');
      setShakeEmail(true);
      setTimeout(() => setShakeEmail(false), 400);
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setEmailError('Please enter a valid email address');
      setShakeEmail(true);
      setTimeout(() => setShakeEmail(false), 400);
      return;
    }

    if (!formData.phone.trim()) {
      setPhoneError('Phone number is required');
      setShakePhone(true);
      setTimeout(() => setShakePhone(false), 400);
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setPhoneError('Phone number must be exactly 10 digits');
      setShakePhone(true);
      setTimeout(() => setShakePhone(false), 400);
      return;
    }

    if (!formData.password) {
      setPasswordError('Password is required');
      setShakePassword(true);
      setTimeout(() => setShakePassword(false), 400);
      return;
    }

    if (formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      setShakePassword(true);
      setTimeout(() => setShakePassword(false), 400);
      return;
    }

    if (!formData.confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      setShakeConfirmPassword(true);
      setTimeout(() => setShakeConfirmPassword(false), 400);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      setShakeConfirmPassword(true);
      setTimeout(() => setShakeConfirmPassword(false), 400);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setNameError('');
      setEmailError('');
      setPhoneError('');
      setPasswordError('');
      setConfirmPasswordError('');

      await sendRegisterOtp({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      navigate('/register/verify-email', {
        state: {
          name: formData.name,
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone,
          password: formData.password,
          redirect: googleRedirect
        }
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      if (message.toLowerCase().includes('already exists')) {
        setExistsMessage(message);
        setShowExistsPopup(true);
        setError('');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBase = 'peer w-full pl-10 pr-4 pt-5 pb-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200';
  const inputTheme = isDarkMode
    ? 'register-input-dark bg-[#121212] border-gray-700 text-white placeholder-gray-400'
    : 'register-input-light bg-white border-slate-300 text-slate-900 placeholder-slate-400';

  const lightBgStyle = !isDarkMode ? { background: 'radial-gradient(circle at top, #e6f7ff 0%, #f8fbff 45%, #ffffff 100%)' } : undefined;
  const getLabelClass = (fieldName) => {
    const active = focusedField === fieldName || String(formData[fieldName] || '').length > 0;
    const base = `absolute left-10 px-1 pointer-events-none transition-all duration-200 ${isDarkMode ? 'text-gray-400 bg-[#121212]' : 'text-slate-500 bg-white'}`;
    return `${base} ${active ? 'top-0 text-xs text-cyan-600' : 'top-1/2 -translate-y-1/2 text-base'}`;
  };

  return (
    <div className={`fade-in min-h-screen flex items-center justify-center px-4 py-8 ${isDarkMode ? 'bg-black' : 'bg-white'}`} style={lightBgStyle}>
      <style>
        {`
          .register-input-dark:-webkit-autofill,
          .register-input-dark:-webkit-autofill:hover,
          .register-input-dark:-webkit-autofill:focus {
            -webkit-text-fill-color: #ffffff;
            -webkit-box-shadow: 0 0 0px 1000px #121212 inset;
            box-shadow: 0 0 0px 1000px #121212 inset;
            caret-color: #ffffff;
            transition: background-color 9999s ease-in-out 0s;
          }

          .register-input-light:-webkit-autofill,
          .register-input-light:-webkit-autofill:hover,
          .register-input-light:-webkit-autofill:focus {
            -webkit-text-fill-color: #0f172a;
            -webkit-box-shadow: 0 0 0px 1000px #ffffff inset;
            box-shadow: 0 0 0px 1000px #ffffff inset;
            caret-color: #0f172a;
            transition: background-color 9999s ease-in-out 0s;
          }

          /* Hide native password reveal/clear buttons so only custom eye icon appears */
          input[type="password"]::-ms-reveal,
          input[type="password"]::-ms-clear {
            display: none;
          }

          @keyframes mm-shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
          }

          .mm-shake {
            animation: mm-shake 0.35s ease-in-out;
          }
        `}
      </style>

      {showExistsPopup && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-md" onClick={() => setShowExistsPopup(false)}></div>
          <div className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl ${isDarkMode ? 'bg-gray-900/55 border-white/15' : 'bg-white/70 border-white/80'} backdrop-blur-2xl`}>
            <button
              type="button"
              onClick={() => setShowExistsPopup(false)}
              className={`absolute top-3 right-3 rounded-md p-1 transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              aria-label="Close popup"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-9 w-9 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Account Already Exists</h3>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>{existsMessage || 'User already exists'}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowExistsPopup(false);
                  navigate('/login');
                }}
                className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 transition-all"
              >
                Go To Login
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`w-full max-w-md relative rounded-3xl p-8 sm:p-9 border backdrop-blur-2xl shadow-2xl ${isDarkMode ? 'bg-[#0a0a0a] border-white/10' : 'bg-white/90 border-slate-200'}`}>
        <div className={`absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl pointer-events-none ${isDarkMode ? 'bg-cyan-500/20' : 'bg-cyan-400/25'}`}></div>
        <div className={`absolute -bottom-8 -left-8 h-28 w-28 rounded-full blur-3xl pointer-events-none ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-300/25'}`}></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Create Account</h1>
          <p className={isDarkMode ? 'text-gray-300' : 'text-slate-600'}>Join Pinqoza in a few quick steps</p>
        </div>

        {error && (
          <div className={`mb-6 p-3 rounded-xl border text-sm relative z-10 ${isDarkMode ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-300 text-red-700'}`}>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate autoComplete="on" className="space-y-4 relative z-10">
          <div>
            <div className={`relative ${shakeName ? 'mm-shake' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="register-name"
                type="text"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField('')}
                className={`${inputBase} ${
                  nameError
                    ? isDarkMode
                      ? 'register-input-dark bg-red-950/40 border-red-500 text-white placeholder-red-200/70'
                      : 'register-input-light bg-red-50 border-red-500 text-slate-900 placeholder-red-400'
                    : inputTheme
                }`}
                placeholder=" "
              />
              <label htmlFor="register-name" className={getLabelClass('name')}>
                Your full name
              </label>
            </div>
            {nameError && <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{nameError}</p>}
          </div>

          <div>
            <div className={`relative ${shakeEmail ? 'mm-shake' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                id="register-email"
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                readOnly={isGoogleSignup}
                className={`${inputBase} ${
                  emailError
                    ? isDarkMode
                      ? 'register-input-dark bg-red-950/40 border-red-500 text-white placeholder-red-200/70'
                      : 'register-input-light bg-red-50 border-red-500 text-slate-900 placeholder-red-400'
                    : inputTheme
                }`}
                placeholder=" "
              />
              <label htmlFor="register-email" className={getLabelClass('email')}>
                your@email.com
              </label>
            </div>
            {emailError && <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{emailError}</p>}
          </div>

          <div>
            <div className={`relative ${shakePhone ? 'mm-shake' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                id="register-phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField('')}
                inputMode="numeric"
                maxLength={10}
                className={`${inputBase} ${
                  phoneError
                    ? isDarkMode
                      ? 'register-input-dark bg-red-950/40 border-red-500 text-white placeholder-red-200/70'
                      : 'register-input-light bg-red-50 border-red-500 text-slate-900 placeholder-red-400'
                    : inputTheme
                }`}
                placeholder=" "
              />
              <label htmlFor="register-phone" className={getLabelClass('phone')}>
                10 digit phone number
              </label>
            </div>
            {phoneError && (
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{phoneError}</p>
            )}
          </div>

          <div>
            <div className={`relative ${shakePassword ? 'mm-shake' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                className={`${inputBase} pr-14 ${
                  passwordError
                    ? isDarkMode
                      ? 'register-input-dark bg-red-950/40 border-red-500 text-white placeholder-red-200/70'
                      : 'register-input-light bg-red-50 border-red-500 text-slate-900 placeholder-red-400'
                    : inputTheme
                }`}
                placeholder=" "
              />
              <label htmlFor="register-password" className={getLabelClass('password')}>
                Create a password (min 6 chars)
              </label>
              <button type="button" onClick={() => setShowPassword(prev => !prev)} className={`absolute inset-y-0 right-0 w-12 flex items-center justify-center transition-colors ${isDarkMode ? 'text-gray-400 hover:text-cyan-300' : 'text-slate-500 hover:text-cyan-700'}`} aria-label={showPassword ? 'Hide password' : 'Show password'}>
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
            {passwordError && (
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{passwordError}</p>
            )}
          </div>

          <div>
            <div className={`relative ${shakeConfirmPassword ? 'mm-shake' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField('')}
                className={`${inputBase} pr-14 ${
                  confirmPasswordError
                    ? isDarkMode
                      ? 'register-input-dark bg-red-950/40 border-red-500 text-white placeholder-red-200/70'
                      : 'register-input-light bg-red-50 border-red-500 text-slate-900 placeholder-red-400'
                    : inputTheme
                }`}
                placeholder=" "
              />
              <label htmlFor="register-confirm-password" className={getLabelClass('confirmPassword')}>
                Confirm your password
              </label>
              <button type="button" onClick={() => setShowConfirmPassword(prev => !prev)} className={`absolute inset-y-0 right-0 w-12 flex items-center justify-center transition-colors ${isDarkMode ? 'text-gray-400 hover:text-cyan-300' : 'text-slate-500 hover:text-cyan-700'}`} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                {showConfirmPassword ? (
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
            {confirmPasswordError && (
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{confirmPasswordError}</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg">
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending OTP...
              </span>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        <div className="text-center mt-7 relative z-10">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
            Already have an account?{' '}
            <Link to="/login" className={`font-semibold transition-colors duration-200 ${isDarkMode ? 'text-cyan-300 hover:text-cyan-200' : 'text-cyan-700 hover:text-cyan-900'}`}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
