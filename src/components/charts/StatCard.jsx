// src/components/charts/StatCard.jsx
import React from 'react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'blue',
  subtitle
}) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500'
  };

  const bgColors = {
    blue: 'bg-blue-50 dark:bg-blue-900/30',
    green: 'bg-green-50 dark:bg-green-900/30',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30',
    red: 'bg-red-50 dark:bg-red-900/30',
    purple: 'bg-purple-50 dark:bg-purple-900/30',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <span className="text-sm font-medium">
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">so với tháng trước</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`${bgColors[color]} p-4 rounded-full`}>
            <Icon className={`w-8 h-8 ${colors[color].replace('bg-', 'text-')}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
