import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Building2, 
  Users, 
  Shield, 
  FileText, 
  LogOut, 
  Home,
  HeadphonesIcon,
  Activity,
  AlertTriangle,
  X
} from 'lucide-react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

const Layout = ({ children }) => {
  const { user, profile, impersonatedUser, signOut, exitImpersonation } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Navigation items based on user role
  const getNavigation = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/', icon: Home },
      { name: 'Support Center', href: '/support', icon: HeadphonesIcon },
      { name: 'Audit Logs', href: '/audit', icon: Activity },
    ]

    // Add User Management for Global Admin II only
    if (profile?.is_global_admin && profile?.global_admin_level === 2) {
      baseNavigation.splice(1, 0, { name: 'User Management', href: '/users', icon: Users })
    }

    return baseNavigation
  }

  const navigation = getNavigation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleExitImpersonation = async () => {
    await exitImpersonation()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Impersonation Banner */}
      {impersonatedUser && (
        <div className="impersonation-banner text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">
              Impersonating: {impersonatedUser.first_name} {impersonatedUser.last_name} ({impersonatedUser.email})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExitImpersonation}
            className="text-white hover:bg-red-600"
          >
            <X className="h-4 w-4 mr-2" />
            Exit Impersonation
          </Button>
        </div>
      )}

      {/* Header */}
      <header className="admin-header shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Momentum Admin HQ</h1>
                  <p className="text-blue-100 text-sm">Internal Administrative Dashboard</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {/* Navigation */}
              <nav className="hidden md:flex space-x-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.first_name} />
                      <AvatarFallback className="bg-white text-blue-600">
                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <div className="flex items-center mt-2">
                        <Shield className="h-3 w-3 text-green-600 mr-1" />
                        <span className="text-xs text-green-600 font-medium">
                          {profile?.global_admin_level === 2
                            ? 'Global Admin II (Super Admin)'
                            : 'Global Admin I'
                          }
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
