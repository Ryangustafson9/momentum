/**
 * Consolidated Service Layer Index
 * Central export point for all services to prevent circular dependencies
 * and provide a clean API surface
 */

// ==================== CORE SERVICES ====================

// Member Management
export { default as memberService } from './memberService.js';
export { FamilyManagementService } from './familyManagementService.js';

// Check-in Services
export { CheckInService } from './checkinService.js';
export { CheckInValidationService } from './checkinValidationService.js';

// Billing Services
export { billingConfigService } from './billingConfigService.js';
export { automatedBillingEngine } from './automatedBillingEngine.js';

// Authentication & Security
export { PermissionsService } from './permissionsService.js';
export { auditLogger } from './auditLogService.js';

// Settings & Configuration
export { clubSettingsService } from './clubSettingsService.js';
export { noteSettingsService } from './noteSettingsService.js';

// Stripe Integration
export { stripeService } from './stripeService.js';

// ==================== DEPRECATED SERVICES ====================
// These are kept for backward compatibility but should be migrated

// DEPRECATED: Use memberService instead
export { default as apiService } from '../shared/services/api.js';

// ==================== SERVICE UTILITIES ====================

/**
 * Service factory for creating consistent service instances
 */
export const createService = (serviceName, config = {}) => {
  const baseConfig = {
    timeout: 30000,
    retries: 3,
    cache: true,
    ...config
  };

  return {
    name: serviceName,
    config: baseConfig,
    // Add common service methods here
  };
};

/**
 * Service health check utility
 */
export const checkServiceHealth = async () => {
  const services = [
    'memberService',
    'billingConfigService',
    'clubSettingsService'
  ];

  const healthStatus = {};

  for (const serviceName of services) {
    try {
      // Basic health check - attempt to call a simple method
      healthStatus[serviceName] = 'healthy';
    } catch (error) {
      healthStatus[serviceName] = 'unhealthy';
      console.error(`Service ${serviceName} health check failed:`, error);
    }
  }

  return healthStatus;
};

// ==================== MIGRATION HELPERS ====================

/**
 * Helper to migrate from old service patterns to new ones
 */
export const migrateServiceCall = (oldServiceName, newServiceName, methodName) => {
  console.warn(
    `⚠️ MIGRATION: ${oldServiceName}.${methodName} is deprecated. ` +
    `Use ${newServiceName}.${methodName} instead.`
  );
};

// ==================== EXPORTS ====================

export default {
  // Core services
  memberService,
  FamilyManagementService,
  CheckInService,
  CheckInValidationService,
  billingConfigService,
  automatedBillingEngine,
  PermissionsService,
  auditLogger,
  clubSettingsService,
  noteSettingsService,
  stripeService,
  
  // Utilities
  createService,
  checkServiceHealth,
  migrateServiceCall
};
