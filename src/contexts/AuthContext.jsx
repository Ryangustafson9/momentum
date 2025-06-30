import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { showToast } from '@/utils/toastUtils';
import { storage, STORAGE_KEYS } from '@/utils/storageUtils';
import { enhancedStorage } from '@/utils/secureStorage';
import { normalizeRole } from '@/utils/roleUtils';
import { createProfileSafe, validateAuthUserExists } from '@/utils/profileValidation';
import { useProfileFetcher } from '@/hooks/useProfileFetcher';
import { logger } from '@/utils/logger';
import { PermissionsService } from '@/services/permissionsService';
// 🔐 SECURITY: Import audit logging and account security services
import { auditLogger } from '@/services/auditLogService';
import { accountSecurityService } from '@/services/accountSecurityService';

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
  // 🔐 SECURITY: Helper function to get client IP address
  const getClientIp = async () => {
    try {
      // In production, you might want to get this from request headers or a service
      // For now, return a placeholder that can be enhanced later
      return 'client-browser';
    } catch (error) {
      logger.warn('Failed to get client IP:', error);
      return 'unknown';
    }
  };

  // ⚡ PERFORMANCE: Initialize with cached user for faster UI hydration
  const [user, setUser] = useState(() => {
    try {
      // Use localStorage for cached user data (persistent across refreshes)
      const cached = enhancedStorage.local.get('cached_user');
      const cacheTimestamp = enhancedStorage.local.get('cached_user_timestamp');

      // 💾 CACHE VALIDATION: Check if cache is still valid (7 days)
      if (cached && cacheTimestamp) {
        const cacheAge = Date.now() - cacheTimestamp;
        const maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (cacheAge < maxCacheAge) {
          return cached;
        } else {
          enhancedStorage.local.remove('cached_user');
          enhancedStorage.local.remove('cached_user_timestamp');
        }
      }

      return null;
    } catch (error) {
      logger.warn('Failed to load cached user:', error);
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
  const fetchAndSetProfile = useCallback(async (userId, options = {}) => {
    try {
      const profile = await fetchUserProfile(userId, {
        ...options,
        onProfileCreated: (createdProfile) => {

          setUser(createdProfile);
          // 💾 PERSISTENCE: Cache created profile in localStorage
          try {
            enhancedStorage.local.set('cached_user', createdProfile);
            enhancedStorage.local.set('cached_user_timestamp', Date.now());
          } catch (error) {
            logger.warn('Failed to cache created profile:', error);
          }
        }
      });

      setUser(profile);

      // 💾 PERSISTENCE: Cache fetched profile in localStorage
      try {
        enhancedStorage.local.set('cached_user', profile);
        enhancedStorage.local.set('cached_user_timestamp', Date.now());
      } catch (error) {
        logger.warn('Failed to cache profile:', error);
      }

      // 🔐 PERMISSIONS: Fetch permissions after profile is set
      if (profile?.id) {
        fetchUserPermissions(profile.id).catch(error => {

        });
      }

      return profile;
    } catch (error) {

      throw error;
    }
  }, [fetchUserProfile, setUser, fetchUserPermissions]);

  // ⭐ SIMPLIFIED: Auth state listener with faster timeout
  useEffect(() => {
    
    
    let isMounted = true;
    
    // Debug interval removed for security - no sensitive data logging
    
    // Window focus/blur monitoring for session validation (no logging)
    const handleFocus = () => {
      // Focus event handled silently
    };

    const handleBlur = () => {
      // Blur event handled silently
    };

    const handleVisibilityChange = () => {
      // When page becomes visible again, check session status
      if (!document.hidden && user) {
        supabase.auth.getSession().then(({ data: { session }, error }) => {
          if (error) {
            logger.error('Session check error on visibility change:', error);
            return;
          }

          if (!session && user) {
            // Try to refresh the session
            supabase.auth.refreshSession().catch(refreshError => {
              logger.error('Session refresh failed:', refreshError);
            });
          }
        });
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // ⭐ FIXED: Longer timeout to allow proper session restoration
    const authTimeout = setTimeout(() => {
      if (isMounted) {
        logger.warn('Auth initialization timeout - setting authReady to true');
        setAuthReady(true);
      }
    }, 8000); // Increased to 8 seconds for better session restoration

    const initializeAuth = async () => {
      try {
        logger.info('🔄 Initializing authentication...');

        // ⭐ CRITICAL: Wait for Supabase to restore session from localStorage
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('AuthContext: Session error:', error);
          if (isMounted) {
            setAuthReady(true);
          }
          return;
        }

        logger.info('Session check completed:', session ? 'Session found' : 'No session');

        if (session?.user && isMounted) {
          logger.info('✅ User session found, fetching profile...');

          // ⭐ CRITICAL: Wait for profile fetch before setting authReady
          try {
            await fetchAndSetProfile(session.user.id);
            logger.info('✅ Profile fetched successfully');
          } catch (profileError) {
            logger.error('Profile fetch error:', profileError);
            // Create fallback user profile
            const fallbackUser = {
              id: session.user.id,
              email: session.user.email || '',
              role: 'nonmember',
              first_name: '',
              last_name: '',
              name: session.user.email || ''
            };
            setUser(fallbackUser);

            // Cache fallback user
            try {
              enhancedStorage.local.set('cached_user', fallbackUser);
              enhancedStorage.local.set('cached_user_timestamp', Date.now());
            } catch (error) {
              logger.warn('Failed to cache fallback user:', error);
            }
          }

          // ⭐ FIXED: Set authReady after profile is handled
          if (isMounted) {
            setAuthReady(true);
            clearTimeout(authTimeout);
          }
        } else {
          logger.info('No active session found');

          // ⭐ FIXED: Don't try to refresh session unnecessarily
          // Just set authReady and let the user login normally
          if (isMounted) {
            setAuthReady(true);
            clearTimeout(authTimeout);
          }
        }

      } catch (error) {
        logger.error('AuthContext: Initialize error:', error);
        if (isMounted) {
          setAuthReady(true);
          clearTimeout(authTimeout);
        }
      }
    };

    // ⭐ FAST: Initialize immediately
    initializeAuth();

    // ⭐ FIXED: Auth state change listener with better session handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('🔄 Auth state change:', event, session ? 'with session' : 'no session');

      if (!isMounted) return;

      switch (event) {
        case 'SIGNED_IN':
          logger.info('✅ SIGNED_IN event - user authenticated');
          if (session?.user) {
            // ⭐ BACKGROUND: Don't block UI for profile fetching
            fetchAndSetProfile(session.user.id)
              .catch((error) => {
                logger.error('Profile fetch error in SIGNED_IN:', error);
                // Don't throw - this is a background operation
                // User can still use the app with basic auth data
              });
          }
          break;

        case 'SIGNED_OUT':
          logger.info('⚠️ SIGNED_OUT event received');

          // ⭐ CRITICAL: Add delay to prevent race conditions during page refresh
          setTimeout(async () => {
            if (!isMounted) return;

            // Double-check session status to prevent false logouts
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            if (!currentSession) {
              logger.info('✅ Confirmed logout - clearing user state');
              setUser(null);
              setUserPermissions([]);
              // Clear cached data
              enhancedStorage.local.remove('cached_user');
              enhancedStorage.local.remove('cached_user_timestamp');
              enhancedStorage.secure.clear();
              enhancedStorage.session.clear();
            } else {
              logger.info('🔄 False logout detected - session still exists, keeping user logged in');
            }
          }, 100); // Small delay to handle race conditions
          break;

        case 'TOKEN_REFRESHED':
          logger.info('🔄 Token refreshed successfully');
          // Session is still valid, no action needed
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
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription?.unsubscribe();
    };
  }, []);  const login = async (email, password) => {
    setLoading(true);

    try {      // 🔐 SECURITY: Check for account lockout before attempting login
      const clientIp = await getClientIp();
      const lockoutCheck = await accountSecurityService.checkAccountLockout(email, clientIp);
      
      if (lockoutCheck.isLocked) {
        const error = new Error(`Account temporarily locked due to multiple failed attempts. Try again in ${Math.ceil(lockoutCheck.remainingTime / 60000)} minutes.`);
        await auditLogger.logFailedLogin(email, clientIp, 'Account locked');
        throw error;
      }

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
      }      if (error) {
        // 🔐 SECURITY: Log failed login attempt and apply lockout logic
        await auditLogger.logFailedLogin(email, clientIp, error.message);
        await accountSecurityService.recordFailedAttempt(email, clientIp);
        throw error;
      }// ⭐ IMMEDIATE: Fetch profile right after login
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
          setUser(userProfile);          // 💾 PERSISTENCE: Cache fallback user in localStorage
          try {
            enhancedStorage.local.set('cached_user', userProfile);
            enhancedStorage.local.set('cached_user_timestamp', Date.now());
          } catch (error) {
            logger.warn('Failed to cache user:', error);
          }

          
        }
      }
        storage.local.set('last_login', new Date().toISOString());
        // 🔐 SECURITY: Log successful login and clear any lockout records
      await auditLogger.logSuccessfulLogin(data.user.id, data.user.email, clientIp);
      await accountSecurityService.clearFailedAttempts(email, clientIp);
      
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
      // 🔐 SECURITY: Get client IP for audit logging
      const clientIp = await getClientIp();

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
        // 🔐 SECURITY: Log attempted signup with existing email
        await auditLogger.logSecurityEvent('signup_attempt_existing_email', {
          email,
          client_ip: clientIp,
          risk_level: 'medium'
        });
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
        // 🔐 SECURITY: Log failed signup attempt
        await auditLogger.logSecurityEvent('signup_failed', {
          email,
          client_ip: clientIp,
          error: error.message,
          risk_level: 'low'
        });
        
        throw error;
      }// Only create profile if auth user was created successfully
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
          }          // ⚠️ FIX: Normalize and cache user data like in login() - use secure storage
          normalizedUser = {
            ...createdProfile,
            role: normalizeRole(createdProfile.role || 'nonmember')
          };
          
          // Cache the normalized user data securely
          await enhancedStorage.secure.set('cached_user', normalizedUser);
          enhancedStorage.session.set('cached_user_timestamp', Date.now());
            // ⭐ FIX: Set user state immediately so signup component can show success
          setUser(normalizedUser);
          
          // 🔐 SECURITY: Log successful user registration
          await auditLogger.logUserRegistration(normalizedUser.id, normalizedUser.email, clientIp, {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: 'nonmember'
          });

          

        } catch (profileCreationError) {
          
          throw profileCreationError;
        }showToast.success(
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
  };  const logout = async () => {
    // 🔐 SECURITY: Log logout attempt with user context
    const currentUser = user;
    const clientIp = await getClientIp();
    
    // Attempting logout
    try {
      // Clearing storage
      // ⭐ CLEAR: All stored data including cached user - use localStorage
      enhancedStorage.local.remove('cached_user');
      enhancedStorage.local.remove('cached_user_timestamp');
      enhancedStorage.local.remove(STORAGE_KEYS.USER_PREFERENCES);
      enhancedStorage.local.remove(STORAGE_KEYS.DASHBOARD_CONFIG);
      enhancedStorage.secure.clear(); // Clear all secure data
      enhancedStorage.session.clear();

      // Calling supabase.auth.signOut()
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Supabase signOut error:', error);
        throw error;
      }

      // 🔐 SECURITY: Log successful logout
      if (currentUser?.id) {
        await auditLogger.logUserLogout(currentUser.id, currentUser.email, clientIp);
      }

      // Supabase signOut successful, clearing user state
      setUser(null);
      setUserPermissions([]); // Clear permissions

      // Logout successful, redirecting

      // ⭐ REDIRECT: Force redirect to login page
      window.location.href = '/login';

    } catch (error) {
      logger.error('Logout error:', error);
      // FALLBACK: Even if logout fails, redirect to login
      window.location.href = '/login';
    }
  };// ⚡ PERFORMANCE FIX: Memoize context value to prevent unnecessary re-renders
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


