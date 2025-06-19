import { supabase } from '@/lib/supabaseClient';

// Cache for performance
let cachedSettings = {
  gym_name: 'Nordic Fitness',
  contact_email: 'info@nordicfitness.com',
  contact_phone: '(555) 123-4567',
  address: '',
  website: '',
  online_joining_enabled: true,
  logo_url: '' // Add logo support
};

// Get gym name
export const getGymName = () => {
  return 'Nordic Fitness';
};

// Get gym logo (ADD THIS MISSING EXPORT)
export const getGymLogo = () => {
  // Fixed: Use correct case-sensitive filename
  return `${import.meta.env.BASE_URL}assets/NordicFitness.png`;
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
    console.log('🔄 Loading gym settings from database...');
    
    const { data: settings, error } = await supabase
      .from('general_settings')
      .select('*')
      .single();

    if (!error && settings) {
      // Update cache with database values
      cachedSettings = {
        gym_name: settings.gym_name || 'Nordic Fitness',
        contact_email: settings.contact_email || 'info@nordicfitness.com',
        contact_phone: settings.contact_phone || '(555) 123-4567',
        address: settings.address || '',
        website: settings.website || '',
        online_joining_enabled: settings.online_joining_enabled !== false,
        logo_url: settings.logo_url || '' // Add logo support
      };
      
      console.log('✅ Gym settings loaded:', cachedSettings);
    } else {
      console.log('⚠️ No settings found, using defaults');
    }
  } catch (error) {
    console.error('❌ Error loading gym settings:', error);
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
  
  return cachedSettings;
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
