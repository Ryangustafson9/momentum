/**
 * Note Subject Utilities
 * Centralized configuration for note subjects, colors, and icons
 */

export const NOTE_SUBJECTS = [
  {
    value: 'Follow-up Required',
    label: 'Follow-up Required',
    icon: '🔄',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    category: 'action'
  },
  {
    value: 'Personal Training',
    label: 'Personal Training',
    icon: '💪',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    category: 'service'
  },
  {
    value: 'Membership Issue',
    label: 'Membership Issue',
    icon: '🎫',
    color: 'bg-red-100 text-red-800 border-red-200',
    category: 'issue'
  },
  {
    value: 'Payment Related',
    label: 'Payment Related',
    icon: '💳',
    color: 'bg-green-100 text-green-800 border-green-200',
    category: 'financial'
  },
  {
    value: 'Equipment Issue',
    label: 'Equipment Issue',
    icon: '🔧',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    category: 'facility'
  },
  {
    value: 'Class Inquiry',
    label: 'Class Inquiry',
    icon: '📅',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    category: 'service'
  },
  {
    value: 'Complaint',
    label: 'Complaint',
    icon: '⚠️',
    color: 'bg-red-100 text-red-800 border-red-200',
    category: 'feedback'
  },
  {
    value: 'Compliment',
    label: 'Compliment',
    icon: '👏',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    category: 'feedback'
  },
  {
    value: 'General Note',
    label: 'General Note',
    icon: '📝',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    category: 'general'
  },
  {
    value: 'Medical Information',
    label: 'Medical Information',
    icon: '🏥',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    category: 'medical'
  },
  {
    value: 'Emergency Contact',
    label: 'Emergency Contact',
    icon: '🚨',
    color: 'bg-red-100 text-red-800 border-red-200',
    category: 'emergency'
  },
  {
    value: 'Special Needs',
    label: 'Special Needs',
    icon: '♿',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    category: 'accessibility'
  }
];

/**
 * Get subject configuration by value
 */
export const getSubjectConfig = (subjectValue) => {
  return NOTE_SUBJECTS.find(subject => subject.value === subjectValue) || {
    value: subjectValue,
    label: subjectValue,
    icon: '📝',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    category: 'general'
  };
};

/**
 * Get subject color class
 */
export const getSubjectColor = (subjectValue) => {
  return getSubjectConfig(subjectValue).color;
};

/**
 * Get subject icon
 */
export const getSubjectIcon = (subjectValue) => {
  return getSubjectConfig(subjectValue).icon;
};

/**
 * Get subjects by category
 */
export const getSubjectsByCategory = (category) => {
  return NOTE_SUBJECTS.filter(subject => subject.category === category);
};

/**
 * Get all subject categories
 */
export const getSubjectCategories = () => {
  const categories = [...new Set(NOTE_SUBJECTS.map(subject => subject.category))];
  return categories.sort();
};

/**
 * Search subjects by text
 */
export const searchSubjects = (searchTerm) => {
  if (!searchTerm) return NOTE_SUBJECTS;
  
  const term = searchTerm.toLowerCase();
  return NOTE_SUBJECTS.filter(subject => 
    subject.label.toLowerCase().includes(term) ||
    subject.category.toLowerCase().includes(term)
  );
};

/**
 * Get priority order for subjects (for AI suggestions)
 */
export const getSubjectPriority = (subjectValue) => {
  const priorities = {
    'Follow-up Required': 10,
    'Complaint': 9,
    'Emergency Contact': 8,
    'Medical Information': 7,
    'Payment Related': 6,
    'Membership Issue': 5,
    'Personal Training': 4,
    'Equipment Issue': 3,
    'Class Inquiry': 2,
    'General Note': 1,
    'Compliment': 1,
    'Special Needs': 6
  };
  
  return priorities[subjectValue] || 1;
};

export default {
  NOTE_SUBJECTS,
  getSubjectConfig,
  getSubjectColor,
  getSubjectIcon,
  getSubjectsByCategory,
  getSubjectCategories,
  searchSubjects,
  getSubjectPriority
};
