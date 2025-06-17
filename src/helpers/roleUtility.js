/**
 * Normalize role names to handle variations and ensure consistency
 * @param {string} role - Raw role string
 * @returns {string} - Normalized role
 */
export const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') {
    return 'member'; // Default fallback
  }
  
  const normalized = role.toLowerCase().trim();
  
  // Handle common variations
  const roleMap = {
    'administrator': 'admin',
    'admin': 'admin',
    'staff': 'staff',
    'employee': 'staff',
    'trainer': 'staff',
    'instructor': 'staff',
    'member': 'member',
    'user': 'member',
    'customer': 'member',
    'family_member': 'member', // Fix: family_member should be treated as member
  };
  
  return roleMap[normalized] || 'member';
};

/**
 * Check if a role has admin privileges
 * @param {string} role - Role to check
 * @returns {boolean} - Whether role has admin privileges
 */
export const isAdmin = (role) => {
  return normalizeRole(role) === 'admin';
};

/**
 * Check if a role has staff privileges
 * @param {string} role - Role to check
 * @returns {boolean} - Whether role has staff privileges
 */
export const isStaff = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'staff' || normalized === 'admin';
};

/**
 * Check if a role is a member
 * @param {string} role - Role to check
 * @returns {boolean} - Whether role is a member
 */
export const isMember = (role) => {
  return normalizeRole(role) === 'member';
};

/**
 * Get role hierarchy level (higher number = more privileges)
 * @param {string} role - Role to check
 * @returns {number} - Hierarchy level
 */
export const getRoleLevel = (role) => {
  const levels = {
    'admin': 3,
    'staff': 2,
    'member': 1,
  };
  
  return levels[normalizeRole(role)] || 0;
};