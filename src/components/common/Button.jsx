// src/components/common/Button.jsx
import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-400',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-600',
    success: 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 focus:ring-green-500 disabled:bg-green-300 dark:disabled:bg-green-400',
    danger: 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 focus:ring-red-500 disabled:bg-red-300 dark:disabled:bg-red-400',
    warning: 'bg-yellow-500 dark:bg-yellow-600 text-white hover:bg-yellow-600 dark:hover:bg-yellow-700 focus:ring-yellow-500 disabled:bg-yellow-300 dark:disabled:bg-yellow-500',
    outline: 'border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500 disabled:border-blue-300 disabled:text-blue-300 dark:disabled:border-blue-500 dark:disabled:text-blue-500'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'cursor-not-allowed opacity-60' : ''}
        ${className}
      `}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4\" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
