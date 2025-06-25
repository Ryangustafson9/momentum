import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import StaffLocationPermissions from '@/components/admin/StaffLocationPermissions';
import LocationSwitcher from '@/components/admin/LocationSwitcher';
import { 
  Building2, 
  Users, 
  Shield, 
  Settings,
  MapPin,
  Globe,
  AlertCircle
} from 'lucide-react';

const LocationManagement = () => {
  const { user } = useAuth();
  const { availableLocations, currentLocation, loading, error } = useLocationContext();
  const [activeTab, setActiveTab] = useState('permissions');

  // Only admins should access this page
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            Only administrators can access location management.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading location management...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Locations</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Location Management</h1>
          <p className="text-muted-foreground">
            Manage locations and staff access permissions for your organization
          </p>
        </div>
        
        {availableLocations.length > 1 && (
          <LocationSwitcher 
            variant="dropdown" 
            showPermissions={true}
            className="ml-4"
          />
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableLocations.length}</div>
            <p className="text-xs text-muted-foreground">
              {availableLocations.length === 1 ? 'Single location setup' : 'Multi-location setup'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentLocation?.name || 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentLocation?.is_primary ? 'Primary location' : 'Secondary location'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Level</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="secondary">
                <Globe className="h-3 w-3 mr-1" />
                Global Admin
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Full access to all locations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Staff Permissions
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Location Settings
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Access Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <StaffLocationPermissions />
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Location Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Location configuration settings will be available in a future update.
                </p>
                
                <div className="grid gap-4">
                  {availableLocations.map((location) => (
                    <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{location.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {location.address || 'No address set'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {location.is_primary && (
                          <Badge variant="default">Primary</Badge>
                        )}
                        <Badge variant={location.is_active ? 'default' : 'secondary'}>
                          {location.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Access Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Comprehensive access overview and analytics will be available in a future update.
                </p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Staff with Global Access</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {/* This would be calculated from actual data */}
                      2
                    </p>
                    <p className="text-sm text-muted-foreground">Admin users</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Staff with Restricted Access</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {/* This would be calculated from actual data */}
                      5
                    </p>
                    <p className="text-sm text-muted-foreground">Location-specific access</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LocationManagement;
