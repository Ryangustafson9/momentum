import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '@/lib/supabaseClient';
import { validateUserRole, normalizeRole } from '@/utils/accessControl';

const useAuthStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    user: null,
    loading: true,
    authReady: false,
    session: null,

    // Computed values - use direct state access to prevent loops
    isAuthenticated: () => {
      const state = get();
      return !!state.user;
    },
    userRole: () => {
      const state = get();
      return state.user ? normalizeRole(state.user.role) : null;
    },
    isAdmin: () => {
      const state = get();
      const role = state.user ? normalizeRole(state.user.role) : null;
      return role === 'admin';
    },
    isStaff: () => {
      const state = get();
      const role = state.user ? normalizeRole(state.user.role) : null;
      return ['staff', 'admin'].includes(role);
    },
    isMember: () => {
      const state = get();
      const role = state.user ? normalizeRole(state.user.role) : null;
      return ['member', 'staff', 'admin'].includes(role);
    },
    
    // Actions
    setUser: (userData) => {
      if (!userData) {
        set({ user: null });
        return;
      }

      const validation = validateUserRole(userData);
      if (validation.warning) {
        console.warn('⚠️ AuthStore user role warning:', validation.warning);
      }

      const safeUser = {
        ...userData,
        role: validation.role,
        normalizedRole: validation.role,
      };

      console.log('✅ AuthStore: Setting safe user:', {
        email: safeUser.email,
        role: safeUser.role,
        originalRole: userData.role
      });

      set({ user: safeUser });
    },

    setLoading: (loading) => set({ loading }),
    
    setAuthReady: (authReady) => set({ authReady }),
    
    setSession: (session) => set({ session }),

    // Auth methods
    login: async (email, password) => {
      set({ loading: true });

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Fetch user profile
        const userProfile = await get().fetchUserProfile(data.user);

        // Validate and set user directly
        const validation = validateUserRole(userProfile);
        const safeUser = {
          ...userProfile,
          role: validation.role,
          normalizedRole: validation.role,
        };

        set({
          user: safeUser,
          session: data.session,
          loading: false,
          authReady: true
        });

        return { user: safeUser };
      } catch (error) {
        console.error('❌ Login error:', error);
        set({ loading: false });
        throw error;
      }
    },

    logout: async () => {
      set({ loading: true });
      
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        set({ 
          user: null, 
          session: null,
          loading: false 
        });
      } catch (error) {
        console.error('❌ Logout error:', error);
        set({ loading: false });
        throw error;
      }
    },

    signup: async (email, password, userData = {}) => {
      set({ loading: true });
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData
          }
        });

        if (error) throw error;
        
        return { user: data.user };
      } catch (error) {
        console.error('❌ Signup error:', error);
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    fetchUserProfile: async (authUser) => {
      if (!authUser?.id) {
        console.warn('🚫 fetchUserProfile: No auth user provided');
        return null;
      }

      try {
        console.log('🔍 Fetching user profile for ID:', authUser.id, 'Email:', authUser.email);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.warn('⚠️ No profile found, creating default profile');
            return {
              id: authUser.id,
              email: authUser.email,
              role: 'member',
              first_name: authUser.user_metadata?.first_name || '',
              last_name: authUser.user_metadata?.last_name || '',
              status: 'active',
              created_at: new Date().toISOString(),
            };
          }
          throw error;
        }

        console.log('✅ User profile fetched:', data.email, 'Role:', data.role);
        return data;
      } catch (error) {
        console.error('❌ fetchUserProfile error:', error);
        throw error;
      }
    },

    // Initialize auth state
    initialize: async () => {
      const state = get();
      if (state.authReady) {
        console.log('🔄 AuthStore: Already initialized, skipping...');
        return;
      }

      try {
        console.log('🔄 AuthStore: Initializing...');
        set({ loading: true });

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Session error:', error);
          set({ loading: false, authReady: true });
          return;
        }

        if (session?.user) {
          const userProfile = await get().fetchUserProfile(session.user);
          set({
            user: userProfile,
            session,
            loading: false,
            authReady: true
          });
        } else {
          set({ loading: false, authReady: true });
        }

        console.log('✅ AuthStore: Initialization complete');
      } catch (error) {
        console.error('❌ AuthStore initialization error:', error);
        set({
          user: null,
          session: null,
          loading: false,
          authReady: true
        });
      }
    },

    // Handle auth state changes
    handleAuthStateChange: async (event, session) => {
      console.log('🔄 AuthStore: Auth state change:', event);

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          set({ loading: true });
          const userProfile = await get().fetchUserProfile(session.user);
          set({
            user: userProfile,
            session,
            loading: false,
            authReady: true
          });
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            session: null,
            loading: false,
            authReady: true
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed for:', session.user.email);
          set({ session });
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error);
        set({
          user: null,
          session: null,
          loading: false,
          authReady: true
        });
      }
    },
  }))
);

// Initialize auth state when store is created
let isInitialized = false;

// Subscribe to auth state changes only once
if (!isInitialized) {
  supabase.auth.onAuthStateChange((event, session) => {
    const state = useAuthStore.getState();
    state.handleAuthStateChange(event, session);
  });

  // Initialize on store creation
  useAuthStore.getState().initialize();
  isInitialized = true;
}

export default useAuthStore;
