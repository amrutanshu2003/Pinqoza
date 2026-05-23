import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, getOrders, requestDeleteAccount, cancelDeleteRequest } from '../services/api';
import { isAuthenticated, saveAuthData, logout } from '../util/auth';
import { useTheme } from '../context/ThemeContext';

const Account = ({ user, onUpdate }) => {
  const { isDarkMode } = useTheme();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  // Get emoji for each category
  const getCategoryEmoji = (category) => {
    const emojis = {
      milk: '🥛',
      ghee: '🍯',
      cheese: '🧀',
      butter: '🧈',
      curd: '🥣',
      paneer: '🧊',
      cream: '🍦',
      yogurt: '🍶',
      lassi: '🥤',
      buttermilk: '🫙',
      sweets: '🍬',
      cake: '🍰'
    };
    return emojis[category] || '🥛';
  };

  // Derive category from product name if not available
  const deriveCategoryFromName = (name) => {
    const lowerName = name?.toLowerCase() || '';
    if (lowerName.includes('cake') || lowerName.includes('milk cake')) return 'cake';
    if (lowerName.includes('sweet') || lowerName.includes('rasgulla') || lowerName.includes('gulab') || lowerName.includes('kaju') || lowerName.includes('rasmalai')) return 'sweets';
    if (lowerName.includes('milk')) return 'milk';
    if (lowerName.includes('ghee')) return 'ghee';
    if (lowerName.includes('cheese')) return 'cheese';
    if (lowerName.includes('butter')) return 'butter';
    if (lowerName.includes('curd')) return 'curd';
    if (lowerName.includes('paneer')) return 'paneer';
    if (lowerName.includes('cream') || lowerName.includes('creme') || lowerName.includes('fraiche')) return 'cream';
    if (lowerName.includes('yogurt')) return 'yogurt';
    if (lowerName.includes('lassi')) return 'lassi';
    if (lowerName.includes('buttermilk')) return 'buttermilk';
    return 'milk';
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, ordersRes] = await Promise.all([
        getProfile(),
        getOrders()
      ]);
      setProfile(profileRes.data);
      setOrders(ordersRes.data);
      
      setFormData(prev => ({
        ...prev,
        name: profileRes.data.name || '',
        email: profileRes.data.email || '',
        phone: profileRes.data.phone || '',
        street: profileRes.data.address?.street || '',
        city: profileRes.data.address?.city || '',
        state: profileRes.data.address?.state || '',
        pincode: profileRes.data.address?.pincode || ''
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const updateData = {
        name: formData.name,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        }
      };

      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      const res = await updateProfile(updateData);
      setProfile(res.data);
      saveAuthData(res.data.token, res.data);
      onUpdate(res.data);
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
      setFormData(prev => ({
        ...prev,
        password: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error updating profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Please enter your password' });
      return;
    }

    try {
      setDeleting(true);
      setMessage({ type: '', text: '' });

      await requestDeleteAccount(deletePassword);
      
      setMessage({ type: 'success', text: 'Account deletion requested! Your account will be deleted in 30 days.' });
      setShowDeleteModal(false);
      setDeletePassword('');
      
      setTimeout(() => {
        logout();
        navigate('/');
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error requesting account deletion' });
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDeleteRequest = async () => {
    try {
      await cancelDeleteRequest();
      setMessage({ type: 'success', text: 'Account deletion cancelled successfully' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error cancelling deletion request' });
    }
  };

  const getStatusClass = (status) => {
    const classes = {
      processing: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="fade-in min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black flex items-center justify-center">
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
    <div className="fade-in min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Modern Header */}
        <div className="text-center mb-12">
          <div className="inline-block relative group">
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 bg-clip-text text-transparent">
                My Account
              </span>
            </h1>
            {/* Animated Underline */}
            <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Manage your profile and orders
          </p>
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-lg`}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {profile?.name || 'User'}
          </div>
        </div>

        <div className="space-y-12">
        {/* Profile Section */}
        <div>
          <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-10 shadow-2xl mb-8 transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-[1.02] hover:-translate-y-1`}>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  My Profile
                </h2>
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className={`px-6 py-3 rounded-xl font-medium transform hover:scale-[1.05] transition-all duration-300 ${
                  editing 
                    ? 'bg-gray-500 text-white hover:bg-gray-600' 
                    : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600'
                } shadow-lg hover:shadow-xl hover:shadow-primary-500/20`}
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {message.text && (
              <div className={`relative p-6 rounded-2xl mb-8 backdrop-blur-xl border transform transition-all duration-300 hover:shadow-lg ${
                message.type === 'error' 
                  ? 'bg-red-900/90 border-red-700/50 text-red-100' 
                  : 'bg-green-900/90 border-green-700/50 text-green-100'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {message.type === 'error' ? (
                      <svg className="w-6 h-6 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <p className="font-medium">{message.text}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Full Name
                    </span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                      editing 
                        ? 'border-primary-500/50 focus:border-primary-500 bg-white dark:bg-black' 
                        : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-black'
                    } ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Address
                    </span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className={`w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-black ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} cursor-not-allowed`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Phone Number
                    </span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                      editing 
                        ? 'border-primary-500/50 focus:border-primary-500 bg-white dark:bg-black' 
                        : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-black'
                    } ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Street Address
                    </span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                      editing 
                        ? 'border-primary-500/50 focus:border-primary-500 bg-white dark:bg-black' 
                        : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-black'
                    } ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      City
                    </span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                      editing 
                        ? 'border-primary-500/50 focus:border-primary-500 bg-white dark:bg-black' 
                        : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-black'
                    } ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      State
                    </span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                      editing 
                        ? 'border-primary-500/50 focus:border-primary-500 bg-white dark:bg-black' 
                        : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-black'
                    } ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Pincode
                    </span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                      editing 
                        ? 'border-primary-500/50 focus:border-primary-500 bg-white dark:bg-black' 
                        : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-black'
                    } ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                  />
                </div>
              </div>

              {editing && (
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Change Password (Optional)
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          New Password
                        </span>
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl border-2 border-primary-500/50 focus:border-primary-500 bg-white dark:bg-black ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                        placeholder="New password"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Confirm Password
                        </span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl border-2 border-primary-500/50 focus:border-primary-500 bg-white dark:bg-black ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editing && (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-bold hover:from-primary-600 hover:to-secondary-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </span>
                  )}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Orders Section */}
        <div>
          <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-10 shadow-2xl mb-8 transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-[1.02] hover:-translate-y-1`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Recent Orders
                  </h2>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {orders.length > 0 ? `${orders.length} order${orders.length > 1 ? 's' : ''}` : 'No orders yet'}
                  </p>
                </div>
              </div>
              {orders.length > 0 && (
                <Link 
                  to="/orders" 
                  className={`px-4 py-2 rounded-xl font-medium transform hover:scale-[1.02] transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  View All Orders
                </Link>
              )}
            </div>
            
            {orders.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {orders.slice(0, 6).map((order) => (
                  <div key={order._id} className={`group relative overflow-hidden rounded-2xl border-2 ${isDarkMode ? 'border-gray-700/50 bg-gray-900/30' : 'border-gray-200/50 bg-white/50'} backdrop-blur-sm p-8 transition-all duration-300 hover:shadow-xl hover:scale-[1.03] hover:border-primary-500/50 transform hover:-translate-y-1`}>
                    {/* Order Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className={`font-bold text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                          Order #{order._id.slice(-8)}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(order.orderStatus || order.status)}`}>
                        {(order.orderStatus || order.status)?.charAt(0).toUpperCase() + (order.orderStatus || order.status)?.slice(1)}
                      </span>
                    </div>
                    
                    {/* Order Items Preview */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                          <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {/* Show first 2 items */}
                      <div className="space-y-2">
                        {order.orderItems.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getCategoryEmoji(item.category || item.product?.category || deriveCategoryFromName(item.name))}</span>
                              <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate max-w-[100px]`}>
                                {item.name} x {item.quantity}
                              </span>
                            </div>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              ₹{item.price * item.quantity}
                            </span>
                          </div>
                        ))}
                        {order.orderItems.length > 2 && (
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            +{order.orderItems.length - 2} more item{order.orderItems.length - 2 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Order Total */}
                    <div className={`pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Total
                        </span>
                        <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">
                          ₹{order.totalPrice}
                        </span>
                      </div>
                      
                      <Link 
                        to={`/order/${order._id}`}
                        className="w-full py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium hover:from-primary-600 hover:to-secondary-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl text-sm text-center block"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className={`w-24 h-24 mx-auto mb-6 rounded-3xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'} flex items-center justify-center`}>
                  <svg className={`w-12 h-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  No orders yet
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6 max-w-md mx-auto`}>
                  Start shopping on Pinqoza and track your orders here!
                </p>
                <Link 
                  to="/products" 
                  className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium hover:from-primary-600 hover:to-secondary-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Browse Products
                </Link>
              </div>
            )}
          </div>
        </div>

              </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[50] p-4">
          <div className={`relative w-full max-w-md rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/90' : 'border-gray-200 bg-white/90'} backdrop-blur-xl p-8 shadow-2xl transform transition-all duration-300 scale-100`}>
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeletePassword('');
              }}
              className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Delete Account
              </h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                This action cannot be undone. Your account will be permanently deleted after 30 days.
              </p>
            </div>

            <form onSubmit={handleDeleteAccount}>
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 border-red-500/50 focus:border-red-500 bg-white dark:bg-black ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transform hover:scale-[1.02] transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-red-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </span>
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        <div className="mb-8"></div>

        {/* Account Dashboard */}
        <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-10 shadow-2xl mb-8 transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-[1.02] hover:-translate-y-1`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Account Dashboard
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'} backdrop-blur-sm border ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Orders</span>
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{orders.length}</div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>All time orders</p>
            </div>

            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'} backdrop-blur-sm border ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Member Since</span>
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '2024'}
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Customer since</p>
            </div>

            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'} backdrop-blur-sm border ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Saved</span>
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>₹2,450</div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Total savings</p>
            </div>

            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'} backdrop-blur-sm border ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Points</span>
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>850</div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Reward points</p>
            </div>
          </div>
        </div>

        {/* Rewards & Loyalty */}
        <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-10 shadow-2xl mb-8 transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-[1.02] hover:-translate-y-1`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Rewards & Loyalty
            </h2>
          </div>

          <div className="space-y-6">
            <div className={`p-8 rounded-2xl ${isDarkMode ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20' : 'bg-gradient-to-r from-yellow-50 to-orange-50'} border ${isDarkMode ? 'border-yellow-700/30' : 'border-yellow-200/50'} transition-all duration-300 hover:shadow-lg hover:scale-105`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Gold Member</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>150 points to Platinum</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Progress</span>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>850/1000</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-black rounded-full h-3">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full" style={{width: '85%'}}></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>5%</div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cashback</p>
                </div>
                <div>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>2x</div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Points</p>
                </div>
                <div>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Free</div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Delivery</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <button className={`p-6 rounded-xl border-2 ${isDarkMode ? 'border-purple-500/30 bg-purple-900/20' : 'border-purple-200 bg-purple-50'} hover:bg-purple-100 dark:hover:bg-purple-800/20 transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Redeem Points</div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>850 points available</p>
                  </div>
                </div>
              </button>
              <button className={`p-6 rounded-xl border-2 ${isDarkMode ? 'border-green-500/30 bg-green-900/20' : 'border-green-200 bg-green-50'} hover:bg-green-100 dark:hover:bg-green-800/20 transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Rewards History</div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>View all rewards</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Preferences & Settings */}
        <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-10 shadow-2xl mb-8 transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-[1.02] hover:-translate-y-1`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Preferences & Settings
            </h2>
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Delivery Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Default Delivery Time</span>
                    <select className={`px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                      <option>6:00 AM - 8:00 AM</option>
                      <option>8:00 AM - 10:00 AM</option>
                      <option>6:00 PM - 8:00 PM</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Delivery Instructions</span>
                    <button className={`px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Communication</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Notifications</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>SMS Alerts</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>WhatsApp Updates</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Payment Methods</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-xl border-2 ${isDarkMode ? 'border-gray-600/50 bg-gray-700/50' : 'border-gray-200 bg-gray-50'} cursor-pointer hover:border-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                      <span className="text-white text-sm font-bold">VISA</span>
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>•••• 4242</div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Expires 12/25</div>
                    </div>
                  </div>
                </div>
                <button className={`p-6 rounded-xl border-2 border-dashed ${isDarkMode ? 'border-gray-600/50 bg-gray-700/50' : 'border-gray-300 bg-gray-50'} hover:border-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}>
                  <div className="text-center">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Add Payment Method</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-10 shadow-2xl mb-8 transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-[1.02] hover:-translate-y-1`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Security Settings
            </h2>
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-gray-600/50 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Two-Factor Authentication</h4>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Add an extra layer of security</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-black peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-gray-600/50 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Login Alerts</h4>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Get notified of new logins</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-black peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              <button className={`px-6 py-3 rounded-xl font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}>
                Change Password
              </button>
              <button className={`px-6 py-3 rounded-xl font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}>
                View Login History
              </button>
              <button className={`px-6 py-3 rounded-xl font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}>
                Manage Sessions
              </button>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-10 shadow-2xl mb-8 transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform hover:scale-[1.02] hover:-translate-y-1`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Recent Activity
            </h2>
          </div>

          <div className="space-y-3">
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-gray-600/50 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Order Delivered</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Order #1234 - 2 hours ago</div>
                  </div>
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Success</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-gray-600/50 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>New Order Placed</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Order #1235 - 1 day ago</div>
                  </div>
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Processing</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-gray-600/50 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Points Earned</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>50 points - 2 days ago</div>
                  </div>
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>+50</span>
              </div>
            </div>
          </div>

          <button className={`w-full mt-6 px-6 py-3 rounded-xl font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}>
            View All Activity
          </button>
        </div>

        {/* Danger Zone - Delete Account */}
        <div className={`relative overflow-hidden rounded-3xl border-2 border-red-500/30 ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} backdrop-blur-xl p-10 shadow-2xl transition-all duration-700 hover:shadow-4xl hover:shadow-red-500/20 transform hover:scale-[1.02] hover:-translate-y-1`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              Danger Zone
            </h3>
          </div>
          <p className={`${isDarkMode ? 'text-red-300' : 'text-red-700'} mb-6 leading-relaxed`}>
            Once you request account deletion, your account will be scheduled for deletion in 30 days. 
            You can cancel this request anytime within 30 days.
          </p>
          
          {profile?.deleteRequestedAt ? (
            <div className={`relative p-4 rounded-2xl backdrop-blur-xl border ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-100' : 'bg-yellow-50 border-yellow-200 text-yellow-800'} mb-6`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">
                    Account deletion scheduled for: {new Date(profile.deleteAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-yellow-200' : 'text-yellow-700'} mb-3`}>
                    You can cancel this request anytime before the deletion date.
                  </p>
                  <button
                    onClick={handleCancelDeleteRequest}
                    className={`px-4 py-2 rounded-xl font-medium transform hover:scale-[1.02] transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                    } shadow-lg hover:shadow-xl`}
                  >
                    Cancel Deletion Request
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteModal(true)}
              className={`px-6 py-3 rounded-xl font-medium transform hover:scale-[1.02] transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              } shadow-lg hover:shadow-xl`}
            >
              Request Account Deletion
            </button>
          )}
        </div>

        </div>
    </div>
  );
};

export default Account;
