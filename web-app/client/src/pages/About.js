import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const About = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="max-w-5xl mx-auto">
      <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="p-8 md:p-10">
          <h1 className={`text-3xl md:text-4xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>About Pinqoza</h1>
          <p className={`mt-3 text-base md:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Pinqoza is a modern online marketplace for shopping across categories—groceries, fashion, electronics, home & more.
          </p>

          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              { title: 'Fast Delivery', body: 'Quick and reliable doorstep delivery.' },
              { title: 'Trusted Sellers', body: 'Quality checks and verified partners.' },
              { title: 'Secure Payments', body: 'Multiple payment options with safety in mind.' }
            ].map((card) => (
              <div
                key={card.title}
                className={`rounded-2xl p-5 border ${isDarkMode ? 'bg-black/40 border-gray-800' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{card.title}</div>
                <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{card.body}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg hover:opacity-95 transition"
            >
              Start Shopping
            </Link>
            <Link
              to="/contact"
              className={`inline-flex items-center justify-center px-6 py-3 rounded-2xl font-semibold border transition ${
                isDarkMode ? 'border-gray-700 text-gray-200 hover:bg-white/5' : 'border-gray-300 text-gray-800 hover:bg-gray-50'
              }`}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;

