import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import ProfileService from '@/services/profileService';

/**
 * Custom hook for managing profile operations with consistent error handling and state management
 */
export const useProfileManager = (options = {}) => {
  const { toast } = useToast();
  const { 
    autoRefresh = true,
    showToasts = true,
    validateData = true 
  } = options;

  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to show toast messages
  const showToast = useCallback((title, description, variant = 'default') => {
    if (showToasts) {
      toast({ title, description, variant });
    }
  }, [toast, showToasts]);

  // Load a single profile
  const loadProfile = useCallback(async (profileId, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ProfileService.getProfile(profileId, options);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to load profile');
      }

      setCurrentProfile(result.data);
      return result.data;
    } catch (err) {
      setError(err.message);
      showToast('Error', `Failed to load profile: ${err.message}`, 'destructive');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Search profiles
  const searchProfiles = useCallback(async (searchQuery, searchOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ProfileService.searchProfiles(searchQuery, searchOptions);
      
      if (result.error) {
        throw new Error(result.error.message || 'Search failed');
      }

      setProfiles(result.data);
      return result.data;
    } catch (err) {
      setError(err.message);
      showToast('Search Error', `Failed to search profiles: ${err.message}`, 'destructive');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Create a new profile
  const createProfile = useCallback(async (profileData, createOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ProfileService.createProfile(profileData, {
        validateData,
        ...createOptions
      });
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to create profile');
      }

      const newProfile = result.data;
      
      // Update local state
      if (autoRefresh) {
        setProfiles(prev => [newProfile, ...prev]);
      }
      
      showToast('Success', 'Profile created successfully');
      return newProfile;
    } catch (err) {
      setError(err.message);
      showToast('Creation Failed', `Failed to create profile: ${err.message}`, 'destructive');
      throw err; // Re-throw so calling component can handle it
    } finally {
      setIsLoading(false);
    }
  }, [validateData, autoRefresh, showToast]);

  // Update an existing profile
  const updateProfile = useCallback(async (profileId, updates, updateOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ProfileService.updateProfile(profileId, updates, {
        validateData,
        ...updateOptions
      });
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update profile');
      }

      const updatedProfile = result.data;
      
      // Update local state
      if (autoRefresh) {
        setProfiles(prev => 
          prev.map(profile => 
            profile.id === profileId ? updatedProfile : profile
          )
        );
        
        if (currentProfile?.id === profileId) {
          setCurrentProfile(updatedProfile);
        }
      }
      
      showToast('Success', 'Profile updated successfully');
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      showToast('Update Failed', `Failed to update profile: ${err.message}`, 'destructive');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [validateData, autoRefresh, currentProfile, showToast]);

  // Delete a profile
  const deleteProfile = useCallback(async (profileId, deleteOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ProfileService.deleteProfile(profileId, deleteOptions);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete profile');
      }
      
      // Update local state
      if (autoRefresh) {
        setProfiles(prev => prev.filter(profile => profile.id !== profileId));
        
        if (currentProfile?.id === profileId) {
          setCurrentProfile(null);
        }
      }
      
      showToast('Success', 'Profile deleted successfully');
      return true;
    } catch (err) {
      setError(err.message);
      showToast('Delete Failed', `Failed to delete profile: ${err.message}`, 'destructive');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [autoRefresh, currentProfile, showToast]);

  // Activate a draft profile
  const activateProfile = useCallback(async (profileId, additionalData = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ProfileService.activateProfile(profileId, additionalData);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to activate profile');
      }

      const activatedProfile = result.data;
      
      // Update local state
      if (autoRefresh) {
        setProfiles(prev => 
          prev.map(profile => 
            profile.id === profileId ? activatedProfile : profile
          )
        );
        
        if (currentProfile?.id === profileId) {
          setCurrentProfile(activatedProfile);
        }
      }
      
      showToast('Success', 'Profile activated successfully');
      return activatedProfile;
    } catch (err) {
      setError(err.message);
      showToast('Activation Failed', `Failed to activate profile: ${err.message}`, 'destructive');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [autoRefresh, currentProfile, showToast]);

  // Get profile statistics
  const getProfileStats = useCallback(async (profileId) => {
    try {
      const result = await ProfileService.getProfileStats(profileId);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to load profile stats');
      }

      return result.data;
    } catch (err) {
      setError(err.message);
      showToast('Stats Error', `Failed to load profile statistics: ${err.message}`, 'destructive');
      return null;
    }
  }, [showToast]);

  // Clear current state
  const clearState = useCallback(() => {
    setProfiles([]);
    setCurrentProfile(null);
    setError(null);
  }, []);

  // Refresh current profile
  const refreshProfile = useCallback(async (profileId = null) => {
    const targetId = profileId || currentProfile?.id;
    if (targetId) {
      return await loadProfile(targetId);
    }
  }, [currentProfile, loadProfile]);

  return {
    // State
    profiles,
    currentProfile,
    isLoading,
    error,
    
    // Actions
    loadProfile,
    searchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    activateProfile,
    getProfileStats,
    refreshProfile,
    clearState,
    
    // Setters for manual state management
    setProfiles,
    setCurrentProfile,
    setError
  };
};

export default useProfileManager;
