// utils/formHelpers.js

// Capitalize names like "McDonald", "O'Connor"
export const capitalizeName = (name) => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.includes("'")) {
        return word.split("'").map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join("'");
      }
      if (word.startsWith('mc')) {
        return 'Mc' + word.slice(2).charAt(0).toUpperCase() + word.slice(3);
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

// Evaluate password strength
export const calculatePasswordStrength = (password) => {
  if (!password) {
    return { 
      score: 0, 
      feedback: '', 
      color: 'gray',
      strengthText: '',
      requirements: {
        length: false,
        uppercase: false,
        number: false,
        special: false
      }
    };
  }

  let score = 0;
  let feedback = [];

  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  if (requirements.length) score += 25;
  if (requirements.uppercase) score += 25;
  if (requirements.number) score += 25;
  if (requirements.special) score += 25;

  if (!requirements.length) feedback.push('8+ characters');
  if (!requirements.uppercase) feedback.push('uppercase letter');
  if (!requirements.number) feedback.push('number');
  if (!requirements.special) feedback.push('special character');
  let strengthText = '';
  let color = '';
  let strength = '';

  if (score === 0) {
    strengthText = '';
    strength = '';
    color = 'gray';
  } else if (score === 100) {
    strengthText = 'Requirements Met';
    strength = 'Strong';
    color = 'green';
  } else if (score >= 75) {
    strengthText = 'Almost There';
    strength = 'Good';
    color = 'yellow';
  } else if (score >= 50) {
    strengthText = 'Getting Better';
    strength = 'Fair';
    color = 'orange';
  } else {
    strengthText = 'Requirements Needed';
    strength = 'Weak';
    color = 'red';
  }

  return {
    score,
    feedback: feedback.length > 0 ? `Add: ${feedback.join(', ')}` : 'All requirements met!',
    strengthText,
    strength,
    color,
    requirements
  };
};

