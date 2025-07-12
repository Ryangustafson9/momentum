
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ==================== CORE UTILITIES ====================

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export function generateUUID() {
  return crypto.randomUUID();
}

// ==================== DATE FORMATTING ====================

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now - target) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

// ==================== NUMBER FORMATTING ====================

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

export const formatPercentage = (value, decimals = 1) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// ==================== STRING UTILITIES ====================

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const titleCase = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// ==================== PHONE FORMATTING ====================

export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  const cleaned = phoneNumber.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }

  return phoneNumber;
};

// ==================== NAME UTILITIES ====================

export const formatFullName = (firstName, lastName) => {
  return [firstName, lastName].filter(Boolean).join(' ');
};

export const getInitials = (firstName, lastName) => {
  return [firstName, lastName]
    .filter(Boolean)
    .map(name => name.charAt(0).toUpperCase())
    .join('');
};

// ==================== STATUS UTILITIES ====================

export const getStatusColor = (status) => {
  const colors = {
    active: 'text-green-600 bg-green-100',
    inactive: 'text-gray-600 bg-gray-100',
    pending: 'text-yellow-600 bg-yellow-100',
    suspended: 'text-red-600 bg-red-100',
    expired: 'text-orange-600 bg-orange-100',
    cancelled: 'text-red-600 bg-red-100',
    frozen: 'text-blue-600 bg-blue-100',
    guest: 'text-purple-600 bg-purple-100'
  };
  return colors[status?.toLowerCase()] || colors.inactive;
};

// ==================== VALIDATION UTILITIES ====================

export const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ==================== EXPORTS ====================

// Legacy exports for backward compatibility
export const formatters = {
  currency: formatCurrency,
  number: formatNumber,
  percentage: formatPercentage,
  phone: formatPhoneNumber,
  name: formatFullName,
  initials: getInitials,
  truncate: truncateText,
  capitalize: capitalizeFirst,
  titleCase: titleCase
};
