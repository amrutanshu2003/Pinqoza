import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getProfile, logoutAllDevices, updateProfile } from '../services/api';
import { getCurrentIntendedUrl, saveIntendedUrl } from '../util/auth';
import { ToastContainer } from '../components/ToastNotification';
import useToast from '../hooks/useToast';

const Profile = () => {
  const { isDarkMode } = useTheme();
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const { toasts, removeToast, success, error } = useToast();

  // Authentication protection - redirect to login if not authenticated
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        // Save the intended URL for redirect after login
        const currentPath = getCurrentIntendedUrl();
        console.log('Profile - Saving intended URL:', currentPath);
        saveIntendedUrl(currentPath);
        
        // Smooth redirect to login page
        console.log('Profile - Redirecting to login');
        navigate('/login', { replace: true });
        return;
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastLogin, setLastLogin] = useState({
    at: null,
    ip: '',
    userAgent: ''
  });
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getProfile();
      const data = res.data;
      setProfileData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address?.street || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        pincode: data.address?.pincode || ''
      });
      setLastLogin({
        at: data.lastLoginAt || null,
        ip: data.lastLoginIp || '',
        userAgent: data.lastLoginUserAgent || ''
      });
    } catch (err) {
      error('Failed to load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        address: {
          street: profileData.address,
          city: profileData.city,
          state: profileData.state,
          pincode: profileData.pincode
        }
      });
      success('Profile updated successfully!');
      login(res.data); // Update user context
      setEditing(false);
    } catch (err) {
      error('Failed to update profile');
      console.error('Profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchProfile(); // Reset to original data
    setEditing(false);
  };

  const formatLastLoginAt = (value) => {
    if (!value) return 'Not available';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not available';
    return date.toLocaleString();
  };

  const handleLogoutAllDevices = async () => {
    try {
      setLoggingOutAll(true);
      await logoutAllDevices();
      success('All devices logged out. Please login again.');
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      error('Failed to logout from all devices');
      console.error('Logout all devices error:', err);
    } finally {
      setLoggingOutAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 px-4 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={`mb-8 p-6 rounded-2xl ${
          isDarkMode 
            ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
            : 'bg-white/70 backdrop-blur-xl border border-gray-200'
        } shadow-xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  My Profile
                </h1>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Manage your personal information
                </p>
              </div>
            </div>
            
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className={`px-6 py-2 font-medium rounded-xl transform hover:scale-105 transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <div className={`p-8 rounded-2xl ${
          isDarkMode 
            ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
            : 'bg-white/70 backdrop-blur-xl border border-gray-200'
        } shadow-xl`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                📋 Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      editing
                        ? isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        : isDarkMode
                          ? 'bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleChange}
                    disabled={true} // Email cannot be changed
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                    }`}
                    placeholder="your.email@example.com"
                  />
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      editing
                        ? isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        : isDarkMode
                          ? 'bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                    }`}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h2 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                🏠 Address Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={profileData.address}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      editing
                        ? isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        : isDarkMode
                          ? 'bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                    }`}
                    placeholder="123, Main Street, Apartment 4B"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={profileData.city}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      editing
                        ? isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        : isDarkMode
                          ? 'bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                    }`}
                    placeholder="Mumbai"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={profileData.state}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      editing
                        ? isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        : isDarkMode
                          ? 'bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                    }`}
                    placeholder="Maharashtra"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    PIN Code
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={profileData.pincode}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      editing
                        ? isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        : isDarkMode
                          ? 'bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                    }`}
                    placeholder="400001"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Quick Actions */}
        <div className={`mt-8 p-6 rounded-2xl ${
          isDarkMode 
            ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
            : 'bg-white/70 backdrop-blur-xl border border-gray-200'
        } shadow-xl`}>
          <h2 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            ⚡ Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/orders')}
              className={`p-4 rounded-xl text-left transition-all duration-200 hover:scale-105 ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              <div className="text-2xl mb-2">📦</div>
              <div className="font-medium">Order History</div>
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                View your past orders
              </div>
            </button>

            <button
              onClick={() => navigate('/wishlist')}
              className={`p-4 rounded-xl text-left transition-all duration-200 hover:scale-105 ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              <div className="text-2xl mb-2">❤️</div>
              <div className="font-medium">Wishlist</div>
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Saved products
              </div>
            </button>

            <button
              onClick={() => navigate('/cart')}
              className={`p-4 rounded-xl text-left transition-all duration-200 hover:scale-105 ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              <div className="text-2xl mb-2">🛒</div>
              <div className="font-medium">Shopping Cart</div>
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                View cart items
              </div>
            </button>
          </div>
        </div>

        {/* Session & Security */}
        <div className={`mt-8 p-6 rounded-2xl ${
          isDarkMode
            ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700'
            : 'bg-white/70 backdrop-blur-xl border border-gray-200'
        } shadow-xl`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Session & Security
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/60' : 'bg-gray-100'}`}>
              <div className={`text-xs uppercase tracking-wide mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Last Login Time
              </div>
              <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatLastLoginAt(lastLogin.at)}
              </div>
            </div>
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/60' : 'bg-gray-100'}`}>
              <div className={`text-xs uppercase tracking-wide mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Last Login IP
              </div>
              <div className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {lastLogin.ip || 'Not available'}
              </div>
              <div className={`text-xs mt-1 truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {lastLogin.userAgent || 'User agent not available'}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleLogoutAllDevices}
              disabled={loggingOutAll}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium hover:from-red-700 hover:to-rose-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loggingOutAll ? 'Logging out...' : 'Logout All Devices'}
            </button>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Profile;
