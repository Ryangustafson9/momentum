import { useMemo } from 'react';
import { useAuthQuery as useAuth } from '@/hooks/useAuthQuery';
import { normalizeRole } from '@/utils/accessControl';

/**
 * ⭐ PERFORMANCE: Memoized hook for auth-related computations
 * Use this instead of useAuth when you need derived values
 */
export const useAuthPerformance = () => {
  const { user, loading, authReady } = useAuth();

  // ⭐ MEMOIZED: All derived auth values
  const authData = useMemo(() => {
    const isAuthenticated = !!user;
    const userRole = user ? normalizeRole(user.role) : null;
    const userEmail = user?.email || null;
    const userName = user?.first_name || user?.display_name || userEmail?.split('@')[0] || null;
    
    return {
      user,
      loading,
      authReady,
      isAuthenticated,
      userRole,
      userEmail,
      userName,
      // Helper booleans
      isAdmin: userRole === 'admin',
      isStaff: userRole === 'staff' || userRole === 'admin',
      isMember: ['member', 'staff', 'admin'].includes(userRole),
      isGuest: !isAuthenticated
    };
  }, [user, loading, authReady]);

  return authData;
};

export default useAuthPerformance;