/**
 * 📜 PERMISSION HISTORY SERVICE
 * Track and manage permission changes over time
 */

import { supabase } from '@/lib/supabaseClient';

// ==================== PERMISSION HISTORY FUNCTIONS ====================

/**
 * Log a permission change
 */
export const logPermissionChange = async (changeData) => {
  try {
    const { data, error } = await supabase
      .from('permission_history')
      .insert({
        role_id: changeData.roleId,
        role_name: changeData.roleName,
        changed_by: changeData.changedBy,
        change_type: changeData.changeType, // 'update', 'create', 'delete', 'template_applied'
        old_permissions: changeData.oldPermissions || {},
        new_permissions: changeData.newPermissions || {},
        changes_summary: changeData.changesSummary,
        template_applied: changeData.templateApplied || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    
    throw error;
  }
};

/**
 * Get permission history for a specific role
 */
export const getRolePermissionHistory = async (roleId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('permission_history')
      .select('*')
      .eq('role_id', roleId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    
    return [];
  }
};

/**
 * Get all permission history with pagination
 */
export const getAllPermissionHistory = async (page = 1, pageSize = 20, filters = {}) => {
  try {
    let query = supabase
      .from('permission_history')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (filters.roleId) {
      query = query.eq('role_id', filters.roleId);
    }
    
    if (filters.changedBy) {
      query = query.eq('changed_by', filters.changedBy);
    }
    
    if (filters.changeType) {
      query = query.eq('change_type', filters.changeType);
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      throw error;
    }
    
    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  } catch (error) {
    
    return {
      data: [],
      count: 0,
      page: 1,
      pageSize,
      totalPages: 0
    };
  }
};

/**
 * Generate changes summary for permission updates
 */
export const generateChangesSummary = (oldPermissions, newPermissions) => {
  const changes = {
    added: [],
    removed: [],
    total: 0
  };
  
  // Find added permissions
  Object.keys(newPermissions).forEach(perm => {
    if (newPermissions[perm] && !oldPermissions[perm]) {
      changes.added.push(perm);
    }
  });
  
  // Find removed permissions
  Object.keys(oldPermissions).forEach(perm => {
    if (oldPermissions[perm] && !newPermissions[perm]) {
      changes.removed.push(perm);
    }
  });
  
  changes.total = changes.added.length + changes.removed.length;
  
  // Generate human-readable summary
  const summaryParts = [];
  
  if (changes.added.length > 0) {
    summaryParts.push(`Added ${changes.added.length} permission${changes.added.length > 1 ? 's' : ''}`);
  }
  
  if (changes.removed.length > 0) {
    summaryParts.push(`Removed ${changes.removed.length} permission${changes.removed.length > 1 ? 's' : ''}`);
  }
  
  if (summaryParts.length === 0) {
    return 'No permission changes';
  }
  
  return summaryParts.join(', ');
};

/**
 * Get permission change statistics
 */
export const getPermissionChangeStats = async (dateRange = 30) => {
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - dateRange);
    
    const { data, error } = await supabase
      .from('permission_history')
      .select('change_type, created_at')
      .gte('created_at', dateFrom.toISOString());
    
    if (error) {
      throw error;
    }
    
    const stats = {
      total: data.length,
      byType: {},
      byDay: {},
      mostActiveRoles: {}
    };
    
    // Group by change type
    data.forEach(record => {
      stats.byType[record.change_type] = (stats.byType[record.change_type] || 0) + 1;
      
      // Group by day
      const day = new Date(record.created_at).toDateString();
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;
    });
    
    return stats;
  } catch (error) {
    
    return {
      total: 0,
      byType: {},
      byDay: {},
      mostActiveRoles: {}
    };
  }
};

/**
 * Revert permissions to a previous state
 */
export const revertPermissions = async (historyId, currentUserId) => {
  try {
    // Get the history record
    const { data: historyRecord, error: historyError } = await supabase
      .from('permission_history')
      .select('*')
      .eq('id', historyId)
      .single();
    
    if (historyError) {
      throw historyError;
    }
    
    // Update the role with old permissions
    const { data: updatedRole, error: updateError } = await supabase
      .from('staff_roles')
      .update({
        permissions: historyRecord.old_permissions,
        updated_at: new Date().toISOString()
      })
      .eq('id', historyRecord.role_id)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    // Log the revert action
    await logPermissionChange({
      roleId: historyRecord.role_id,
      roleName: historyRecord.role_name,
      changedBy: currentUserId,
      changeType: 'revert',
      oldPermissions: historyRecord.new_permissions,
      newPermissions: historyRecord.old_permissions,
      changesSummary: `Reverted to state from ${new Date(historyRecord.created_at).toLocaleString()}`
    });
    
    return updatedRole;
  } catch (error) {
    
    throw error;
  }
};

/**
 * Delete old permission history records
 */
export const cleanupPermissionHistory = async (daysToKeep = 365) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const { data, error } = await supabase
      .from('permission_history')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');
    
    if (error) {
      throw error;
    }
    
    return data?.length || 0;
  } catch (error) {
    
    return 0;
  }
};

export default {
  logPermissionChange,
  getRolePermissionHistory,
  getAllPermissionHistory,
  generateChangesSummary,
  getPermissionChangeStats,
  revertPermissions,
  cleanupPermissionHistory
};

