// Location Context
// Manages current location context for multi-location support
// Created: June 21, 2025
// Note: Hook renamed to useLocationContext to avoid conflict with react-router-dom's useLocation

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LocationService from '@/lib/services/locationService';
import { useAuth } from './AuthContext';

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
    // Support patterns like: /vanguard/northpark/dashboard or /location/northpark
    const matches = pathname.match(/\/(?:location|[^\/]+)\/([^\/]+)/);
    return matches ? matches[1] : null;
  };

  // Load available locations for user's organization
  useEffect(() => {
    if (user?.organization_id) {
      loadAvailableLocations();
    }
  }, [user?.organization_id]);

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

  const loadAvailableLocations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await LocationService.getOrganizationLocations(user.organization_id);
      
      if (result.error) {
        throw new Error('Failed to load locations');
      }

      setAvailableLocations(result.data || []);
      
      // If user has a primary location preference, use that
      if (user.primary_location_id && result.data) {
        const primaryLocation = result.data.find(loc => loc.id === user.primary_location_id);
        if (primaryLocation) {
          setCurrentLocation(primaryLocation);
        }
      }
    } catch (err) {
      
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationNotFound = (slug) => {
    
    setError(`Location "${slug}" not found or not accessible`);
    
    // Redirect to first available location if exists
    if (availableLocations.length > 0) {
      switchLocation(availableLocations[0].slug);
    } else {
      // No locations available, redirect to location selection or error page
      navigate('/no-locations');
    }
  };

  const switchLocation = (locationSlug) => {
    const targetLocation = availableLocations.find(loc => loc.slug === locationSlug);
    
    if (!targetLocation) {
      
      return false;
    }

    // Update current location
    setCurrentLocation(targetLocation);
    
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
    // Patterns: /vanguard/oldlocation/page -> /vanguard/newlocation/page
    const organizationSlug = user?.organization?.slug || 'momentum';
    
    // Remove existing location from path
    const pathWithoutLocation = currentPath.replace(/\/[^\/]+\/[^\/]+/, '');
    
    // Add new location
    return `/${organizationSlug}/${locationSlug}${pathWithoutLocation}`;
  };

  const getLocationUrl = (locationSlug, path = '/dashboard') => {
    const organizationSlug = user?.organization?.slug || 'momentum';
    return `/${organizationSlug}/${locationSlug}${path}`;
  };

  const isLocationAccessible = (locationId) => {
    // Check if user has access to this location
    // For now, users have access to all locations in their organization
    return availableLocations.some(loc => loc.id === locationId);
  };

  const getCurrentLocationConfig = async () => {
    if (!currentLocation) return null;
    
    try {
      const result = await LocationService.getLocationDetails(currentLocation.id);
      return result.data;
    } catch (error) {
      
      return null;
    }
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
    
    // Utilities
    getLocationUrl,
    isLocationAccessible,
    getCurrentLocationConfig,
    
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

