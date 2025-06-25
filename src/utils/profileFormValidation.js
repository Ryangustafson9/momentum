import React from 'react';

/**
 * Comprehensive profile form validation utilities
 */

// Validation rules
export const validationRules = {
  first_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'First name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes'
  },
  last_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Last name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes'
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  phone: {
    required: false,
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Please enter a valid phone number'
  },
  address: {
    required: false,
    maxLength: 200,
    message: 'Address must be less than 200 characters'
  },
  dob: {
    required: false,
    validate: (value) => {
      if (!value) return true;
      const date = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return age >= 13 && age <= 120;
    },
    message: 'Date of birth must be between 13 and 120 years ago'
  },
  join_date: {
    required: false,
    validate: (value) => {
      if (!value) return true;
      const date = new Date(value);
      const now = new Date();
      return date <= now;
    },
    message: 'Join date cannot be in the future'
  },
  emergency_contact: {
    required: false,
    minLength: 2,
    maxLength: 100,
    message: 'Emergency contact name must be 2-100 characters'
  },
  emergency_phone: {
    required: false,
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Please enter a valid emergency contact phone number'
  },
  notes: {
    required: false,
    maxLength: 1000,
    message: 'Notes must be less than 1000 characters'
  },
  access_card_number: {
    required: false,
    pattern: /^[A-Za-z0-9-]+$/,
    message: 'Access card number can only contain letters, numbers, and hyphens'
  }
};

/**
 * Validates a single field value
 */
export const validateField = (fieldName, value, rules = validationRules) => {
  const rule = rules[fieldName];
  if (!rule) return null;

  // Check required
  if (rule.required && (!value || value.toString().trim() === '')) {
    return `${fieldName.replace('_', ' ')} is required`;
  }

  // If value is empty and not required, it's valid
  if (!value || value.toString().trim() === '') {
    return null;
  }

  const stringValue = value.toString().trim();

  // Check minimum length
  if (rule.minLength && stringValue.length < rule.minLength) {
    return rule.message || `Must be at least ${rule.minLength} characters`;
  }

  // Check maximum length
  if (rule.maxLength && stringValue.length > rule.maxLength) {
    return rule.message || `Must be less than ${rule.maxLength} characters`;
  }

  // Check pattern
  if (rule.pattern && !rule.pattern.test(stringValue)) {
    return rule.message || 'Invalid format';
  }

  // Check custom validation function
  if (rule.validate && !rule.validate(value)) {
    return rule.message || 'Invalid value';
  }

  return null;
};

/**
 * Validates an entire form object
 */
export const validateForm = (formData, rules = validationRules, requiredFields = []) => {
  const errors = {};
  const warnings = [];

  // Validate each field that has rules
  Object.keys(rules).forEach(fieldName => {
    const error = validateField(fieldName, formData[fieldName], rules);
    if (error) {
      errors[fieldName] = error;
    }
  });

  // Check additional required fields
  requiredFields.forEach(fieldName => {
    if (!formData[fieldName] || formData[fieldName].toString().trim() === '') {
      errors[fieldName] = `${fieldName.replace('_', ' ')} is required`;
    }
  });

  // Add warnings for incomplete but not required fields
  if (formData.phone && !formData.emergency_phone) {
    warnings.push('Consider adding an emergency contact phone number');
  }

  if (formData.emergency_contact && !formData.emergency_phone) {
    warnings.push('Emergency contact is missing a phone number');
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
};

/**
 * Real-time validation for form fields
 */
export const useFormValidation = (initialData = {}, customRules = {}) => {
  const [formData, setFormData] = React.useState(initialData);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const rules = { ...validationRules, ...customRules };

  const validateSingleField = (fieldName, value) => {
    const error = validateField(fieldName, value, rules);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
    return !error;
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Validate if field has been touched
    if (touched[fieldName]) {
      validateSingleField(fieldName, value);
    }
  };

  const handleFieldBlur = (fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
    validateSingleField(fieldName, formData[fieldName]);
  };

  const validateAllFields = (requiredFields = []) => {
    const validation = validateForm(formData, rules, requiredFields);
    setErrors(validation.errors);
    return validation;
  };

  const resetForm = (newData = {}) => {
    setFormData(newData);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    handleFieldChange,
    handleFieldBlur,
    validateAllFields,
    resetForm,
    setFormData
  };
};

/**
 * Profile-specific validation configurations
 */
export const profileValidationConfigs = {
  member: {
    requiredFields: ['first_name', 'last_name', 'email'],
    rules: validationRules
  },
  staff: {
    requiredFields: ['first_name', 'last_name', 'email', 'phone'],
    rules: {
      ...validationRules,
      phone: { ...validationRules.phone, required: true }
    }
  },
  admin: {
    requiredFields: ['first_name', 'last_name', 'email', 'phone'],
    rules: {
      ...validationRules,
      phone: { ...validationRules.phone, required: true }
    }
  }
};

export default {
  validationRules,
  validateField,
  validateForm,
  useFormValidation,
  profileValidationConfigs
};
