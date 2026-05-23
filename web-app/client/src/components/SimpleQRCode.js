import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { useTheme } from '../context/ThemeContext';

const SimpleQRCode = ({ plan, onClose }) => {
  const { isDarkMode } = useTheme();
  const [upiId] = useState('amrutanshu20003-16@oksbi');
  const [qrValue, setQrValue] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const upiString = `upi://pay?pa=${upiId}&pn=Pinqoza&am=${plan.price}&cu=INR&tn=Subscription_${plan.name}`;
    setQrValue(upiString);
  }, [plan]);

  // Block Escape key and right-click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[10000] p-4"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-secondary-500/20 to-primary-500/20 rounded-full blur-3xl animate-pulse animation-delay-2"></div>
      </div>

      <div className={`relative max-w-sm w-full rounded-3xl shadow-2xl transform transition-all duration-500 scale-100 opacity-100 overflow-hidden ${
        isDarkMode ? 'bg-gray-900/95 border border-gray-700/50 backdrop-blur-xl' : 'bg-white/95 border border-gray-200/50 backdrop-blur-xl'
      }`}>
        {/* Modal Glow Effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-primary-500/10 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

        {/* Modal Edge Glow */}
        <div className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-r from-primary-500/30 via-secondary-500/30 to-primary-500/30 opacity-20 pointer-events-none"></div>

        {/* Header */}
        <div className="relative p-4 border-b border-gray-200/20 dark:border-gray-700/20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-secondary-500/5 to-primary-500/5 rounded-t-3xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Animated Icon */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center transform transition-transform duration-300 hover:scale-110">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 to-secondary-500/30 rounded-xl blur-lg animate-pulse"></div>
              </div>
              <h3 className="text-xl font-bold tracking-wide text-white drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]">
                Complete Payment
              </h3>
            </div>
            {/* Secure — no close button */}
            <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
              <span className="text-xs font-semibold text-green-400">SECURE</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Plan Summary Card */}
          <div className={`group relative p-4 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-lg transform hover:-translate-y-1 hover:scale-[1.01] ${
            isDarkMode ? 'bg-gradient-to-br from-gray-800/50 to-gray-700/50 hover:from-gray-700/50 hover:to-gray-600/50 border border-gray-700/50' : 'bg-gradient-to-br from-gray-50 to-white hover:from-white hover:to-gray-50 border border-gray-200/50'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-secondary-500/5 to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{plan.name}</h4>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{plan.duration}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 bg-clip-text text-transparent">
                  ₹{plan.price}
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className={`relative p-5 rounded-2xl ${isDarkMode ? 'bg-white' : 'bg-gray-100'} shadow-inner`}>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-primary-500/10 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
              {qrValue && (
                <QRCode
                  value={qrValue}
                  size={200}
                  level="H"
                  bgColor={isDarkMode ? '#FFFFFF' : '#F3F4F6'}
                  fgColor="#000000"
                />
              )}
            </div>
          </div>

          {/* UPI ID Card */}
          <div className={`group relative p-4 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-lg ${
            isDarkMode ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/40 hover:from-blue-800/40 hover:to-blue-700/50 border border-blue-800/50' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100/50 hover:to-blue-200/50 border border-blue-200'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Or pay to UPI ID</p>
              </div>
              <div className="flex items-center gap-2">
                <code className={`flex-1 ${isDarkMode ? 'bg-gray-900/80 text-gray-200' : 'bg-white text-gray-800'} px-3 py-2.5 rounded-xl text-sm font-mono border text-center tracking-wider`}>
                  {upiId}
                </code>
                <button
                  onClick={handleCopy}
                  className={`group/copy relative p-2.5 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    copied ? 'bg-green-500 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {copied ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-gradient-to-r from-yellow-500/5 to-amber-500/5 border border-yellow-500/10">
            <div className="w-5 h-5 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="font-medium">Payment will be verified by admin</p>
              <p>Subscription will be activated after confirmation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleQRCode;
