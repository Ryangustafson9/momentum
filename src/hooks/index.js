/**
 * Hooks Index - Central export point for all custom hooks
 * Provides clean imports and prevents circular dependencies
 */

// ==================== CORE HOOKS ====================
export { default as useAuth } from './useAuth';
export { default as useToast } from './use-toast';
export { default as useTheme } from './useTheme';

// ==================== DATA HOOKS ====================
export { default as useMembers } from './useMembers';
export { default as useMemberships } from './useMemberships';
export { default as useClubSettings } from './useClubSettings';
export { default as useOrganization } from './useOrganization';

// ==================== PERFORMANCE HOOKS ====================
export * from './usePerformanceOptimization';
export { default as useDebounce } from './useDebounce';
export { default as useLocalStorage } from './useLocalStorage';

// ==================== SECURITY HOOKS ====================
export { default as usePasswordSecurity } from './usePasswordSecurity';
export { default as usePermissions } from './usePermissions';

// ==================== UI HOOKS ====================
export { default as useModal } from './useModal';
export { default as useForm } from './useForm';
export { default as usePagination } from './usePagination';

// ==================== BUSINESS LOGIC HOOKS ====================
export { default as useBilling } from './useBilling';
export { default as useCheckIn } from './useCheckIn';
export { default as useStaffManagement } from './useStaffManagement';

// ==================== UTILITY HOOKS ====================
export { default as useAsync } from './useAsync';
export { default as useInterval } from './useInterval';
export { default as useTimeout } from './useTimeout';

// ==================== DEPRECATED HOOKS ====================
// These are kept for backward compatibility but should be migrated

/**
 * @deprecated Use useAuth instead
 */
export const useLegacyAuth = () => {
  console.warn('⚠️ DEPRECATED: useLegacyAuth is deprecated. Use useAuth instead.');
  return useAuth();
};

// ==================== HOOK GROUPS ====================

export const CoreHooks = {
  useAuth,
  useToast,
  useTheme
};

export const DataHooks = {
  useMembers,
  useMemberships,
  useClubSettings,
  useOrganization
};

export const PerformanceHooks = {
  useDebounce,
  useLocalStorage,
  // Performance optimization hooks are exported individually above
};

export const SecurityHooks = {
  usePasswordSecurity,
  usePermissions
};

export const UIHooks = {
  useModal,
  useForm,
  usePagination
};

export const BusinessHooks = {
  useBilling,
  useCheckIn,
  useStaffManagement
};

// ==================== HOOK UTILITIES ====================

/**
 * Get hook by name (useful for dynamic imports)
 */
export const getHook = (hookName) => {
  const hooks = {
    useAuth,
    useToast,
    useTheme,
    useMembers,
    useMemberships,
    useClubSettings,
    useOrganization,
    useDebounce,
    useLocalStorage,
    usePasswordSecurity,
    usePermissions,
    useModal,
    useForm,
    usePagination,
    useBilling,
    useCheckIn,
    useStaffManagement,
    useAsync,
    useInterval,
    useTimeout
  };
  
  return hooks[hookName];
};

/**
 * Check if hook exists
 */
export const hasHook = (hookName) => {
  return getHook(hookName) !== undefined;
};

// ==================== DEFAULT EXPORT ====================

export default {
  // Core
  ...CoreHooks,
  
  // Data
  ...DataHooks,
  
  // Performance
  ...PerformanceHooks,
  
  // Security
  ...SecurityHooks,
  
  // UI
  ...UIHooks,
  
  // Business
  ...BusinessHooks,
  
  // Utilities
  getHook,
  hasHook
};
