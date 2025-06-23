import { supabase } from '@/lib/supabaseClient';

export class MultiLocationService {
  
  /**
   * Get multi-location settings from general_settings
   */
  static async getMultiLocationSettings() {
    try {
      const { data, error } = await supabase
        .from('general_settings')
        .select('multi_location_enabled, gym_name, admin_email, contact_phone')
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching multi-location settings:', error);
      return { data: null, error };
    }
  }

  /**
   * Enable or disable multi-location support
   */
  static async toggleMultiLocationSupport(enabled) {
    try {
      const { data, error } = await supabase
        .from('general_settings')
        .update({
          multi_location_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error toggling multi-location support:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all locations
   */
  static async getLocations() {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching locations:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new location
   */
  static async createLocation(locationData) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({
          ...locationData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating location:', error);
      return { data: null, error };
    }
  }

  /**
   * Update a location
   */
  static async updateLocation(locationId, locationData) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .update({
          ...locationData,
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
   * Delete a location
   */
  static async deleteLocation(locationId) {
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting location:', error);
      return { error };
    }
  }

  /**
   * Get location statistics
   */
  static async getLocationStats(locationId) {
    try {
      // Get member count for location
      const { data: memberCount, error: memberError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('location_id', locationId);

      if (memberError) throw memberError;

      // Get staff count for location
      const { data: staffCount, error: staffError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('location_id', locationId)
        .in('role', ['admin', 'staff']);

      if (staffError) throw staffError;

      return {
        data: {
          memberCount: memberCount?.length || 0,
          staffCount: staffCount?.length || 0
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching location stats:', error);
      return { data: null, error };
    }
  }

  /**
   * Migrate existing data to support multi-location
   */
  static async migrateToMultiLocation(primaryLocationData) {
    try {
      // Create the primary location
      const { data: primaryLocation, error: locationError } = await this.createLocation({
        ...primaryLocationData,
        is_primary: true,
        status: 'active'
      });

      if (locationError) throw locationError;

      // Update all existing profiles to belong to the primary location
      const { error: profilesError } = await supabase
        .from('profiles')
        .update({ location_id: primaryLocation.id })
        .is('location_id', null);

      if (profilesError) throw profilesError;

      // Update all existing memberships to belong to the primary location
      const { error: membershipsError } = await supabase
        .from('memberships')
        .update({ location_id: primaryLocation.id })
        .is('location_id', null);

      if (membershipsError) throw membershipsError;

      return { data: primaryLocation, error: null };
    } catch (error) {
      console.error('Error migrating to multi-location:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if multi-location migration is needed
   */
  static async checkMigrationStatus() {
    try {
      // Check if there are any profiles without location_id
      const { data: unmappedProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .is('location_id', null);

      if (profilesError) throw profilesError;

      // Check if there are any locations
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('id', { count: 'exact' });

      if (locationsError) throw locationsError;

      return {
        data: {
          needsMigration: (unmappedProfiles?.length || 0) > 0,
          hasLocations: (locations?.length || 0) > 0,
          unmappedProfilesCount: unmappedProfiles?.length || 0
        },
        error: null
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return { data: null, error };
    }
  }
}

export default MultiLocationService;
