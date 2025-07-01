// Location Management Service
// Handles location creation, configuration, and template management
// Created: June 21, 2025

import { supabase } from '@/lib/supabaseClient';

export class LocationService {
  // ==================== ORGANIZATION MANAGEMENT ====================
  
  /**
   * Get all organizations
   */
  static async getOrganizations() {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return { data: null, error };
    }
  }

  /**
   * Get organization by slug
   */
  static async getOrganizationBySlug(slug) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching organization by slug:', error);
      return { data: null, error };
    }
  }

  // ==================== LOCATION MANAGEMENT ====================

  /**
   * Get all locations for an organization (admin access)
   */
  static async getOrganizationLocations(organizationId, includeInactive = false) {
    try {
      let query = supabase
        .from('locations')
        .select('*')
        .eq('organization_id', organizationId);

      // Only filter by is_active if the column exists and includeInactive is false
      if (!includeInactive) {
        query = query.or('is_active.is.null,is_active.eq.true');
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching organization locations:', error);
      return { data: null, error };
    }
  }

  /**
   * Get accessible locations for a user based on their role and permissions
   */
  static async getUserAccessibleLocations(userId) {
    try {
      // First get the user's profile to check their role and organization
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, organization_id, location_access_level, default_location_id')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      if (!userProfile.organization_id) {
        return { data: [], error: null };
      }

      // If user is admin with global access, return all organization locations
      if (userProfile.role === 'admin' && userProfile.location_access_level === 'global') {
        return await this.getOrganizationLocations(userProfile.organization_id);
      }

      // For staff users with restricted access, get only permitted locations
      if (userProfile.role === 'staff' && userProfile.location_access_level === 'restricted') {
        const { data, error } = await supabase
          .from('locations')
          .select(`
            *,
            staff_location_access!inner(
              access_level,
              is_active
            )
          `)
          .eq('organization_id', userProfile.organization_id)
          .eq('is_active', true)
          .eq('staff_location_access.user_id', userId)
          .eq('staff_location_access.is_active', true)
          .order('name');

        if (error) throw error;
        return { data, error: null };
      }

      // For single location access, return only the default location
      if (userProfile.location_access_level === 'single' && userProfile.default_location_id) {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('id', userProfile.default_location_id)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        return { data: data ? [data] : [], error: null };
      }

      // Fallback: no access
      return { data: [], error: null };
    } catch (error) {
      console.error('Error fetching user accessible locations:', error);
      return { data: null, error };
    }
  }

  /**
   * Get location details with full configuration
   */
  static async getLocationDetails(locationId) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          location_billing_configs(*),
          organizations(name, slug)
        `)
        .eq('id', locationId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching location details:', error);
      return { data: null, error };
    }
  }

  /**
   * Create new location with template or defaults
   */
  static async createLocation(locationData, templateId = null) {
    try {
      const { data, error } = await supabase.rpc(
        'create_location_with_defaults',
        {
          p_organization_id: locationData.organization_id,
          p_name: locationData.name,
          p_slug: locationData.slug,
          p_template_id: templateId
        }
      );

      if (error) throw error;

      // Get the created location with full details
      return await this.getLocationDetails(data);
    } catch (error) {
      console.error('Error creating location:', error);
      return { data: null, error };
    }
  }

  /**
   * Update location basic information
   */
  static async updateLocation(locationId, updates) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', locationId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating location:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a location (soft delete - marks as inactive)
   */
  static async deleteLocation(locationId) {
    try {
      console.log('🗑️ LocationService: Soft deleting location with ID:', locationId);

      const { data, error } = await supabase
        .from('locations')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', locationId)
        .select()
        .single();

      if (error) {
        console.error('🚨 LocationService: Delete error:', error);
        throw error;
      }

      console.log('✅ LocationService: Location soft deleted successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ LocationService: Error deleting location:', error);
      return { data: null, error };
    }
  }

  // ==================== BILLING CONFIGURATION ====================

  /**
   * Update location billing configuration
   */
  static async updateBillingConfig(locationId, config) {
    try {
      const { data, error } = await supabase
        .from('location_billing_configs')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('location_id', locationId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating billing config:', error);
      return { data: null, error };
    }
  }

  /**
   * Get billing configuration for location
   */
  static async getBillingConfig(locationId) {
    try {
      const { data, error } = await supabase
        .from('location_billing_configs')
        .select('*')
        .eq('location_id', locationId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching billing config:', error);
      return { data: null, error };
    }
  }

  // ==================== PAYMENT CONFIGURATION ====================
  // Note: Payment configuration methods disabled until location_payment_configs table is created

  /**
   * Update payment processor configuration (DISABLED - table not found)
   */
  static async updatePaymentConfig(locationId, config) {
    console.warn('Payment configuration disabled - location_payment_configs table not found');
    return { data: null, error: new Error('Payment configuration not available') };
  }

  /**
   * Sanitize payment configuration (remove/encrypt sensitive data)
   */
  static sanitizePaymentConfig(config) {
    const sanitized = { ...config };

    // Remove or encrypt sensitive fields
    const sensitiveFields = [
      'stripe_secret_key',
      'stripe_webhook_secret',
      'square_access_token',
      'square_webhook_signature_key',
      'paypal_client_secret'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        // In production, encrypt these values
        // For now, we'll mark them as encrypted
        sanitized[field] = `[ENCRYPTED:${sanitized[field].substring(0, 4)}***]`;
      }
    });

    return sanitized;
  }

  // ==================== TEMPLATE MANAGEMENT ====================

  /**
   * Get all available location templates
   */
  static async getLocationTemplates(category = null) {
    try {
      let query = supabase
        .from('location_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_momentum_official', { ascending: false })
        .order('usage_count', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching location templates:', error);
      return { data: null, error };
    }
  }

  /**
   * Create new location template
   */
  static async createLocationTemplate(templateData) {
    try {
      const { data, error } = await supabase
        .from('location_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating location template:', error);
      return { data: null, error };
    }
  }

  /**
   * Apply template to existing location
   */
  static async applyTemplateToLocation(locationId, templateId, migrationStrategy = 'new_members_only') {
    try {
      // Get template configuration
      const { data: template, error: templateError } = await supabase
        .from('location_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      // Get current location config
      const { data: currentConfig } = await this.getBillingConfig(locationId);

      // Create migration record
      const { data: migration, error: migrationError } = await supabase
        .from('billing_rule_migrations')
        .insert([{
          location_id: locationId,
          migration_type: 'template_application',
          old_config: currentConfig,
          new_config: template.billing_config_template,
          migration_strategy: migrationStrategy,
          status: 'pending'
        }])
        .select()
        .single();

      if (migrationError) throw migrationError;

      // Apply billing configuration
      await this.updateBillingConfig(locationId, template.billing_config_template);

      // Update migration status
      await supabase
        .from('billing_rule_migrations')
        .update({ 
          status: 'completed',
          executed_at: new Date().toISOString()
        })
        .eq('id', migration.id);

      // Update template usage count
      await supabase
        .from('location_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', templateId);

      return { data: migration, error: null };
    } catch (error) {
      console.error('Error applying template to location:', error);
      return { data: null, error };
    }
  }

  // ==================== MIGRATION MANAGEMENT ====================

  /**
   * Create billing rule migration
   */
  static async createBillingMigration(locationId, migrationData) {
    try {
      const { data, error } = await supabase
        .from('billing_rule_migrations')
        .insert([{
          location_id: locationId,
          ...migrationData,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating billing migration:', error);
      return { data: null, error };
    }
  }

  /**
   * Execute pending migrations for a location
   */
  static async executePendingMigrations(locationId) {
    try {
      const { data: migrations, error } = await supabase
        .from('billing_rule_migrations')
        .select('*')
        .eq('location_id', locationId)
        .eq('status', 'pending')
        .order('created_at');

      if (error) throw error;

      const results = [];
      for (const migration of migrations) {
        try {
          const result = await this.executeMigration(migration);
          results.push(result);
        } catch (migrationError) {
          console.error(`Migration ${migration.id} failed:`, migrationError);
          results.push({ id: migration.id, success: false, error: migrationError });
        }
      }

      return { data: results, error: null };
    } catch (error) {
      console.error('Error executing pending migrations:', error);
      return { data: null, error };
    }
  }

  /**
   * Execute individual migration
   */
  static async executeMigration(migration) {
    try {
      // Update migration status to in_progress
      await supabase
        .from('billing_rule_migrations')
        .update({ status: 'in_progress' })
        .eq('id', migration.id);

      // Apply the new configuration
      await this.updateBillingConfig(migration.location_id, migration.new_config);

      // Handle affected memberships based on strategy
      let affectedCount = 0;
      let grandfatheredCount = 0;

      switch (migration.migration_strategy) {
        case 'apply_to_all':
          // Apply new rules to all existing memberships
          affectedCount = await this.applyRulesToAllMemberships(migration.location_id, migration.new_config);
          break;
        
        case 'grandfather_all':
          // Keep old rules for existing memberships
          grandfatheredCount = await this.grandfatherExistingMemberships(migration.location_id);
          break;
        
        case 'new_members_only':
          // Only apply to new memberships (default behavior)
          break;
        
        case 'selective':
          // Apply to specified memberships only
          if (migration.affected_membership_ids) {
            affectedCount = await this.applyRulesToSelectedMemberships(
              migration.affected_membership_ids, 
              migration.new_config
            );
          }
          break;
      }

      // Update migration with results
      await supabase
        .from('billing_rule_migrations')
        .update({
          status: 'completed',
          executed_at: new Date().toISOString(),
          migrated_memberships: affectedCount,
          grandfathered_memberships: grandfatheredCount
        })
        .eq('id', migration.id);

      return { id: migration.id, success: true, affectedCount, grandfatheredCount };
    } catch (error) {
      // Update migration status to failed
      await supabase
        .from('billing_rule_migrations')
        .update({
          status: 'failed',
          error_log: [{ timestamp: new Date().toISOString(), error: error.message }]
        })
        .eq('id', migration.id);

      throw error;
    }
  }

  // ==================== STAFF LOCATION PERMISSIONS ====================

  /**
   * Grant location access to a staff member
   */
  static async grantLocationAccess(staffUserId, locationId, grantedBy, accessLevel = 'full', notes = '') {
    try {
      // First revoke any existing active access
      await this.revokeLocationAccess(staffUserId, locationId, grantedBy, 'Replaced with new access level');

      // Grant new access
      const { data, error } = await supabase
        .from('staff_location_access')
        .insert([{
          user_id: staffUserId,
          location_id: locationId,
          granted_by: grantedBy,
          access_level: accessLevel,
          notes: notes,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error granting location access:', error);
      return { data: null, error };
    }
  }

  /**
   * Revoke location access from a staff member
   */
  static async revokeLocationAccess(staffUserId, locationId, revokedBy, reason = '') {
    try {
      const { data, error } = await supabase
        .from('staff_location_access')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: revokedBy,
          notes: reason
        })
        .eq('user_id', staffUserId)
        .eq('location_id', locationId)
        .eq('is_active', true)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error revoking location access:', error);
      return { data: null, error };
    }
  }

  /**
   * Get staff location permissions for a specific user
   */
  static async getStaffLocationPermissions(staffUserId) {
    try {
      const { data, error } = await supabase
        .from('staff_location_access')
        .select(`
          *,
          location:locations(*),
          granted_by_user:profiles!staff_location_access_granted_by_fkey(id, name, email),
          revoked_by_user:profiles!staff_location_access_revoked_by_fkey(id, name, email)
        `)
        .eq('user_id', staffUserId)
        .order('granted_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching staff location permissions:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all staff members and their location permissions for an organization
   */
  static async getOrganizationStaffPermissions(organizationId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          role,
          location_access_level,
          default_location_id,
          staff_location_access(
            id,
            location_id,
            access_level,
            is_active,
            granted_at,
            revoked_at,
            notes,
            location:locations(id, name, slug)
          )
        `)
        .eq('organization_id', organizationId)
        .eq('role', 'staff')
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching organization staff permissions:', error);
      return { data: null, error };
    }
  }

  /**
   * Bulk update staff location permissions
   */
  static async bulkUpdateStaffPermissions(updates, updatedBy) {
    try {
      const results = [];

      for (const update of updates) {
        const { staffUserId, locationId, action, accessLevel, notes } = update;

        if (action === 'grant') {
          const result = await this.grantLocationAccess(staffUserId, locationId, updatedBy, accessLevel, notes);
          results.push({ ...update, result });
        } else if (action === 'revoke') {
          const result = await this.revokeLocationAccess(staffUserId, locationId, updatedBy, notes);
          results.push({ ...update, result });
        }
      }

      return { data: results, error: null };
    } catch (error) {
      console.error('Error bulk updating staff permissions:', error);
      return { data: null, error };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate unique location slug
   */
  static async generateLocationSlug(organizationId, baseName) {
    const baseSlug = baseName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data, error } = await supabase
        .from('locations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('slug', slug);

      // If error or no data found, the slug is available
      if (error || !data || data.length === 0) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Validate location slug format
   */
  static validateSlug(slug) {
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(slug);
  }

  /**
   * Get location analytics
   */
  static async getLocationAnalytics(locationId, period = 'monthly') {
    try {
      // This would integrate with the billing analytics table
      // For now, return basic member and revenue metrics

      let memberCount = 0;
      let totalRevenue = 0;

      // Try to get member count - handle if memberships table doesn't exist
      try {
        const { data: memberData } = await supabase
          .from('memberships')
          .select('id', { count: 'exact' })
          .eq('location_id', locationId)
          .eq('status', 'active');

        memberCount = memberData?.length || 0;
      } catch (memberError) {
        console.warn('Memberships table not available for analytics:', memberError.message);
        memberCount = 0;
      }

      // Try to get revenue data from transactions table
      try {
        const { data: revenueData } = await supabase
          .from('transactions')
          .select('total_amount')
          .eq('status', 'completed')
          .gte('created_at', this.getPeriodStartDate(period));

        totalRevenue = revenueData?.reduce((sum, transaction) => sum + parseFloat(transaction.total_amount), 0) || 0;
      } catch (revenueError) {
        console.warn('Transactions table not available for analytics:', revenueError.message);
        totalRevenue = 0;
      }

      return {
        data: {
          member_count: memberCount,
          total_revenue: totalRevenue,
          period
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching location analytics:', error);
      // Return default data instead of null to prevent UI crashes
      return {
        data: {
          member_count: 0,
          total_revenue: 0,
          period
        },
        error: null
      };
    }
  }

  /**
   * Helper to get period start date
   */
  static getPeriodStartDate(period) {
    const now = new Date();
    switch (period) {
      case 'weekly':
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      case 'quarterly':
        return new Date(now.setMonth(now.getMonth() - 3)).toISOString();
      case 'yearly':
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      default:
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
    }
  }
}

export default LocationService;
