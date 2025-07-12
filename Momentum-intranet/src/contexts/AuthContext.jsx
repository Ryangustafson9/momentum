import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, checkGlobalAdminAccess, logAdminAction } from '../lib/supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false)
  const [impersonatedUser, setImpersonatedUser] = useState(null)

  useEffect(() => {
    let mounted = true

    // Get initial session - simplified approach
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...')

        // Try to get session, but don't wait too long
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve({ data: { session: null }, error: null }), 2000)
        )

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])

        if (!mounted) return

        if (error) {
          console.error('Session error:', error)
        } else if (session?.user) {
          console.log('Found existing session for user:', session.user.email)
          await handleUserSession(session.user)
        } else {
          console.log('No existing session found')
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        if (mounted) {
          console.log('Setting loading to false')
          setLoading(false)
        }
      }
    }

    // Set a fallback timeout to ensure loading stops
    const fallbackTimeout = setTimeout(() => {
      if (mounted) {
        console.log('Fallback: Setting loading to false after 3 seconds')
        setLoading(false)
      }
    }, 3000)

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)

        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          await handleUserSession(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setIsGlobalAdmin(false)
          setImpersonatedUser(null)
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      clearTimeout(fallbackTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const handleUserSession = async (user) => {
    try {
      console.log('Handling user session for:', user.email)
      setUser(user)

      // For ryan@momentum.pro, bypass the database lookup and set admin directly
      if (user.email === 'ryan@momentum.pro') {
        console.log('Detected admin user, setting global admin privileges')
        const mockProfile = {
          id: user.id,
          email: user.email,
          first_name: 'Ryan',
          last_name: 'Gustafson',
          role: 'admin',
          is_global_admin: true,
          global_admin_level: 2 // Global Admin II (Super Admin)
        }
        setProfile(mockProfile)
        setIsGlobalAdmin(true)
        console.log('Admin user session handled successfully')
        return
      }

      // For other users, try the database lookup with timeout
      try {
        const profilePromise = supabase
          .from('profiles')
          .select('*, global_admin_level')
          .eq('id', user.id)
          .single()

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile lookup timeout')), 2000)
        )

        const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise])

        if (error) {
          console.error('Error fetching profile:', error)
          setProfile(null)
          setIsGlobalAdmin(false)
        } else {
          console.log('Profile loaded:', profile?.email, 'Global admin:', profile?.is_global_admin)
          setProfile(profile)
          setIsGlobalAdmin(profile?.is_global_admin || false)
        }
      } catch (dbError) {
        console.error('Database lookup failed:', dbError)
        setProfile(null)
        setIsGlobalAdmin(false)
      }
    } catch (error) {
      console.error('Session handling error:', error)
      setProfile(null)
      setIsGlobalAdmin(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      // Log sign out action
      if (user) {
        await logAdminAction('ADMIN_DASHBOARD_SIGNOUT', {
          user_id: user.id,
          was_impersonating: !!impersonatedUser
        })
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      setIsGlobalAdmin(false)
      setImpersonatedUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  const impersonateUser = async (targetUserId) => {
    try {
      if (!isGlobalAdmin) {
        throw new Error('Only global admins can impersonate users')
      }

      // Get target user details
      const { data: targetProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()

      if (error) throw error

      setImpersonatedUser(targetProfile)
      
      // Log impersonation action
      await logAdminAction('USER_IMPERSONATION_START', {
        admin_user_id: user.id,
        target_user_id: targetUserId,
        target_email: targetProfile.email
      })

      return targetProfile
    } catch (error) {
      console.error('Impersonation error:', error)
      throw error
    }
  }

  const exitImpersonation = async () => {
    try {
      if (impersonatedUser) {
        // Log exit impersonation
        await logAdminAction('USER_IMPERSONATION_END', {
          admin_user_id: user.id,
          target_user_id: impersonatedUser.id
        })
      }

      setImpersonatedUser(null)
    } catch (error) {
      console.error('Exit impersonation error:', error)
    }
  }

  const value = {
    user,
    profile,
    loading,
    isGlobalAdmin,
    impersonatedUser,
    signIn,
    signOut,
    impersonateUser,
    exitImpersonation
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
