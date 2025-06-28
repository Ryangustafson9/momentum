/**
 * 📊 STATUS UTILITIES
 * Centralized status definitions and utilities for users and memberships
 */

// ==================== USER STATUSES ====================
export const USER_STATUSES = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended', 
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  FROZEN: 'frozen',
  GUEST: 'guest',
  ARCHIVED: 'archived'
};

export const USER_STATUS_LABELS = {
  [USER_STATUSES.ACTIVE]: 'Active',
  [USER_STATUSES.SUSPENDED]: 'Suspended',
  [USER_STATUSES.CANCELLED]: 'Cancelled', 
  [USER_STATUSES.EXPIRED]: 'Expired',
  [USER_STATUSES.FROZEN]: 'Frozen',
  [USER_STATUSES.GUEST]: 'Guest',
  [USER_STATUSES.ARCHIVED]: 'Archived'
};

export const USER_STATUS_COLORS = {
  [USER_STATUSES.ACTIVE]: 'bg-green-100 text-green-800 border-green-200',
  [USER_STATUSES.SUSPENDED]: 'bg-red-100 text-red-800 border-red-200',
  [USER_STATUSES.CANCELLED]: 'bg-red-100 text-red-800 border-red-200',
  [USER_STATUSES.EXPIRED]: 'bg-orange-100 text-orange-800 border-orange-200',
  [USER_STATUSES.FROZEN]: 'bg-blue-100 text-blue-800 border-blue-200',
  [USER_STATUSES.GUEST]: 'bg-gray-100 text-gray-800 border-gray-200',
  [USER_STATUSES.ARCHIVED]: 'bg-gray-100 text-gray-800 border-gray-200'
};

// ==================== MEMBERSHIP STATUSES ====================
export const MEMBERSHIP_STATUSES = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  PENDING: 'pending', 
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

export const MEMBERSHIP_STATUS_LABELS = {
  [MEMBERSHIP_STATUSES.ACTIVE]: 'Active',
  [MEMBERSHIP_STATUSES.SUSPENDED]: 'Suspended',
  [MEMBERSHIP_STATUSES.PENDING]: 'Pending',
  [MEMBERSHIP_STATUSES.EXPIRED]: 'Expired',
  [MEMBERSHIP_STATUSES.CANCELLED]: 'Cancelled'
};

export const MEMBERSHIP_STATUS_COLORS = {
  [MEMBERSHIP_STATUSES.ACTIVE]: 'bg-green-100 text-green-800 border-green-200',
  [MEMBERSHIP_STATUSES.SUSPENDED]: 'bg-red-100 text-red-800 border-red-200',
  [MEMBERSHIP_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [MEMBERSHIP_STATUSES.EXPIRED]: 'bg-orange-100 text-orange-800 border-orange-200',
  [MEMBERSHIP_STATUSES.CANCELLED]: 'bg-red-100 text-red-800 border-red-200'
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get user status color classes
 */
export const getUserStatusColor = (status) => {
  return USER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Get membership status color classes
 */
export const getMembershipStatusColor = (status) => {
  return MEMBERSHIP_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Get user status label
 */
export const getUserStatusLabel = (status) => {
  return USER_STATUS_LABELS[status] || status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';
};

/**
 * Get membership status label
 */
export const getMembershipStatusLabel = (status) => {
  return MEMBERSHIP_STATUS_LABELS[status] || status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';
};

/**
 * Check if user is a guest (no membership required)
 */
export const isGuestUser = (userStatus) => {
  return userStatus === USER_STATUSES.GUEST;
};

/**
 * Check if user can check in
 */
export const canUserCheckIn = (userStatus, membershipStatus = null) => {
  // Guest users can always check in
  if (isGuestUser(userStatus)) {
    return true;
  }
  
  // Active users with active memberships can check in
  if (userStatus === USER_STATUSES.ACTIVE && membershipStatus === MEMBERSHIP_STATUSES.ACTIVE) {
    return true;
  }
  
  // Frozen users might be allowed depending on business rules
  if (userStatus === USER_STATUSES.FROZEN) {
    return false; // Can be customized based on business rules
  }
  
  return false;
};

/**
 * Get all user status options for dropdowns
 */
export const getUserStatusOptions = () => {
  return Object.values(USER_STATUSES).map(status => ({
    value: status,
    label: USER_STATUS_LABELS[status]
  }));
};

/**
 * Get all membership status options for dropdowns
 */
export const getMembershipStatusOptions = () => {
  return Object.values(MEMBERSHIP_STATUSES).map(status => ({
    value: status,
    label: MEMBERSHIP_STATUS_LABELS[status]
  }));
};

/**
 * Check if membership should be hidden (for guest users)
 */
export const shouldHideMembership = (userStatus) => {
  return isGuestUser(userStatus);
};

/**
 * Get badge variant for status
 */
export const getStatusBadgeVariant = (status, type = 'user') => {
  const isActive = type === 'user' 
    ? status === USER_STATUSES.ACTIVE 
    : status === MEMBERSHIP_STATUSES.ACTIVE;
    
  const isDestructive = type === 'user'
    ? [USER_STATUSES.SUSPENDED, USER_STATUSES.CANCELLED, USER_STATUSES.EXPIRED].includes(status)
    : [MEMBERSHIP_STATUSES.SUSPENDED, MEMBERSHIP_STATUSES.CANCELLED, MEMBERSHIP_STATUSES.EXPIRED].includes(status);
    
  const isPending = type === 'user'
    ? false
    : status === MEMBERSHIP_STATUSES.PENDING;
    
  if (isActive) return 'default';
  if (isDestructive) return 'destructive';
  if (isPending) return 'secondary';
  return 'outline';
};
