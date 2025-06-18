import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { showToast } from '@/utils/toastUtils';
import { storage, STORAGE_KEYS } from '@/utils/storageUtils';
import { normalizeRole } from '@/utils/roleUtils';
import { createProfileSafe, validateAuthUserExists } from '@/utils/profileValidation';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // ⭐ SIMPLIFIED: Faster user profile fetching
  const fetchUserProfile = async (userId) => {
    try {
      console.log('[AuthContext] 🔍 Fetching user profile for:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AuthContext] ❌ Profile fetch error:', error);
        
        // ⭐ CHECK: If profile doesn't exist, create one
        if (error.code === 'PGRST116') { // No rows returned
          console.log('[AuthContext] 📝 No profile found, creating basic profile...');

          // ⭐ GET: User email from auth session
          const { data: { session } } = await supabase.auth.getSession();
          const userEmail = session?.user?.email || `user_${userId}@temp.local`;

          console.log('[AuthContext] 📧 Using email for profile:', userEmail);

          // ⭐ CHECK: If email already exists, try to find that profile first
          if (userEmail && userEmail !== `user_${userId}@temp.local`) {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', userEmail)
              .single();

            if (existingProfile) {
              console.log('[AuthContext] 🔍 Found existing profile with same email:', existingProfile);
              // Update the existing profile with the correct user ID
              const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update({ id: userId })
                .eq('email', userEmail)
                .select()
                .single();

              if (!updateError && updatedProfile) {
                console.log('[AuthContext] ✅ Updated existing profile:', updatedProfile);
                setUser(updatedProfile);
                return updatedProfile;
              }
            }
          }

          // ⭐ TRY: Create a basic profile with unique email (using only existing fields)
          const newProfile = {
            id: userId,
            role: 'nonmember', // Default to nonmember for new signups
            first_name: '',
            last_name: '',
            email: userEmail, // ⭐ FIXED: Use actual email from auth or temp email
            name: '' // Add name field that exists in schema
          };

          // ⚠️ FOREIGN KEY FIX: Try safe function first, fallback to direct insert
          let insertData, insertError;

          try {
            // Try using safe creation function
            const result = await supabase.rpc('create_profile_safe', {
              p_user_id: newProfile.id,
              p_email: newProfile.email,
              p_role: newProfile.role,
              p_first_name: newProfile.first_name,
              p_last_name: newProfile.last_name,
              p_phone: null
            });
            insertData = result.data;
            insertError = result.error;
          } catch (rpcError) {
            // Fallback to direct insert if function doesn't exist
            console.warn('[AuthContext] ⚠️ Safe function not available, using direct insert');
            const result = await supabase
              .from('profiles')
              .insert([newProfile])
              .select()
              .single();
            insertData = result.data;
            insertError = result.error;
          }

          if (insertError) {
            console.error('[AuthContext] ❌ Failed to create profile:', insertError);

            // ⭐ FALLBACK: If still failing due to email conflict, use temp email
            if (insertError.code === '23505' && insertError.message.includes('email')) {
              console.log('[AuthContext] 🔄 Retrying with unique temp email...');
              const tempEmail = `user_${userId}_${Date.now()}@temp.local`;
              newProfile.email = tempEmail;

              // ⚠️ FOREIGN KEY FIX: Try safe function for retry, fallback to direct insert
              let retryData, retryError;

              try {
                const result = await supabase.rpc('create_profile_safe', {
                  p_user_id: newProfile.id,
                  p_email: newProfile.email,
                  p_role: newProfile.role,
                  p_first_name: newProfile.first_name,
                  p_last_name: newProfile.last_name,
                  p_phone: null
                });
                retryData = result.data;
                retryError = result.error;
              } catch (rpcError) {
                const result = await supabase
                  .from('profiles')
                  .insert([newProfile])
                  .select()
                  .single();
                retryData = result.data;
                retryError = result.error;
              }

              if (!retryError && retryData) {
                console.log('[AuthContext] ✅ Created profile with temp email:', retryData);
                setUser(retryData);
                return retryData;
              }
            }

            // Return fallback profile anyway
            return newProfile;
          }

          console.log('[AuthContext] ✅ Created new profile:', insertData);
          setUser(insertData);
          return insertData;
        }
        
        throw error;
      }

      // ⭐ VALIDATE: Ensure role exists
      if (!data.role || data.role === null) {
        console.warn('[AuthContext] ⚠️ Profile has no role, defaulting to nonmember');
        data.role = 'nonmember';
        
        // Update the profile with default role
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'nonmember' })
          .eq('id', userId);
          
        if (updateError) {
          console.error('[AuthContext] ❌ Failed to update role:', updateError);
        }
      }

      // ⭐ NORMALIZE: Clean and normalize the user data
      const normalizedUser = {
        ...data,
        role: normalizeRole(data.role || 'nonmember')
      };

      console.log('[AuthContext] ✅ Profile fetched and normalized:', {
        id: normalizedUser.id,
        email: normalizedUser.email,
        role: normalizedUser.role
      });
      
      setUser(normalizedUser);
      return normalizedUser;
      
    } catch (error) {
      console.error('[AuthContext] ❌ Error fetching profile:', error);
      
      // ⭐ FALLBACK: Don't break auth flow, create minimal user
      const fallbackUser = {
        id: userId,
        role: 'nonmember',
        email: 'unknown@example.com',
        first_name: '',
        last_name: '',
        name: ''
      };
      
      console.log('[AuthContext] 🔧 Using fallback user:', fallbackUser);
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  // ⭐ SIMPLIFIED: Auth state listener with faster timeout
  useEffect(() => {
    console.log('[AuthContext] 🔄 Initializing auth state...');
    
    let isMounted = true;
    let timeoutId;
    
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
          fetchUserProfile(session.user.id)
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
            fetchUserProfile(session.user.id)
              .catch((error) => {
                console.warn('[AuthContext] ⚠️ Background profile fetch failed on sign in:', error);
                // Don't throw - this is a background operation
                // User can still use the app with basic auth data
              });
          }
          break;
          
        case 'SIGNED_OUT':
          setUser(null);
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
          userProfile = await fetchUserProfile(data.user.id);
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
      }

      // Only create profile if auth user was created successfully
      if (data.user) {
        console.log('[AuthContext] 👤 Auth user created successfully, now creating profile...');

        try {
          const profileData = {
            id: data.user.id,
            role: 'nonmember', // All app signups are nonmembers - admins created at DB level
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
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
          }

          console.log('[AuthContext] ✅ Profile created successfully with foreign key validation:', createdProfile);

        } catch (profileCreationError) {
          console.error('[AuthContext] ❌ Profile creation process failed:', profileCreationError);
          throw profileCreationError;
        }

        showToast.success(
          'Account Created!',
          'Please check your email to verify your account.'
        );
      } else {
        throw new Error('User creation failed - no user data returned.');
      }

      return { user: data.user };
      
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

      // ⭐ CLEAR: All stored data
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
    fetchUserProfile,
  }), [user, authReady, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;