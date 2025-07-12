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
  Building2, 
  Globe, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
  ExternalLink
} from 'lucide-react'

const CreateOrganizationModal = ({ isOpen, onClose, onSuccess }) => {
  const { profile } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    timezone: 'America/New_York',
    currency: 'USD'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [slugGenerated, setSlugGenerated] = useState(false)

  // Check if user is Global Admin II
  const isGlobalAdminII = profile?.is_global_admin && profile?.global_admin_level === 2

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' }
  ]

  const currencies = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' }
  ]

  const generateSlug = (name) => {
    if (!name) return ''
    
    let slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    if (slug.length < 3) {
      slug = slug + '-gym'
    }
    
    if (slug.length > 45) {
      slug = slug.substring(0, 45).replace(/-$/, '')
    }
    
    return slug
  }

  const handleNameChange = (value) => {
    setFormData(prev => ({
      ...prev,
      name: value
    }))
    
    // Auto-generate slug if it hasn't been manually edited
    if (!formData.slug || slugGenerated) {
      const newSlug = generateSlug(value)
      setFormData(prev => ({
        ...prev,
        slug: newSlug
      }))
      setSlugGenerated(true)
    }
  }

  const handleSlugChange = (value) => {
    setFormData(prev => ({
      ...prev,
      slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    }))
    setSlugGenerated(false) // User manually edited slug
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Organization name is required')
      }

      if (!formData.slug.trim()) {
        throw new Error('Organization slug is required')
      }

      // Create the organization
      const { data, error } = await supabase
        .rpc('create_organization_complete', {
          p_name: formData.name.trim(),
          p_slug: formData.slug.trim(),
          p_timezone: formData.timezone,
          p_currency: formData.currency,
          p_created_by: profile.id
        })

      if (error) throw error

      // Check if the function returned an error
      if (!data.success) {
        throw new Error(data.error || 'Failed to create organization')
      }

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: profile.id,
          action: 'ORGANIZATION_CREATED',
          admin_hq_action_type: 'ORGANIZATION_MANAGEMENT',
          details: {
            organization_id: data.organization.id,
            organization_name: data.organization.name,
            organization_slug: data.organization.slug,
            timezone: data.organization.timezone,
            currency: data.organization.currency,
            timestamp: new Date().toISOString()
          }
        })

      // Reset form
      setFormData({
        name: '',
        slug: '',
        timezone: 'America/New_York',
        currency: 'USD'
      })
      setSlugGenerated(false)

      onSuccess?.(data.organization)
      onClose()
    } catch (err) {
      console.error('Error creating organization:', err)
      setError(err.message || 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  if (!isGlobalAdminII) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">
              Only Global Admin II (Super Admin) users can create new organizations.
            </p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Create New Customer Site
              </CardTitle>
              <CardDescription>
                Set up a new gym organization with default configuration
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Name */}
            <div>
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Elite Fitness Center"
                required
                disabled={loading}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                The display name for the gym organization
              </p>
            </div>

            {/* Organization Slug */}
            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <div className="mt-1">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">https://</span>
                  <Input
                    id="slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="elite-fitness"
                    required
                    disabled={loading}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 ml-2">.momentum.pro</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                URL-friendly identifier (lowercase, letters, numbers, hyphens only)
              </p>
            </div>

            {/* Timezone */}
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                disabled={loading}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div>
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                disabled={loading}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {currencies.map(curr => (
                  <option key={curr.value} value={curr.value}>{curr.label}</option>
                ))}
              </select>
            </div>

            {/* Info Box */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>What will be created:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• New organization with the specified name and URL</li>
                  <li>• Default "Main Location" for the gym</li>
                  <li>• Local admin account for organization management</li>
                  <li>• Basic configuration and settings</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Create Organization
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

export default CreateOrganizationModal
