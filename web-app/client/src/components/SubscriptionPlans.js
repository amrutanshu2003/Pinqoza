import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const SubscriptionPlans = ({ onSelectPlan, currentPlan = null }) => {
  const { isDarkMode } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Premium',
      price: 299,
      duration: '30 days',
      features: [
        'Free delivery on all orders',
        '10% discount on all products',
        'Priority customer support',
        'Exclusive member deals',
        'Early access to new products'
      ],
      popular: false,
      color: 'blue'
    },
    {
      id: 'quarterly',
      name: 'Quarterly Premium',
      price: 799,
      duration: '90 days',
      features: [
        'Free delivery on all orders',
        '15% discount on all products',
        'Priority customer support',
        'Exclusive member deals',
        'Early access to new products',
        'Free monthly surprise gift'
      ],
      popular: true,
      color: 'purple'
    },
    {
      id: 'yearly',
      name: 'Yearly Premium',
      price: 2499,
      duration: '365 days',
      features: [
        'Free delivery on all orders',
        '25% discount on all products',
        'VIP customer support',
        'Exclusive member deals',
        'Early access to new products',
        'Free monthly surprise gift',
        'Birthday special offers',
        'Anniversary special offers'
      ],
      popular: false,
      color: 'gold'
    }
  ];

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan.id);
    onSelectPlan(plan);
  };

  const getPlanStyles = (plan) => {
    const isSelected = selectedPlan === plan.id || currentPlan === plan.id;
    const baseStyles = 'relative rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer';
    
    if (plan.popular) {
      return `${baseStyles} ${
        isSelected 
          ? 'border-purple-500 bg-purple-50 dark:bg-black/30 shadow-xl scale-105' 
          : 'border-purple-200 dark:border-purple-700 hover:border-purple-400 hover:shadow-lg'
      }`;
    }
    
    return `${baseStyles} ${
      isSelected 
        ? 'border-blue-500 bg-blue-50 dark:bg-black/30 shadow-xl scale-105' 
        : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-lg'
    }`;
  };

  const getButtonStyles = (plan) => {
    const isActive = currentPlan === plan.id;
    const isSelected = selectedPlan && selectedPlan.id === plan.id;
    
    if (isActive) {
      return 'w-full py-3 px-6 rounded-xl font-semibold text-sm bg-green-500 text-white cursor-not-allowed';
    }
    
    if (isSelected) {
      return 'w-full py-3 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white animate-pulse';
    }
    
    return plan.popular 
      ? 'w-full py-3 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all'
      : 'w-full py-3 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Choose Your Premium Plan
        </h2>
        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Get exclusive benefits and save on every order
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className={getPlanStyles(plan)}>
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                  MOST POPULAR
                </div>
              </div>
            )}

            {/* Plan Header */}
            <div className="text-center mb-6">
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              <div className="mb-2">
                <span className={`text-4xl font-bold ${plan.popular ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  ₹{plan.price}
                </span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
                  / {plan.duration}
                </span>
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Save {plan.id === 'quarterly' ? '₹98' : plan.id === 'yearly' ? '₹1089' : '₹0'} compared to monthly
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    plan.popular ? 'bg-purple-100 dark:bg-black/30' : 'bg-blue-100 dark:bg-black/30'
                  }`}>
                    <svg className={`w-3 h-3 ${plan.popular ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleSelectPlan(plan)}
              disabled={currentPlan === plan.id}
              className={getButtonStyles(plan)}
            >
              {currentPlan === plan.id ? 'CURRENT PLAN' : (selectedPlan && selectedPlan.id === plan.id) ? 'SELECTED' : 'SELECT PLAN'}
            </button>
          </div>
        ))}
      </div>

      {/* Current Plan Info */}
      {currentPlan && (
        <div className="mt-8 p-4 bg-green-50 dark:bg-black/30 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-green-800 dark:text-green-200">
                You are currently subscribed to {plans.find(p => p.id === currentPlan)?.name}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                You can upgrade or change your plan anytime
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-10 text-center">
        <div className={`inline-flex items-center gap-2 p-4 rounded-xl ${
          isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
        }`}>
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            All subscriptions are auto-renewable. You can cancel anytime from your account settings.
          </span>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
