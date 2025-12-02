// src/components/common/Input.jsx
import React from 'react';

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  className = '',
  icon: Icon
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full rounded-lg border transition-colors duration-200
            ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5
            ${error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
            }
            ${disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-700'}
            text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2
          `}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default Input;
