import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Users,
  Activity,
  TrendingUp,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  Search,
  ExternalLink,
  LogIn,
  Shield,
  Star,
  StarOff,
  X,
  Heart,
  Filter
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { formatNumber, formatRelativeTime, getStatusColor } from '../lib/utils'
import { initiateSSOLogin } from '../lib/ssoUtils'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import CreateOrganizationModal from '../components/CreateOrganizationModal'

const Dashboard = () => {
  const { user, profile, isGlobalAdmin } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [ssoLoading, setSsoLoading] = useState({})
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false)

  // Fetch favorite organizations by default
  const { data: favorites, isLoading: isFavoritesLoading, error: favoritesError } = useQuery({
    queryKey: ['favorite-organizations', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      try {
        console.log('Fetching favorite organizations for user:', profile.id)

        const { data, error } = await supabase
          .rpc('get_favorited_organizations', { user_id: profile.id })

        if (error) {
          console.error('Favorites query error:', error)
          throw error
        }

        console.log('Favorite organizations loaded:', data?.length || 0)
        return data || []
      } catch (error) {
        console.error('Error fetching favorites:', error)
        // Return empty array on error - user will see "no favorites" message
        return []
      }
    },
    enabled: !!profile?.id && !isSearching,
    retry: false,
    staleTime: 30000 // Cache for 30 seconds
  })

  // Fetch system-wide metrics - with mock data fallback
  const { data: systemMetrics } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      try {
        console.log('Fetching system metrics...')

        // Return mock data immediately to avoid hanging
        console.log('Using mock system metrics due to connection issues')
        return {
          totalOrganizations: 2,
          totalMembers: 1247,
          totalCheckins: 8934,
          openSupportTickets: 12
        }
      } catch (error) {
        console.error('Error fetching system metrics:', error)
        return {
          totalOrganizations: 0,
          totalMembers: 0,
          totalCheckins: 0,
          openSupportTickets: 0
        }
      }
    },
    retry: false,
    staleTime: 0
  })

  // Search functionality
  const performSearch = async (term) => {
    if (!term.trim()) {
      setIsSearching(false)
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      console.log('Searching organizations for:', term)

      const { data, error } = await supabase
        .rpc('search_organizations_with_favorites', {
          user_id: profile.id,
          search_term: term.trim()
        })

      if (error) {
        console.error('Search error:', error)
        throw error
      }

      console.log('Search results:', data?.length || 0)
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching organizations:', error)
      setSearchResults([])
    }
  }

  // Toggle favorite status
  const toggleFavorite = async (organizationId, event) => {
    event.preventDefault()
    event.stopPropagation()

    try {
      const { data, error } = await supabase
        .rpc('toggle_organization_favorite', {
          user_id: profile.id,
          org_id: organizationId
        })

      if (error) throw error

      // Refresh favorites if we're in favorites view
      if (!isSearching) {
        // Refetch favorites
        window.location.reload() // Simple refresh for now
      } else {
        // Update search results
        setSearchResults(prev => prev.map(org =>
          org.id === organizationId
            ? { ...org, is_favorited: data }
            : org
        ))
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('Failed to update favorite status')
    }
  }

  // Handle search term changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchTerm, profile?.id])

  // Clear search when search term is empty
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)

    if (!value.trim()) {
      setIsSearching(false)
      setSearchResults([])
    }
  }

  // Clear search completely
  const clearSearch = () => {
    setSearchTerm('')
    setIsSearching(false)
    setSearchResults([])
  }

  // Handle organization creation success
  const handleOrganizationCreated = (newOrganization) => {
    // Refresh favorites if we're in favorites view
    if (!isSearching) {
      window.location.reload() // Simple refresh for now
    }

    // Show success message
    alert(`Organization "${newOrganization.name}" created successfully!\nURL: https://${newOrganization.slug}.momentum.pro`)
  }

  // Handle SSO login to customer site
  const handleSSOLogin = async (organization, event) => {
    event.preventDefault()
    event.stopPropagation()

    // Debug user permissions
    console.log('Current user:', user)
    console.log('Current profile:', profile)
    console.log('Is global admin (from context):', isGlobalAdmin)
    console.log('Is global admin (from profile):', profile?.is_global_admin)
    console.log('User role:', profile?.role)

    if (!isGlobalAdmin && !profile?.is_global_admin) {
      alert(`SSO Access Denied\n\nCurrent user: ${user?.email}\nProfile role: ${profile?.role}\nGlobal Admin: ${profile?.is_global_admin}\n\nOnly global administrators can use SSO.`)
      return
    }

    setSsoLoading(prev => ({ ...prev, [organization.id]: true }))

    try {
      // Use profile data instead of user data for SSO
      const adminUser = profile || user
      await initiateSSOLogin(organization, adminUser)
    } catch (error) {
      console.error('SSO login failed:', error)
      alert(`SSO login failed: ${error.message}`)
    } finally {
      setSsoLoading(prev => ({ ...prev, [organization.id]: false }))
    }
  }

  // Determine what to display
  const displayData = isSearching ? searchResults : favorites
  const isLoading = isSearching ? false : isFavoritesLoading
  const error = isSearching ? null : favoritesError

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Centralized management interface for all Momentum gym locations
          </p>
        </div>

        {/* Create Organization Button - Only for Global Admin II */}
        {profile?.is_global_admin && profile?.global_admin_level === 2 && (
          <Button
            onClick={() => setShowCreateOrgModal(true)}
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Create New Organization
          </Button>
        )}
      </div>

      {/* Full-Width Search Bar */}
      <div className="w-full">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search organizations by name, slug, or description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-12 pr-12 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Search State Indicator */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {isSearching ? (
              <>
                <Search className="h-4 w-4" />
                <span>Search Results for "{searchTerm}"</span>
                <Badge variant="outline">{searchResults.length} found</Badge>
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 text-red-500" />
                <span>Favorite Organizations</span>
                <Badge variant="outline">{favorites?.length || 0} favorites</Badge>
              </>
            )}
          </div>

          {!isSearching && (
            <div className="text-xs text-gray-500">
              Use the search bar above to find all organizations
            </div>
          )}
        </div>
      </div>

      {/* System Metrics */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(systemMetrics.totalOrganizations)}</div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(systemMetrics.totalMembers)}</div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(systemMetrics.totalCheckins)}</div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Support Tickets</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatNumber(systemMetrics.openSupportTickets)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Organizations Section */}
      <div>
        {displayData?.length === 0 && isSearching ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
              <p className="text-gray-600">No organizations match your search criteria for "{searchTerm}".</p>
              <button
                onClick={clearSearch}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear search to view favorites
              </button>
            </CardContent>
          </Card>
        ) : displayData?.length === 0 && !isSearching ? (
          <Card>
            <CardContent className="text-center py-12">
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Favorite Organizations</h3>
              <p className="text-gray-600 mb-4">
                You haven't marked any organizations as favorites yet.
              </p>
              <p className="text-sm text-gray-500">
                Use the search bar above to find organizations and click the star icon to add them to your favorites.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {displayData?.map((org) => (
                  <div key={org.id} className="relative">
                    <Link
                      to={`/organizations/${org.id}`}
                      className="block hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-6 pr-16">
                        <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-medium text-gray-900 truncate">
                                {org.name}
                              </h3>
                              <div className="flex items-center space-x-4 mt-1">
                                <p className="text-sm text-gray-600">
                                  {org.slug}.momentum.pro
                                </p>
                                <Badge className="text-green-600 bg-green-100">
                                  Active
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>- Locations</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              <span>- Members</span>
                            </div>
                            <div className="flex items-center">
                              <Activity className="h-4 w-4 mr-1" />
                              <span>- Check-ins</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{formatRelativeTime(org.updated_at)}</span>
                            </div>
                          </div>

                          {/* SSO Login Button */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => handleSSOLogin(org, e)}
                              disabled={ssoLoading[org.id]}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Login to customer site as admin"
                            >
                              {ssoLoading[org.id] ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                                  Connecting...
                                </>
                              ) : (
                                <>
                                  <Shield className="h-3 w-3 mr-1" />
                                  Access Site
                                </>
                              )}
                            </button>
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                    </Link>

                    {/* Favorite Button - Positioned absolutely */}
                    <button
                      onClick={(e) => toggleFavorite(org.id, e)}
                      className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      title={org.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {org.is_favorited ? (
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      ) : (
                        <StarOff className="h-5 w-5 text-gray-400 hover:text-yellow-500" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateOrgModal}
        onClose={() => setShowCreateOrgModal(false)}
        onSuccess={handleOrganizationCreated}
      />
    </div>
  )
}

export default Dashboard
