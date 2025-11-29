// src/utils/formatters.js
// Format date, time, number

/**
 * Format date sang DD/MM/YYYY
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN');
};

/**
 * Format time sang HH:MM:SS
 * @param {Date|string} date
 * @returns {string}
 */
export const formatTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleTimeString('vi-VN');
};

/**
 * Format datetime đầy đủ
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return `${formatDate(d)} ${formatTime(d)}`;
};

/**
 * Format số với separator
 * @param {number} num
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('vi-VN');
};

/**
 * Format khoảng cách (mét)
 * @param {number} meters
 * @returns {string}
 */
export const formatDistance = (meters) => {
  if (!meters && meters !== 0) return '-';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
};

/**
 * Format phần trăm
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
export const formatPercent = (value, decimals = 0) => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format thời gian làm việc (giờ)
 * @param {number} hours
 * @returns {string}
 */
export const formatWorkingHours = (hours) => {
  if (!hours) return '0 giờ';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
};

/**
 * Lấy tên ngày trong tuần
 * @param {Date|string} date
 * @returns {string}
 */
export const getDayName = (date) => {
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const d = new Date(date);
  return days[d.getDay()];
};

/**
 * Lấy tên tháng
 * @param {number} month - 1-12
 * @returns {string}
 */
export const getMonthName = (month) => {
  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  return months[month - 1] || '';
};
