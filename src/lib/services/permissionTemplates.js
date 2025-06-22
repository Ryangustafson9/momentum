/**
 * 📋 PERMISSION TEMPLATES
 * Pre-defined permission sets for common staff roles
 */

export const PERMISSION_TEMPLATES = {
  // ==================== FRONT DESK ROLES ====================
  'front_desk_basic': {
    name: 'Front Desk - Basic',
    description: 'Basic front desk operations with member check-in and basic member management',
    category: 'Front Desk',
    permissions: {
      // Member Management
      'view_members': true,
      'member_checkin': true,
      
      // Class Management
      'view_classes': true,
      
      // Operations
      'manage_equipment': false,
      
      // Financial
      'process_payments': true,
      'manage_billing': false,
      'view_reports': false,
      'view_revenue': false,
      
      // System
      'manage_settings': false,
      'view_logs': false
    }
  },

  'front_desk_advanced': {
    name: 'Front Desk - Advanced',
    description: 'Advanced front desk with member management and basic billing capabilities',
    category: 'Front Desk',
    permissions: {
      // Member Management
      'view_members': true,
      'manage_members': true,
      'member_checkin': true,
      
      // Class Management
      'view_classes': true,
      'manage_schedule': true,
      
      // Operations
      'manage_equipment': true,
      
      // Financial
      'process_payments': true,
      'manage_billing': true,
      'view_reports': true,
      'view_revenue': false,
      
      // System
      'manage_settings': false,
      'view_logs': false
    }
  },

  // ==================== SALES ROLES ====================
  'sales_representative': {
    name: 'Sales Representative',
    description: 'Sales-focused role with lead management and membership sales capabilities',
    category: 'Sales',
    permissions: {
      // Member Management
      'view_members': true,
      'manage_members': true,
      
      // Sales & Marketing
      'lead_management': true,
      'membership_sales': true,
      'tour_scheduling': true,
      'commission_reports': true,
      
      // Financial
      'process_payments': true,
      'view_reports': true,
      'view_revenue': false,
      
      // Class Management
      'view_classes': true,
      
      // System
      'manage_settings': false
    }
  },

  'sales_manager': {
    name: 'Sales Manager',
    description: 'Senior sales role with team oversight and revenue access',
    category: 'Sales',
    permissions: {
      // Member Management
      'view_members': true,
      'manage_members': true,
      
      // Sales & Marketing
      'lead_management': true,
      'membership_sales': true,
      'tour_scheduling': true,
      'commission_reports': true,
      
      // Staff Management
      'view_staff': true,
      'manage_staff': true,
      
      // Financial
      'process_payments': true,
      'manage_billing': true,
      'view_reports': true,
      'view_revenue': true,
      
      // Class Management
      'view_classes': true,
      'manage_classes': true,
      
      // System
      'manage_settings': false
    }
  },

  // ==================== FITNESS ROLES ====================
  'fitness_instructor': {
    name: 'Fitness Instructor',
    description: 'Group fitness instructor with class management and member training',
    category: 'Fitness',
    permissions: {
      // Member Management
      'view_members': true,
      'member_checkin': true,
      
      // Class Management
      'view_classes': true,
      'manage_classes': true,
      'manage_schedule': true,
      'track_attendance': true,
      
      // Training & Fitness
      'program_design': true,
      'fitness_assessments': true,
      
      // Operations
      'manage_equipment': true,
      
      // Financial
      'view_reports': false,
      'commission_reports': true
    }
  },

  'personal_trainer': {
    name: 'Personal Trainer',
    description: 'One-on-one training specialist with client management capabilities',
    category: 'Fitness',
    permissions: {
      // Member Management
      'view_members': true,
      'manage_members': true,
      
      // Training & Fitness
      'client_management': true,
      'program_design': true,
      'fitness_assessments': true,
      'nutrition_guidance': true,
      
      // Class Management
      'view_classes': true,
      'manage_schedule': true,
      'track_attendance': true,
      
      // Operations
      'manage_equipment': true,
      
      // Financial
      'commission_reports': true,
      'view_reports': false
    }
  },

  'fitness_manager': {
    name: 'Fitness Manager',
    description: 'Fitness department manager with comprehensive fitness and staff oversight',
    category: 'Management',
    permissions: {
      // Member Management
      'view_members': true,
      'manage_members': true,
      
      // Staff Management
      'view_staff': true,
      'manage_staff': true,
      
      // Training & Fitness
      'client_management': true,
      'program_design': true,
      'fitness_assessments': true,
      'nutrition_guidance': true,
      
      // Class Management
      'view_classes': true,
      'manage_classes': true,
      'manage_schedule': true,
      'track_attendance': true,
      
      // Operations
      'manage_equipment': true,
      
      // Financial
      'view_reports': true,
      'commission_reports': true,
      'view_revenue': false,
      
      // System
      'manage_settings': false
    }
  },

  // ==================== MANAGEMENT ROLES ====================
  'assistant_manager': {
    name: 'Assistant Manager',
    description: 'Assistant management role with operational oversight',
    category: 'Management',
    permissions: {
      // Member Management
      'view_members': true,
      'manage_members': true,
      'impersonate_members': true,
      
      // Staff Management
      'view_staff': true,
      'manage_staff': true,
      
      // Class Management
      'view_classes': true,
      'manage_classes': true,
      'manage_schedule': true,
      'track_attendance': true,
      
      // Financial
      'process_payments': true,
      'manage_billing': true,
      'view_reports': true,
      'view_revenue': true,
      
      // Operations
      'manage_equipment': true,
      
      // Sales
      'lead_management': true,
      'membership_sales': true,
      'commission_reports': true,
      
      // System
      'manage_settings': false,
      'view_logs': true
    }
  },

  'general_manager': {
    name: 'General Manager',
    description: 'Full facility management with comprehensive system access',
    category: 'Management',
    permissions: {
      // Member Management
      'view_members': true,
      'manage_members': true,
      'impersonate_members': true,
      
      // Staff Management
      'view_staff': true,
      'manage_staff': true,
      'assign_roles': true,
      
      // Class Management
      'view_classes': true,
      'manage_classes': true,
      'manage_schedule': true,
      'track_attendance': true,
      
      // Financial
      'process_payments': true,
      'manage_billing': true,
      'view_reports': true,
      'view_revenue': true,
      
      // Operations
      'manage_equipment': true,
      
      // Sales
      'lead_management': true,
      'membership_sales': true,
      'commission_reports': true,
      
      // Training
      'client_management': true,
      'program_design': true,
      'fitness_assessments': true,
      'nutrition_guidance': true,
      
      // System
      'manage_settings': true,
      'view_logs': true
    }
  }
};

// ==================== TEMPLATE CATEGORIES ====================

export const TEMPLATE_CATEGORIES = {
  'Front Desk': {
    color: 'blue',
    icon: 'Users',
    description: 'Front desk and reception roles'
  },
  'Sales': {
    color: 'green',
    icon: 'TrendingUp',
    description: 'Sales and marketing positions'
  },
  'Fitness': {
    color: 'orange',
    icon: 'Dumbbell',
    description: 'Fitness and training roles'
  },
  'Management': {
    color: 'purple',
    icon: 'Crown',
    description: 'Management and supervisory positions'
  }
};

// ==================== TEMPLATE UTILITIES ====================

/**
 * Get all permission templates grouped by category
 */
export const getPermissionTemplates = () => {
  const grouped = {};

  Object.entries(PERMISSION_TEMPLATES).forEach(([key, template]) => {
    const category = template.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push({
      key,
      ...template
    });
  });

  return grouped;
};

/**
 * Get a specific permission template
 */
export const getPermissionTemplate = (templateKey) => {
  return PERMISSION_TEMPLATES[templateKey];
};

/**
 * Apply a permission template to a role
 */
export const applyPermissionTemplate = (templateKey) => {
  const template = PERMISSION_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Permission template '${templateKey}' not found`);
  }

  return {
    name: template.name,
    description: template.description,
    permissions: { ...template.permissions }
  };
};

/**
 * Get template suggestions based on role name
 */
export const getTemplateSuggestions = (roleName) => {
  const name = roleName.toLowerCase();
  const suggestions = [];

  // Front desk suggestions
  if (name.includes('front') || name.includes('desk') || name.includes('reception')) {
    suggestions.push('front_desk_basic', 'front_desk_advanced');
  }

  // Sales suggestions
  if (name.includes('sales') || name.includes('marketing')) {
    suggestions.push('sales_representative', 'sales_manager');
  }

  // Fitness suggestions
  if (name.includes('trainer') || name.includes('fitness') || name.includes('instructor')) {
    suggestions.push('personal_trainer', 'fitness_instructor', 'fitness_manager');
  }

  // Management suggestions
  if (name.includes('manager') || name.includes('supervisor') || name.includes('director')) {
    suggestions.push('assistant_manager', 'general_manager');
  }

  return suggestions.map(key => ({
    key,
    ...PERMISSION_TEMPLATES[key]
  }));
};

/**
 * Compare current permissions with template
 */
export const compareWithTemplate = (currentPermissions, templateKey) => {
  const template = getPermissionTemplate(templateKey);
  if (!template) return null;

  const templatePermissions = template.permissions;
  const missing = [];
  const extra = [];
  const matching = [];

  // Find missing permissions
  Object.keys(templatePermissions).forEach(perm => {
    if (templatePermissions[perm] && !currentPermissions[perm]) {
      missing.push(perm);
    } else if (templatePermissions[perm] && currentPermissions[perm]) {
      matching.push(perm);
    }
  });

  // Find extra permissions
  Object.keys(currentPermissions).forEach(perm => {
    if (currentPermissions[perm] && !templatePermissions[perm]) {
      extra.push(perm);
    }
  });

  return {
    template: template.name,
    missing,
    extra,
    matching,
    matchPercentage: Math.round((matching.length / Object.keys(templatePermissions).length) * 100)
  };
};

export default {
  PERMISSION_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getPermissionTemplates,
  getPermissionTemplate,
  applyPermissionTemplate,
  getTemplateSuggestions,
  compareWithTemplate
};

