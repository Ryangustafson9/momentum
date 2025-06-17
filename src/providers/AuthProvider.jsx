// 🔐 AUTH PROVIDER - React Query powered authentication provider
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { authQueryKeys } from '@/hooks/useAuthQuery';

// ⭐ AUTH CONTEXT - Minimal context for auth state
const AuthContext = createContext({
  authReady: false,
  sessionTimeout: null,
  startRoleImpersonation: null,
  stopRoleImpersonation: null,
  isImpersonating: false,
  originalUser: null,
});

// ⭐ SESSION TIMEOUT CONFIGURATION
const SESSION_CONFIG = {
  TIMEOUT_MINUTES: 30, // 30 minutes as requested
  WARNING_MINUTES: 5,  // Show warning 5 minutes before timeout
  CHECK_INTERVAL: 60000, // Check every minute
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [authReady, setAuthReady] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  
  // Role impersonation state
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalUser, setOriginalUser] = useState(null);
  const [impersonatedRole, setImpersonatedRole] = useState(null);

  // ⭐ SESSION TIMEOUT MANAGEMENT
  useEffect(() => {
    let timeoutId;
    let warningId;
    let intervalId;

    const resetTimeout = () => {
      setLastActivity(Date.now());
      
      // Clear existing timeouts
      clearTimeout(timeoutId);
      clearTimeout(warningId);
      setShowTimeoutWarning(false);

      // Set warning timeout (25 minutes)
      warningId = setTimeout(() => {
        setShowTimeoutWarning(true);
        console.warn('⚠️ Session will expire in 5 minutes');
      }, (SESSION_CONFIG.TIMEOUT_MINUTES - SESSION_CONFIG.WARNING_MINUTES) * 60 * 1000);

      // Set logout timeout (30 minutes)
      timeoutId = setTimeout(async () => {
        console.warn('⏰ Session timeout - logging out user');
        try {
          await supabase.auth.signOut();
          queryClient.clear();
        } catch (error) {
          console.error('❌ Auto-logout error:', error);
        }
      }, SESSION_CONFIG.TIMEOUT_MINUTES * 60 * 1000);
    };

    const handleActivity = () => {
      resetTimeout();
    };

    // Activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check session validity every minute
    intervalId = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          console.warn('⚠️ Session invalid - clearing auth state');
          queryClient.removeQueries({ queryKey: authQueryKeys.all });
        }
      } catch (error) {
        console.error('❌ Session check error:', error);
      }
    }, SESSION_CONFIG.CHECK_INTERVAL);

    // Initialize timeout
    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(warningId);
      clearInterval(intervalId);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [queryClient]);

  // ⭐ AUTH STATE LISTENER
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 AuthProvider: Auth state change:', event);

        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ User signed in:', session?.user?.email);
            queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
            setShowTimeoutWarning(false);
            break;
            
          case 'SIGNED_OUT':
            console.log('👋 User signed out');
            queryClient.removeQueries({ queryKey: authQueryKeys.all });
            setShowTimeoutWarning(false);
            // Reset impersonation state
            setIsImpersonating(false);
            setOriginalUser(null);
            setImpersonatedRole(null);
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed for:', session?.user?.email);
            queryClient.invalidateQueries({ queryKey: authQueryKeys.session() });
            break;
            
          case 'PASSWORD_RECOVERY':
            console.log('🔑 Password recovery initiated');
            break;
        }

        // Set auth ready after first event
        if (!authReady) {
          setAuthReady(true);
        }
      }
    );

    // Fallback timeout to set auth ready
    const fallbackTimeout = setTimeout(() => {
      if (mounted && !authReady) {
        console.log('⏰ AuthProvider: Setting authReady via fallback timeout');
        setAuthReady(true);
      }
    }, 2000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      subscription?.unsubscribe();
    };
  }, [queryClient, authReady]);

  // ⭐ ROLE IMPERSONATION FUNCTIONS
  const startRoleImpersonation = (targetRole) => {
    if (isImpersonating) {
      console.warn('⚠️ Already impersonating a role');
      return;
    }

    // Get current user from query cache
    const currentUser = queryClient.getQueryData(authQueryKeys.user());
    if (!currentUser) {
      console.error('❌ No current user to impersonate from');
      return;
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'staff') {
      console.error('❌ Only admin/staff can impersonate roles');
      return;
    }

    console.log(`🎭 Starting role impersonation: ${currentUser.role} -> ${targetRole}`);
    
    setOriginalUser(currentUser);
    setImpersonatedRole(targetRole);
    setIsImpersonating(true);

    // Update user data in cache with impersonated role
    const impersonatedUser = {
      ...currentUser,
      role: targetRole,
      originalRole: currentUser.role,
      isImpersonating: true,
    };

    queryClient.setQueryData(authQueryKeys.profile(currentUser.id), impersonatedUser);
  };

  const stopRoleImpersonation = () => {
    if (!isImpersonating || !originalUser) {
      console.warn('⚠️ Not currently impersonating');
      return;
    }

    console.log(`🎭 Stopping role impersonation: ${impersonatedRole} -> ${originalUser.role}`);

    // Restore original user data in cache
    queryClient.setQueryData(authQueryKeys.profile(originalUser.id), originalUser);

    setIsImpersonating(false);
    setOriginalUser(null);
    setImpersonatedRole(null);
  };

  // ⭐ SESSION TIMEOUT WARNING COMPONENT
  const SessionTimeoutWarning = () => {
    if (!showTimeoutWarning) return null;

    return (
      <div className="fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded shadow-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">
              Your session will expire in 5 minutes due to inactivity.
            </p>
          </div>
          <div className="ml-4">
            <button
              onClick={() => setShowTimeoutWarning(false)}
              className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  };

  const contextValue = {
    authReady,
    sessionTimeout,
    startRoleImpersonation,
    stopRoleImpersonation,
    isImpersonating,
    originalUser,
    impersonatedRole,
    showTimeoutWarning,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <SessionTimeoutWarning />
    </AuthContext.Provider>
  );
};
