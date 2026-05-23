import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sendRegisterOtp, verifyRegisterOtp } from '../services/api';
import { getSafeRedirectUrl, saveAuthData } from '../util/auth';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';

const RegisterVerifyEmail = ({ onVerified }) => {
  const { isDarkMode } = useTheme();
  const { updateCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const signup = location.state || {};

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(60);
  const [otpError, setOtpError] = useState('');
  const [shakeOtp, setShakeOtp] = useState(false);

  useEffect(() => {
    if (!signup.email || !signup.name || !signup.phone || !signup.password) {
      navigate('/register', { replace: true });
    }
  }, [navigate, signup]);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const id = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (otp.trim().length !== 6) {
      setOtpError('Please enter 6-digit OTP');
      setShakeOtp(true);
      setTimeout(() => setShakeOtp(false), 360);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setOtpError('');
      const res = await verifyRegisterOtp(signup.email, otp.trim());
      saveAuthData(res.data.token, res.data);
      updateCartCount();
      if (onVerified) onVerified(res.data);
      const redirectUrl = getSafeRedirectUrl(signup.redirect, '/');
      navigate(redirectUrl, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'OTP verification failed';
      setOtpError(message);
      setShakeOtp(true);
      setTimeout(() => setShakeOtp(false), 360);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setError('');
      setSuccess('');
      setOtpError('');
      await sendRegisterOtp({
        name: signup.name,
        email: signup.email,
        phone: signup.phone,
        password: signup.password
      });
      setSuccess('OTP resent to your email');
      setTimer(60);
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to resend OTP';
      setOtpError(message);
      setShakeOtp(true);
      setTimeout(() => setShakeOtp(false), 360);
    } finally {
      setResending(false);
    }
  };

  const lightBgStyle = !isDarkMode ? { background: 'radial-gradient(circle at top, #e6f7ff 0%, #f8fbff 45%, #ffffff 100%)' } : undefined;

  return (
    <div className={`fade-in min-h-screen flex items-center justify-center px-4 py-8 ${isDarkMode ? 'bg-black' : 'bg-white'}`} style={lightBgStyle}>
      <div className={`w-full max-w-md rounded-3xl p-8 border backdrop-blur-2xl shadow-2xl ${isDarkMode ? 'bg-[#0a0a0a] border-white/10' : 'bg-white/90 border-slate-200'}`}>
        <h1 className={`text-3xl font-bold mb-2 text-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Verify Email</h1>
        <p className={`text-center mb-6 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
          OTP sent to <span className="font-semibold">{signup.email}</span>
        </p>

        {error && <p className={`mb-4 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{error}</p>}
        {success && <p className={`mb-4 text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>{success}</p>}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            placeholder="Enter 6-digit OTP"
            className={`w-full px-4 py-3 rounded-xl border text-center tracking-[0.3em] ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-white text-slate-900'} ${otpError ? 'border-red-500' : (isDarkMode ? 'border-gray-700' : 'border-slate-300')} focus:outline-none focus:ring-2 focus:ring-cyan-500/30`}
            style={shakeOtp ? { animation: 'fieldShake 360ms ease-in-out' } : undefined}
          />
          {otpError && <p className={`-mt-1 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{otpError}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
          >
            {loading ? 'Verifying...' : 'Verify & Create Account'}
          </button>
        </form>

        <div className="mt-4 text-center">
          {timer > 0 ? (
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>Resend OTP in {timer}s</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className={`text-sm font-semibold ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}
            >
              {resending ? 'Resending...' : 'Resend OTP'}
            </button>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/register" className={`text-sm ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
            Back to Create Account
          </Link>
        </div>
      </div>
      <style>
        {`
          @keyframes fieldShake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }
        `}
      </style>
    </div>
  );
};

export default RegisterVerifyEmail;
