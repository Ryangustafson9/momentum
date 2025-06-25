import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { storage } from '@/utils/storageUtils';
import { enhancedStorage } from '@/utils/secureStorage';
import { normalizeRole } from '@/utils/roleUtils';
import { createProfileSafe } from '@/utils/profileValidation';

/**
 * Custom hook for fetching and managing user profiles
 * Extracted from AuthContext to improve maintainability and reusability
 */
export const useProfileFetcher = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetches user profile with comprehensive error handling and profile creation
   * @param {string} userId - The user ID to fetch profile for
   * @param {Object} options - Configuration options
   * @param {boolean} options.cache - Whether to cache the result (default: true)
   * @param {boolean} options.createIfMissing - Whether to create profile if missing (default: true)
   * @param {Function} options.onProfileCreated - Callback when profile is created
   * @returns {Promise<Object>} The user profile object
   */
  const fetchUserProfile = useCallback(async (userId, options = {}) => {
    const {
      cache = true,
      createIfMissing = true,
      onProfileCreated = null
    } = options;

    try {
      setLoading(true);
      setError(null);
      
      
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        
        
        // Handle missing profile case
        if (fetchError.code === 'PGRST116' && createIfMissing) {
          
          
          const createdProfile = await createUserProfile(userId, onProfileCreated);
            if (cache) {
            await cacheUserProfile(createdProfile);
          }
          
          return createdProfile;
        }
        
        throw fetchError;
      }

      // Validate and normalize profile data
      const normalizedProfile = normalizeProfileData(data);
      
          // Cache the profile if requested
      if (cache) {
        await cacheUserProfile(normalizedProfile);
      }

      return normalizedProfile;
      
    } catch (err) {
      
      setError(err);
      
      // Return fallback profile to prevent auth flow breakage
      const fallbackProfile = createFallbackProfile(userId);
      
      
      return fallbackProfile;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Creates a new user profile with email handling and conflict resolution
   * @param {string} userId - The user ID
   * @param {Function} onCreated - Callback when profile is created
   * @returns {Promise<Object>} The created profile
   */
  const createUserProfile = async (userId, onCreated = null) => {
    // Get user email from auth session
    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email || `user_${userId}@temp.local`;

    

    // Check if email already exists and handle conflicts
    if (userEmail && userEmail !== `user_${userId}@temp.local`) {
      const existingProfile = await handleExistingEmailProfile(userId, userEmail);
      if (existingProfile) {
        return existingProfile;
      }
    }

    // Create new profile
    const newProfile = {
      id: userId,
      role: 'nonmember', // Default role for new signups
      first_name: '',
      last_name: '',
      email: userEmail,
      name: ''
    };

    const createdProfile = await insertProfileSafely(newProfile);
    
    if (onCreated) {
      onCreated(createdProfile);
    }
    
    return createdProfile;
  };

  /**
   * Handles existing email profile conflicts
   * @param {string} userId - The user ID
   * @param {string} email - The email to check
   * @returns {Promise<Object|null>} Existing profile if found and updated
   */
  const handleExistingEmailProfile = async (userId, email) => {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (existingProfile) {
      
      
      // Update the existing profile with the correct user ID
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ id: userId })
        .eq('email', email)
        .select()
        .single();

      if (!updateError && updatedProfile) {
        
        return updatedProfile;
      }
    }
    
    return null;
  };

  /**
   * Safely inserts a profile with fallback strategies
   * @param {Object} profileData - The profile data to insert
   * @returns {Promise<Object>} The inserted profile
   */
  const insertProfileSafely = async (profileData) => {
    let insertData, insertError;

    try {
      // Try using safe creation function first
      const result = await supabase.rpc('create_profile_safe', {
        p_user_id: profileData.id,
        p_email: profileData.email,
        p_role: profileData.role,
        p_first_name: profileData.first_name,
        p_last_name: profileData.last_name,
        p_phone: null
      });
      insertData = result.data;
      insertError = result.error;
    } catch (rpcError) {
      // Fallback to direct insert if function doesn't exist
      
      const result = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      insertData = result.data;
      insertError = result.error;
    }

    if (insertError) {
      

      // Handle email conflict by using temp email
      if (insertError.code === '23505' && insertError.message.includes('email')) {
        
        const tempEmail = `user_${profileData.id}_${Date.now()}@temp.local`;
        profileData.email = tempEmail;

        return await insertProfileSafely(profileData); // Recursive retry
      }

      // Return original profile data as fallback
      return profileData;
    }

    
    return insertData;
  };

  /**
   * Normalizes and validates profile data
   * @param {Object} data - Raw profile data
   * @returns {Object} Normalized profile data
   */
  const normalizeProfileData = (data) => {
    // Ensure role exists and is valid
    if (!data.role || data.role === null) {
      
      data.role = 'nonmember';
      
      // Update the profile with default role (fire and forget)
      supabase
        .from('profiles')
        .update({ role: 'nonmember' })
        .eq('id', data.id)
        .then(({ error }) => {
          if (error) {
            
          }
        });
    }

    // Normalize and return clean user data
    return {
      ...data,
      role: normalizeRole(data.role || 'nonmember')
    };
  };

  /**
   * Creates a fallback profile when all else fails
   * @param {string} userId - The user ID
   * @returns {Object} Fallback profile object
   */
  const createFallbackProfile = (userId) => {
    return {
      id: userId,
      role: 'nonmember',
      email: 'unknown@example.com',
      first_name: '',
      last_name: '',
      name: ''
    };
  };
  /**
   * Caches user profile data securely for faster subsequent loads
   * @param {Object} profile - The profile to cache
   */
  const cacheUserProfile = async (profile) => {
    try {
      await enhancedStorage.secure.set('cached_user', profile);
      enhancedStorage.session.set('cached_user_timestamp', Date.now());
    } catch (error) {
      console.warn('Failed to cache user profile securely:', error);
    }
  };

  /**
   * Retrieves cached user profile if valid
   * @returns {Object|null} Cached profile or null if invalid/expired
   */
  const getCachedProfile = useCallback(async () => {
    try {
      const cached = await enhancedStorage.secure.get('cached_user');
      const cacheTimestamp = enhancedStorage.session.get('cached_user_timestamp');

      // Check if cache is still valid (24 hours)
      if (cached && cacheTimestamp) {
        const cacheAge = Date.now() - cacheTimestamp;
        const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours

        if (cacheAge < maxCacheAge) {
          console.log('🔄 Using cached user profile');
          return cached;
        } else {
          console.log('♻️ Cache expired, clearing');
          enhancedStorage.secure.remove('cached_user');
          enhancedStorage.session.remove('cached_user_timestamp');
        }
      }

      return null;
    } catch (error) {
      console.warn('Failed to get cached profile:', error);
      return null;
    }
  }, []);

  /**
   * Clears cached profile data securely
   */
  const clearProfileCache = useCallback(() => {
    try {
      enhancedStorage.secure.remove('cached_user');
      enhancedStorage.session.remove('cached_user_timestamp');
      console.log('🧹 Profile cache cleared securely');
    } catch (error) {
      console.warn('Failed to clear profile cache:', error);
    }
  }, []);

  return {
    fetchUserProfile,
    createUserProfile,
    getCachedProfile,
    clearProfileCache,
    loading,
    error
  };
};

export default useProfileFetcher;

