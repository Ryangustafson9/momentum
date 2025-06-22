import { supabase } from '@/lib/supabaseClient';
import { normalizeRole } from '@/utils/roleUtils';

/**
 * Profile utility functions for non-hook operations
 * These can be used in admin tools, server-side operations, or anywhere
 * React hooks aren't available or needed
 */

/**
 * Fetches multiple user profiles by IDs
 * @param {string[]} userIds - Array of user IDs to fetch
 * @param {Object} options - Query options
 * @param {string[]} options.select - Fields to select (default: all)
 * @param {Object} options.filters - Additional filters
 * @returns {Promise<Object[]>} Array of user profiles
 */
export const fetchMultipleProfiles = async (userIds, options = {}) => {
  const { select = '*', filters = {} } = options;
  
  try {
    let query = supabase
      .from('profiles')
      .select(select)
      .in('id', userIds);
      
    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Normalize roles for all profiles
    const normalizedProfiles = data.map(profile => ({
      ...profile,
      role: normalizeRole(profile.role || 'nonmember')
    }));
    
    return normalizedProfiles;
    
  } catch (error) {
    throw error;
  }
};

/**
 * Searches profiles by various criteria
 * @param {Object} searchCriteria - Search parameters
 * @param {string} searchCriteria.query - Text to search for
 * @param {string[]} searchCriteria.fields - Fields to search in
 * @param {string} searchCriteria.role - Filter by role
 * @param {number} searchCriteria.limit - Limit results (default: 50)
 * @returns {Promise<Object[]>} Array of matching profiles
 */
export const searchProfiles = async (searchCriteria = {}) => {
  const { 
    query = '', 
    fields = ['first_name', 'last_name', 'email'], 
    role = null,
    limit = 50 
  } = searchCriteria;
  
  try {
    let supabaseQuery = supabase
      .from('profiles')
      .select('*')
      .limit(limit);
    
    // Add role filter if specified
    if (role) {
      supabaseQuery = supabaseQuery.eq('role', role);
    }
    
    // Add text search if query provided
    if (query && query.trim()) {
      // Create OR conditions for each field
      const searchConditions = fields.map(field => 
        `${field}.ilike.%${query.trim()}%`
      ).join(',');
      
      supabaseQuery = supabaseQuery.or(searchConditions);
    }
    
    const { data, error } = await supabaseQuery;
    
    if (error) {
      throw error;
    }
    
    // Normalize roles
    const normalizedProfiles = data.map(profile => ({
      ...profile,
      role: normalizeRole(profile.role || 'nonmember')
    }));
    
    return normalizedProfiles;
    
  } catch (error) {
    throw error;
  }
};

/**
 * Updates a user profile with validation
 * @param {string} userId - User ID to update
 * @param {Object} updates - Fields to update
 * @param {Object} options - Update options
 * @param {boolean} options.validateRole - Whether to validate role (default: true)
 * @returns {Promise<Object>} Updated profile
 */
export const updateProfile = async (userId, updates, options = {}) => {
  const { validateRole = true } = options;
  
  try {
    // Validate role if being updated
    if (validateRole && updates.role) {
      updates.role = normalizeRole(updates.role);
    }
    
    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return data;
    
  } catch (error) {
    throw error;
  }
};

/**
 * Bulk updates multiple profiles
 * @param {Object[]} profileUpdates - Array of {id, updates} objects
 * @param {Object} options - Update options
 * @returns {Promise<Object[]>} Array of updated profiles
 */
export const bulkUpdateProfiles = async (profileUpdates, options = {}) => {
  const { validateRole = true } = options;
  
  try {
    const updatePromises = profileUpdates.map(({ id, updates }) => 
      updateProfile(id, updates, { validateRole })
    );
    
    const results = await Promise.allSettled(updatePromises);
    
    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
      
    const failed = results
      .filter(result => result.status === 'rejected')
      .map((result, index) => ({
        id: profileUpdates[index].id,
        error: result.reason
      }));
    
    if (failed.length > 0) {
      
    }
    
    return {
      successful,
      failed,
      total: profileUpdates.length
    };
    
  } catch (error) {
    throw error;
  }
};

/**
 * Gets profile statistics by role
 * @returns {Promise<Object>} Statistics object with counts by role
 */
export const getProfileStats = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .not('role', 'is', null);
      
    if (error) {
      throw error;
    }
    
    // Count by role
    const stats = data.reduce((acc, profile) => {
      const role = normalizeRole(profile.role || 'nonmember');
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    
    // Add total count
    stats.total = data.length;
    
    return stats;
    
  } catch (error) {
    throw error;
  }
};

/**
 * Validates profile data structure
 * @param {Object} profileData - Profile data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateProfileData = (profileData) => {
  const errors = [];
  const warnings = [];
  
  // Required fields
  if (!profileData.id) {
    errors.push('Profile ID is required');
  }
  
  if (!profileData.role) {
    warnings.push('Role is missing, will default to nonmember');
  }
  
  // Email validation
  if (profileData.email && profileData.email !== 'unknown@example.com') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      errors.push('Invalid email format');
    }
  }
  
  // Role validation
  if (profileData.role) {
    const validRoles = ['admin', 'staff', 'member', 'nonmember'];
    const normalizedRole = normalizeRole(profileData.role);
    if (!validRoles.includes(normalizedRole)) {
      errors.push(`Invalid role: ${profileData.role}`);
    }
  }
  
  const isValid = errors.length === 0;
  
  return {
    isValid,
    errors,
    warnings,
    normalizedRole: profileData.role ? normalizeRole(profileData.role) : 'nonmember'
  };
};

/**
 * Sanitizes profile data for safe storage
 * @param {Object} profileData - Raw profile data
 * @returns {Object} Sanitized profile data
 */
export const sanitizeProfileData = (profileData) => {
  const sanitized = { ...profileData };
  
  // Normalize role
  if (sanitized.role) {
    sanitized.role = normalizeRole(sanitized.role);
  }
  
  // Trim string fields
  ['first_name', 'last_name', 'name', 'email'].forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitized[field].trim();
    }
  });
  
  // Remove null/undefined values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === null || sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });
  
  return sanitized;
};

export default {
  fetchMultipleProfiles,
  searchProfiles,
  updateProfile,
  bulkUpdateProfiles,
  getProfileStats,
  validateProfileData,
  sanitizeProfileData
};

