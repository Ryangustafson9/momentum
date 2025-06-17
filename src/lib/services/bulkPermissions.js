/**
 * 🔄 BULK PERMISSION MANAGEMENT
 * Apply permissions to multiple staff plans simultaneously
 */

import { supabase } from '@/lib/supabaseClient';
import { updateStaffRolePermissions } from './permissionService';
import { logPermissionChange, generateChangesSummary } from './permissionHistory';
import { applyPermissionTemplate } from './permissionTemplates';

// ==================== BULK OPERATIONS ====================

/**
 * Apply permissions to multiple roles
 */
export const bulkUpdatePermissions = async (roleIds, permissions, currentUserId) => {
  const results = {
    successful: [],
    failed: [],
    total: roleIds.length
  };
  
  try {
    // Process each role
    for (const roleId of roleIds) {
      try {
        // Get current permissions for history
        const { data: currentRole, error: fetchError } = await supabase
          .from('staff_roles')
          .select('*')
          .eq('id', roleId)
          .single();
        
        if (fetchError) {
          results.failed.push({
            roleId,
            error: fetchError.message
          });
          continue;
        }
        
        const oldPermissions = currentRole.permissions || {};
        
        // Update permissions
        await updateStaffRolePermissions(roleId, permissions);
        
        // Log the change
        await logPermissionChange({
          roleId,
          roleName: currentRole.name,
          changedBy: currentUserId,
          changeType: 'bulk_update',
          oldPermissions,
          newPermissions: permissions,
          changesSummary: generateChangesSummary(oldPermissions, permissions)
        });
        
        results.successful.push({
          roleId,
          roleName: currentRole.name
        });
        
      } catch (error) {
        results.failed.push({
          roleId,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in bulk permission update:', error);
    throw error;
  }
};

/**
 * Apply template to multiple roles
 */
export const bulkApplyTemplate = async (roleIds, templateKey, currentUserId) => {
  const results = {
    successful: [],
    failed: [],
    total: roleIds.length
  };
  
  try {
    const template = applyPermissionTemplate(templateKey);
    
    // Process each role
    for (const roleId of roleIds) {
      try {
        // Get current permissions for history
        const { data: currentRole, error: fetchError } = await supabase
          .from('staff_roles')
          .select('*')
          .eq('id', roleId)
          .single();
        
        if (fetchError) {
          results.failed.push({
            roleId,
            error: fetchError.message
          });
          continue;
        }
        
        const oldPermissions = currentRole.permissions || {};
        
        // Update permissions with template
        await updateStaffRolePermissions(roleId, template.permissions);
        
        // Log the change
        await logPermissionChange({
          roleId,
          roleName: currentRole.name,
          changedBy: currentUserId,
          changeType: 'template_applied',
          oldPermissions,
          newPermissions: template.permissions,
          changesSummary: `Applied template: ${template.name}`,
          templateApplied: templateKey
        });
        
        results.successful.push({
          roleId,
          roleName: currentRole.name,
          templateApplied: template.name
        });
        
      } catch (error) {
        results.failed.push({
          roleId,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in bulk template application:', error);
    throw error;
  }
};

/**
 * Add specific permissions to multiple roles
 */
export const bulkAddPermissions = async (roleIds, permissionsToAdd, currentUserId) => {
  const results = {
    successful: [],
    failed: [],
    total: roleIds.length
  };
  
  try {
    // Process each role
    for (const roleId of roleIds) {
      try {
        // Get current permissions
        const { data: currentRole, error: fetchError } = await supabase
          .from('staff_roles')
          .select('*')
          .eq('id', roleId)
          .single();
        
        if (fetchError) {
          results.failed.push({
            roleId,
            error: fetchError.message
          });
          continue;
        }
        
        const oldPermissions = currentRole.permissions || {};
        const newPermissions = { ...oldPermissions };
        
        // Add new permissions
        permissionsToAdd.forEach(permission => {
          newPermissions[permission] = true;
        });
        
        // Update permissions
        await updateStaffRolePermissions(roleId, newPermissions);
        
        // Log the change
        await logPermissionChange({
          roleId,
          roleName: currentRole.name,
          changedBy: currentUserId,
          changeType: 'bulk_add',
          oldPermissions,
          newPermissions,
          changesSummary: `Added ${permissionsToAdd.length} permission${permissionsToAdd.length > 1 ? 's' : ''}`
        });
        
        results.successful.push({
          roleId,
          roleName: currentRole.name,
          permissionsAdded: permissionsToAdd
        });
        
      } catch (error) {
        results.failed.push({
          roleId,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in bulk add permissions:', error);
    throw error;
  }
};

/**
 * Remove specific permissions from multiple roles
 */
export const bulkRemovePermissions = async (roleIds, permissionsToRemove, currentUserId) => {
  const results = {
    successful: [],
    failed: [],
    total: roleIds.length
  };
  
  try {
    // Process each role
    for (const roleId of roleIds) {
      try {
        // Get current permissions
        const { data: currentRole, error: fetchError } = await supabase
          .from('staff_roles')
          .select('*')
          .eq('id', roleId)
          .single();
        
        if (fetchError) {
          results.failed.push({
            roleId,
            error: fetchError.message
          });
          continue;
        }
        
        const oldPermissions = currentRole.permissions || {};
        const newPermissions = { ...oldPermissions };
        
        // Remove permissions
        permissionsToRemove.forEach(permission => {
          delete newPermissions[permission];
        });
        
        // Update permissions
        await updateStaffRolePermissions(roleId, newPermissions);
        
        // Log the change
        await logPermissionChange({
          roleId,
          roleName: currentRole.name,
          changedBy: currentUserId,
          changeType: 'bulk_remove',
          oldPermissions,
          newPermissions,
          changesSummary: `Removed ${permissionsToRemove.length} permission${permissionsToRemove.length > 1 ? 's' : ''}`
        });
        
        results.successful.push({
          roleId,
          roleName: currentRole.name,
          permissionsRemoved: permissionsToRemove
        });
        
      } catch (error) {
        results.failed.push({
          roleId,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in bulk remove permissions:', error);
    throw error;
  }
};

/**
 * Copy permissions from one role to multiple roles
 */
export const bulkCopyPermissions = async (sourceRoleId, targetRoleIds, currentUserId) => {
  const results = {
    successful: [],
    failed: [],
    total: targetRoleIds.length
  };
  
  try {
    // Get source role permissions
    const { data: sourceRole, error: sourceError } = await supabase
      .from('staff_roles')
      .select('*')
      .eq('id', sourceRoleId)
      .single();
    
    if (sourceError) {
      throw new Error(`Failed to fetch source role: ${sourceError.message}`);
    }
    
    const sourcePermissions = sourceRole.permissions || {};
    
    // Apply to target roles
    const bulkResult = await bulkUpdatePermissions(targetRoleIds, sourcePermissions, currentUserId);
    
    // Update change logs to indicate copy operation
    for (const success of bulkResult.successful) {
      await logPermissionChange({
        roleId: success.roleId,
        roleName: success.roleName,
        changedBy: currentUserId,
        changeType: 'copy_permissions',
        oldPermissions: {},
        newPermissions: sourcePermissions,
        changesSummary: `Copied permissions from ${sourceRole.name}`
      });
    }
    
    return bulkResult;
  } catch (error) {
    console.error('Error in bulk copy permissions:', error);
    throw error;
  }
};

export default {
  bulkUpdatePermissions,
  bulkApplyTemplate,
  bulkAddPermissions,
  bulkRemovePermissions,
  bulkCopyPermissions
};
