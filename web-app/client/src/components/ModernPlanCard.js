import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ModernPlanCard = ({
  name,
  price,
  duration,
  description,
  features,
  color,
  icon,
  badge,
  badgeColor,
  onSubscribe
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="group relative">
      {/* Hover glow effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${color} rounded-3xl opacity-0 group-hover:opacity-40 blur transition duration-500 group-hover:duration-200`}></div>

      <div className={`relative h-full flex flex-col overflow-hidden rounded-3xl border transition-all duration-500 hover:-translate-y-2 ${
        isDarkMode
          ? 'bg-gray-800/80 border-gray-700/50 hover:border-gray-600/70'
          : 'bg-white/90 border-gray-200/80 hover:border-gray-300/80'
      } shadow-xl backdrop-blur-sm`}>

        {/* Top gradient bar */}
        <div className={`h-1.5 bg-gradient-to-r ${color} w-full`}></div>

        {/* Plan Header */}
        <div className="relative p-6 text-center">
          {/* Floating icon */}
          <div className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br ${color} shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
          </div>

          <h3 className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{name}</h3>
          <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>

          <div className="flex items-baseline justify-center gap-1">
            <span className={`text-4xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>₹{price}</span>
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>/{duration}</span>
          </div>
        </div>

        {/* Features */}
        <div className="flex-1 px-6 pb-6 space-y-3">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${color} flex items-center justify-center`}>
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="px-6 pb-6">
          <button
            onClick={onSubscribe}
            className={`w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r ${color} hover:opacity-90 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl`}
          >
            Start {name}
          </button>
        </div>

        {/* Badge */}
        {badge && (
          <div className={`absolute top-4 right-4 bg-gradient-to-r ${badgeColor || color} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md`}>
            {badge}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernPlanCard;
