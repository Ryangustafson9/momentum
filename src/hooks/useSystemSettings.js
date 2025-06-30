import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook to manage system settings and feature flags
 * Provides access to various system configuration options
 */
export const useSystemSettings = () => {
  const [settings, setSettings] = useState({
    multi_location_enabled: false,
    online_joining_enabled: true,
    electronic_agreements_enabled: true,
    pos_integration_enabled: false,
    advanced_reporting_enabled: true,
    // Add more settings as needed
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to fetch from system_settings table
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is fine for optional settings
        throw settingsError;
      }

      // If we have settings data, merge with defaults
      if (settingsData) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...settingsData
        }));
      }
      // If no settings found, use defaults (already set in state)

    } catch (err) {
      console.warn('Error fetching system settings, using defaults:', err);
      setError(err);
      // Keep default settings on error
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      // Optimistically update local state
      setSettings(prev => ({ ...prev, [key]: value }));

      // Try to update in database
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          id: 1, // Single row for system settings
          [key]: value,
          updated_at: new Date().toISOString()
        });

      if (error) {
        // Revert optimistic update on error
        setSettings(prev => ({ ...prev, [key]: !value }));
        throw error;
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating system setting:', err);
      return { success: false, error: err };
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSetting,
    refetch: fetchSettings,
    
    // Convenience getters for common settings
    isMultiLocationEnabled: settings.multi_location_enabled,
    isOnlineJoiningEnabled: settings.online_joining_enabled,
    isElectronicAgreementsEnabled: settings.electronic_agreements_enabled,
    isPosIntegrationEnabled: settings.pos_integration_enabled,
    isAdvancedReportingEnabled: settings.advanced_reporting_enabled,
  };
};

/**
 * Lightweight hook for just checking if multi-location is enabled
 * Use this when you only need the multi-location status
 */
export const useMultiLocationEnabled = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMultiLocationStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('multi_location_enabled')
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        // Default to false if no settings found
        setIsEnabled(data?.multi_location_enabled || false);
      } catch (err) {
        console.warn('Error checking multi-location status, defaulting to false:', err);
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkMultiLocationStatus();
  }, []);

  return { isEnabled, isLoading };
};

export default useSystemSettings;
