import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react'
import { createSSOSession } from '@/lib/ssoUtils'
import { useAuth } from '@/contexts/AuthContext'
import { showToast } from '@/utils/toastUtils'

const SSOLogin = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [status, setStatus] = useState('processing') // processing, error
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setError('No SSO token provided')
      return
    }

    // Process SSO login
    processSSOToken(token)
  }, [searchParams])



  const processSSOToken = async (token) => {
    try {
      setStatus('processing')
      
      // Create SSO session
      const result = await createSSOSession(token)
      
      if (result.success) {
        // Trigger auth context update
        window.dispatchEvent(new Event('sso-login-success'))

        // Redirect immediately without success screen
        navigate(result.redirectTo || '/staff-portal/dashboard')
      } else {
        throw new Error('SSO login failed')
      }
    } catch (error) {
      console.error('SSO processing error:', error)
      setStatus('error')

      // Provide more helpful error messages
      if (error.message.includes('Organization mismatch')) {
        setError('Organization mismatch. Please access this link from the correct organization subdomain.')
      } else if (error.message.includes('Token expired')) {
        setError('SSO token has expired. Please request a new login link from the Admin HQ.')
      } else if (error.message.includes('Invalid token')) {
        setError('Invalid SSO token. Please request a new login link from the Admin HQ.')
      } else {
        setError(error.message || 'SSO login failed. Please try again or contact support.')
      }
    }
  }

  const handleReturnToAdminHQ = () => {
    const adminHQUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5174' 
      : 'https://admin.momentum.pro'
    
    window.open(adminHQUrl, '_blank', 'noopener,noreferrer')
  }



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Admin SSO Login
            </h1>
            <p className="text-gray-600">
              Secure single sign-on from Momentum Admin HQ
            </p>
          </div>

          {/* Processing State */}
          {status === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Verifying SSO Token...
              </h3>
              <p className="text-gray-600">
                Please wait while we authenticate your session
              </p>
            </motion.div>
          )}



          {/* Error State */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                SSO Login Failed
              </h3>
              <p className="text-gray-600 mb-6">
                {error || 'Unable to authenticate your SSO session.'}
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-red-800 mb-2">Common Issues:</h4>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• Token has expired (60 second limit)</li>
                  <li>• Token has already been used</li>
                  <li>• Organization mismatch</li>
                  <li>• Invalid admin permissions</li>
                </ul>
              </div>

              {/* Development Mode Notice */}
              {(window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Development Mode:</h4>
                  <p className="text-xs text-blue-700">
                    In development, SSO tokens work across all organizations on localhost.
                    Organization validation is relaxed for testing purposes.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleReturnToAdminHQ}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Return to Admin HQ
                </button>
                
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Regular Login
                </button>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200/50 text-center">
            <p className="text-xs text-gray-500">
              Secure SSO powered by Momentum Admin HQ
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SSOLogin
