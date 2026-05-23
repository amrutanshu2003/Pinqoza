import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { getOrderById } from '../services/api';

const UPIQRCode = ({ amount, orderId }) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [upiId] = useState('amrutanshu20003-16@oksbi');
  const [qrValue, setQrValue] = useState('');
  const [countdown, setCountdown] = useState(300);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const upiString = `upi://pay?pa=${upiId}&pn=Pinqoza&am=${amount}&cu=INR&tn=Order_${orderId}`;
    setQrValue(upiString);
  }, [amount, orderId, upiId]);

  // Poll for order status every 3 seconds (backup to socket)
  const fetchOrderStatus = async () => {
    try {
      const response = await getOrderById(orderId);
      const orderData = response.data;
      
      // If order is confirmed/paid, redirect to success page
      if (orderData.status === 'confirmed' || orderData.paymentStatus === 'paid' || orderData.orderPlaced === true) {
        console.log('✅ Order confirmed via polling! Redirecting...');
        
        // Re-enable body interactions before navigation
        document.body.style.overflow = '';
        const navbar = document.querySelector('nav, header, .navbar, [class*="nav"]');
        if (navbar) {
          navbar.style.pointerEvents = '';
          navbar.style.opacity = '';
        }
        
        // Redirect to success page
        navigate('/order-success', { 
          state: { 
            orderId: orderId,
            paymentMethod: 'online',
            amount: amount,
            message: 'Payment verified successfully!'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching order status:', error);
    }
  };

  useEffect(() => {
    if (orderId) {
      // Start polling for order status updates
      const interval = setInterval(fetchOrderStatus, 3000); // Check every 3 seconds
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [orderId, navigate, amount]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    // Prevent scroll
    document.body.style.overflow = 'hidden';
    
    // Disable navbar interactions
    const navbar = document.querySelector('nav, header, .navbar, [class*="nav"]');
    if (navbar) {
      navbar.style.pointerEvents = 'none';
      navbar.style.opacity = '0.5';
    }
    
    // Disable all interactive elements except our modal
    const allElements = document.querySelectorAll('button, a, input, select, textarea');
    allElements.forEach(el => {
      if (!el.closest('.fixed')) {
        el.style.pointerEvents = 'none';
      }
    });
    
    return () => {
      document.body.style.overflow = '';
      if (navbar) {
        navbar.style.pointerEvents = '';
        navbar.style.opacity = '';
      }
      allElements.forEach(el => {
        el.style.pointerEvents = '';
      });
    };
  }, []);

  // Listen for payment verification from admin
  useEffect(() => {
    if (socket) {
      console.log('🔌 Socket connected, listening for paymentVerified...');
      console.log('📦 Waiting for orderId:', orderId);
      
      const handlePaymentVerified = (data) => {
        console.log('📨 Received paymentVerified event:', data);
        console.log('🔍 Comparing:', data.orderId, '===', orderId, 'or', data._id, '===', orderId);
        
        // Check both orderId and _id (server might send either)
        if (data.orderId === orderId || data._id === orderId || String(data.orderId) === String(orderId)) {
          console.log('✅ Order ID matched! Redirecting to success page...');
          
          // Re-enable body interactions before navigation
          document.body.style.overflow = '';
          const navbar = document.querySelector('nav, header, .navbar, [class*="nav"]');
          if (navbar) {
            navbar.style.pointerEvents = '';
            navbar.style.opacity = '';
          }
          
          // Redirect to order-success page with online payment info
          navigate('/order-success', { 
            state: { 
              orderId: orderId,
              paymentMethod: 'online',
              amount: amount,
              message: 'Payment verified successfully!'
            }
          });
        } else {
          console.log('❌ Order ID did not match');
        }
      };

      socket.on('paymentVerified', handlePaymentVerified);
      
      return () => {
        socket.off('paymentVerified', handlePaymentVerified);
      };
    } else {
      console.log('⚠️ Socket not connected');
    }
  }, [socket, orderId, navigate, amount]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[9999] p-4"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Glass background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm"></div>
      
      <div 
        className="relative bg-white/95 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto scrollbar-hide"
        onContextMenu={(e) => e.preventDefault()}
      >
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        {/* Header - Compact */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
          <p className="text-gray-500 text-sm">Order #{orderId?.slice(-8)?.toUpperCase()}</p>
        </div>

        {/* Amount - Compact */}
        <div className="text-center mb-4">
          <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ₹{amount}
          </div>
        </div>

        {/* QR Code - Smaller with glow */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative bg-white p-3 rounded-2xl border border-gray-200 shadow-lg">
              {qrValue && (
                <QRCode
                  value={qrValue}
                  size={160}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              )}
            </div>
          </div>
        </div>

        {/* UPI ID - Compact */}
        <div className="bg-gray-50 rounded-xl p-3 mb-3">
          <div className="text-xs text-gray-600 mb-2 text-center font-medium">Or pay to UPI ID</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm font-mono text-gray-800 border border-gray-200 text-center">
              {upiId}
            </code>
            <button
              onClick={handleCopy}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Instructions - Compact */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span className="font-semibold text-gray-800 text-sm">How to Pay</span>
          </div>
          <ol className="text-xs text-gray-700 space-y-1">
            <li className="flex items-start gap-1.5">
              <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</span>
              <span>Open UPI app</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</span>
              <span>Scan QR or enter ID</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">3</span>
              <span>Pay ₹{amount}</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">4</span>
              <span>Wait for verification</span>
            </li>
          </ol>
        </div>

        {/* Timer - Compact */}
        <div className="text-center mb-3">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
            countdown < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
          }`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-xs font-medium">Expires in {formatTime(countdown)}</span>
          </div>
        </div>

        {/* Waiting Message - Compact */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-yellow-800 text-sm">Please Do Not Close</div>
              <div className="text-xs text-yellow-700">Auto-closes after verification</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UPIQRCode;
