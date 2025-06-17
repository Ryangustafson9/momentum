// Settings utility functions
import { supabase } from '@/lib/supabaseClient';

/**
 * Get general settings from the database
 * @returns {Promise<Object>} Settings object
 */
export const getGeneralSettings = async () => {
  try {
    // For now, return default settings since we don't have a settings table yet
    // This can be expanded later to fetch from a database table
    return {
      NonmemberSignupPrompt: false, // Default to false
      // Add other settings as needed
    };
  } catch (error) {
    console.error('Error fetching general settings:', error);
    // Return default settings on error
    return {
      NonmemberSignupPrompt: false,
    };
  }
};

/**
 * Update general settings in the database
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Updated settings
 */
export const updateGeneralSettings = async (settings) => {
  try {
    // For now, just return the settings since we don't have a settings table yet
    // This can be expanded later to update a database table
    console.log('Settings would be updated:', settings);
    return settings;
  } catch (error) {
    console.error('Error updating general settings:', error);
    throw error;
  }
};

/**
 * Get a specific setting value
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if setting not found
 * @returns {Promise<any>} Setting value
 */
export const getSetting = async (key, defaultValue = null) => {
  try {
    const settings = await getGeneralSettings();
    return settings[key] !== undefined ? settings[key] : defaultValue;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Set a specific setting value
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @returns {Promise<Object>} Updated settings
 */
export const setSetting = async (key, value) => {
  try {
    const currentSettings = await getGeneralSettings();
    const updatedSettings = {
      ...currentSettings,
      [key]: value,
    };
    return await updateGeneralSettings(updatedSettings);
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
};
