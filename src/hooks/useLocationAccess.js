import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import LocationService from '@/lib/services/locationService';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for validating and managing location access permissions
 * Provides utilities for checking if a user can access specific locations
 */
export const useLocationAccess = () => {
  const { user } = useAuth();
  const { availableLocations, currentLocation } = useLocationContext();
  const { toast } = useToast();
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user permissions on mount
  useEffect(() => {
    if (user?.id) {
      loadUserPermissions();
    }
  }, [user?.id]);

  const loadUserPermissions = async () => {
    try {
      setLoading(true);
      
      if (user.role === 'admin') {
        // Admins have global access
        setUserPermissions({
          hasGlobalAccess: user.location_access_level === 'global',
          accessLevel: user.location_access_level,
          accessibleLocationIds: availableLocations.map(loc => loc.id),
          permissions: []
        });
      } else {
        // Staff users - get specific permissions
        const result = await LocationService.getStaffLocationPermissions(user.id);
        if (result.error) throw result.error;

        const activePermissions = result.data?.filter(perm => perm.is_active) || [];
        setUserPermissions({
          hasGlobalAccess: false,
          accessLevel: user.location_access_level,
          accessibleLocationIds: activePermissions.map(perm => perm.location_id),
          permissions: activePermissions
        });
      }
    } catch (error) {
      console.error('Error loading user permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load location permissions',
        variant: 'destructive'
      });
      setUserPermissions({
        hasGlobalAccess: false,
        accessLevel: 'restricted',
        accessibleLocationIds: [],
        permissions: []
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user has access to a specific location
   */
  const hasLocationAccess = (locationId) => {
    if (!userPermissions || !locationId) return false;
    
    // Global access users can access all locations
    if (userPermissions.hasGlobalAccess) return true;
    
    // Check if location is in accessible list
    return userPermissions.accessibleLocationIds.includes(locationId);
  };

  /**
   * Get the access level for a specific location
   */
  const getLocationAccessLevel = (locationId) => {
    if (!userPermissions || !locationId) return null;
    
    // Global access users have full access
    if (userPermissions.hasGlobalAccess) return 'full';
    
    // Find specific permission for this location
    const permission = userPermissions.permissions.find(p => p.location_id === locationId);
    return permission?.access_level || null;
  };

  /**
   * Validate if user can perform a specific action at a location
   */
  const canPerformAction = (locationId, action = 'read') => {
    if (!hasLocationAccess(locationId)) return false;
    
    const accessLevel = getLocationAccessLevel(locationId);
    
    switch (action) {
      case 'read':
        return ['full', 'read_only', 'limited'].includes(accessLevel);
      case 'write':
      case 'edit':
      case 'create':
        return ['full'].includes(accessLevel);
      case 'delete':
        return ['full'].includes(accessLevel) && user?.role === 'admin';
      default:
        return accessLevel === 'full';
    }
  };

  /**
   * Validate location access and show error if unauthorized
   */
  const validateLocationAccess = (locationId, action = 'read', showToast = true) => {
    const hasAccess = canPerformAction(locationId, action);
    
    if (!hasAccess && showToast) {
      const location = availableLocations.find(loc => loc.id === locationId);
      const locationName = location?.name || 'this location';

      toast({
        title: `Access denied to ${locationName}`,
        description: `You don't have permission to ${action} at ${locationName}.`,
        variant: 'destructive'
      });
    }
    
    return hasAccess;
  };

  /**
   * Get all accessible locations with their access levels
   */
  const getAccessibleLocationsWithLevels = () => {
    if (!userPermissions) return [];
    
    return availableLocations
      .filter(loc => hasLocationAccess(loc.id))
      .map(loc => ({
        ...loc,
        accessLevel: getLocationAccessLevel(loc.id),
        canRead: canPerformAction(loc.id, 'read'),
        canWrite: canPerformAction(loc.id, 'write'),
        canDelete: canPerformAction(loc.id, 'delete')
      }));
  };

  /**
   * Check if user can switch to a specific location
   */
  const canSwitchToLocation = (locationSlug) => {
    const location = availableLocations.find(loc => loc.slug === locationSlug);
    return location ? hasLocationAccess(location.id) : false;
  };

  /**
   * Validate current location access
   */
  const validateCurrentLocationAccess = () => {
    if (!currentLocation) return true; // No current location to validate
    
    return hasLocationAccess(currentLocation.id);
  };

  /**
   * Get permission summary for display
   */
  const getPermissionSummary = () => {
    if (!userPermissions) return null;
    
    return {
      totalAccessibleLocations: userPermissions.accessibleLocationIds.length,
      hasGlobalAccess: userPermissions.hasGlobalAccess,
      accessLevel: userPermissions.accessLevel,
      permissions: userPermissions.permissions.map(perm => ({
        locationId: perm.location_id,
        locationName: availableLocations.find(loc => loc.id === perm.location_id)?.name,
        accessLevel: perm.access_level,
        grantedAt: perm.granted_at
      }))
    };
  };

  return {
    // State
    userPermissions,
    loading,
    
    // Access checking
    hasLocationAccess,
    getLocationAccessLevel,
    canPerformAction,
    canSwitchToLocation,
    
    // Validation
    validateLocationAccess,
    validateCurrentLocationAccess,
    
    // Utilities
    getAccessibleLocationsWithLevels,
    getPermissionSummary,
    
    // Actions
    refreshPermissions: loadUserPermissions
  };
};

export default useLocationAccess;
