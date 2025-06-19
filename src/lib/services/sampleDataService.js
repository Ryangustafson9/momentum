/**
 * 🎯 SAMPLE DATA SERVICE
 * Create sample staff plans and roles for testing permissions system
 */

import { supabase } from '@/lib/supabaseClient';

// ==================== SAMPLE STAFF PLANS DATA ====================

const SAMPLE_STAFF_PLANS = [
  {
    name: 'Front Desk Staff',
    description: 'Front desk operations and member check-in services',
    category: 'Staff',
    price: 0.00,
    billing_type: 'monthly',
    duration_months: 1,
    features: [
      'Member check-in/check-out',
      'Basic member information access',
      'Schedule viewing',
      'Payment processing',
      'Guest registration'
    ],
    available_for_sale: false,
    available_online: false,
    color: 'from-blue-500 to-blue-600',
    role_permissions: {
      'view_members': true,
      'member_checkin': true,
      'view_classes': true,
      'process_payments': true,
      'manage_billing': false,
      'view_reports': false
    }
  },
  {
    name: 'Sales Representative',
    description: 'Membership sales and lead management specialist',
    category: 'Staff',
    price: 0.00,
    billing_type: 'monthly',
    duration_months: 1,
    features: [
      'Lead management',
      'Tour scheduling',
      'Membership sales',
      'Follow-up tracking',
      'Commission reporting'
    ],
    available_for_sale: false,
    available_online: false,
    color: 'from-green-500 to-green-600',
    role_permissions: {
      'view_members': true,
      'manage_members': true,
      'lead_management': true,
      'membership_sales': true,
      'tour_scheduling': true,
      'commission_reports': true,
      'process_payments': true,
      'view_reports': true
    }
  },
  {
    name: 'Fitness Instructor',
    description: 'Group fitness classes and member training',
    category: 'Staff',
    price: 0.00,
    billing_type: 'monthly',
    duration_months: 1,
    features: [
      'Class instruction',
      'Member training',
      'Schedule management',
      'Attendance tracking',
      'Equipment management'
    ],
    available_for_sale: false,
    available_online: false,
    color: 'from-orange-500 to-orange-600',
    role_permissions: {
      'view_members': true,
      'member_checkin': true,
      'view_classes': true,
      'manage_classes': true,
      'manage_schedule': true,
      'track_attendance': true,
      'program_design': true,
      'manage_equipment': true
    }
  },
  {
    name: 'Personal Trainer',
    description: 'One-on-one training and client management',
    category: 'Staff',
    price: 0.00,
    billing_type: 'monthly',
    duration_months: 1,
    features: [
      'Personal training sessions',
      'Client management',
      'Program design',
      'Fitness assessments',
      'Nutrition guidance'
    ],
    available_for_sale: false,
    available_online: false,
    color: 'from-purple-500 to-purple-600',
    role_permissions: {
      'view_members': true,
      'manage_members': true,
      'client_management': true,
      'program_design': true,
      'fitness_assessments': true,
      'nutrition_guidance': true,
      'manage_schedule': true,
      'track_attendance': true,
      'commission_reports': true
    }
  },
  {
    name: 'Fitness Manager',
    description: 'Fitness department management and oversight',
    category: 'Staff',
    price: 0.00,
    billing_type: 'monthly',
    duration_months: 1,
    features: [
      'Department management',
      'Staff oversight',
      'Program development',
      'Equipment management',
      'Performance tracking'
    ],
    available_for_sale: false,
    available_online: false,
    color: 'from-indigo-500 to-indigo-600',
    role_permissions: {
      'view_members': true,
      'manage_members': true,
      'view_staff': true,
      'manage_staff': true,
      'client_management': true,
      'program_design': true,
      'fitness_assessments': true,
      'nutrition_guidance': true,
      'view_classes': true,
      'manage_classes': true,
      'manage_schedule': true,
      'track_attendance': true,
      'manage_equipment': true,
      'view_reports': true,
      'commission_reports': true
    }
  },
  {
    name: 'General Manager',
    description: 'Full facility management with comprehensive access',
    category: 'Staff',
    price: 0.00,
    billing_type: 'monthly',
    duration_months: 1,
    features: [
      'Full facility management',
      'Staff management',
      'Financial oversight',
      'System administration',
      'Strategic planning'
    ],
    available_for_sale: false,
    available_online: false,
    color: 'from-red-500 to-red-600',
    role_permissions: {
      'view_members': true,
      'manage_members': true,
      'impersonate_members': true,
      'view_staff': true,
      'manage_staff': true,
      'assign_roles': true,
      'view_classes': true,
      'manage_classes': true,
      'manage_schedule': true,
      'track_attendance': true,
      'process_payments': true,
      'manage_billing': true,
      'view_reports': true,
      'view_revenue': true,
      'manage_equipment': true,
      'lead_management': true,
      'membership_sales': true,
      'commission_reports': true,
      'client_management': true,
      'program_design': true,
      'fitness_assessments': true,
      'nutrition_guidance': true,
      'manage_settings': true,
      'view_logs': true
    }
  }
];

// ==================== SAMPLE DATA CREATION FUNCTIONS ====================

/**
 * Create sample staff plans with associated roles
 */
export const createSampleStaffPlans = async () => {
  try {
    console.log('🏗️ Creating sample staff plans...');
    
    const results = {
      created: [],
      errors: [],
      total: SAMPLE_STAFF_PLANS.length
    };

    for (const planData of SAMPLE_STAFF_PLANS) {
      try {
        // 1. Create staff role first
        const roleId = `role_${planData.name.toLowerCase().replace(/\s+/g, '_')}`;
        
        const { data: existingRole } = await supabase
          .from('staff_roles')
          .select('id')
          .eq('id', roleId)
          .single();

        if (!existingRole) {
          const { error: roleError } = await supabase
            .from('staff_roles')
            .insert({
              id: roleId,
              name: planData.name,
              description: planData.description,
              permissions: planData.role_permissions,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (roleError) {
            console.error(`❌ Error creating role for ${planData.name}:`, roleError);
            results.errors.push({ plan: planData.name, error: roleError.message });
            continue;
          }
          
          console.log(`✅ Created role: ${roleId}`);
        }

        // 2. Create staff plan with role_id
        const { data: existingPlan } = await supabase
          .from('membership_types')
          .select('id')
          .eq('name', planData.name)
          .eq('category', 'Staff')
          .single();

        if (!existingPlan) {
          const { data: newPlan, error: planError } = await supabase
            .from('membership_types')
            .insert({
              name: planData.name,
              description: planData.description,
              category: planData.category,
              price: planData.price,
              billing_type: planData.billing_type,
              duration_months: planData.duration_months,
              features: planData.features,
              available_for_sale: planData.available_for_sale,
              available_online: planData.available_online,
              color: planData.color,
              role_id: roleId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (planError) {
            console.error(`❌ Error creating plan ${planData.name}:`, planError);
            results.errors.push({ plan: planData.name, error: planError.message });
            continue;
          }

          console.log(`✅ Created staff plan: ${planData.name}`);
          results.created.push({
            plan: newPlan,
            role: roleId
          });
        } else {
          console.log(`ℹ️ Staff plan already exists: ${planData.name}`);
        }

      } catch (error) {
        console.error(`❌ Error processing ${planData.name}:`, error);
        results.errors.push({ plan: planData.name, error: error.message });
      }
    }

    console.log('🎉 Sample staff plans creation completed:', results);
    return results;

  } catch (error) {
    console.error('❌ Error creating sample staff plans:', error);
    throw error;
  }
};

/**
 * Check if sample staff plans exist
 */
export const checkSampleStaffPlansExist = async () => {
  try {
    const { data, error } = await supabase
      .from('membership_types')
      .select('id, name, role_id')
      .eq('category', 'Staff');

    if (error) {
      throw error;
    }

    return {
      exist: data && data.length > 0,
      count: data?.length || 0,
      plans: data || []
    };
  } catch (error) {
    console.error('Error checking sample staff plans:', error);
    return { exist: false, count: 0, plans: [] };
  }
};

/**
 * Delete all sample staff plans and roles
 */
export const deleteSampleStaffPlans = async () => {
  try {
    console.log('🗑️ Deleting sample staff plans...');

    // Get all staff plans
    const { data: staffPlans } = await supabase
      .from('membership_types')
      .select('id, name, role_id')
      .eq('category', 'Staff');

    if (!staffPlans || staffPlans.length === 0) {
      return { deleted: 0, message: 'No staff plans to delete' };
    }

    // Delete staff plans
    const { error: plansError } = await supabase
      .from('membership_types')
      .delete()
      .eq('category', 'Staff');

    if (plansError) {
      throw plansError;
    }

    // Delete associated roles
    const roleIds = staffPlans.map(plan => plan.role_id).filter(Boolean);
    if (roleIds.length > 0) {
      const { error: rolesError } = await supabase
        .from('staff_roles')
        .delete()
        .in('id', roleIds);

      if (rolesError) {
        console.warn('Error deleting roles:', rolesError);
      }
    }

    console.log(`✅ Deleted ${staffPlans.length} staff plans and ${roleIds.length} roles`);
    return { 
      deleted: staffPlans.length, 
      message: `Deleted ${staffPlans.length} staff plans and ${roleIds.length} roles` 
    };

  } catch (error) {
    console.error('❌ Error deleting sample staff plans:', error);
    throw error;
  }
};

export default {
  createSampleStaffPlans,
  checkSampleStaffPlansExist,
  deleteSampleStaffPlans
};
