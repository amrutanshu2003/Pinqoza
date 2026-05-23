import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Simple subscription API
export const createSimpleSubscription = async (subscriptionData) => {
  try {
    const res = await api.post('/simple-subscription', subscriptionData);
    return res;
  } catch (error) {
    console.error('Simple subscription error:', error);
    throw error;
  }
};

// Get user subscriptions
export const getUserSubscriptions = async () => {
  try {
    const res = await api.get('/simple-subscription');
    return res;
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
};

// Admin: Get pending subscriptions for verification
export const getPendingSubscriptions = async () => {
  try {
    const res = await api.get('/simple-subscription/admin/pending');
    return res;
  } catch (error) {
    console.error('Error fetching pending subscriptions:', error);
    throw error;
  }
};

// Admin: Confirm subscription payment
export const confirmSubscriptionPayment = async (subscriptionId, notes = '') => {
  try {
    const res = await api.post(`/simple-subscription/admin/confirm/${subscriptionId}`, { notes });
    return res;
  } catch (error) {
    console.error('Error confirming subscription:', error);
    throw error;
  }
};

export default api;
