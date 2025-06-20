import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { showToast } from '@/utils/toastUtils';
import { storage, STORAGE_KEYS } from '@/utils/storageUtils';
import { normalizeRole } from '@/utils/roleUtils';
import { createProfileSafe, validateAuthUserExists } from '@/utils/profileValidation';
import { useProfileFetcher } from '@/hooks/useProfileFetcher';

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
          console.log('[AuthContext] 💾 Using cached user data');
          return cached;
        } else {
          console.log('[AuthContext] ⏰ Cached user data expired, clearing cache');
          storage.local.remove('cached_user');
          storage.local.remove('cached_user_timestamp');
        }
      }

      return null;
    } catch (error) {
      console.warn('[AuthContext] ⚠️ Failed to load cached user:', error);
      return null;
    }
  });
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // ⭐ REFACTORED: Use dedicated profile fetcher hook
  const { 
    fetchUserProfile, 
    getCachedProfile, 
    clearProfileCache 
  } = useProfileFetcher();

  // ⭐ ENHANCED: Profile fetcher with user state management
  const fetchAndSetProfile = async (userId, options = {}) => {
    try {
      const profile = await fetchUserProfile(userId, {
        ...options,
        onProfileCreated: (createdProfile) => {
          console.log('[AuthContext] 🎉 New profile created:', createdProfile);
          setUser(createdProfile);
        }
      });
      
      setUser(profile);
      return profile;
    } catch (error) {
      console.error('[AuthContext] ❌ Failed to fetch and set profile:', error);
      throw error;
    }  };

  // ⭐ SIMPLIFIED: Auth state listener with faster timeout
  useEffect(() => {
    console.log('[AuthContext] 🔄 Initializing auth state...');
    
    let isMounted = true;
    
    // ⭐ FASTER: Reduced timeout to 3 seconds
    const authTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('[AuthContext] ⚠️ Auth loading timeout - forcing completion');
        setAuthReady(true);
      }
    }, 3000); // Reduced from 5000ms to 3000ms

    const initializeAuth = async () => {
      try {
        // ⭐ FASTER: Get current session quickly
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] ❌ Session error:', error);
          if (isMounted) {
            setAuthReady(true);
          }
          return;
        }

        if (session?.user && isMounted) {
          console.log('[AuthContext] 👤 Found existing session for:', session.user.id);
            // ⭐ ASYNC: Fetch profile in background, don't wait
          fetchAndSetProfile(session.user.id)
            .catch((error) => {
              console.warn('[AuthContext] ⚠️ Background profile fetch failed during init:', error);
              // Don't throw - this is a background operation
            })
            .finally(() => {
              if (isMounted) {
                setAuthReady(true);
                clearTimeout(authTimeout);
              }
            });
        } else {
          console.log('[AuthContext] 🚫 No active session');
          if (isMounted) {
            setAuthReady(true);
            clearTimeout(authTimeout);
          }
        }
        
      } catch (error) {
        console.error('[AuthContext] ❌ Auth initialization error:', error);
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
      console.log('[AuthContext] 🔄 Auth state changed:', event);
      
      if (!isMounted) return;

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            // ⭐ BACKGROUND: Don't block UI for profile fetching
            fetchAndSetProfile(session.user.id)
              .catch((error) => {
                console.warn('[AuthContext] ⚠️ Background profile fetch failed on sign in:', error);
                // Don't throw - this is a background operation
                // User can still use the app with basic auth data
              });
          }
          break;
          
        case 'SIGNED_OUT':
          setUser(null);
          // 💾 PERSISTENCE: Clear cached user on logout
          storage.local.remove('cached_user');
          storage.local.remove('cached_user_timestamp');
          storage.local.clear();
          storage.session.clear();
          break;
          
        case 'TOKEN_REFRESHED':
          console.log('[AuthContext] 🔄 Token refreshed');
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
      console.log('[AuthContext] 🔑 Logging in...');

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
        console.error('[AuthContext] ❌ Schema error during login:', schemaError);

        // If it's a schema error, try to handle it gracefully
        if (schemaError.message?.includes('Database error querying schema')) {
          throw new Error('Database configuration issue. Please contact support or try again later.');
        }
        throw schemaError;
      }

      if (error) throw error;

      console.log('[AuthContext] ✅ Login successful, fetching profile...');
      console.log('[AuthContext] 🔍 Auth data:', data);
      
      // ⭐ IMMEDIATE: Fetch profile right after login
      let userProfile = null;
      if (data.user) {
        try {
          console.log('[AuthContext] 📋 Fetching profile for user ID:', data.user.id);
          userProfile = await fetchAndSetProfile(data.user.id);
          console.log('[AuthContext] ✅ Profile fetched successfully:', userProfile);
        } catch (profileError) {
          console.warn('[AuthContext] ⚠️ Profile fetch failed:', profileError);
          console.log('[AuthContext] 🔧 Creating fallback profile...');
          
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
            console.warn('[AuthContext] ⚠️ Failed to cache fallback user:', error);
          }

          console.log('[AuthContext] 📋 Fallback profile created:', userProfile);
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
      
      console.log('[AuthContext] 🎯 Returning user for login:', returnUser);
      return { user: returnUser };
      
    } catch (error) {
      console.error('[AuthContext] ❌ Login error:', error);

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
      console.log('[AuthContext] 📝 Signing up...');

      // ⚠️ RACE CONDITION FIX: Check for existing users before creating auth user
      // This prevents orphaned auth users and provides better error messages
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingProfileError && existingProfileError.code !== 'PGRST116') {
        console.error('[AuthContext] ❌ Error checking existing profile:', existingProfileError);
        throw new Error('Unable to verify account status. Please try again.');
      }

      // Check if email already exists in profiles
      if (existingProfile) {
        throw new Error('An account with this email already exists. Please try logging in instead.');
      }

      console.log('[AuthContext] 🔍 Email verification passed, proceeding with signup...');

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
        console.error('[AuthContext] ❌ Auth signup failed:', error);
        throw error;
      }      // Only create profile if auth user was created successfully
      if (data.user) {
        console.log('[AuthContext] 👤 Auth user created successfully, now creating profile...');

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

          console.log('[AuthContext] 🔍 Validating auth user before profile creation...');

          // ⚠️ FOREIGN KEY FIX: Validate auth user exists before creating profile
          const authUserValid = await validateAuthUserExists(data.user.id);
          if (!authUserValid) {
            throw new Error('Auth user validation failed - cannot create profile');
          }

          // ⚠️ FOREIGN KEY FIX: Try safe profile creation, fallback to direct insert
          console.log('[AuthContext] 📝 Creating profile with foreign key validation...');

          let createdProfile;
          try {
            createdProfile = await createProfileSafe(profileData);
          } catch (safeError) {
            console.warn('[AuthContext] ⚠️ Safe creation failed, using direct insert:', safeError);
            const { data, error } = await supabase
              .from('profiles')
              .insert([profileData])
              .select()
              .single();

            if (error) throw error;
            createdProfile = data;
          }          console.log('[AuthContext] ✅ Profile created successfully with foreign key validation:', createdProfile);          // ⚠️ FIX: Normalize and cache user data like in login()
          normalizedUser = {
            ...createdProfile,
            role: normalizeRole(createdProfile.role || 'nonmember')
          };
          
          // Cache the normalized user data
          storage.local.set('cached_user', normalizedUser);
          storage.local.set('cached_user_timestamp', Date.now());
          
          // ⭐ FIX: Set user state immediately so signup component can show success
          setUser(normalizedUser);
          
          console.log('[AuthContext] 💾 User data normalized, cached, and state updated:', normalizedUser);

        } catch (profileCreationError) {
          console.error('[AuthContext] ❌ Profile creation process failed:', profileCreationError);
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
      console.error('[AuthContext] ❌ Signup error:', error);
      
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
      console.log('[AuthContext] 🔄 Sending password reset email...');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      console.log('[AuthContext] ✅ Password reset email sent successfully');
      showToast.success(
        'Reset Email Sent',
        'Please check your email for password reset instructions'
      );

      return { success: true };

    } catch (error) {
      console.error('[AuthContext] ❌ Password reset error:', error);

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
      console.log('[AuthContext] 🚪 Logging out...');

      // ⭐ CLEAR: All stored data including cached user
      storage.local.remove('cached_user');
      storage.local.remove('cached_user_timestamp');
      storage.local.remove(STORAGE_KEYS.USER_PREFERENCES);
      storage.local.remove(STORAGE_KEYS.DASHBOARD_CONFIG);
      storage.session.clear();

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);

      showToast.success('Logged Out', 'You have been successfully logged out');

      // ⭐ REDIRECT: Force redirect to login page
      window.location.href = '/login';

    } catch (error) {
      console.error('[AuthContext] ❌ Logout error:', error);
      showToast.error('Logout Failed', error.message);
      // ⭐ FALLBACK: Even if logout fails, redirect to login
      window.location.href = '/login';
    }
  };
  // ⚡ PERFORMANCE FIX: Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    authReady,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    fetchAndSetProfile,
    clearProfileCache,
  }), [user, authReady, loading, fetchAndSetProfile, clearProfileCache]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
