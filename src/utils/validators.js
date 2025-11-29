// src/utils/validators.js
// Validate input

/**
 * Validate email
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate số điện thoại Việt Nam
 * @param {string} phone
 * @returns {boolean}
 */
export const validatePhone = (phone) => {
  const re = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
  return re.test(phone.replace(/\s/g, ''));
};

/**
 * Validate password (ít nhất 6 ký tự)
 * @param {string} password
 * @returns {boolean}
 */
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Validate tên (không rỗng, ít nhất 2 ký tự)
 * @param {string} name
 * @returns {boolean}
 */
export const validateName = (name) => {
  return name && name.trim().length >= 2;
};

/**
 * Validate không rỗng
 * @param {*} value
 * @returns {boolean}
 */
export const validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * Validate form với nhiều rules
 * @param {object} values - { field: value }
 * @param {object} rules - { field: [{ validate: fn, message: string }] }
 * @returns {object} - { isValid: boolean, errors: { field: string } }
 */
export const validateForm = (values, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = values[field];
    
    for (const rule of fieldRules) {
      if (!rule.validate(value)) {
        errors[field] = rule.message;
        break;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
