/**
 * 🏢 Club Settings Service
 * Centralized service for managing club operational settings
 */

import React from 'react';
import { supabase } from '@/lib/supabaseClient';

// Cache for settings to avoid repeated database calls
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch club settings from database with caching
 */
export const getClubSettings = async (forceRefresh = false) => {
  const now = Date.now();
  
  // Return cached settings if still valid and not forcing refresh
  if (!forceRefresh && settingsCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
    return settingsCache;
  }

  try {
    const { data: settings, error } = await supabase
      .from('general_settings')
      .select(`
        allow_online_joining,
        allow_online_upgrades,
        allow_addons_online,
        allow_family_additions_online
      `)
      .single();

    if (error) {
      console.error('Error fetching club settings:', error);
      // Return default settings on error
      return getDefaultSettings();
    }

    // Transform database format to application format
    const clubSettings = {
      allowOnlineJoining: settings?.allow_online_joining ?? true,
      allowOnlineUpgrades: settings?.allow_online_upgrades ?? true,
      allowAddonsOnline: settings?.allow_addons_online ?? true,
      allowFamilyAdditionsOnline: settings?.allow_family_additions_online ?? true,
    };

    // Update cache
    settingsCache = clubSettings;
    cacheTimestamp = now;

    return clubSettings;
  } catch (error) {
    console.error('Failed to fetch club settings:', error);
    return getDefaultSettings();
  }
};

/**
 * Get default club settings (fallback)
 */
export const getDefaultSettings = () => ({
  allowOnlineJoining: true,
  allowOnlineUpgrades: true,
  allowAddonsOnline: true,
  allowFamilyAdditionsOnline: true,
});

/**
 * Check if online membership joining is allowed
 */
export const isOnlineJoiningAllowed = async () => {
  const settings = await getClubSettings();
  return settings.allowOnlineJoining;
};

/**
 * Check if online membership upgrades are allowed
 */
export const isOnlineUpgradesAllowed = async () => {
  const settings = await getClubSettings();
  return settings.allowOnlineUpgrades;
};

/**
 * Check if online add-on purchases are allowed
 */
export const isAddonsOnlineAllowed = async () => {
  const settings = await getClubSettings();
  return settings.allowAddonsOnline;
};

/**
 * Check if online family member additions are allowed
 */
export const isFamilyAdditionsOnlineAllowed = async () => {
  const settings = await getClubSettings();
  return settings.allowFamilyAdditionsOnline;
};

/**
 * Clear settings cache (useful when settings are updated)
 */
export const clearSettingsCache = () => {
  settingsCache = null;
  cacheTimestamp = null;
};

/**
 * Update club settings in database and clear cache
 */
export const updateClubSettings = async (newSettings) => {
  try {
    const { error } = await supabase
      .from('general_settings')
      .upsert({
        allow_online_joining: newSettings.allowOnlineJoining,
        allow_online_upgrades: newSettings.allowOnlineUpgrades,
        allow_addons_online: newSettings.allowAddonsOnline,
        allow_family_additions_online: newSettings.allowFamilyAdditionsOnline,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    // Clear cache to force refresh on next access
    clearSettingsCache();
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update club settings:', error);
    return { success: false, error };
  }
};

/**
 * React hook for club settings (with real-time updates)
 */
export const useClubSettings = () => {
  const [settings, setSettings] = React.useState(getDefaultSettings());
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      const clubSettings = await getClubSettings();
      setSettings(clubSettings);
      setLoading(false);
    };

    loadSettings();

    // Set up real-time subscription for settings changes
    const subscription = supabase
      .channel('club-settings-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'general_settings' 
        }, 
        (payload) => {
          console.log('Club settings updated:', payload);
          // Clear cache and reload settings
          clearSettingsCache();
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { settings, loading, refresh: () => getClubSettings(true) };
};

/**
 * Utility functions for common setting checks
 */
export const clubSettingsUtils = {
  // Check if any online features are disabled
  hasRestrictedOnlineFeatures: async () => {
    const settings = await getClubSettings();
    return !settings.allowOnlineJoining || 
           !settings.allowOnlineUpgrades || 
           !settings.allowAddonsOnline || 
           !settings.allowFamilyAdditionsOnline;
  },

  // Get user-friendly messages for disabled features
  getDisabledFeatureMessage: (feature) => {
    const messages = {
      joining: "Online membership joining is currently disabled. Please contact our staff to set up your membership.",
      upgrades: "Online membership upgrades are currently disabled. Please contact our staff to upgrade your membership.",
      addons: "Online add-on purchases are currently disabled. Please contact our staff to add services to your membership.",
      family: "Online family member additions are currently disabled. Please contact our staff to add family members."
    };
    return messages[feature] || "This feature is currently disabled. Please contact our staff for assistance.";
  },

  // Get contact information for disabled features
  getContactInfo: () => ({
    phone: "(555) 123-4567", // This should come from club settings
    email: "info@momentumgym.com", // This should come from club settings
    hours: "Monday-Friday: 6AM-10PM, Saturday-Sunday: 8AM-8PM" // This should come from club settings
  })
};

export default {
  getClubSettings,
  isOnlineJoiningAllowed,
  isOnlineUpgradesAllowed,
  isAddonsOnlineAllowed,
  isFamilyAdditionsOnlineAllowed,
  clearSettingsCache,
  updateClubSettings,
  useClubSettings,
  clubSettingsUtils
};
