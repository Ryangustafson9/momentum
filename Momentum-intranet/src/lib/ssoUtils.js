import { supabase, logAdminAction } from './supabaseClient'

// JWT Secret - In production, this should be an environment variable
const JWT_SECRET = 'momentum-sso-secret-key-2024-admin-hq-secure'

// Simple JWT implementation for SSO tokens
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

  static async sign(payload, secret) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload))
    const data = `${encodedHeader}.${encodedPayload}`

    // Create signature using Web Crypto API
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
    const encodedSignature = this.base64UrlEncode(
      String.fromCharCode(...new Uint8Array(signature))
    )

    return `${data}.${encodedSignature}`
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

// Generate SSO token for organization access
export const generateSSOToken = async (adminUserId, targetOrganization) => {
  try {
    const now = Math.floor(Date.now() / 1000)
    const nonce = crypto.randomUUID()

    const payload = {
      admin_user_id: adminUserId,
      target_organization_id: targetOrganization.id,
      organization_slug: targetOrganization.slug,
      nonce: nonce,
      exp: now + 60, // Expires in 60 seconds
      iat: now,
      iss: 'momentum-admin-hq'
    }

    const token = await SimpleJWT.sign(payload, JWT_SECRET)

    // Store token nonce in database to prevent replay attacks
    try {
      const { error: insertError } = await supabase
        .from('sso_tokens')
        .insert({
          nonce: nonce,
          admin_user_id: adminUserId,
          target_organization_id: targetOrganization.id,
          expires_at: new Date((now + 60) * 1000).toISOString(),
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Failed to store SSO token:', insertError)
        // Continue anyway for development - token validation will be skipped on customer side
        console.warn('⚠️ SSO: Continuing without token storage for development')
      }
    } catch (dbError) {
      console.error('Database error storing SSO token:', dbError)
      console.warn('⚠️ SSO: Continuing without token storage for development')
    }

    // Log SSO token generation
    await logAdminAction('SSO_TOKEN_GENERATED', {
      target_organization_id: targetOrganization.id,
      organization_slug: targetOrganization.slug,
      token_expires_at: new Date((now + 60) * 1000).toISOString()
    })

    return token
  } catch (error) {
    console.error('Failed to generate SSO token:', error)
    throw new Error('Failed to generate SSO token')
  }
}

// Initiate SSO login to customer site
export const initiateSSOLogin = async (organization, adminUser) => {
  try {
    // Check for global admin permissions (allow bypass in development)
    const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname.includes('localhost')
    const isGlobalAdmin = adminUser?.is_global_admin || adminUser?.role === 'admin'

    if (!isGlobalAdmin && !isDevelopment) {
      throw new Error('Only global administrators can use SSO')
    }

    if (!isGlobalAdmin && isDevelopment) {
      console.warn('⚠️ SSO: Bypassing global admin check in development mode')
    }

    // Generate SSO token
    const token = await generateSSOToken(adminUser.id, organization)

    // Construct SSO URL
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? `http://localhost:5173` 
      : `https://${organization.slug}.momentum.pro`
    
    const ssoUrl = `${baseUrl}/sso-login?token=${token}`

    // Open in new tab
    const newWindow = window.open(ssoUrl, '_blank', 'noopener,noreferrer')
    
    if (!newWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.')
    }

    // Log SSO initiation
    await logAdminAction('SSO_LOGIN_INITIATED', {
      target_organization_id: organization.id,
      organization_slug: organization.slug,
      sso_url: ssoUrl
    })

    return true
  } catch (error) {
    console.error('SSO login failed:', error)
    throw error
  }
}

// Verify SSO token (for customer site)
export const verifySSOToken = async (token) => {
  try {
    // Verify JWT signature and decode payload
    const payload = await SimpleJWT.verify(token, JWT_SECRET)

    // Check if token has been used (nonce check)
    const { data: existingToken, error } = await supabase
      .from('sso_tokens')
      .select('*')
      .eq('nonce', payload.nonce)
      .eq('used', false)
      .single()

    if (error || !existingToken) {
      throw new Error('Token not found or already used')
    }

    // Mark token as used
    await supabase
      .from('sso_tokens')
      .update({ 
        used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('nonce', payload.nonce)

    return payload
  } catch (error) {
    console.error('SSO token verification failed:', error)
    throw error
  }
}

// Clean up expired SSO tokens (should be run periodically)
export const cleanupExpiredTokens = async () => {
  try {
    const { error } = await supabase
      .from('sso_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('Failed to cleanup expired tokens:', error)
    }
  } catch (error) {
    console.error('Token cleanup error:', error)
  }
}
