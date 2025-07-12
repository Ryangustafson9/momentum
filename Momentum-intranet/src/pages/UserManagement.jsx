import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import CreateAdminUserModal from '../components/CreateAdminUserModal'
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

const UserManagement = () => {
  const { profile } = useAuth()
  const [adminUsers, setAdminUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Check if current user is Global Admin II
  const isGlobalAdminII = profile?.is_global_admin && profile?.global_admin_level === 2

  useEffect(() => {
    if (isGlobalAdminII) {
      fetchAdminUsers()
    } else {
      setLoading(false)
      setError('Access denied. Global Admin II privileges required.')
    }
  }, [isGlobalAdminII])

  const fetchAdminUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('admin_hq_users_view')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAdminUsers(data || [])
    } catch (err) {
      console.error('Error fetching admin users:', err)
      setError('Failed to load admin users')
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('admin_hq_users')
        .update({ 
          is_active: !currentStatus,
          updated_by: profile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error
      
      // Refresh the list
      fetchAdminUsers()
    } catch (err) {
      console.error('Error updating user status:', err)
      setError('Failed to update user status')
    }
  }

  const toggleSSOAccess = async (userId, currentAccess) => {
    try {
      const { error } = await supabase
        .from('admin_hq_users')
        .update({ 
          sso_access_enabled: !currentAccess,
          updated_by: profile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error
      
      // Refresh the list
      fetchAdminUsers()
    } catch (err) {
      console.error('Error updating SSO access:', err)
      setError('Failed to update SSO access')
    }
  }

  const getRoleBadge = (level) => {
    if (level === 2) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          Global Admin II
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Global Admin I
        </Badge>
      )
    }
  }

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3" />
          Active
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-red-600 border-red-200">
          <XCircle className="h-3 w-3" />
          Inactive
        </Badge>
      )
    }
  }

  if (!isGlobalAdminII) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. This page requires Global Admin II (Super Admin) privileges.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin users...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin HQ User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage Global Admin I and Global Admin II accounts for the internal admin dashboard
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add Admin User
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admin Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Admin II</CardTitle>
            <ShieldCheck className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminUsers.filter(u => u.global_admin_level === 2).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Admin I</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminUsers.filter(u => u.global_admin_level === 1).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>
            Manage Global Admin I and Global Admin II accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No admin users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">SSO Access</th>
                    <th className="text-left py-3 px-4 font-medium">Last Login</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{user.first_name} {user.last_name}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getRoleBadge(user.global_admin_level)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(user.is_active)}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSSOAccess(user.id, user.sso_access_enabled)}
                          className="flex items-center gap-1"
                        >
                          {user.sso_access_enabled ? (
                            <>
                              <Eye className="h-3 w-3" />
                              Enabled
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              Disabled
                            </>
                          )}
                        </Button>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.last_login_at 
                          ? new Date(user.last_login_at).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          {user.email !== 'ryan@momentum.pro' && (
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Admin User Modal */}
      <CreateAdminUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchAdminUsers}
      />
    </div>
  )
}

export default UserManagement
