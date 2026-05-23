import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {
  const { isDarkMode } = useTheme();

  return (
    <footer className={`relative overflow-hidden mt-auto ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-t border-gray-200'}`}>
      {/* Top Shadow Gradient for Light Mode */}
      {!isDarkMode && (
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-gray-200/50 to-transparent pointer-events-none"></div>
      )}
      
      {/* Animated Gradient Background - Conditional based on theme */}
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-white via-gray-50 to-gray-100'}`}></div>
      
      {/* Animated Background Pattern */}
      <div className={`absolute inset-0 ${isDarkMode ? 'opacity-30' : 'opacity-10'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-primary-500/10 animate-gradient-shift"></div>
      </div>
      
      {/* Glow Effects - Different for light/dark mode */}
      <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl ${isDarkMode ? 'bg-primary-500/20' : 'bg-primary-500/10'}`}></div>
      <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl ${isDarkMode ? 'bg-secondary-500/20' : 'bg-secondary-500/10'}`}></div>

      <div className="relative z-10 container mx-auto px-4 pt-8 pb-24 md:pb-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-1 group">
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full transform group-hover:scale-110 transition-transform duration-500"></div>
                <div className="absolute inset-0 rounded-full overflow-hidden shadow-lg">
                  <img src="/icon.svg" alt="Pinqoza" className="w-full h-full" draggable="false" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <span className={`text-xl font-bold bg-gradient-to-r ${isDarkMode ? 'from-white to-gray-300' : 'from-gray-800 to-gray-600'} bg-clip-text text-transparent`}>Pinqoza</span>
            </div>
            <p className={`text-xs leading-relaxed transition-colors duration-300 ${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-800'}`}>
              Shop everything you need with fast delivery and great deals.
            </p>
            
            {/* Social Icons */}
            <div className="flex space-x-3 mt-4">
              {[
                { key: 'facebook', label: 'Facebook', href: 'https://facebook.com/pinqoza' },
                { key: 'instagram', label: 'Instagram', href: 'https://instagram.com/pinqoza' },
                { key: 'youtube', label: 'YouTube', href: 'https://youtube.com/@pinqoza' },
                { key: 'x', label: 'X', href: 'https://x.com/pinqoza' }
              ].map((social) => (
                <a
                  key={social.key}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transform hover:scale-110 transition-all duration-300 hover:text-white hover:bg-gradient-to-br hover:from-primary-500 hover:to-secondary-500 hover:border-transparent ${isDarkMode ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-white border-gray-300 text-gray-600 hover:shadow-lg'}`}
                >
                  <span className="text-sm font-bold">{social.label[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="group">
            <h3 className={`text-lg font-bold mb-3 bg-gradient-to-r bg-clip-text text-transparent ${isDarkMode ? 'from-white to-gray-300' : 'from-gray-800 to-gray-600'}`}>
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Home' },
                { to: '/products', label: 'Products' },
                { to: '/cart', label: 'Cart' },
                { to: '/about', label: 'About' },
                { to: '/contact', label: 'Contact' },
                { to: '/login', label: 'Login' }
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className={`hover:translate-x-2 inline-flex items-center transition-all duration-300 group/link ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <span className="w-0 group-hover/link:w-2 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 mr-0 group-hover/link:mr-2 transition-all duration-300"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div className="group">
            <h3 className={`text-lg font-bold mb-3 bg-gradient-to-r bg-clip-text text-transparent ${isDarkMode ? 'from-white to-gray-300' : 'from-gray-800 to-gray-600'}`}>
              Products
            </h3>
            <ul className="space-y-2">
              {[
                { to: '/products?search=groceries', label: 'Groceries' },
                { to: '/products?search=fashion', label: 'Fashion' },
                { to: '/products?search=electronics', label: 'Electronics' },
                { to: '/products?search=beauty', label: 'Beauty' },
                { to: '/products?search=home', label: 'Home & Kitchen' }
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className={`hover:translate-x-2 inline-flex items-center transition-all duration-300 group/link ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <span className="w-0 group-hover/link:w-2 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 mr-0 group-hover/link:mr-2 transition-all duration-300"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="group">
            <h3 className={`text-lg font-bold mb-3 bg-gradient-to-r bg-clip-text text-transparent ${isDarkMode ? 'from-white to-gray-300' : 'from-gray-800 to-gray-600'}`}>
              Contact Us
            </h3>
            <ul className="space-y-2">
              {[
                { icon: '📍', text: 'Mumbai, Maharashtra, India' },
                { icon: '📞', text: '+91 98765 43210' },
                { icon: '✉️', text: 'support@pinqoza.com' }
              ].map((contact, index) => (
                <li 
                  key={index}
                  className={`flex items-center space-x-3 transition-all duration-300 group/item cursor-pointer ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <span className={`w-8 h-8 rounded-full border flex items-center justify-center transform group-hover/item:scale-110 transition-all duration-300 group-hover/item:bg-gradient-to-br group-hover/item:from-primary-500 group-hover/item:to-secondary-500 group-hover/item:border-transparent ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-300'}`}>
                    {contact.icon}
                  </span>
                  <span className="text-sm">{contact.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modern Divider */}
        <div className="relative mt-8 mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-300/50'}`}></div>
          </div>
          <div className="relative flex justify-center">
            <div className={`px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <span className={`bg-gradient-to-r bg-clip-text text-transparent ${isDarkMode ? 'from-gray-400 to-gray-300' : 'from-gray-500 to-gray-400'}`}>
              © {new Date().getFullYear()} Pinqoza. All rights reserved.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
