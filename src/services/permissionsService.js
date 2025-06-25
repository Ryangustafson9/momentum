/**
 * 🔐 Permissions Service - Staff Plan Permission Management
 * 
 * This service connects Staff Plans to the detailed permissions system,
 * allowing fine-grained access control based on assigned staff roles.
 * 
 * ✅ SECURITY FIXES APPLIED:
 * - Enhanced parameter validation and null checks
 * - Improved error handling with safe fallbacks
 * - Added user validation helpers
 * - Better logging for debugging access issues
 */

import { supabase } from '@/lib/supabaseClient';
import { sanitizeError } from '@/utils/requestUtils';

/**
 * Validates if a user ID is valid
 * @param {any} userId - User ID to validate
 * @returns {boolean} - Whether user ID is valid
 */
const isValidUserId = (userId) => {
  return (
    userId !== null &&
    userId !== undefined &&
    (typeof userId === 'string' || typeof userId === 'number') &&
    String(userId).trim().length > 0
  );
};

/**
 * Validates if a permission name is valid
 * @param {any} permissionName - Permission name to validate
 * @returns {boolean} - Whether permission name is valid
 */
const isValidPermissionName = (permissionName) => {
  return (
    permissionName !== null &&
    permissionName !== undefined &&
    typeof permissionName === 'string' &&
    permissionName.trim().length > 0 &&
    permissionName.length < 100 // Reasonable limit
  );
};

export class PermissionsService {
  /**
   * Get all permissions for a user based on their staff role
   */
  static async getUserPermissions(userId) {
    // ✅ SECURITY FIX: Validate user ID parameter
    if (!isValidUserId(userId)) {
      console.warn('Invalid userId provided to getUserPermissions:', userId);
      return [];
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_permissions', { user_id: userId });

      if (error) {
        console.error('Error getting user permissions:', sanitizeError(error, 'Get user permissions'));
        return [];
      }

      // ✅ SECURITY FIX: Validate response data
      if (!Array.isArray(data)) {
        console.warn('Invalid permissions data received for user:', userId);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Exception in getUserPermissions:', sanitizeError(error, 'Get user permissions'));
      return [];
    }
  }

  /**
   * Check if a user has a specific permission
   */
  static async userHasPermission(userId, permissionName) {
    // ✅ SECURITY FIX: Validate parameters
    if (!isValidUserId(userId)) {
      console.warn('Invalid userId provided to userHasPermission:', userId);
      return false;
    }

    if (!isValidPermissionName(permissionName)) {
      console.warn('Invalid permissionName provided to userHasPermission:', permissionName);
      return false;
    }

    try {
      const { data, error } = await supabase
        .rpc('user_has_permission', { 
          user_id: userId, 
          permission_name: permissionName 
        });

      if (error) {
        console.error('Error checking user permission:', sanitizeError(error, 'Check user permission'));
        return false;
      }

      // ✅ SECURITY FIX: Ensure boolean result
      return Boolean(data);
    } catch (error) {
      console.error('Exception in userHasPermission:', sanitizeError(error, 'Check user permission'));
      return false;
    }
  }
  /**
   * Get user's complete role and permission information
   */
  static async getUserRoleInfo(userId) {
    // ✅ SECURITY FIX: Validate user ID parameter
    if (!isValidUserId(userId)) {
      console.warn('Invalid userId provided to getUserRoleInfo:', userId);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_role_permissions')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        console.error('Error getting user role info:', sanitizeError(error, 'Get user role info'));
        return null;
      }

      // ✅ SECURITY FIX: Validate returned data structure
      if (!data || typeof data !== 'object') {
        console.warn('Invalid role info data received for user:', userId);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in getUserRoleInfo:', sanitizeError(error, 'Get user role info'));
      return null;
    }
  }

  /**
   * Assign a staff role to a user
   */
  static async assignStaffRole(userId, staffRoleId) {
    // ✅ SECURITY FIX: Validate parameters
    if (!isValidUserId(userId)) {
      console.warn('Invalid userId provided to assignStaffRole:', userId);
      return { success: false, error: 'Invalid user ID' };
    }

    if (!isValidUserId(staffRoleId)) {
      console.warn('Invalid staffRoleId provided to assignStaffRole:', staffRoleId);
      return { success: false, error: 'Invalid staff role ID' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ staff_role_id: staffRoleId })
        .eq('auth_user_id', userId)
        .select();

      if (error) {
        const sanitizedError = sanitizeError(error, 'Assign staff role');
        console.error('Error assigning staff role:', sanitizedError);
        return { success: false, error: sanitizedError.message };
      }

      return { success: true, data };
    } catch (error) {
      const sanitizedError = sanitizeError(error, 'Assign staff role');
      console.error('Exception in assignStaffRole:', sanitizedError);
      return { success: false, error: sanitizedError.message };
    }
  }
  /**
   * Remove staff role from a user
   */
  static async removeStaffRole(userId) {
    // ✅ SECURITY FIX: Validate user ID parameter
    if (!isValidUserId(userId)) {
      console.warn('Invalid userId provided to removeStaffRole:', userId);
      return { success: false, error: 'Invalid user ID' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ staff_role_id: null })
        .eq('auth_user_id', userId)
        .select();

      if (error) {
        const sanitizedError = sanitizeError(error, 'Remove staff role');
        console.error('Error removing staff role:', sanitizedError);
        return { success: false, error: sanitizedError.message };
      }

      return { success: true, data };
    } catch (error) {
      const sanitizedError = sanitizeError(error, 'Remove staff role');
      console.error('Exception in removeStaffRole:', sanitizedError);
      return { success: false, error: sanitizedError.message };
    }
  }

  /**
   * Get all available staff roles
   */
  static async getAllStaffRoles() {
    try {
      const { data, error } = await supabase
        .from('staff_roles')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error getting staff roles:', sanitizeError(error, 'Get staff roles'));
        return [];
      }

      // ✅ SECURITY FIX: Validate response data
      if (!Array.isArray(data)) {
        console.warn('Invalid staff roles data received');
        return [];
      }

      return data;
    } catch (error) {
      console.error('Exception in getAllStaffRoles:', sanitizeError(error, 'Get staff roles'));
      return [];
    }
  }

  /**
   * Permission categories for UI organization
   */
  static getPermissionCategories() {
    return {
      'Member Management': [
        { id: 'view_members', label: 'View Members', description: 'Access member directory and profiles' },
        { id: 'edit_members', label: 'Edit Members', description: 'Modify member information and profiles' },
        { id: 'delete_members', label: 'Delete Members', description: 'Remove members from the system' },
        { id: 'create_members', label: 'Create Members', description: 'Add new members to the system' },
      ],
      'Access Control': [
        { id: 'check_in_members', label: 'Check-in Members', description: 'Process member check-ins and attendance' },
        { id: 'access_admin_panel', label: 'Access Admin Panel', description: 'View and use administrative features' },
        { id: 'manage_staff', label: 'Manage Staff', description: 'Add, edit, and remove staff members' },
        { id: 'view_reports', label: 'View Reports', description: 'Access business reports and analytics' },
      ],
      'Financial': [
        { id: 'manage_payments', label: 'Manage Payments', description: 'Process payments and billing' },
        { id: 'view_financial_reports', label: 'Financial Reports', description: 'Access financial data and reports' },
        { id: 'manage_pricing', label: 'Manage Pricing', description: 'Set and modify membership prices' },
      ],
      'Operations': [
        { id: 'manage_classes', label: 'Manage Classes', description: 'Create and manage class schedules' },
        { id: 'manage_trainers', label: 'Manage Trainers', description: 'Handle trainer assignments and schedules' },
        { id: 'manage_inventory', label: 'Manage Inventory', description: 'Track and manage gym equipment and supplies' },
        { id: 'manage_communications', label: 'Communications', description: 'Send messages and notifications to members' },
      ],
      'System': [
        { id: 'system_settings', label: 'System Settings', description: 'Modify system-wide configurations' },
        { id: 'backup_restore', label: 'Backup & Restore', description: 'Perform system backups and restoration' },
        { id: 'audit_logs', label: 'Audit Logs', description: 'View system audit trails and logs' },
      ]
    };
  }
}

export default PermissionsService;

