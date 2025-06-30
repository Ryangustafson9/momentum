/**
 * Password Security and Validation Utilities
 * Implements comprehensive password security requirements
 */

// Password complexity requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfoInPassword: true,
  preventSequentialChars: true,
  preventRepeatingChars: true
};

// Common weak passwords to prevent
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '123456789', 'qwerty',
  'abc123', 'password1', 'admin', 'welcome', 'login',
  'user', 'test', 'guest', 'demo', 'temp', 'changeme'
];

// Special characters allowed
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Validate password against all security requirements
 * @param {string} password - Password to validate
 * @param {Object} userInfo - User information to prevent personal info in password
 * @returns {Object} Validation result with score and requirements
 */
export const validatePassword = (password, userInfo = {}) => {
  const result = {
    isValid: false,
    score: 0,
    strength: 'weak',
    requirements: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumbers: false,
      hasSpecialChars: false,
      notCommonPassword: false,
      noUserInfo: false,
      noSequentialChars: false,
      noRepeatingChars: false
    },
    errors: [],
    suggestions: []
  };

  if (!password || typeof password !== 'string') {
    result.errors.push('Password is required');
    return result;
  }

  // Check minimum length
  if (password.length >= PASSWORD_REQUIREMENTS.minLength) {
    result.requirements.minLength = true;
    result.score += 10;
  } else {
    result.errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
    result.suggestions.push('Use a longer password');
  }

  // Check maximum length
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    result.errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
    return result;
  }

  // Check for uppercase letters
  if (/[A-Z]/.test(password)) {
    result.requirements.hasUppercase = true;
    result.score += 10;
  } else {
    result.errors.push('Password must contain at least one uppercase letter');
    result.suggestions.push('Add uppercase letters (A-Z)');
  }

  // Check for lowercase letters
  if (/[a-z]/.test(password)) {
    result.requirements.hasLowercase = true;
    result.score += 10;
  } else {
    result.errors.push('Password must contain at least one lowercase letter');
    result.suggestions.push('Add lowercase letters (a-z)');
  }

  // Check for numbers
  if (/[0-9]/.test(password)) {
    result.requirements.hasNumbers = true;
    result.score += 10;
  } else {
    result.errors.push('Password must contain at least one number');
    result.suggestions.push('Add numbers (0-9)');
  }

  // Check for special characters
  if (new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password)) {
    result.requirements.hasSpecialChars = true;
    result.score += 15;
  } else {
    result.errors.push('Password must contain at least one special character');
    result.suggestions.push(`Add special characters (${SPECIAL_CHARS})`);
  }

  // Check against common passwords
  const lowerPassword = password.toLowerCase();
  if (!COMMON_PASSWORDS.includes(lowerPassword)) {
    result.requirements.notCommonPassword = true;
    result.score += 15;
  } else {
    result.errors.push('Password is too common and easily guessed');
    result.suggestions.push('Use a more unique password');
  }

  // Check for user information in password
  if (userInfo) {
    const personalInfo = [
      userInfo.firstName?.toLowerCase(),
      userInfo.lastName?.toLowerCase(),
      userInfo.email?.split('@')[0]?.toLowerCase(),
      userInfo.username?.toLowerCase(),
      userInfo.phone?.replace(/\D/g, ''),
      userInfo.dateOfBirth?.replace(/\D/g, '')
    ].filter(Boolean);

    const containsPersonalInfo = personalInfo.some(info => 
      info && lowerPassword.includes(info)
    );

    if (!containsPersonalInfo) {
      result.requirements.noUserInfo = true;
      result.score += 10;
    } else {
      result.errors.push('Password should not contain personal information');
      result.suggestions.push('Avoid using your name, email, or other personal details');
    }
  } else {
    result.requirements.noUserInfo = true;
    result.score += 10;
  }

  // Check for sequential characters (abc, 123, qwe)
  const hasSequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789|890|qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)/i.test(password);
  
  if (!hasSequential) {
    result.requirements.noSequentialChars = true;
    result.score += 5;
  } else {
    result.errors.push('Password should not contain sequential characters');
    result.suggestions.push('Avoid sequences like "abc" or "123"');
  }

  // Check for repeating characters (aaa, 111)
  const hasRepeating = /(.)\1{2,}/.test(password);
  
  if (!hasRepeating) {
    result.requirements.noRepeatingChars = true;
    result.score += 5;
  } else {
    result.errors.push('Password should not contain repeating characters');
    result.suggestions.push('Avoid repeating characters like "aaa" or "111"');
  }

  // Bonus points for length and complexity
  if (password.length >= 12) result.score += 5;
  if (password.length >= 16) result.score += 5;
  
  // Count character types
  const charTypes = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password)
  ].filter(Boolean).length;
  
  if (charTypes >= 4) result.score += 10;

  // Calculate strength based on score
  if (result.score >= 90) {
    result.strength = 'very-strong';
  } else if (result.score >= 75) {
    result.strength = 'strong';
  } else if (result.score >= 60) {
    result.strength = 'medium';
  } else if (result.score >= 40) {
    result.strength = 'weak';
  } else {
    result.strength = 'very-weak';
  }

  // Password is valid if all requirements are met
  result.isValid = Object.values(result.requirements).every(req => req === true);

  return result;
};

/**
 * Generate a secure random password
 * @param {number} length - Password length
 * @returns {string} Generated password
 */
export const generateSecurePassword = (length = 12) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  
  // Ensure at least one character from each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest with random characters
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Check if password has been compromised in data breaches
 * Note: This would typically use an API like HaveIBeenPwned
 * For now, we'll implement a basic check against common patterns
 * @param {string} password - Password to check
 * @returns {Promise<boolean>} True if password appears compromised
 */
export const checkPasswordCompromised = async (password) => {
  // In a real implementation, you would:
  // 1. Hash the password with SHA-1
  // 2. Send first 5 characters of hash to HaveIBeenPwned API
  // 3. Check if full hash exists in returned list
  
  // For now, basic check against known patterns
  const compromisedPatterns = [
    /password/i,
    /123456/,
    /qwerty/i,
    /admin/i,
    /letmein/i,
    /welcome/i,
    /monkey/i,
    /dragon/i
  ];
  
  return compromisedPatterns.some(pattern => pattern.test(password));
};

/**
 * Estimate time to crack password
 * @param {string} password - Password to analyze
 * @returns {Object} Crack time estimation
 */
export const estimateCrackTime = (password) => {
  if (!password) return { time: '0 seconds', isSecure: false };
  
  // Calculate character space
  let charSpace = 0;
  if (/[a-z]/.test(password)) charSpace += 26;
  if (/[A-Z]/.test(password)) charSpace += 26;
  if (/[0-9]/.test(password)) charSpace += 10;
  if (new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password)) charSpace += SPECIAL_CHARS.length;
  
  // Calculate total combinations
  const totalCombinations = Math.pow(charSpace, password.length);
  
  // Assume attacker can try 1 billion passwords per second (modern GPU)
  const attemptsPerSecond = 1e9;
  
  // Average time to crack is half the total combinations
  const secondsToCrack = totalCombinations / (2 * attemptsPerSecond);
  
  // Convert to human-readable time
  if (secondsToCrack < 60) {
    return { time: `${Math.round(secondsToCrack)} seconds`, isSecure: false };
  } else if (secondsToCrack < 3600) {
    return { time: `${Math.round(secondsToCrack / 60)} minutes`, isSecure: false };
  } else if (secondsToCrack < 86400) {
    return { time: `${Math.round(secondsToCrack / 3600)} hours`, isSecure: false };
  } else if (secondsToCrack < 31536000) {
    return { time: `${Math.round(secondsToCrack / 86400)} days`, isSecure: secondsToCrack > 86400 * 30 };
  } else if (secondsToCrack < 31536000000) {
    return { time: `${Math.round(secondsToCrack / 31536000)} years`, isSecure: true };
  } else {
    return { time: 'centuries', isSecure: true };
  }
};

export default {
  validatePassword,
  generateSecurePassword,
  checkPasswordCompromised,
  estimateCrackTime,
  PASSWORD_REQUIREMENTS
};
