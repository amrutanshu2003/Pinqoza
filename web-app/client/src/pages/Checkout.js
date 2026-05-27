import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createOrder,
  clearCart,
  getCart,
  getProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  validateCoupon
} from '../services/api';
import UPIQRCode from '../components/UPIQRCode';
import CODVerificationPopup from '../components/CODVerificationPopup';
import { isAuthenticated } from '../util/auth';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const { isDarkMode } = useTheme();
  const { updateCartCount } = useCart();
  const [cart, setCart] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    paymentMethod: 'cod',
    notes: ''
  });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressModal, setAddressModal] = useState({ open: false, mode: 'add', id: null });
  const [addressDraft, setAddressDraft] = useState({
    tag: 'home',
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    isDefault: false
  });
  const [addressBusy, setAddressBusy] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponBusy, setCouponBusy] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [showQRCode, setShowQRCode] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [showCODVerification, setShowCODVerification] = useState(false);
  const [CODOrderId, setCODOrderId] = useState('');
  const navigate = useNavigate();

  // Get gradient colors for fallback background
  const getCategoryGradient = (category) => {
    const gradients = {
      milk: 'from-blue-200 to-blue-400 dark:from-blue-600 dark:to-blue-800',
      ghee: 'from-amber-200 to-amber-400 dark:from-amber-600 dark:to-amber-800',
      cheese: 'from-yellow-200 to-yellow-400 dark:from-yellow-600 dark:to-yellow-800',
      butter: 'from-orange-200 to-orange-400 dark:from-orange-600 dark:to-orange-800',
      curd: 'from-green-200 to-green-400 dark:from-green-600 dark:to-green-800',
      paneer: 'from-purple-200 to-purple-400 dark:from-purple-600 dark:to-purple-800',
      cream: 'from-pink-200 to-pink-400 dark:from-pink-600 dark:to-pink-800',
      yogurt: 'from-teal-200 to-teal-400 dark:from-teal-600 dark:to-teal-800',
      lassi: 'from-cyan-200 to-cyan-400 dark:from-cyan-600 dark:to-cyan-800',
      buttermilk: 'from-lime-200 to-lime-400 dark:from-lime-600 dark:to-lime-800',
      sweets: 'from-rose-200 to-pink-300 dark:from-rose-600 dark:to-pink-800',
      cake: 'from-fuchsia-200 to-pink-400 dark:from-fuchsia-600 dark:to-pink-800'
    };
    return gradients[category] || 'from-gray-200 to-gray-400 dark:from-gray-600 dark:to-gray-800';
  };

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
      const [cartRes, profileRes, addressesRes] = await Promise.all([
        getCart(),
        getProfile(),
        getAddresses()
      ]);
      
      // Check for selected items in sessionStorage
      const selectedItemsStr = sessionStorage.getItem('selectedItems');
      if (selectedItemsStr) {
        const selectedItems = JSON.parse(selectedItemsStr);
        // Create a cart object with only selected items
        const selectedCart = {
          ...cartRes.data,
          items: selectedItems,
          totalItems: selectedItems.length,
          totalPrice: selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0)
        };
        setCart(selectedCart);
      } else {
        setCart(cartRes.data);
      }
      
      setUser(profileRes.data);

      const loadedAddresses = Array.isArray(addressesRes?.data) ? addressesRes.data : [];
      setAddresses(loadedAddresses);

      const defaultAddress =
        loadedAddresses.find((addr) => addr?.isDefault) || loadedAddresses[0] || null;

      if (defaultAddress?._id) {
        setSelectedAddressId(defaultAddress._id);
        setFormData((prev) => ({
          ...prev,
          street: defaultAddress.street || '',
          city: defaultAddress.city || '',
          state: defaultAddress.state || '',
          pincode: defaultAddress.pincode || '',
          phone: defaultAddress.phone || profileRes.data.phone || ''
        }));
      } else if (profileRes.data.address) {
        // Backward-compat: older single address field
        setFormData((prev) => ({
          ...prev,
          street: profileRes.data.address?.street || '',
          city: profileRes.data.address?.city || '',
          state: profileRes.data.address?.state || '',
          pincode: profileRes.data.address?.pincode || '',
          phone: profileRes.data.phone || ''
        }));
      } else if (profileRes.data.phone) {
        setFormData((prev) => ({
          ...prev,
          phone: profileRes.data.phone
        }));
      }
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

  const applyAddressToForm = (addr) => {
    if (!addr) return;
    setFormData((prev) => ({
      ...prev,
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      phone: addr.phone || prev.phone || ''
    }));
  };

  const handleSelectAddress = (addressId) => {
    setSelectedAddressId(addressId);
    const addr = addresses.find((a) => a?._id === addressId);
    if (addr) applyAddressToForm(addr);
  };

  const openAddAddressModal = () => {
    setAddressDraft({
      tag: 'home',
      street: formData.street || '',
      city: formData.city || '',
      state: formData.state || '',
      pincode: formData.pincode || '',
      phone: formData.phone || user?.phone || '',
      isDefault: addresses.length === 0
    });
    setAddressModal({ open: true, mode: 'add', id: null });
  };

  const openEditAddressModal = (addressId) => {
    const addr = addresses.find((a) => a?._id === addressId);
    if (!addr) return;
    setAddressDraft({
      tag: addr.tag || 'home',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      phone: addr.phone || '',
      isDefault: Boolean(addr.isDefault)
    });
    setAddressModal({ open: true, mode: 'edit', id: addressId });
  };

  const closeAddressModal = () => {
    if (addressBusy) return;
    setAddressModal({ open: false, mode: 'add', id: null });
  };

  const handleAddressDraftChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressDraft((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const syncAddressesFromServer = (nextAddresses) => {
    const list = Array.isArray(nextAddresses) ? nextAddresses : [];
    setAddresses(list);
    const defaultAddr = list.find((a) => a?.isDefault) || list[0] || null;
    if (defaultAddr?._id) {
      setSelectedAddressId(defaultAddr._id);
      applyAddressToForm(defaultAddr);
    } else {
      setSelectedAddressId('');
    }
  };

  const saveAddressDraft = async () => {
    try {
      setAddressBusy(true);
      const payload = {
        tag: addressDraft.tag,
        street: addressDraft.street,
        city: addressDraft.city,
        state: addressDraft.state,
        pincode: addressDraft.pincode,
        phone: addressDraft.phone,
        isDefault: addressDraft.isDefault
      };

      let res;
      if (addressModal.mode === 'edit' && addressModal.id) {
        res = await updateAddress(addressModal.id, payload);
      } else {
        res = await addAddress(payload);
      }

      syncAddressesFromServer(res.data);
      closeAddressModal();
    } catch (error) {
      console.error('Error saving address:', error);
      alert(error?.response?.data?.message || 'Failed to save address');
    } finally {
      setAddressBusy(false);
    }
  };

  const removeAddress = async (addressId) => {
    const ok = window.confirm('Delete this address?');
    if (!ok) return;
    try {
      setAddressBusy(true);
      const res = await deleteAddress(addressId);
      syncAddressesFromServer(res.data);
    } catch (error) {
      console.error('Error deleting address:', error);
      alert(error?.response?.data?.message || 'Failed to delete address');
    } finally {
      setAddressBusy(false);
    }
  };

  const makeDefaultAddress = async (addressId) => {
    try {
      setAddressBusy(true);
      const res = await setDefaultAddress(addressId);
      syncAddressesFromServer(res.data);
      setSelectedAddressId(addressId);
    } catch (error) {
      console.error('Error setting default address:', error);
      alert(error?.response?.data?.message || 'Failed to set default address');
    } finally {
      setAddressBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.street || !formData.city || !formData.pincode || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const orderData = {
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          phone: formData.phone
        },
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        couponCode: couponCode || undefined,
        pointsToRedeem: pointsToRedeem || 0
      };
       
      const res = await createOrder(orderData);
      const newOrderId = res.data._id;
      setOrderId(newOrderId);
      
      console.log('🔍 Order created successfully:', newOrderId);
      console.log('🔍 Payment method check:', formData.paymentMethod);
      
      if (formData.paymentMethod === 'online') {
        // Show QR code for online payment
        console.log('🔍 Showing QR code for online payment');
        setShowQRCode(true);
      } else if (formData.paymentMethod === 'cod') {
        // For COD, show verification popup immediately
        console.log('🔍 COD order placed, showing verification popup');
        console.log('🔍 Order ID:', newOrderId);
        await clearCart();
        updateCartCount();
        // Clear selected items from sessionStorage
        sessionStorage.removeItem('selectedItems');
        // Show COD verification popup instead of redirecting
        setShowCODVerification(true);
        setCODOrderId(newOrderId);
        console.log('🔍 setShowCODVerification called, CODOrderId set to:', newOrderId);
        console.log('🔍 showCODVerification state should now be true');
      } else if (formData.paymentMethod === 'subscription') {
        // For subscription, redirect to subscription plans page
        console.log('🔍 Subscription payment method selected, redirecting to subscription plans');
        navigate('/');
      } else {
        console.log('🔍 Unknown payment method:', formData.paymentMethod);
      }
    } catch (error) {
      console.error('🔍 Error creating order:', error);
      alert(error.response?.data?.message || 'Error creating order');
    } finally {
      setSubmitting(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode || !cart?.totalPrice) return;
    try {
      setCouponBusy(true);
      const res = await validateCoupon(couponCode, cart.totalPrice);
      setCouponDiscount(res.data.discountAmount || 0);
    } catch (e) {
      console.error(e);
      setCouponDiscount(0);
      alert(e?.response?.data?.message || 'Invalid coupon');
    } finally {
      setCouponBusy(false);
    }
  };

  const handlePaymentComplete = async () => {
    try {
      await clearCart();
      updateCartCount();
      // Clear selected items from sessionStorage
      sessionStorage.removeItem('selectedItems');
      setShowQRCode(false);
      navigate('/success', { state: { orderId } });
    } catch (error) {
      console.error('Error completing payment:', error);
    }
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

  if (!cart || cart.items.length === 0) {
    return (
      <div className="fade-in min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black flex items-center justify-center px-4">
        <div className={`text-center py-20 rounded-3xl ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-white/10' : 'bg-white/70 backdrop-blur-xl border border-gray-200'} shadow-xl max-w-md w-full`}>
          <div className="w-32 h-32 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-black/50 dark:to-black/50 flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Your cart is empty
          </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
            Add some products before checkout
          </p>
          <button 
            onClick={() => navigate('/products')} 
            className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium hover:from-primary-600 hover:to-secondary-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 overflow-x-hidden">
        {/* Modern Header */}
        <div className="text-center mb-12">
          <div className="inline-block relative group">
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 bg-clip-text text-transparent">
                Checkout
              </span>
            </h1>
            {/* Animated Underline */}
            <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Complete your order details
          </p>
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-lg`}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cart?.items?.length || 0} Item{cart?.items?.length !== 1 ? 's' : ''}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping Address */}
              <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-4 sm:p-8 shadow-xl transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform lg:hover:scale-[1.01]`}>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Shipping Address
                  </h2>
                </div>
                
                <div className="space-y-6">
                  {/* Saved Addresses */}
                  <div className={`rounded-2xl border ${isDarkMode ? 'border-white/10 bg-gray-900/30' : 'border-gray-200 bg-white/60'} p-4`}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Saved Addresses</p>
                      <button
                        type="button"
                        onClick={openAddAddressModal}
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                      >
                        + Add New
                      </button>
                    </div>

                    {addresses.length > 0 ? (
                      <div className="space-y-3">
                        {addresses.map((addr) => (
                          <div
                            key={addr._id}
                            className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border p-4 ${
                              selectedAddressId === addr._id
                                ? isDarkMode
                                  ? 'border-primary-500/60 bg-primary-500/10'
                                  : 'border-primary-500/50 bg-primary-50'
                                : isDarkMode
                                  ? 'border-white/10 bg-gray-800/30'
                                  : 'border-gray-200 bg-white'
                            }`}
                          >
                            <label className="flex items-start gap-3 cursor-pointer flex-1">
                              <input
                                type="radio"
                                name="selectedAddress"
                                checked={selectedAddressId === addr._id}
                                onChange={() => handleSelectAddress(addr._id)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {(addr.tag || 'home').toUpperCase()}
                                  </span>
                                  {addr.isDefault && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {addr.street}{addr.city ? `, ${addr.city}` : ''}{addr.state ? `, ${addr.state}` : ''}{addr.pincode ? ` - ${addr.pincode}` : ''}
                                </p>
                                {addr.phone && (
                                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{addr.phone}</p>
                                )}
                              </div>
                            </label>

                            <div className="flex items-center gap-2 justify-end flex-wrap">
                              {!addr.isDefault && (
                                <button
                                  type="button"
                                  disabled={addressBusy}
                                  onClick={() => makeDefaultAddress(addr._id)}
                                  className={`px-3 py-2 rounded-xl text-sm font-medium border ${
                                    isDarkMode
                                      ? 'border-white/10 text-gray-200 hover:bg-gray-800'
                                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                  } disabled:opacity-50`}
                                >
                                  Make Default
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={addressBusy}
                                onClick={() => openEditAddressModal(addr._id)}
                                className={`px-3 py-2 rounded-xl text-sm font-medium border ${
                                  isDarkMode
                                    ? 'border-white/10 text-gray-200 hover:bg-gray-800'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                } disabled:opacity-50`}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={addressBusy}
                                onClick={() => removeAddress(addr._id)}
                                className="px-3 py-2 rounded-xl text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-900/10 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                        No saved addresses yet. Add one to save time next checkout.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'} premium-input`}
                      placeholder="House No., Street Name, Area"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'} premium-input`}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'} premium-input`}
                        placeholder="State"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Pincode *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'} premium-input`}
                        placeholder="Pincode"
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Phone Number *
                      </label>
                      <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'} premium-input`}
                      placeholder="Phone Number"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Order Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'} premium-input`}
                  placeholder="Special instructions for delivery..."
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-4 sm:p-8 shadow-xl transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform lg:hover:scale-[1.01]`}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Payment Method
                </h2>
              </div>
              
              <div className="space-y-4">
                <label className={`relative flex items-center p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  formData.paymentMethod === 'cod' 
                    ? `${isDarkMode ? 'border-primary-500 bg-primary-500/10' : 'border-primary-500 bg-primary-50'}` 
                    : `${isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      formData.paymentMethod === 'cod' 
                        ? 'border-primary-500 bg-primary-500' 
                        : isDarkMode ? 'border-gray-600' : 'border-gray-300'
                    }`}>
                      {formData.paymentMethod === 'cod' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Cash on Delivery</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>Popular</span>
                      </div>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pay when you receive your order • Admin confirmation required</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                      <svg className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </label>
                
                <label className={`relative flex items-center p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  formData.paymentMethod === 'online' 
                    ? `${isDarkMode ? 'border-primary-500 bg-primary-500/10' : 'border-primary-500 bg-primary-50'}` 
                    : `${isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={formData.paymentMethod === 'online'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      formData.paymentMethod === 'online' 
                        ? 'border-primary-500 bg-primary-500' 
                        : isDarkMode ? 'border-gray-600' : 'border-gray-300'
                    }`}>
                      {formData.paymentMethod === 'online' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Online Payment</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white`}>Instant</span>
                      </div>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pay now using UPI/Card/Net Banking</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                      <svg className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                </label>

                <label className={`relative flex items-center p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  formData.paymentMethod === 'subscription' 
                    ? `${isDarkMode ? 'border-purple-500 bg-purple-500/10' : 'border-purple-500 bg-purple-50'}` 
                    : `${isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="subscription"
                    checked={formData.paymentMethod === 'subscription'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      formData.paymentMethod === 'subscription' 
                        ? 'border-purple-500 bg-purple-500' 
                        : isDarkMode ? 'border-gray-600' : 'border-gray-300'
                    }`}>
                      {formData.paymentMethod === 'subscription' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Premium Subscription</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white`}>Best Value</span>
                      </div>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Get exclusive discounts & free delivery • Admin verification required</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                      <svg className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

            {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className={`relative overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-white/70'} backdrop-blur-xl p-4 sm:p-8 shadow-xl lg:sticky lg:top-8 transition-all duration-700 hover:shadow-4xl hover:shadow-primary-500/20 transform lg:hover:scale-[1.01]`}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Order Summary
                </h2>
              </div>
              
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`
                  .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {cart.items.map((item) => (
                  <div key={item._id} className={`flex justify-between items-center gap-2 p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Product Image */}
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        
                        {/* Fallback Image based on category */}
                        <div 
                          className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getCategoryGradient(item.category || item.product?.category || deriveCategoryFromName(item.name))} ${item.image ? 'hidden' : 'flex'}`}
                        >
                          <span className="text-2xl">{getCategoryEmoji(item.category || item.product?.category || deriveCategoryFromName(item.name))}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm break-words ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{item.name}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>x {item.quantity}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm sm:text-base text-right break-words ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              
              <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-6 space-y-4`}>
                <div className="flex justify-between items-center gap-3">
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Subtotal</span>
                  <span className={`font-medium text-right break-words ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>₹{cart.totalPrice}</span>
                </div>

                {/* Coupon */}
                <div className={`rounded-2xl p-4 border ${isDarkMode ? 'border-white/10 bg-gray-900/20' : 'border-gray-200 bg-white/50'}`}>
                  <p className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Coupon</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g. MILK10)"
                      className={`flex-1 px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponBusy || !couponCode}
                      className="px-4 py-3 rounded-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 text-white disabled:opacity-50"
                    >
                      {couponBusy ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between items-center mt-3">
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Discount</span>
                      <span className="font-bold text-green-600 dark:text-green-400">-₹{couponDiscount}</span>
                    </div>
                  )}
                </div>

                {/* Loyalty Points */}
                <div className={`rounded-2xl p-4 border ${isDarkMode ? 'border-white/10 bg-gray-900/20' : 'border-gray-200 bg-white/50'}`}>
                  <p className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Loyalty Points</p>
                  <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Available: {user?.loyaltyPoints || 0} (1 point = ₹1)
                  </p>
                  <input
                    type="number"
                    min="0"
                    value={pointsToRedeem}
                    onChange={(e) => {
                      const n = Math.max(0, Math.floor(Number(e.target.value) || 0));
                      const cap = Math.max(0, (cart?.totalPrice || 0) - (couponDiscount || 0));
                      const max = Math.min(user?.loyaltyPoints || 0, cap);
                      setPointsToRedeem(Math.min(n, max));
                    }}
                    className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                    placeholder="0"
                  />
                  {pointsToRedeem > 0 && (
                    <div className="flex justify-between items-center mt-3">
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Redeemed</span>
                      <span className="font-bold text-green-600 dark:text-green-400">-₹{pointsToRedeem}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center gap-3">
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Delivery</span>
                  <span className="font-bold text-green-600 dark:text-green-400">Free</span>
                </div>
                <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`}>
                  <div className="flex justify-between items-center gap-3">
                    <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Total</span>
                    <span className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400 text-right break-words">
                      ₹{Math.max(0, (cart.totalPrice || 0) - (couponDiscount || 0) - (pointsToRedeem || 0))}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-8 px-6 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-bold hover:from-primary-600 hover:to-secondary-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Placing Order...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Place Order
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Address Modal */}
      {addressModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className={`w-full max-w-xl rounded-3xl shadow-2xl border ${isDarkMode ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'}`}>
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {addressModal.mode === 'edit' ? 'Edit Address' : 'Add Address'}
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                    Save addresses for faster checkout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAddressModal}
                  disabled={addressBusy}
                  className={`p-2 rounded-xl border ${
                    isDarkMode ? 'border-white/10 text-gray-200 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tag
                  </label>
                  <select
                    name="tag"
                    value={addressDraft.tag}
                    onChange={handleAddressDraftChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'} focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200`}
                  >
                    <option value="home">Home</option>
                    <option value="office">Office</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={addressDraft.phone}
                    onChange={handleAddressDraftChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'} focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200`}
                    placeholder="10-digit phone"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Street *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={addressDraft.street}
                    onChange={handleAddressDraftChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'} focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200`}
                    placeholder="House No., Street Name, Area"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={addressDraft.city}
                    onChange={handleAddressDraftChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'} focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200`}
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={addressDraft.state}
                    onChange={handleAddressDraftChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'} focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200`}
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={addressDraft.pincode}
                    onChange={handleAddressDraftChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'} focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200`}
                    placeholder="Pincode"
                    required
                  />
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-8">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={addressDraft.isDefault}
                    onChange={handleAddressDraftChange}
                  />
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>Set as default</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={closeAddressModal}
                  disabled={addressBusy}
                  className={`px-5 py-3 rounded-xl font-medium border ${
                    isDarkMode ? 'border-white/10 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAddressDraft}
                  disabled={addressBusy}
                  className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg hover:shadow-primary-500/30 disabled:opacity-50"
                >
                  {addressBusy ? 'Saving…' : 'Save Address'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPI QR Code Modal */}
      {showQRCode && (
        <UPIQRCode
          amount={cart.totalPrice}
          orderId={orderId}
        />
      )}

      {/* COD Verification Popup */}
      {showCODVerification && (
        <>
          <CODVerificationPopup
            orderId={CODOrderId}
          />
        </>
      )}
      </div>
    </div>
  );
};

export default Checkout;
