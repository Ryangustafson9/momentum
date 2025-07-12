import { createClient } from '@supabase/supabase-js'

// Supabase configuration - using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Admin-specific helper functions
export const checkGlobalAdminAccess = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_global_admin, role, global_admin_level')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw new Error('Failed to fetch user profile')
    }

    if (!profile?.is_global_admin) {
      throw new Error('Insufficient privileges - Global admin access required')
    }

    return { user, profile }
  } catch (error) {
    console.error('Global admin access check failed:', error)
    throw error
  }
}

// Check if user is Global Admin II (Super Admin)
export const checkGlobalAdminIIAccess = async () => {
  try {
    const { user, profile } = await checkGlobalAdminAccess()

    if (profile.global_admin_level !== 2) {
      throw new Error('Insufficient privileges - Global Admin II (Super Admin) access required')
    }

    return { user, profile }
  } catch (error) {
    console.error('Global Admin II access check failed:', error)
    throw error
  }
}

// Check if user is Global Admin I or II
export const checkGlobalAdminAnyLevel = async () => {
  try {
    const { user, profile } = await checkGlobalAdminAccess()

    if (!profile.global_admin_level || ![1, 2].includes(profile.global_admin_level)) {
      throw new Error('Insufficient privileges - Global Admin access required')
    }

    return { user, profile }
  } catch (error) {
    console.error('Global Admin access check failed:', error)
    throw error
  }
}

// Audit logging function
export const logAdminAction = async (action, details = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Simple audit log entry
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action,
        details,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Audit log error:', error)
    }
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // Don't throw - audit logging shouldn't block the app
  }
}