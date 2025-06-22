/**
 * Centralized validation utilities
 */

export const validators = {
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  phone: (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  },

  password: (password) => {
    return {
      isValid: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  },

  required: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },

  minLength: (value, min) => {
    return value && value.length >= min;
  },

  maxLength: (value, max) => {
    return value && value.length <= max;
  }
};

export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const fieldRules = rules[field];
    
    fieldRules.forEach(rule => {
      if (rule.required && !validators.required(value)) {
        errors[field] = rule.message || `${field} is required`;
        return;
      }
      
      if (rule.email && value && !validators.email(value)) {
        errors[field] = rule.message || 'Invalid email format';
        return;
      }
      
      if (rule.phone && value && !validators.phone(value)) {
        errors[field] = rule.message || 'Invalid phone format';
        return;
      }
      
      if (rule.minLength && value && !validators.minLength(value, rule.minLength)) {
        errors[field] = rule.message || `Minimum ${rule.minLength} characters required`;
        return;
      }
    });
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Common validation rule sets
export const validationRules = {
  user: {
    first_name: [
      { required: true, message: 'First name is required' },
      { minLength: 2, message: 'First name must be at least 2 characters' }
    ],
    last_name: [
      { required: true, message: 'Last name is required' },
      { minLength: 2, message: 'Last name must be at least 2 characters' }
    ],
    email: [
      { required: true, message: 'Email is required' },
      { email: true, message: 'Please enter a valid email' }
    ],
    phone: [
      { phone: true, message: 'Please enter a valid phone number' }
    ]
  },
  
  auth: {
    email: [
      { required: true, message: 'Email is required' },
      { email: true, message: 'Please enter a valid email' }
    ],
    password: [
      { required: true, message: 'Password is required' },
      { minLength: 8, message: 'Password must be at least 8 characters' }
    ]
  }
};

