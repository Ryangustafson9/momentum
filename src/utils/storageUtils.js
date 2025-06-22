/**
 * Centralized browser storage utilities
 */

export const storage = {
  // Local Storage
  local: {
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        
      }
    },

    get: (key, defaultValue = null) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        
        return defaultValue;
      }
    },

    remove: (key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        
      }
    },

    clear: () => {
      try {
        localStorage.clear();
      } catch (error) {
        
      }
    }
  },

  // Session Storage
  session: {
    set: (key, value) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        
      }
    },

    get: (key, defaultValue = null) => {
      try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        
        return defaultValue;
      }
    },

    remove: (key) => {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        
      }
    },

    clear: () => {
      try {
        sessionStorage.clear();
      } catch (error) {
        
      }
    }
  }
};

// App-specific storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'momentum_user_preferences',
  DASHBOARD_CONFIG: 'momentum_dashboard_config',
  THEME: 'momentum_theme',
  RECENT_SEARCHES: 'momentum_recent_searches',
  FORM_DRAFTS: 'momentum_form_drafts'
};

export default storage;

