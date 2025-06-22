/**
 * 🔐 ENHANCED PERMISSION SERVICE
 * Manages dynamic staff permissions linked to staff plans
 */

import { supabase } from '@/lib/supabaseClient';

// ==================== PERMISSION DEFINITIONS ====================

export const AVAILABLE_PERMISSIONS = {
  // Member Management
  'manage_members': {
    name: 'Manage Members',
    description: 'Create, edit, and delete member profiles',
    category: 'Member Management',
    level: 'high'
  },
  'view_members': {
    name: 'View Members',
    description: 'View member profiles and information',
    category: 'Member Management',
    level: 'medium'
  },
  'member_checkin': {
    name: 'Member Check-in',
    description: 'Check members in and out of the facility',
    category: 'Member Management',
    level: 'low'
  },
  'impersonate_members': {
    name: 'Impersonate Members',
    description: 'Log in as members for support purposes',
    category: 'Member Management',
    level: 'high'
  },

  // Class Management
  'manage_classes': {
    name: 'Manage Classes',
    description: 'Create, edit, and delete fitness classes',
    category: 'Class Management',
    level: 'high'
  },
  'view_classes': {
    name: 'View Classes',
    description: 'View class schedules and information',
    category: 'Class Management',
    level: 'low'
  },
  'manage_schedule': {
    name: 'Manage Schedule',
    description: 'Modify class schedules and bookings',
    category: 'Class Management',
    level: 'medium'
  },
  'track_attendance': {
    name: 'Track Attendance',
    description: 'Mark attendance for classes and sessions',
    category: 'Class Management',
    level: 'medium'
  },

  // Financial Management
  'manage_billing': {
    name: 'Manage Billing',
    description: 'Process payments and manage billing',
    category: 'Financial',
    level: 'high'
  },
  'view_reports': {
    name: 'View Reports',
    description: 'Access financial and operational reports',
    category: 'Financial',
    level: 'medium'
  },
  'process_payments': {
    name: 'Process Payments',
    description: 'Handle payment transactions',
    category: 'Financial',
    level: 'medium'
  },
  'view_revenue': {
    name: 'View Revenue',
    description: 'Access revenue and financial data',
    category: 'Financial',
    level: 'high'
  },

  // Staff Management
  'manage_staff': {
    name: 'Manage Staff',
    description: 'Hire, edit, and manage staff members',
    category: 'Staff Management',
    level: 'high'
  },
  'view_staff': {
    name: 'View Staff',
    description: 'View staff profiles and schedules',
    category: 'Staff Management',
    level: 'medium'
  },
  'assign_roles': {
    name: 'Assign Roles',
    description: 'Assign and modify staff roles',
    category: 'Staff Management',
    level: 'high'
  },

  // System Administration
  'manage_settings': {
    name: 'Manage Settings',
    description: 'Modify system settings and configuration',
    category: 'System',
    level: 'high'
  },
  'view_logs': {
    name: 'View System Logs',
    description: 'Access system logs and audit trails',
    category: 'System',
    level: 'high'
  },
  'manage_equipment': {
    name: 'Manage Equipment',
    description: 'Track and maintain gym equipment',
    category: 'Operations',
    level: 'medium'
  },

  // Sales & Marketing
  'lead_management': {
    name: 'Lead Management',
    description: 'Manage sales leads and prospects',
    category: 'Sales',
    level: 'medium'
  },
  'membership_sales': {
    name: 'Membership Sales',
    description: 'Sell memberships and packages',
    category: 'Sales',
    level: 'medium'
  },
  'tour_scheduling': {
    name: 'Tour Scheduling',
    description: 'Schedule facility tours for prospects',
    category: 'Sales',
    level: 'low'
  },
  'commission_reports': {
    name: 'Commission Reports',
    description: 'View sales commission reports',
    category: 'Sales',
    level: 'medium'
  },

  // Training & Fitness
  'client_management': {
    name: 'Client Management',
    description: 'Manage personal training clients',
    category: 'Training',
    level: 'medium'
  },
  'program_design': {
    name: 'Program Design',
    description: 'Create fitness programs and routines',
    category: 'Training',
    level: 'medium'
  },
  'fitness_assessments': {
    name: 'Fitness Assessments',
    description: 'Conduct member fitness evaluations',
    category: 'Training',
    level: 'medium'
  },
  'nutrition_guidance': {
    name: 'Nutrition Guidance',
    description: 'Provide nutritional advice and planning',
    category: 'Training',
    level: 'medium'
  }
};

// ==================== PERMISSION CATEGORIES ====================

export const PERMISSION_CATEGORIES = {
  'Member Management': {
    color: 'blue',
    icon: 'Users',
    description: 'Member-related operations'
  },
  'Class Management': {
    color: 'green',
    icon: 'Calendar',
    description: 'Class and schedule management'
  },
  'Financial': {
    color: 'yellow',
    icon: 'DollarSign',
    description: 'Billing and financial operations'
  },
  'Staff Management': {
    color: 'purple',
    icon: 'UserCheck',
    description: 'Staff and role management'
  },
  'System': {
    color: 'red',
    icon: 'Settings',
    description: 'System administration'
  },
  'Operations': {
    color: 'gray',
    icon: 'Tool',
    description: 'Facility operations'
  },
  'Sales': {
    color: 'emerald',
    icon: 'TrendingUp',
    description: 'Sales and marketing'
  },
  'Training': {
    color: 'orange',
    icon: 'Dumbbell',
    description: 'Training and fitness services'
  }
};

// ==================== PERMISSION SERVICE FUNCTIONS ====================

/**
 * Get all available permissions grouped by category
 */
export const getAvailablePermissions = () => {
  const grouped = {};
  
  Object.entries(AVAILABLE_PERMISSIONS).forEach(([key, permission]) => {
    const category = permission.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push({
      key,
      ...permission
    });
  });
  
  return grouped;
};

/**
 * Get staff role permissions from database
 */
export const getStaffRolePermissions = async (roleId) => {
  try {
    const { data, error } = await supabase
      .from('staff_roles')
      .select('permissions')
      .eq('id', roleId)
      .single();
    
    if (error) {
      
      return {};
    }
    
    return data?.permissions || {};
  } catch (error) {
    
    return {};
  }
};

/**
 * Get user permissions based on their staff plan
 */
export const getUserPermissions = async (userId) => {
  try {
    // Get user's membership with staff plan info
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select(`
        *,
        membership_type:membership_types!current_membership_type_id(
          role_id,
          category
        )
      `)
      .eq('auth_user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (membershipError || !membership) {
      
      return {};
    }
    
    // If user has a staff plan, get role permissions
    if (membership.membership_type?.category === 'Staff Plans' && membership.membership_type?.role_id) {
      return await getStaffRolePermissions(membership.membership_type.role_id);
    }
    
    // Return default permissions for non-staff users
    return {};
  } catch (error) {
    
    return {};
  }
};

/**
 * Check if user has specific permission
 */
export const hasPermission = async (userId, permission) => {
  const permissions = await getUserPermissions(userId);
  return permissions[permission] === true;
};

/**
 * Check multiple permissions at once
 */
export const hasAnyPermission = async (userId, permissionList) => {
  const permissions = await getUserPermissions(userId);
  return permissionList.some(permission => permissions[permission] === true);
};

/**
 * Check if user has all specified permissions
 */
export const hasAllPermissions = async (userId, permissionList) => {
  const permissions = await getUserPermissions(userId);
  return permissionList.every(permission => permissions[permission] === true);
};

/**
 * Update staff role permissions
 */
export const updateStaffRolePermissions = async (roleId, permissions) => {
  try {
    const { data, error } = await supabase
      .from('staff_roles')
      .update({
        permissions,
        updated_at: new Date().toISOString()
      })
      .eq('id', roleId)
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
 * Get all staff roles with their permissions (includes staff plans from membership_types)
 */
export const getAllStaffRoles = async () => {
  try {
    // Get staff roles from staff_roles table
    const { data: staffRoles, error: rolesError } = await supabase
      .from('staff_roles')
      .select('*')
      .order('name');

    if (rolesError) {
      throw rolesError;
    }

    // Get staff plans from membership_types table
    const { data: staffPlans, error: plansError } = await supabase
      .from('membership_types')
      .select(`
        id,
        name,
        description,
        role_id,
        category,
        staff_roles!role_id (
          id,
          name,
          description,
          permissions
        )
      `)
      .eq('category', 'Staff')
      .order('name');

    if (plansError) {
      
    }

    // Combine staff roles and staff plans
    const allRoles = [...(staffRoles || [])];

    // Add staff plans that have associated roles
    if (staffPlans && staffPlans.length > 0) {
      staffPlans.forEach(plan => {
        if (plan.staff_roles) {
          // Check if this role is already in our list
          const existingRole = allRoles.find(role => role.id === plan.staff_roles.id);
          if (!existingRole) {
            // Add the role with plan information
            const newRole = {
              ...plan.staff_roles,
              staff_plan_id: plan.id,
              staff_plan_name: plan.name,
              staff_plan_description: plan.description,
              is_staff_plan: true
            };
            allRoles.push(newRole);
          } else {
            // Update existing role with plan information
            existingRole.staff_plan_id = plan.id;
            existingRole.staff_plan_name = plan.name;
            existingRole.staff_plan_description = plan.description;
            existingRole.is_staff_plan = true;
          }
        } else {
          // Create a temporary role for staff plans without role_id
          const tempRole = {
            id: `temp_${plan.id}`,
            name: plan.name,
            description: plan.description || `Role for ${plan.name}`,
            permissions: {},
            staff_plan_id: plan.id,
            staff_plan_name: plan.name,
            staff_plan_description: plan.description,
            is_staff_plan: true,
            is_temp_role: true
          };
          allRoles.push(tempRole);
        }
      });
    } else {
      
    }

    return allRoles;
  } catch (error) {
    
    return [];
  }
};

/**
 * Get staff plans from membership_types table
 */
export const getStaffPlans = async () => {
  try {
    const { data, error } = await supabase
      .from('membership_types')
      .select(`
        id,
        name,
        description,
        role_id,
        category,
        available_for_sale,
        available_online,
        staff_roles!role_id (
          id,
          name,
          description,
          permissions
        )
      `)
      .eq('category', 'Staff')
      .order('name');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    
    return [];
  }
};

/**
 * Create or update staff role when staff plan is created
 */
export const syncStaffPlanWithRole = async (planData) => {
  try {
    let roleId = planData.role_id;

    // If no role_id, create a new staff role
    if (!roleId) {
      const { data: newRole, error: roleError } = await supabase
        .from('staff_roles')
        .insert({
          name: planData.name,
          description: planData.description || `Role for ${planData.name}`,
          permissions: {} // Start with empty permissions
        })
        .select()
        .single();

      if (roleError) {
        throw roleError;
      }

      roleId = newRole.id;

      // Update the membership_type with the new role_id
      const { error: updateError } = await supabase
        .from('membership_types')
        .update({ role_id: roleId })
        .eq('id', planData.id);

      if (updateError) {
        throw updateError;
      }
    }

    return roleId;
  } catch (error) {
    
    throw error;
  }
};

export default {
  AVAILABLE_PERMISSIONS,
  PERMISSION_CATEGORIES,
  getAvailablePermissions,
  getStaffRolePermissions,
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  updateStaffRolePermissions,
  getAllStaffRoles,
  getStaffPlans,
  syncStaffPlanWithRole
};

