import { useCallback } from 'react';
import useAuthStore from '@/shared/stores/authStore';
import { shallow } from 'zustand/shallow';

/**
 * Modern auth hook using Zustand store
 * Provides optimized selectors and memoized actions
 */
export const useAuth = () => {
  // Use shallow comparison for better performance
  const authState = useAuthStore(
    (state) => ({
      user: state.user,
      loading: state.loading,
      authReady: state.authReady,
      session: state.session,
    }),
    shallow
  );

  // Get computed values
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const userRole = useAuthStore((state) => state.userRole());
  const isAdmin = useAuthStore((state) => state.isAdmin());
  const isStaff = useAuthStore((state) => state.isStaff());
  const isMember = useAuthStore((state) => state.isMember());

  // Get actions
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const signup = useAuthStore((state) => state.signup);

  // Memoized helper functions
  const hasRole = useCallback((role) => {
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    return userRole === role;
  }, [userRole]);

  const hasPermission = useCallback((permission) => {
    // Basic permission check - can be extended
    if (!isAuthenticated) return false;
    
    // Admin has all permissions
    if (isAdmin) return true;
    
    // Staff has most permissions except admin-only
    if (isStaff && !permission?.includes('admin')) return true;
    
    // Member has basic permissions
    if (isMember && permission?.includes('member')) return true;
    
    return false;
  }, [isAuthenticated, isAdmin, isStaff, isMember]);

  const canAccess = useCallback((resource, action = 'read') => {
    if (!isAuthenticated) return false;
    
    // Define access control rules
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
      attendance: {
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

  // User info helpers
  const getUserDisplayName = useCallback(() => {
    if (!authState.user) return null;
    
    const { first_name, last_name, email } = authState.user;
    
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    }
    
    if (first_name) return first_name;
    if (last_name) return last_name;
    
    return email?.split('@')[0] || 'User';
  }, [authState.user]);

  const getUserInitials = useCallback(() => {
    if (!authState.user) return 'U';
    
    const { first_name, last_name, email } = authState.user;
    
    if (first_name && last_name) {
      return `${first_name[0]}${last_name[0]}`.toUpperCase();
    }
    
    if (first_name) return first_name[0].toUpperCase();
    if (last_name) return last_name[0].toUpperCase();
    
    return email?.[0]?.toUpperCase() || 'U';
  }, [authState.user]);

  return {
    // State
    ...authState,
    
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
    
    // Helper functions
    hasRole,
    hasPermission,
    canAccess,
    getUserDisplayName,
    getUserInitials,
    
    // Convenience getters
    get userName() {
      return getUserDisplayName();
    },
    
    get userInitials() {
      return getUserInitials();
    },
    
    get userEmail() {
      return authState.user?.email || null;
    },
  };
};

/**
 * Hook for components that only need auth status
 */
export const useAuthStatus = () => {
  return useAuthStore(
    (state) => ({
      isAuthenticated: state.isAuthenticated(),
      loading: state.loading,
      authReady: state.authReady,
    }),
    shallow
  );
};

/**
 * Hook for components that only need user info
 */
export const useUser = () => {
  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.userRole());
  
  return {
    user,
    userRole,
    isAdmin: userRole === 'admin',
    isStaff: ['staff', 'admin'].includes(userRole),
    isMember: ['member', 'staff', 'admin'].includes(userRole),
  };
};

/**
 * Hook for role-based access control
 */
export const useRoleAccess = () => {
  const userRole = useAuthStore((state) => state.userRole());
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  
  const hasRole = useCallback((role) => {
    if (!isAuthenticated) return false;
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    return userRole === role;
  }, [userRole, isAuthenticated]);

  const requiresRole = useCallback((requiredRole) => {
    return hasRole(requiredRole);
  }, [hasRole]);

  return {
    userRole,
    hasRole,
    requiresRole,
    isAdmin: userRole === 'admin',
    isStaff: ['staff', 'admin'].includes(userRole),
    isMember: ['member', 'staff', 'admin'].includes(userRole),
  };
};

export default useAuth;
