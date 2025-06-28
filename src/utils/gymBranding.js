import { supabase } from '@/lib/supabaseClient';
import { brandingService } from '@/services/brandingService';

// Cache for performance
let cachedSettings = {
  gym_name: 'Momentum Fitness',
  contact_email: 'info@momentumfitness.com',
  contact_phone: '(555) 123-4567',
  address: '',
  website: '',
  online_joining_enabled: true,
  logo_url: ''
};

// Cache for branding data
let cachedBranding = null;

// Get gym name from branding service
export const getGymName = async () => {
  try {
    if (!cachedBranding) {
      cachedBranding = await brandingService.getBranding();
    }
    return cachedBranding.clubName || 'Momentum Fitness';
  } catch (error) {
    console.warn('Failed to load gym name from branding service:', error);
    return 'Momentum Fitness';
  }
};

// Synchronous version for immediate use (uses cache)
export const getGymNameSync = () => {
  return cachedBranding?.clubName || cachedSettings.gym_name || 'Momentum Fitness';
};

// Get gym logo from branding service
export const getGymLogo = async () => {
  try {
    if (!cachedBranding) {
      cachedBranding = await brandingService.getBranding();
    }
    return cachedBranding.logoUrl || `${import.meta.env.BASE_URL}assets/momentum-logo.svg`;
  } catch (error) {
    console.warn('Failed to load gym logo from branding service:', error);
    return `${import.meta.env.BASE_URL}assets/momentum-logo.svg`;
  }
};

// Synchronous version for immediate use (uses cache)
export const getGymLogoSync = () => {
  return cachedBranding?.logoUrl || cachedSettings.logo_url || `${import.meta.env.BASE_URL}assets/momentum-logo.svg`;
};

// Get contact information
export const getContactInfo = () => {
  return {
    email: cachedSettings.contact_email,
    phone: cachedSettings.contact_phone,
    address: cachedSettings.address,
    website: cachedSettings.website
  };
};

// Get operational settings
export const getOperationalSettings = () => {
  return {
    online_joining_enabled: cachedSettings.online_joining_enabled
  };
};

// Load all settings from database
export const loadGymSettings = async () => {
  try {
    // Load general settings
    const { data: settings, error } = await supabase
      .from('general_settings')
      .select('*')
      .single();

    if (!error && settings) {
      // Update cache with database values
      cachedSettings = {
        gym_name: settings.gym_name || 'Momentum Fitness',
        contact_email: settings.contact_email || 'info@momentumfitness.com',
        contact_phone: settings.contact_phone || '(555) 123-4567',
        address: settings.address || '',
        website: settings.website || '',
        online_joining_enabled: settings.online_joining_enabled !== false,
        logo_url: settings.logo_url || ''
      };
    }

    // Load branding data
    try {
      cachedBranding = await brandingService.getBranding();
      // Override gym_name and logo_url with branding data if available
      if (cachedBranding.clubName) {
        cachedSettings.gym_name = cachedBranding.clubName;
      }
      if (cachedBranding.logoUrl) {
        cachedSettings.logo_url = cachedBranding.logoUrl;
      }
    } catch (brandingError) {
      console.warn('Failed to load branding data:', brandingError);
    }

  } catch (error) {
    console.warn('Failed to load gym settings:', error);
  }

  return cachedSettings;
};

// Initialize gym branding (call this on app start and after settings changes)
export const initializeGymBranding = async () => {
  await loadGymSettings();

  // Optional: Update document title
  if (typeof document !== 'undefined') {
    document.title = `${cachedSettings.gym_name} - Management System`;
  }

  return { ...cachedSettings, branding: cachedBranding };
};

// Force refresh branding cache
export const refreshBrandingCache = async () => {
  cachedBranding = null;
  return await loadGymSettings();
};

// Get current cached settings (synchronous)
export const getCachedSettings = () => {
  return { ...cachedSettings };
};

// Gym color scheme (for future customization)
export const getGymColors = () => {
  return {
    primary: '#4f46e5', // Indigo
    secondary: '#7c3aed', // Purple
    accent: '#ec4899', // Pink
  };
};

// Utility to check if a feature is enabled
export const isFeatureEnabled = (featureName) => {
  switch (featureName) {
    case 'online_joining':
      return cachedSettings.online_joining_enabled;
    default:
      return false;
  }
};

