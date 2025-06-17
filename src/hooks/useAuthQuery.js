// 🔐 UNIFIED AUTH SYSTEM - React Query powered authentication
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { validateUserRole, normalizeRole } from '@/utils/accessControl';

// ⭐ QUERY KEYS - Centralized query key management
export const authQueryKeys = {
  all: ['auth'],
  session: () => [...authQueryKeys.all, 'session'],
  user: () => [...authQueryKeys.all, 'user'],
  profile: (userId) => [...authQueryKeys.all, 'profile', userId],
};

// ⭐ AUTH SERVICE - Centralized auth operations
const authService = {
  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Get user profile from database
  async getUserProfile(userId) {
    if (!userId) return null;
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Profile not found, using auth user data:', error);
      return null;
    }

    // Validate and normalize role
    const validation = validateUserRole(profile);
    return {
      ...profile,
      role: validation.role,
      normalizedRole: validation.role,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email?.split('@')[0] || 'User'
    };
  },

  // Login with email/password
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Signup with email/password
  async signup(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });

    if (error) throw error;
    return data;
  },

  // Logout
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Update user profile
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ⭐ MAIN AUTH HOOK - React Query powered
export const useAuthQuery = () => {
  const queryClient = useQueryClient();
  const [authReady, setAuthReady] = useState(false);

  // Session query
  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError
  } = useQuery({
    queryKey: authQueryKeys.session(),
    queryFn: authService.getSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // User profile query (depends on session)
  const {
    data: user,
    isLoading: userLoading,
    error: userError
  } = useQuery({
    queryKey: authQueryKeys.profile(session?.user?.id),
    queryFn: () => authService.getUserProfile(session?.user?.id),
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // formerly cacheTime
    retry: 1,
  });

  // Combined loading state
  const loading = sessionLoading || (session?.user && userLoading);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => authService.login(email, password),
    onSuccess: (data) => {
      // Invalidate and refetch auth queries
      queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
    },
    onError: (error) => {
      console.error('❌ Login error:', error);
    }
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: ({ email, password, userData }) => authService.signup(email, password, userData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
    },
    onError: (error) => {
      console.error('❌ Signup error:', error);
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: authQueryKeys.all });
      queryClient.clear(); // Clear entire cache for security
    },
    onError: (error) => {
      console.error('❌ Logout error:', error);
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: ({ userId, updates }) => authService.updateProfile(userId, updates),
    onSuccess: (updatedProfile) => {
      // Update the user query cache
      queryClient.setQueryData(authQueryKeys.profile(updatedProfile.id), updatedProfile);
    },
    onError: (error) => {
      console.error('❌ Update profile error:', error);
    }
  });

  // Auth state change listener
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state change:', event);

        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
            break;
          case 'SIGNED_OUT':
            queryClient.removeQueries({ queryKey: authQueryKeys.all });
            break;
        }

        if (!authReady) {
          setAuthReady(true);
        }
      }
    );

    // Set auth ready after initial load
    const timer = setTimeout(() => {
      if (mounted && !authReady) {
        setAuthReady(true);
      }
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, [queryClient, authReady]);

  // Computed values
  const isAuthenticated = !!session?.user && !!user;
  const userRole = user?.role || 'nonmember';
  const isAdmin = userRole === 'admin';
  const isStaff = ['staff', 'admin'].includes(userRole);
  const isMember = ['member', 'staff', 'admin'].includes(userRole);

  // Helper functions
  const hasRole = useCallback((role) => {
    return userRole === role;
  }, [userRole]);

  const hasPermission = useCallback((permission) => {
    const permissions = {
      admin: ['admin'],
      staff: ['staff', 'admin'],
      member: ['member', 'staff', 'admin'],
    };
    return permissions[permission]?.includes(userRole) || false;
  }, [userRole]);

  const canAccess = useCallback((resource, action = 'read') => {
    if (!isAuthenticated) return false;
    
    const accessRules = {
      members: {
        read: ['admin', 'staff'],
        write: ['admin', 'staff'],
        delete: ['admin'],
      },
      classes: {
        read: ['admin', 'staff', 'member'],
        write: ['admin', 'staff'],
        delete: ['admin'],
      },
      billing: {
        read: ['admin', 'staff'],
        write: ['admin', 'staff'],
        delete: ['admin'],
      },
      equipment: {
        read: ['admin', 'staff'],
        write: ['admin', 'staff'],
        delete: ['admin'],
      },
      communications: {
        read: ['admin', 'staff'],
        write: ['admin', 'staff'],
        delete: ['admin'],
      },
      settings: {
        read: ['admin', 'staff'],
        write: ['admin'],
        delete: ['admin'],
      },
    };

    const resourceRules = accessRules[resource];
    if (!resourceRules) return false;

    const allowedRoles = resourceRules[action];
    if (!allowedRoles) return false;

    return allowedRoles.includes(userRole);
  }, [isAuthenticated, userRole]);

  const getUserDisplayName = useCallback(() => {
    if (!user) return 'User';
    return user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || 'User';
  }, [user]);

  const getUserInitials = useCallback(() => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }, [getUserDisplayName]);

  // Action wrappers
  const login = useCallback(async (email, password) => {
    return loginMutation.mutateAsync({ email, password });
  }, [loginMutation]);

  const signup = useCallback(async (email, password, userData = {}) => {
    return signupMutation.mutateAsync({ email, password, userData });
  }, [signupMutation]);

  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const updateProfile = useCallback(async (updates) => {
    if (!user?.id) throw new Error('No user to update');
    return updateProfileMutation.mutateAsync({ userId: user.id, updates });
  }, [updateProfileMutation, user?.id]);

  return {
    // State
    user,
    session,
    loading,
    authReady,
    
    // Computed values
    isAuthenticated,
    userRole,
    isAdmin,
    isStaff,
    isMember,
    
    // Actions
    login,
    logout,
    signup,
    updateProfile,
    
    // Helper functions
    hasRole,
    hasPermission,
    canAccess,
    getUserDisplayName,
    getUserInitials,
    
    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    
    // Errors
    loginError: loginMutation.error,
    signupError: signupMutation.error,
    logoutError: logoutMutation.error,
    updateProfileError: updateProfileMutation.error,
    sessionError,
    userError,
    
    // Convenience getters
    get userName() {
      return getUserDisplayName();
    },
    
    get userInitials() {
      return getUserInitials();
    },
    
    get userEmail() {
      return user?.email || session?.user?.email || null;
    },
  };
};

// ⭐ LIGHTWEIGHT AUTH STATUS HOOK - For components that only need auth status
export const useAuthStatus = () => {
  const { isAuthenticated, loading, authReady, userRole } = useAuthQuery();
  
  return {
    isAuthenticated,
    loading,
    authReady,
    userRole,
  };
};
