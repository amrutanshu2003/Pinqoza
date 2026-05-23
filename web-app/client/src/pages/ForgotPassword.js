import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPasswordWithOtp } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const shakeAnimationStyle = `
@keyframes fieldShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
`;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    otp: '',
    password: '',
    confirmPassword: ''
  });
  const [shakeField, setShakeField] = useState({
    email: false,
    otp: false,
    password: false,
    confirmPassword: false
  });

  const setError = (text) => setMessage({ type: 'error', text });
  const setSuccess = (text) => setMessage({ type: 'success', text });
  const triggerFieldError = (field, text) => {
    setFieldErrors((prev) => ({ ...prev, [field]: text }));
    setShakeField((prev) => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setShakeField((prev) => ({ ...prev, [field]: false }));
    }, 380);
  };

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const id = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setFieldErrors((prev) => ({ ...prev, email: '' }));
    if (!email.trim()) {
      setError('Please enter your email address');
      triggerFieldError('email', 'Please enter your email address');
      return;
    }
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      const response = await sendForgotPasswordOtp(email.trim());
      setSuccess(response?.data?.message || 'OTP sent to your email');
      setStep(2);
      setResendTimer(60);
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to send OTP';
      const detail = error.response?.data?.detail;
      setError(detail ? `${message} (${detail})` : message);
      triggerFieldError('email', detail ? `${message} (${detail})` : message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendingOtp(true);
      setMessage({ type: '', text: '' });
      const response = await sendForgotPasswordOtp(email.trim());
      setSuccess(response?.data?.message || 'OTP resent to your email');
      setResendTimer(60);
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to resend OTP';
      const detail = error.response?.data?.detail;
      triggerFieldError('otp', detail ? `${message} (${detail})` : message);
    } finally {
      setResendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFieldErrors((prev) => ({ ...prev, otp: '' }));
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter 6-digit OTP');
      triggerFieldError('otp', 'Please enter 6-digit OTP');
      return;
    }
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      await verifyForgotPasswordOtp(email.trim(), otp.trim());
      setSuccess('OTP verified. Set a new password.');
      setStep(3);
    } catch (error) {
      setError(error.response?.data?.message || 'OTP verification failed');
      triggerFieldError('otp', error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setFieldErrors((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    if (!password) {
      setError('Please enter new password');
      triggerFieldError('password', 'Please enter new password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      triggerFieldError('password', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      triggerFieldError('confirmPassword', 'Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      await resetPasswordWithOtp(email.trim(), otp.trim(), password);
      setSuccess('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1400);
    } catch (error) {
      setError(error.response?.data?.message || 'Unable to reset password');
      triggerFieldError('password', error.response?.data?.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  const lightBgStyle = !isDarkMode ? { background: 'radial-gradient(circle at top, #e6f7ff 0%, #f8fbff 45%, #ffffff 100%)' } : undefined;

  return (
    <div className={`fade-in min-h-screen flex items-center justify-center px-4 py-8 ${isDarkMode ? 'bg-black' : 'bg-white'}`} style={lightBgStyle}>
      <style>{shakeAnimationStyle}</style>
      <div className={`w-full max-w-md relative rounded-3xl p-8 sm:p-9 border backdrop-blur-2xl shadow-2xl ${isDarkMode ? 'bg-[#0a0a0a] border-white/10' : 'bg-white/90 border-slate-200'}`}>
        <div className={`absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl pointer-events-none ${isDarkMode ? 'bg-cyan-500/20' : 'bg-cyan-400/25'}`}></div>
        <div className={`absolute -bottom-8 -left-8 h-28 w-28 rounded-full blur-3xl pointer-events-none ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-300/25'}`}></div>

        <div className="text-center mb-7 relative z-10">
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Forgot Password</h1>
          <p className={isDarkMode ? 'text-gray-300' : 'text-slate-600'}>
            {step === 1 && 'Enter your email to receive OTP'}
            {step === 2 && 'Enter the OTP sent to your email'}
            {step === 3 && 'Create your new password'}
          </p>
        </div>

        {message.text && message.type === 'success' && (
          <div className={`mb-6 p-3 rounded-xl border text-sm relative z-10 ${
            isDarkMode ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-50 border-green-300 text-green-700'
          }`}>
            {message.text}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} noValidate className="space-y-5 relative z-10">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200 ${isDarkMode ? 'bg-[#121212] text-white placeholder-gray-400' : 'bg-white text-slate-900 placeholder-slate-400'} ${fieldErrors.email ? 'border-red-500' : (isDarkMode ? 'border-gray-700' : 'border-slate-300')}`}
                style={shakeField.email ? { animation: 'fieldShake 360ms ease-in-out' } : undefined}
                placeholder="your@email.com"
              />
              {fieldErrors.email && <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{fieldErrors.email}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg">
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} noValidate className="space-y-5 relative z-10">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                className={`w-full px-4 py-3 tracking-[0.35em] text-center rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200 ${isDarkMode ? 'bg-[#121212] text-white placeholder-gray-400' : 'bg-white text-slate-900 placeholder-slate-400'} ${fieldErrors.otp ? 'border-red-500' : (isDarkMode ? 'border-gray-700' : 'border-slate-300')}`}
                style={shakeField.otp ? { animation: 'fieldShake 360ms ease-in-out' } : undefined}
                placeholder="000000"
              />
              {fieldErrors.otp && <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{fieldErrors.otp}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            {resendTimer > 0 ? (
              <p className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>Resend OTP in {resendTimer}s</p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendingOtp}
                className={`w-full py-2 text-sm font-semibold ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'} disabled:opacity-60`}
              >
                {resendingOtp ? 'Resending OTP...' : 'Resend OTP'}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp('');
                setMessage({ type: '', text: '' });
                setResendTimer(0);
              }}
              className={`w-full py-2 text-sm ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}
            >
              Change Email
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} noValidate className="space-y-5 relative z-10">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className={`w-full px-4 pr-12 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200 ${isDarkMode ? 'bg-[#121212] text-white placeholder-gray-400' : 'bg-white text-slate-900 placeholder-slate-400'} ${fieldErrors.password ? 'border-red-500' : (isDarkMode ? 'border-gray-700' : 'border-slate-300')}`}
                  style={shakeField.password ? { animation: 'fieldShake 360ms ease-in-out' } : undefined}
                  placeholder="Enter new password"
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className={`absolute inset-y-0 right-0 w-12 flex items-center justify-center ${isDarkMode ? 'text-gray-400 hover:text-cyan-300' : 'text-slate-500 hover:text-cyan-700'}`}>
                  {showPassword ? 'X' : 'O'}
                </button>
              </div>
              {fieldErrors.password && <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{fieldErrors.password}</p>}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className={`w-full px-4 pr-12 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200 ${isDarkMode ? 'bg-[#121212] text-white placeholder-gray-400' : 'bg-white text-slate-900 placeholder-slate-400'} ${fieldErrors.confirmPassword ? 'border-red-500' : (isDarkMode ? 'border-gray-700' : 'border-slate-300')}`}
                  style={shakeField.confirmPassword ? { animation: 'fieldShake 360ms ease-in-out' } : undefined}
                  placeholder="Confirm new password"
                />
                <button type="button" onClick={() => setShowConfirmPassword((s) => !s)} className={`absolute inset-y-0 right-0 w-12 flex items-center justify-center ${isDarkMode ? 'text-gray-400 hover:text-cyan-300' : 'text-slate-500 hover:text-cyan-700'}`}>
                  {showConfirmPassword ? 'X' : 'O'}
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{fieldErrors.confirmPassword}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg">
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className={`text-sm font-semibold ${isDarkMode ? 'text-cyan-300 hover:text-cyan-200' : 'text-cyan-700 hover:text-cyan-900'}`}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
