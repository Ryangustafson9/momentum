import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { showToast } from '@/utils/toastUtils';
import { storage, STORAGE_KEYS } from '@/utils/storageUtils';
import { normalizeRole } from '@/utils/roleUtils';
import { createProfileSafe, validateAuthUserExists } from '@/utils/profileValidation';
import { useProfileFetcher } from '@/hooks/useProfileFetcher';
import { PermissionsService } from '@/services/permissionsService';

/**
 * 🔐 AuthContext - Centralized Authentication Management
 * 
 * ✅ COMPLETED ENHANCEMENTS:
 * - Refactored fetchUserProfile to dedicated useProfileFetcher hook
 * - Added user normalization and caching in signup() for consistency
 * - Maintained comprehensive error handling and profile creation
 * 
 * 🚀 FUTURE ENHANCEMENTS CHECKLIST:
 * - 🔁 autoRefreshToken: Implement background token refresh via supabase.auth.startAutoRefresh()
 * - 🌍 locale support: Cache preferred language/locale with profile or localStorage
 * - 🧼 supabase-js v3 migration: Upgrade to @supabase/ssr methods for SSR when stable
 * - 🧱 Profile utilities: Continue extracting profile-related functions to dedicated modules
 * - 📊 Analytics: Add login/signup event tracking for user behavior analysis
 * - 🔒 Security: Implement session timeout and concurrent session management
 */

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // ⚡ PERFORMANCE: Initialize with cached user for faster UI hydration
  const [user, setUser] = useState(() => {
    try {
      const cached = storage.local.get('cached_user');
      const cacheTimestamp = storage.local.get('cached_user_timestamp');

      // 💾 CACHE VALIDATION: Check if cache is still valid (24 hours)
      if (cached && cacheTimestamp) {
        const cacheAge = Date.now() - cacheTimestamp;
        const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours

        if (cacheAge < maxCacheAge) {
          return cached;
        } else {
          storage.local.remove('cached_user');
          storage.local.remove('cached_user_timestamp');
        }
      }

      return null;    } catch (error) {
      
      return null;
    }
  });
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  // 🔐 PERMISSIONS: State for user permissions
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  // ⭐ REFACTORED: Use dedicated profile fetcher hook
  const { 
    fetchUserProfile, 
    getCachedProfile, 
    clearProfileCache 
  } = useProfileFetcher();

  // 🔐 PERMISSIONS: Fetch user permissions based on staff role
  const fetchUserPermissions = async (userId) => {
    setPermissionsLoading(true);
    try {
      const permissions = await PermissionsService.getUserPermissions(userId);
      setUserPermissions(permissions);
      return permissions;
    } catch (error) {
      
      setUserPermissions([]);
      return [];
    } finally {
      setPermissionsLoading(false);
    }
  };

  // 🔐 PERMISSIONS: Check if user has specific permission
  const hasPermission = (permissionName) => {
    if (!user?.id || !permissionName) return false;
    return userPermissions.some(permission => 
      permission.permission_name === permissionName || permission === permissionName
    );
  };

  // 🔐 PERMISSIONS: Check permission async (for real-time checks)
  const checkPermissionAsync = async (permissionName) => {
    if (!user?.id || !permissionName) return false;
    try {
      return await PermissionsService.userHasPermission(user.id, permissionName);
    } catch (error) {
      
      return false;
    }
  };
  // ⭐ ENHANCED: Profile fetcher with user state management
  const fetchAndSetProfile = async (userId, options = {}) => {
    try {
      const profile = await fetchUserProfile(userId, {
        ...options,
        onProfileCreated: (createdProfile) => {
          
          setUser(createdProfile);
        }
      });
      
      setUser(profile);
      
      // 🔐 PERMISSIONS: Fetch permissions after profile is set
      if (profile?.id) {
        fetchUserPermissions(profile.id).catch(error => {
          
        });
      }
      
      return profile;
    } catch (error) {
      
      throw error;
    }
  };

  // ⭐ SIMPLIFIED: Auth state listener with faster timeout
  useEffect(() => {
    
    
    let isMounted = true;
    
    // ⭐ FASTER: Reduced timeout to 3 seconds
    const authTimeout = setTimeout(() => {
      if (isMounted) {
        setAuthReady(true);
      }
    }, 3000); // Reduced from 5000ms to 3000ms

    const initializeAuth = async () => {
      try {
        // ⭐ FASTER: Get current session quickly
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          
          if (isMounted) {
            setAuthReady(true);
          }
          return;
        }

        if (session?.user && isMounted) {
          // ⭐ ASYNC: Fetch profile in background, don't wait
          fetchAndSetProfile(session.user.id)
            .catch((error) => {
              
              // Don't throw - this is a background operation
            })
            .finally(() => {
              if (isMounted) {
                setAuthReady(true);
                clearTimeout(authTimeout);
              }
            });
        } else {
          if (isMounted) {
            setAuthReady(true);
            clearTimeout(authTimeout);
          }
        }
        
      } catch (error) {
        
        if (isMounted) {
          setAuthReady(true);
          clearTimeout(authTimeout);
        }
      }
    };

    // ⭐ FAST: Initialize immediately
    initializeAuth();

    // ⭐ SIMPLIFIED: Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      
      if (!isMounted) return;

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            // ⭐ BACKGROUND: Don't block UI for profile fetching
            fetchAndSetProfile(session.user.id)
              .catch((error) => {
                
                // Don't throw - this is a background operation
                // User can still use the app with basic auth data
              });
          }
          break;
            case 'SIGNED_OUT':
          setUser(null);
          setUserPermissions([]); // 🔐 Clear permissions on logout
          // 💾 PERSISTENCE: Clear cached user on logout
          storage.local.remove('cached_user');
          storage.local.remove('cached_user_timestamp');
          storage.local.clear();
          storage.session.clear();
          break;
          
        case 'TOKEN_REFRESHED':
          
          break;
      }

      if (!authReady) {
        setAuthReady(true);
        clearTimeout(authTimeout);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);

    try {
      // ⚠️ SCHEMA ERROR FIX: Try login with better error handling
      let data, error;

      try {
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        data = result.data;
        error = result.error;
      } catch (schemaError) {
        

        // If it's a schema error, try to handle it gracefully
        if (schemaError.message?.includes('Database error querying schema')) {
          throw new Error('Database configuration issue. Please contact support or try again later.');
        }
        throw schemaError;
      }

      if (error) throw error;

      // ⭐ IMMEDIATE: Fetch profile right after login
      let userProfile = null;
      if (data.user) {
        try {
          userProfile = await fetchAndSetProfile(data.user.id);
        } catch (profileError) {
          
          
          
          userProfile = {
            id: data.user.id,
            email: data.user.email || '',
            role: 'nonmember', // ⭐ DEFAULT: New signups are nonmembers
            first_name: '',
            last_name: '',
            name: ''
          };
          setUser(userProfile);

          // 💾 PERSISTENCE: Cache fallback user
          try {
            storage.local.set('cached_user', userProfile);
            storage.local.set('cached_user_timestamp', Date.now());
          } catch (error) {
            
          }

          
        }
      }
      
      storage.local.set('last_login', new Date().toISOString());
      
      // ⭐ RETURN: User with profile data
      const returnUser = userProfile || {
        id: data.user.id,
        email: data.user.email,
        role: 'nonmember',
        name: ''
      };
      
      return { user: returnUser };
      
    } catch (error) {
      

      // Don't show toast here - let the Login component handle UI feedback
      // Just throw the error with a clear message for the UI to handle
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid login credentials');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Email not confirmed');
      } else if (error.message.includes('Too many requests')) {
        throw new Error('Too many requests');
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, userData) => {
    setLoading(true);

    try {
      // ⚠️ RACE CONDITION FIX: Check for existing users before creating auth user
      // This prevents orphaned auth users and provides better error messages
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingProfileError && existingProfileError.code !== 'PGRST116') {
        
        throw new Error('Unable to verify account status. Please try again.');
      }

      // Check if email already exists in profiles
      if (existingProfile) {
        throw new Error('An account with this email already exists. Please try logging in instead.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone
          }
        }
      });

      if (error) {
        
        throw error;
      }      // Only create profile if auth user was created successfully
      if (data.user) {
        

        let normalizedUser;

        try {
          const profileData = {
            id: data.user.id,
            role: 'nonmember', // All app signups are nonmembers - admins created at DB level
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            display_name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            email: email,
            phone: userData.phone || null
          };

          // ⚠️ FOREIGN KEY FIX: Validate auth user exists before creating profile
          const authUserValid = await validateAuthUserExists(data.user.id);
          if (!authUserValid) {
            throw new Error('Auth user validation failed - cannot create profile');
          }

          // ⚠️ FOREIGN KEY FIX: Try safe profile creation, fallback to direct insert
          

          let createdProfile;
          try {
            createdProfile = await createProfileSafe(profileData);
          } catch (safeError) {
            
            const { data, error } = await supabase
              .from('profiles')
              .insert([profileData])
              .select()
              .single();

            if (error) throw error;
            createdProfile = data;
          }                    // ⚠️ FIX: Normalize and cache user data like in login()
          normalizedUser = {
            ...createdProfile,
            role: normalizeRole(createdProfile.role || 'nonmember')
          };
          
          // Cache the normalized user data
          storage.local.set('cached_user', normalizedUser);
          storage.local.set('cached_user_timestamp', Date.now());
          
          // ⭐ FIX: Set user state immediately so signup component can show success
          setUser(normalizedUser);
          
          

        } catch (profileCreationError) {
          
          throw profileCreationError;
        }        showToast.success(
          'Account Created!',
          'Please check your email to verify your account.'
        );

        // Return both auth user and profile data
        return { 
          user: data.user, 
          profile: normalizedUser 
        };
      } else {
        throw new Error('User creation failed - no user data returned.');
      }
      
    } catch (error) {
      
      
      if (error.message.includes('User already registered')) {
        showToast.error('Account Exists', 'An account with this email already exists');
      } else {
        showToast.error('Signup Failed', error.message);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      
      showToast.success(
        'Reset Email Sent',
        'Please check your email for password reset instructions'
      );

      return { success: true };

    } catch (error) {
      

      if (error.message.includes('User not found')) {
        throw new Error('No account found with this email address');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Please verify your email address first');
      } else {
        throw new Error('Failed to send reset email. Please try again.');
      }
    }
  };
  const logout = async () => {
    try {
      

      // ⭐ CLEAR: All stored data including cached user
      storage.local.remove('cached_user');
      storage.local.remove('cached_user_timestamp');
      storage.local.remove(STORAGE_KEYS.USER_PREFERENCES);
      storage.local.remove(STORAGE_KEYS.DASHBOARD_CONFIG);
      storage.session.clear();

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setUserPermissions([]); // 🔐 Clear permissions

      showToast.success('Logged Out', 'You have been successfully logged out');

      // ⭐ REDIRECT: Force redirect to login page
      window.location.href = '/login';

    } catch (error) {
      
      showToast.error('Logout Failed', error.message);
      // ⭐ FALLBACK: Even if logout fails, redirect to login
      window.location.href = '/login';
    }
  };  // ⚡ PERFORMANCE FIX: Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    authReady,
    loading,
    userPermissions,
    permissionsLoading,
    login,
    signup,
    logout,
    resetPassword,
    fetchAndSetProfile,
    clearProfileCache,
    fetchUserPermissions,
    hasPermission,
    checkPermissionAsync,
  }), [user, authReady, loading, userPermissions, permissionsLoading, fetchAndSetProfile, clearProfileCache]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

