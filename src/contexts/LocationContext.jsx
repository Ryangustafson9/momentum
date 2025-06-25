// Location Context
// Manages current location context for multi-location support
// Created: June 21, 2025
// Note: Hook renamed to useLocationContext to avoid conflict with react-router-dom's useLocation

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LocationService from '@/lib/services/locationService';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabaseClient';

const LocationContext = createContext();

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract location slug from URL
  const getLocationSlugFromUrl = () => {
    const pathname = location.pathname;

    // Don't treat direct admin/staff-portal/member-portal routes as having location slugs
    if (pathname.startsWith('/admin/') || pathname.startsWith('/staff-portal/') || pathname.startsWith('/member-portal/')) {
      return null;
    }

    // Support patterns like: /main-location/staff-portal/dashboard or /main-location/staff-portal/adminpanel
    const matches = pathname.match(/^\/([^\/]+)\/(?:staff-portal|member-portal|admin)/);
    return matches ? matches[1] : null;
  };

  // Get club subdomain from hostname
  const getClubSubdomain = () => {
    const hostname = window.location.hostname;
    // Extract subdomain from patterns like: vanguard.momentum.pro
    if (hostname.includes('.momentum.pro')) {
      return hostname.split('.momentum.pro')[0];
    }
    // For development (localhost), return default
    return 'momentum';
  };

  // Load available locations for user's organization
  useEffect(() => {
    if (user?.organization_id) {
      checkMultiLocationAndLoadLocations();
    } else {
      // No user organization, default to single-location mode
      setAvailableLocations([]);
      setCurrentLocation(null);
      setLoading(false);
    }
  }, [user?.organization_id]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('LocationContext loading timeout, defaulting to single-location mode');
        setAvailableLocations([]);
        setCurrentLocation(null);
        setLoading(false);
        setError(null);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  // Set current location based on URL
  useEffect(() => {
    const locationSlug = getLocationSlugFromUrl();
    if (locationSlug && availableLocations.length > 0) {
      const foundLocation = availableLocations.find(loc => loc.slug === locationSlug);
      if (foundLocation) {
        setCurrentLocation(foundLocation);
      } else {
        // Location not found, redirect to first available location or show error
        handleLocationNotFound(locationSlug);
      }
    } else if (availableLocations.length > 0 && !currentLocation) {
      // No location in URL, set to first available location
      setCurrentLocation(availableLocations[0]);
    }
  }, [location.pathname, availableLocations]);

  const checkMultiLocationAndLoadLocations = async () => {
    setLoading(true);
    setError(null);

    try {
      // First check if multi-location is enabled
      const { MultiLocationService } = await import('@/services/multiLocationService');
      const { data: settings, error: settingsError } = await MultiLocationService.getMultiLocationSettings();

      if (settingsError || !settings) {
        console.warn('Could not load multi-location settings, assuming single-location mode:', settingsError);
        // If we can't load settings, assume single-location mode
        setAvailableLocations([]);
        setCurrentLocation(null);
        setLoading(false);
        return;
      }

      // If multi-location is not enabled (or null/undefined), don't load locations
      if (!settings.multi_location_enabled) {
        console.log('Multi-location is disabled or not configured, using single-location mode');
        setAvailableLocations([]);
        setCurrentLocation(null);
        setLoading(false);
        return;
      }

      // Multi-location is enabled, load locations
      console.log('Multi-location is enabled, loading locations...');
      await loadAvailableLocations();
    } catch (err) {
      console.error('Error checking multi-location status:', err);
      // On any error, default to single-location mode
      setAvailableLocations([]);
      setCurrentLocation(null);
      setError(null); // Don't show error for this, just default to single-location
      setLoading(false);
    }
  };

  const loadAvailableLocations = async () => {
    try {
      // Use role-based location access instead of organization-wide access
      const result = await LocationService.getUserAccessibleLocations(user.id);

      if (result.error) {
        throw new Error('Failed to load accessible locations');
      }

      const locations = result.data || [];
      setAvailableLocations(locations);

      // Set current location based on user preferences and available locations
      if (locations.length > 0) {
        let selectedLocation = null;

        // Priority 1: User's last accessed location (if still accessible)
        if (user.last_accessed_location_id) {
          selectedLocation = locations.find(loc => loc.id === user.last_accessed_location_id);
        }

        // Priority 2: User's default location (if still accessible)
        if (!selectedLocation && user.default_location_id) {
          selectedLocation = locations.find(loc => loc.id === user.default_location_id);
        }

        // Priority 3: Primary location of the organization
        if (!selectedLocation) {
          selectedLocation = locations.find(loc => loc.is_primary);
        }

        // Priority 4: First available location
        if (!selectedLocation) {
          selectedLocation = locations[0];
        }

        setCurrentLocation(selectedLocation);
      } else {
        setCurrentLocation(null);
      }
    } catch (err) {
      console.error('Error loading available locations:', err);
      setError(err.message);
    }
  };

  const handleLocationNotFound = (slug) => {
    console.warn(`Location with slug "${slug}" not found`);
    setError(`Location "${slug}" not found or not accessible`);
    
    // Redirect to first available location if exists
    if (availableLocations.length > 0) {
      switchLocation(availableLocations[0].slug);
    } else {
      // No locations available, redirect to location selection or error page
      navigate('/no-locations');
    }
  };

  const switchLocation = async (locationSlug) => {
    const targetLocation = availableLocations.find(loc => loc.slug === locationSlug);

    if (!targetLocation) {
      console.error(`Cannot switch to location: ${locationSlug} not found`);
      setError(`Location "${locationSlug}" not found`);
      return false;
    }

    // Check if user has access to this location
    if (!isLocationAccessible(targetLocation.id)) {
      console.error(`User does not have access to location: ${locationSlug}`);
      setError(`Access denied to location: ${targetLocation.name}`);

      // For staff users, provide helpful message
      if (user?.role === 'staff') {
        setError(`Access denied to ${targetLocation.name}. Contact your administrator to request access.`);
      }

      return false;
    }

    // Clear any previous errors
    setError(null);

    // Update current location
    setCurrentLocation(targetLocation);

    // Update user's last accessed location in the database
    try {
      await supabase
        .from('profiles')
        .update({ last_accessed_location_id: targetLocation.id })
        .eq('id', user.id);
    } catch (error) {
      console.warn('Failed to update last accessed location:', error);
      // Don't block the location switch for this
    }

    // Update URL to reflect location change
    const currentPath = location.pathname;
    const newPath = updateUrlWithLocation(currentPath, locationSlug);

    if (newPath !== currentPath) {
      navigate(newPath, { replace: true });
    }

    return true;
  };

  const updateUrlWithLocation = (currentPath, locationSlug) => {
    // Replace existing location in URL or add it
    // Patterns:
    // /old-location/staff-portal/dashboard -> /new-location/staff-portal/dashboard
    // /old-location/admin/adminpanel -> /new-location/admin/adminpanel
    // /admin/adminpanel -> /new-location/admin/adminpanel



    // Check if path already has a location prefix
    const hasLocationPrefix = /^\/[^\/]+\/(?:staff-portal|member-portal|admin)/.test(currentPath);

    if (hasLocationPrefix) {
      // Remove existing location from path
      const pathWithoutLocation = currentPath.replace(/^\/[^\/]+\/(?=(?:staff-portal|member-portal|admin))/, '/');
      return `/${locationSlug}${pathWithoutLocation}`;
    } else {
      // Add location prefix to path that doesn't have one
      return `/${locationSlug}${currentPath}`;
    }
  };

  const getLocationUrl = (locationSlug, path = '/staff-portal/dashboard') => {
    // For multi-location: /location-slug/staff-portal/dashboard
    // For single location: /staff-portal/dashboard
    if (availableLocations.length > 1) {
      return `/${locationSlug}${path}`;
    }
    return path;
  };

  const isLocationAccessible = (locationId) => {
    // Check if user has access to this location based on their available locations
    // This respects the role-based access control system
    return availableLocations.some(loc => loc.id === locationId);
  };

  const getUserLocationPermissions = async () => {
    try {
      if (user.role === 'admin') {
        return {
          hasGlobalAccess: user.location_access_level === 'global',
          accessLevel: user.location_access_level,
          accessibleLocationIds: availableLocations.map(loc => loc.id)
        };
      }

      const result = await LocationService.getStaffLocationPermissions(user.id);
      if (result.error) throw result.error;

      const activePermissions = result.data?.filter(perm => perm.is_active) || [];
      return {
        hasGlobalAccess: false,
        accessLevel: user.location_access_level,
        accessibleLocationIds: activePermissions.map(perm => perm.location_id),
        permissions: activePermissions
      };
    } catch (error) {
      console.error('Error getting user location permissions:', error);
      return {
        hasGlobalAccess: false,
        accessLevel: 'restricted',
        accessibleLocationIds: [],
        permissions: []
      };
    }
  };

  const getCurrentLocationConfig = async () => {
    if (!currentLocation) return null;
    
    try {
      const result = await LocationService.getLocationDetails(currentLocation.id);
      return result.data;
    } catch (error) {
      console.error('Error getting current location config:', error);
      return null;
    }
  };

  // Generate full URL with subdomain for external links
  const getFullLocationUrl = (locationSlug, path = '/staff-portal/dashboard') => {
    const clubSubdomain = getClubSubdomain();
    const baseUrl = window.location.hostname.includes('localhost')
      ? `http://localhost:${window.location.port}`
      : `https://${clubSubdomain}.momentum.pro`;

    // Multi-location: clubname.momentum.pro/location-slug/staff-portal/dashboard
    // Single-location: clubname.momentum.pro/staff-portal/dashboard
    if (availableLocations.length > 1) {
      return `${baseUrl}/${locationSlug}${path}`;
    }
    return `${baseUrl}${path}`;
  };

  const value = {
    // Current state
    currentLocation,
    availableLocations,
    loading,
    error,

    // Actions
    switchLocation,
    loadAvailableLocations,
    refreshLocationContext: checkMultiLocationAndLoadLocations,

    // Utilities
    getLocationUrl,
    getFullLocationUrl,
    getClubSubdomain,
    isLocationAccessible,
    getCurrentLocationConfig,
    getUserLocationPermissions,

    // URL helpers
    getLocationSlugFromUrl,
    updateUrlWithLocation
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

// Higher-order component for location-aware components
export const withLocation = (Component) => {
  return function LocationAwareComponent(props) {
    const locationContext = useLocationContext();
    return <Component {...props} location={locationContext} />;
  };
};

// Hook for components that need location-specific data
export const useLocationData = (dataType, options = {}) => {
  const { currentLocation } = useLocationContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentLocation) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        let result;
        switch (dataType) {
          case 'billing_config':
            result = await LocationService.getBillingConfig(currentLocation.id);
            break;
          case 'analytics':
            result = await LocationService.getLocationAnalytics(currentLocation.id, options.period);
            break;
          case 'full_config':
            result = await LocationService.getLocationDetails(currentLocation.id);
            break;
          default:
            throw new Error(`Unknown data type: ${dataType}`);
        }

        if (result.error) throw result.error;
        setData(result.data);
      } catch (err) {
        console.error(`Error loading ${dataType}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentLocation?.id, dataType, JSON.stringify(options)]);

  return { data, loading, error, refetch: () => loadData() };
};

export default LocationContext;
