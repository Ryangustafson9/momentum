/**
 * Utilities Index - Central export point for all utility functions
 * Consolidates scattered utility functions and provides clean imports
 */

// ==================== CORE UTILITIES ====================
export * from '../lib/utils'; // Main utility functions
export * from './validation';
export * from './formatUtils';

// ==================== DATE & TIME UTILITIES ====================
export * from './dateUtils';

// ==================== SECURITY UTILITIES ====================
export * from './passwordValidation';
export * from './urlMasking';
export * from './secureStorage';

// ==================== STORAGE UTILITIES ====================
export * from './storageUtils';
export * from './storageMigration';

// ==================== FORM UTILITIES ====================
export * from './formHelpers';
export * from './profileFormValidation';
export * from './profileValidation';

// ==================== BUSINESS LOGIC UTILITIES ====================
export * from './statusUtils';
export * from './roleUtils';
export * from './permissionUtils';
export * from './accessControl';

// ==================== UI UTILITIES ====================
export * from './searchHighlight';
export * from './gymBranding';
export * from './toastUtils';

// ==================== PERFORMANCE UTILITIES ====================
export * from './requestUtils';

// ==================== REPORTING UTILITIES ====================
export * from './reportGenerator';

// ==================== DEPRECATED UTILITIES ====================
// These are kept for backward compatibility but should be migrated

/**
 * @deprecated Use formatters from '../lib/utils' instead
 */
export { formatters as legacyFormatters } from './formatUtils';

/**
 * @deprecated Use logger from '../lib/logger' instead
 */
export { logger as legacyLogger } from './logger';

// ==================== UTILITY GROUPS ====================

export const CoreUtils = {
  // Re-export core utilities for easy access
};

export const SecurityUtils = {
  // Security-related utilities
};

export const FormUtils = {
  // Form-related utilities
};

export const UIUtils = {
  // UI-related utilities
};

// ==================== UTILITY HELPERS ====================

/**
 * Get utility function by name
 */
export const getUtility = (utilityName) => {
  // This would need to be implemented based on actual exports
  console.warn('getUtility is not yet implemented');
  return null;
};

/**
 * Check if utility exists
 */
export const hasUtility = (utilityName) => {
  return getUtility(utilityName) !== null;
};

// ==================== MIGRATION HELPERS ====================

/**
 * Helper to migrate from old utility patterns to new ones
 */
export const migrateUtilityCall = (oldUtilName, newUtilName, functionName) => {
  console.warn(
    `⚠️ MIGRATION: ${oldUtilName}.${functionName} is deprecated. ` +
    `Use ${newUtilName}.${functionName} instead.`
  );
};

// ==================== DEFAULT EXPORT ====================

export default {
  // Utility groups
  CoreUtils,
  SecurityUtils,
  FormUtils,
  UIUtils,
  
  // Helpers
  getUtility,
  hasUtility,
  migrateUtilityCall
};
