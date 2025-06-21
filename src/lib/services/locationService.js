// Location Management Service
// Handles location creation, configuration, and template management
// Created: June 21, 2025

import { supabase } from '@/lib/supabaseClient';

export class LocationService {
  // ==================== LOCATION MANAGEMENT ====================
  
  /**
   * Get all locations for an organization
   */
  static async getOrganizationLocations(organizationId) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          location_billing_configs(*),
          location_payment_configs(*)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching organization locations:', error);
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
          location_payment_configs(*),
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

  /**
   * Update payment processor configuration
   */
  static async updatePaymentConfig(locationId, config) {
    try {
      // Encrypt sensitive data before storing
      const sanitizedConfig = this.sanitizePaymentConfig(config);
      
      const { data, error } = await supabase
        .from('location_payment_configs')
        .update({
          ...sanitizedConfig,
          updated_at: new Date().toISOString()
        })
        .eq('location_id', locationId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating payment config:', error);
      return { data: null, error };
    }
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
      const { data } = await supabase
        .from('locations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('slug', slug)
        .single();

      if (!data) break;

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
      
      const { data: memberCount } = await supabase
        .from('memberships')
        .select('id', { count: 'exact' })
        .eq('location_id', locationId)
        .eq('status', 'active');

      const { data: revenueData } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('location_id', locationId)
        .eq('status', 'paid')
        .gte('created_at', this.getPeriodStartDate(period));

      const totalRevenue = revenueData?.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount), 0) || 0;

      return {
        data: {
          member_count: memberCount?.length || 0,
          total_revenue: totalRevenue,
          period
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching location analytics:', error);
      return { data: null, error };
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
