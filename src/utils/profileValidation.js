/**
 * Profile Validation Utilities
 * 
 * This module provides client-side validation for profile operations
 * to ensure data integrity and foreign key constraints are respected.
 */

import { supabase } from '@/lib/supabaseClient';

/**
 * Validates that an auth user exists before creating a profile
 * @param {string} userId - The user ID to validate
 * @returns {Promise<boolean>} True if auth user exists, false otherwise
 */
export async function validateAuthUserExists(userId) {
  try {
    if (!userId) {
      
      return false;
    }

    // Check if the user exists in auth.users
    // Note: We can't directly query auth.users from client, so we use getUser
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      
      return false;
    }

    // If we have a current session, check if it matches the provided userId
    if (user && user.id === userId) {
      
      return true;
    }

    // For other users, we can't directly validate from client-side
    // The database foreign key constraint will catch invalid references
    
    return true; // Let database constraint handle validation
    
  } catch (error) {
    
    return false;
  }
}

/**
 * Validates profile data before creation
 * @param {Object} profileData - The profile data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateProfileData(profileData) {
  const errors = [];
  
  // Required fields validation
  if (!profileData.id) {
    errors.push('Profile ID is required');
  }
  
  if (!profileData.email || profileData.email.trim() === '') {
    errors.push('Email is required');
  }
  
  if (!profileData.role) {
    errors.push('Role is required');
  }
  
  // Email format validation
  if (profileData.email && !isValidEmail(profileData.email)) {
    errors.push('Email format is invalid');
  }
  
  // Role validation
  const validRoles = ['admin', 'staff', 'instructor', 'member', 'nonmember', 'non-member'];
  if (profileData.role && !validRoles.includes(profileData.role)) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}`);
  }
  
  // UUID validation
  if (profileData.id && !isValidUUID(profileData.id)) {
    errors.push('Profile ID must be a valid UUID');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Safely creates a profile with validation
 * @param {Object} profileData - The profile data to create
 * @returns {Promise<Object>} Created profile or error
 */
export async function createProfileSafe(profileData) {
  try {
    
    
    // Client-side validation
    const validation = validateProfileData(profileData);
    if (!validation.isValid) {
      throw new Error(`Profile validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Auth user validation
    const authUserExists = await validateAuthUserExists(profileData.id);
    if (!authUserExists) {
      throw new Error('Cannot create profile: auth user validation failed');
    }
    
    

    // Create profile with direct insert since RPC function doesn't exist
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: profileData.id,
        email: profileData.email,
        role: profileData.role || 'nonmember',
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        display_name: profileData.display_name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
        phone: profileData.phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      
      throw error;
    }

    
    return data;
    
  } catch (error) {
    
    throw error;
  }
}

/**
 * Checks if a profile exists for a given user ID
 * @param {string} userId - The user ID to check
 * @returns {Promise<boolean>} True if profile exists, false otherwise
 */
export async function profileExists(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      
      return false;
    }
    
    return !!data;
    
  } catch (error) {
    
    return false;
  }
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid UUID format
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Gets profile with auth user validation
 * @param {string} userId - The user ID to get profile for
 * @returns {Promise<Object|null>} Profile data or null if not found
 */
export async function getProfileSafe(userId) {
  try {
    if (!userId || !isValidUUID(userId)) {
      throw new Error('Invalid user ID provided');
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        
        return null;
      }
      throw error;
    }
    
    return data;
    
  } catch (error) {
    
    throw error;
  }
}

export default {
  validateAuthUserExists,
  validateProfileData,
  createProfileSafe,
  profileExists,
  getProfileSafe
};

