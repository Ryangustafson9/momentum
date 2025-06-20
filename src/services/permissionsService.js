/**
 * 🔐 Permissions Service - Staff Plan Permission Management
 * 
 * This service connects Staff Plans to the detailed permissions system,
 * allowing fine-grained access control based on assigned staff roles.
 */

import { supabase } from '@/lib/supabaseClient';

export class PermissionsService {
  /**
   * Get all permissions for a user based on their staff role
   */
  static async getUserPermissions(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_permissions', { user_id: userId });

      if (error) {
        console.error('Error fetching user permissions:', error);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error in getUserPermissions:', error);
      return [];
    }
  }

  /**
   * Check if a user has a specific permission
   */
  static async userHasPermission(userId, permissionName) {
    try {
      const { data, error } = await supabase
        .rpc('user_has_permission', { 
          user_id: userId, 
          permission_name: permissionName 
        });

      if (error) {
        console.error('Error checking user permission:', error);
        return false;
      }

      return Boolean(data);
    } catch (error) {
      console.error('Error in userHasPermission:', error);
      return false;
    }
  }

  /**
   * Get user's complete role and permission information
   */
  static async getUserRoleInfo(userId) {
    try {
      const { data, error } = await supabase
        .from('user_role_permissions')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role info:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserRoleInfo:', error);
      return null;
    }
  }

  /**
   * Assign a staff role to a user
   */
  static async assignStaffRole(userId, staffRoleId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ staff_role_id: staffRoleId })
        .eq('auth_user_id', userId)
        .select();

      if (error) {
        console.error('Error assigning staff role:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in assignStaffRole:', error);
      return { success: false, error };
    }
  }

  /**
   * Remove staff role from a user
   */
  static async removeStaffRole(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ staff_role_id: null })
        .eq('auth_user_id', userId)
        .select();

      if (error) {
        console.error('Error removing staff role:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in removeStaffRole:', error);
      return { success: false, error };
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
        console.error('Error fetching staff roles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllStaffRoles:', error);
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
