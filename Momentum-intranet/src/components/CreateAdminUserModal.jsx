import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { 
  X, 
  Shield, 
  ShieldCheck, 
  UserPlus, 
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react'

const CreateAdminUserModal = ({ isOpen, onClose, onSuccess }) => {
  const { profile } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    globalAdminLevel: 1,
    ssoAccessEnabled: true,
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address')
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('admin_hq_users')
        .select('email')
        .eq('email', formData.email)
        .single()

      if (existingUser) {
        throw new Error('An admin user with this email already exists')
      }

      // Create the admin user
      const { data, error } = await supabase
        .from('admin_hq_users')
        .insert({
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          global_admin_level: formData.globalAdminLevel,
          sso_access_enabled: formData.ssoAccessEnabled,
          notes: formData.notes || null,
          created_by: profile.id,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: profile.id,
          action: 'ADMIN_USER_CREATED',
          admin_hq_action_type: 'USER_MANAGEMENT',
          details: {
            created_user_email: formData.email,
            created_user_level: formData.globalAdminLevel,
            timestamp: new Date().toISOString()
          }
        })

      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        globalAdminLevel: 1,
        ssoAccessEnabled: true,
        notes: ''
      })

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Error creating admin user:', err)
      setError(err.message || 'Failed to create admin user')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create Admin User
              </CardTitle>
              <CardDescription>
                Add a new Global Admin I or Global Admin II user
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="admin@company.com"
                required
                disabled={loading}
              />
            </div>

            {/* First Name */}
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="John"
                required
                disabled={loading}
              />
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Doe"
                required
                disabled={loading}
              />
            </div>

            {/* Global Admin Level */}
            <div>
              <Label>Admin Level *</Label>
              <div className="mt-2 space-y-2">
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.globalAdminLevel === 1 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleChange('globalAdminLevel', 1)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Global Admin I</span>
                    </div>
                    <Badge variant="secondary">Standard</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Can view organizations and use SSO. Cannot manage other admin accounts.
                  </p>
                </div>

                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.globalAdminLevel === 2 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleChange('globalAdminLevel', 2)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Global Admin II</span>
                    </div>
                    <Badge variant="destructive">Super Admin</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Full privileges including user management and admin account control.
                  </p>
                </div>
              </div>
            </div>

            {/* SSO Access */}
            <div>
              <Label>SSO Access</Label>
              <div className="mt-2">
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.ssoAccessEnabled 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleChange('ssoAccessEnabled', !formData.ssoAccessEnabled)}
                >
                  <div className="flex items-center gap-2">
                    {formData.ssoAccessEnabled ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-600" />
                    )}
                    <span className="font-medium">
                      {formData.ssoAccessEnabled ? 'SSO Enabled' : 'SSO Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.ssoAccessEnabled 
                      ? 'User can access customer sites via SSO'
                      : 'User cannot access customer sites via SSO'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about this admin user..."
                className="w-full p-2 border border-gray-300 rounded-md resize-none h-20"
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Create Admin User
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateAdminUserModal
