import { supabase } from './supabaseClient'

// JWT Secret - Must match the one in Admin HQ
const JWT_SECRET = 'momentum-sso-secret-key-2024-admin-hq-secure'

// Simple JWT implementation for SSO tokens (same as Admin HQ)
class SimpleJWT {
  static base64UrlEncode(str) {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  static base64UrlDecode(str) {
    str += '='.repeat((4 - str.length % 4) % 4)
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'))
  }

  static async verify(token, secret) {
    try {
      const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')
      
      if (!encodedHeader || !encodedPayload || !encodedSignature) {
        throw new Error('Invalid token format')
      }

      // Verify signature
      const data = `${encodedHeader}.${encodedPayload}`
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      )

      const signature = new Uint8Array(
        Array.from(this.base64UrlDecode(encodedSignature)).map(c => c.charCodeAt(0))
      )

      const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data))
      
      if (!isValid) {
        throw new Error('Invalid signature')
      }

      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload))
      
      // Check expiration
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        throw new Error('Token expired')
      }

      return payload
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`)
    }
  }
}

// Verify SSO token and create authenticated session
export const processSSOLogin = async (token) => {
  try {
    console.log('Processing SSO login with token...')

    // Verify JWT signature and decode payload
    const payload = await SimpleJWT.verify(token, JWT_SECRET)
    console.log('Token verified successfully:', payload)

    // Check if token has been used (nonce check)
    const { data: existingToken, error: tokenError } = await supabase
      .from('sso_tokens')
      .select('*')
      .eq('nonce', payload.nonce)
      .eq('used', false)
      .single()

    if (tokenError || !existingToken) {
      throw new Error('Token not found or already used')
    }

    // Get current organization from URL or environment
    const currentOrgSlug = window.location.hostname.split('.')[0] || 'momentum-demo'
    const isDevelopment = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')

    console.log('Organization validation (processSSOLogin):', {
      currentOrgSlug,
      tokenOrgSlug: payload.organization_slug,
      isDevelopment,
      hostname: window.location.hostname
    })

    // Validate organization match - bypass in development
    if (!isDevelopment && payload.organization_slug !== currentOrgSlug) {
      throw new Error(`Organization mismatch - token for '${payload.organization_slug}' but current site is '${currentOrgSlug}'`)
    }

    if (isDevelopment) {
      console.warn('⚠️ SSO: Bypassing organization validation in development mode')
    }

    // Get the Global Administrator profile for this organization
    const { data: globalAdminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('first_name', 'Global')
      .eq('last_name', 'Administrator')
      .eq('role', 'admin')
      .eq('organization_id', payload.target_organization_id)
      .single()

    if (profileError || !globalAdminProfile) {
      console.error('Global Administrator profile not found:', profileError)
      throw new Error('Global Administrator profile not found for this organization')
    }

    // Mark token as used
    const { error: updateError } = await supabase
      .from('sso_tokens')
      .update({ 
        used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('nonce', payload.nonce)

    if (updateError) {
      console.error('Failed to mark token as used:', updateError)
    }

    // Create a proper Supabase auth session for the global admin
    try {
      // Use Supabase admin client to create a session for the global admin
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
        user_id: globalAdminProfile.id,
        expires_at: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour from now
      })

      if (sessionError) {
        console.error('Failed to create admin session:', sessionError)
        throw new Error('Failed to create authenticated session')
      }

      console.log('SSO session created successfully for:', globalAdminProfile.email)

      // Store additional SSO session info in localStorage
      const ssoSession = {
        user: globalAdminProfile,
        sso: true,
        expires_at: Date.now() + (60 * 60 * 1000), // 1 hour
        created_at: Date.now(),
        session_id: sessionData.session?.access_token
      }

      localStorage.setItem('momentum_sso_session', JSON.stringify(ssoSession))

    } catch (sessionError) {
      console.error('Session creation failed:', sessionError)
      // Fallback to localStorage-only session for development
      const ssoSession = {
        user: globalAdminProfile,
        sso: true,
        expires_at: Date.now() + (60 * 60 * 1000), // 1 hour
        created_at: Date.now(),
        fallback: true
      }
      localStorage.setItem('momentum_sso_session', JSON.stringify(ssoSession))
      console.warn('⚠️ Using fallback SSO session - some features may not work')
    }

    // Log successful SSO login
    await supabase
      .from('audit_logs')
      .insert({
        user_id: payload.admin_user_id,
        action: 'SSO_LOGIN_SUCCESS',
        details: {
          organization_slug: payload.organization_slug,
          target_organization_id: payload.target_organization_id,
          login_method: 'sso',
          timestamp: new Date().toISOString()
        }
      })

    return {
      success: true,
      user: globalAdminProfile,
      redirectTo: '/staff-portal/dashboard' // Redirect to staff portal for admins
    }

  } catch (error) {
    console.error('SSO login failed:', error)
    
    // Log failed SSO attempt
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: null,
          action: 'SSO_LOGIN_FAILED',
          details: {
            error: error.message,
            timestamp: new Date().toISOString()
          }
        })
    } catch (logError) {
      console.error('Failed to log SSO failure:', logError)
    }

    throw error
  }
}

// Alternative SSO approach using direct session creation
export const createSSOSession = async (token) => {
  try {
    console.log('Creating SSO session with token...')

    // Verify token
    const payload = await SimpleJWT.verify(token, JWT_SECRET)
    console.log('Token verified, payload:', payload)

    // For SSO from admin HQ, we don't need to check the sso_tokens table
    // The JWT token itself is the authorization - it's signed by admin HQ
    // We just need to validate the organization and create a session with the local Global Administrator
    console.log('SSO token validated by JWT signature - proceeding with organization validation')

    // Validate organization
    const hostname = window.location.hostname
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
    const currentOrgSlug = isLocalhost ? 'momentum-demo' : hostname.split('.')[0]

    console.log('Organization validation:', {
      hostname,
      isLocalhost,
      currentOrgSlug,
      tokenOrgSlug: payload.organization_slug
    })

    // In development (localhost), allow SSO to any organization
    // In production, enforce strict organization matching
    if (!isLocalhost && payload.organization_slug !== currentOrgSlug) {
      throw new Error(`Organization mismatch: token for '${payload.organization_slug}' but current site is '${currentOrgSlug}'`)
    }

    // For localhost, we'll use the organization from the token instead of the current site
    const targetOrgSlug = isLocalhost ? payload.organization_slug : currentOrgSlug

    // No need to mark token as used since we're not using the sso_tokens table
    // The JWT token expiration handles the security

    // Get the Global Administrator profile for this organization
    // This is the local admin account that will be used for the SSO session
    console.log('Looking for Global Administrator profile for organization:', payload.target_organization_id)
    let globalAdminProfile = null

    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('first_name', 'Global')
      .eq('last_name', 'Administrator')
      .eq('role', 'admin')
      .eq('organization_id', payload.target_organization_id)
      .eq('is_global_admin', true)
      .single()

    if (profileError || !existingProfile) {
      console.error('Global Administrator profile not found:', profileError)
      console.log('Creating Global Administrator profile for organization:', payload.target_organization_id)

      // Create the Global Administrator profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          organization_id: payload.target_organization_id,
          first_name: 'Global',
          last_name: 'Administrator',
          email: `global.admin@${payload.organization_slug}.momentum.internal`,
          role: 'admin',
          status: 'active',
          is_global_admin: true
        })
        .select()
        .single()

      if (createError || !newProfile) {
        console.error('Failed to create Global Administrator profile:', createError)
        throw new Error(`Failed to create Global Administrator profile for organization ${payload.target_organization_id}`)
      }

      console.log('Created Global Administrator profile:', newProfile)
      globalAdminProfile = newProfile
    } else {
      console.log('Found existing Global Administrator profile:', existingProfile)
      globalAdminProfile = existingProfile
    }

    // Store SSO session info in localStorage for the auth context to pick up
    const ssoSession = {
      user: globalAdminProfile,
      sso: true,
      expires_at: Date.now() + (60 * 60 * 1000), // 1 hour
      created_at: Date.now()
    }

    localStorage.setItem('momentum_sso_session', JSON.stringify(ssoSession))

    return {
      success: true,
      user: globalAdminProfile,
      redirectTo: '/staff-portal/dashboard'
    }

  } catch (error) {
    console.error('SSO session creation failed:', error)
    throw error
  }
}
