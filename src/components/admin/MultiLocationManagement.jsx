import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast.js';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  MapPin, 
  Users,
  UserCheck,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Import the service and location manager
import { LocationService } from '@/lib/services/locationService';
import { MultiLocationService } from '@/services/multiLocationService';

import { useAuth } from '@/contexts/AuthContext';

const MultiLocationManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [multiLocationEnabled, setMultiLocationEnabled] = useState(false);
  const [locations, setLocations] = useState([]);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationForm, setLocationForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    manager_name: '',
    timezone: 'America/New_York'
  });

  useEffect(() => {
    loadMultiLocationData();
  }, []);

  const loadMultiLocationData = async () => {
    setIsLoading(true);
    try {
      // Load multi-location settings
      const { data: settings, error: settingsError } = await MultiLocationService.getMultiLocationSettings();
      if (settingsError) throw settingsError;
      
      setMultiLocationEnabled(settings?.multi_location_enabled || false);

      // Load locations if multi-location is enabled
      if (settings?.multi_location_enabled && user?.organization_id) {
        const { data: locationsData, error: locationsError } = await LocationService.getOrganizationLocations(user.organization_id);
        if (locationsError) throw locationsError;
        setLocations(locationsData || []);
      }

      // Check migration status
      const { data: migrationData, error: migrationError } = await MultiLocationService.checkMigrationStatus();
      if (migrationError) throw migrationError;
      setMigrationStatus(migrationData);

    } catch (error) {
      console.error('Error loading multi-location data:', error);
      toast({
        title: "Error",
        description: "Failed to load multi-location settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMultiLocation = async (enabled) => {
    if (enabled) {
      // Show confirmation dialog for enabling
      return;
    }

    try {
      const { error } = await MultiLocationService.toggleMultiLocationSupport(enabled);
      if (error) throw error;

      setMultiLocationEnabled(enabled);
      if (!enabled) {
        setLocations([]);
      }

      toast({
        title: enabled ? "Multi-Location Enabled" : "Multi-Location Disabled",
        description: enabled 
          ? "Multi-location support has been enabled. You can now add locations."
          : "Multi-location support has been disabled.",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error('Error toggling multi-location:', error);
      toast({
        title: "Error",
        description: "Failed to update multi-location settings.",
        variant: "destructive",
      });
    }
  };

  const handleEnableMultiLocation = async () => {
    try {
      // Enable multi-location support
      const { error } = await MultiLocationService.toggleMultiLocationSupport(true);
      if (error) throw error;

      setMultiLocationEnabled(true);
      
      // If migration is needed, create primary location
      if (migrationStatus?.needsMigration) {
        const primaryLocationData = {
          name: 'Main Location', // Default name, user can edit
          address: '',
          phone: '',
          email: '',
          manager_name: '',
          timezone: 'America/New_York'
        };

        const { data: primaryLocation, error: migrationError } = await MultiLocationService.migrateToMultiLocation(primaryLocationData);
        if (migrationError) throw migrationError;

        setLocations([primaryLocation]);
      }

      await loadMultiLocationData(); // Refresh data

      toast({
        title: "Multi-Location Enabled",
        description: "Multi-location support has been enabled successfully.",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error('Error enabling multi-location:', error);
      toast({
        title: "Error",
        description: "Failed to enable multi-location support.",
        variant: "destructive",
      });
    }
  };

  const handleSaveLocation = async () => {
    try {
      if (editingLocation) {
        // Update existing location using LocationService
        const { error } = await LocationService.updateLocation(editingLocation.id, {
          ...locationForm,
          organization_id: user.organization_id
        });
        if (error) throw error;
      } else {
        // Create new location using LocationService
        const locationData = {
          ...locationForm,
          organization_id: user.organization_id,
          slug: await LocationService.generateLocationSlug(user.organization_id, locationForm.name),
          is_active: true,
          status: 'active'
        };

        const { error } = await LocationService.createLocation(locationData);
        if (error) throw error;
      }

      setShowLocationDialog(false);
      setEditingLocation(null);
      setLocationForm({
        name: '',
        address: '',
        phone: '',
        email: '',
        manager_name: '',
        timezone: 'America/New_York'
      });

      await loadMultiLocationData(); // Refresh locations

      toast({
        title: editingLocation ? "Location Updated" : "Location Created",
        description: `Location has been ${editingLocation ? 'updated' : 'created'} successfully.`,
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingLocation ? 'update' : 'create'} location.`,
        variant: "destructive",
      });
    }
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setLocationForm({
      name: location.name || '',
      address: location.address || '',
      phone: location.phone || '',
      email: location.email || '',
      manager_name: location.manager_name || '',
      timezone: location.timezone || 'America/New_York'
    });
    setShowLocationDialog(true);
  };

  const handleDeleteLocation = async (locationId) => {
    try {
      const { error } = await LocationService.deleteLocation(locationId);
      if (error) throw error;

      await loadMultiLocationData(); // Refresh locations

      toast({
        title: "Location Deleted",
        description: "Location has been deleted successfully.",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Failed to delete location.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading multi-location settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Multi-Location Toggle Section */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Multi-Location Management
              </CardTitle>
              <CardDescription className="mt-2">
                Enable and configure multi-location support for your gym chain operations.
              </CardDescription>
            </div>
            <Badge variant={multiLocationEnabled ? "default" : "secondary"}>
              {multiLocationEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Toggle Control */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Switch
                checked={multiLocationEnabled}
                onCheckedChange={multiLocationEnabled ? handleToggleMultiLocation : undefined}
                disabled={isLoading}
              />
              <div>
                <Label className="text-base font-medium">Enable Multi-Location Support</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Allow management of multiple gym locations from a single dashboard
                </p>
              </div>
            </div>
            <Info className="h-5 w-5 text-blue-500" />
          </div>

          {/* Enable Confirmation */}
          {!multiLocationEnabled && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={isLoading}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Enable Multi-Location Support
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Enable Multi-Location Support?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      Enabling multi-location support will make the following changes to your application:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Create a primary location for your existing data</li>
                      <li>Add location-specific settings and configurations</li>
                      <li>Enable location-based member and staff management</li>
                      <li>Allow separate reporting and analytics per location</li>
                    </ul>
                    <p className="text-sm font-medium text-orange-600">
                      This change affects your database structure and cannot be easily reversed.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEnableMultiLocation}>
                    Enable Multi-Location
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Migration Status */}
          {migrationStatus && multiLocationEnabled && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Migration Status</span>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <p>Locations configured: {locations.length}</p>
                {migrationStatus.needsMigration && (
                  <p>Unmapped profiles: {migrationStatus.unmappedProfilesCount}</p>
                )}
                <p>Status: {migrationStatus.needsMigration ? 'Migration needed' : 'Complete'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Locations Management - Only show when enabled */}
      {multiLocationEnabled && (
        <>
          {/* Custom Location Management Interface */}
          <Card className="shadow-lg border-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Location Management</CardTitle>
                  <CardDescription>
                    Manage your gym locations and their configurations
                  </CardDescription>
                </div>
              <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingLocation(null);
                    setLocationForm({
                      name: '',
                      address: '',
                      phone: '',
                      email: '',
                      manager_name: '',
                      timezone: 'America/New_York'
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLocation ? 'Edit Location' : 'Add New Location'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingLocation 
                        ? 'Update the location details below.'
                        : 'Enter the details for the new gym location.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Location Name *</Label>
                      <Input
                        id="name"
                        value={locationForm.name}
                        onChange={(e) => setLocationForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Downtown Branch, North Location"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={locationForm.address}
                        onChange={(e) => setLocationForm(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Full address"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={locationForm.phone}
                          onChange={(e) => setLocationForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={locationForm.email}
                          onChange={(e) => setLocationForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="location@gym.com"
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="manager">Manager Name</Label>
                      <Input
                        id="manager"
                        value={locationForm.manager_name}
                        onChange={(e) => setLocationForm(prev => ({ ...prev, manager_name: e.target.value }))}
                        placeholder="Location manager name"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowLocationDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveLocation} disabled={!locationForm.name.trim()}>
                      {editingLocation ? 'Update Location' : 'Create Location'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent>
            {locations.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Locations Yet</h3>
                <p className="text-gray-600 mb-4">
                  Get started by adding your first gym location.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {locations.map((location) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    onEdit={handleEditLocation}
                    onDelete={handleDeleteLocation}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>


        </>
      )}
    </div>
  );
};

// Location Card Component
const LocationCard = ({ location, onEdit, onDelete }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadLocationStats();
  }, [location.id]);

  const loadLocationStats = async () => {
    try {
      const { data } = await LocationService.getLocationAnalytics(location.id);
      setStats(data);
    } catch (error) {
      console.error('Error loading location stats:', error);
    }
  };

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{location.name}</h3>
              {location.is_primary && (
                <Badge variant="default" className="text-xs">Primary</Badge>
              )}
              <Badge 
                variant={location.status === 'active' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {location.status || 'Active'}
              </Badge>
            </div>
            
            {location.address && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <MapPin className="h-3 w-3" />
                {location.address}
              </div>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {stats && (
                <>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {stats.memberCount} members
                  </div>
                  <div className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    {stats.staffCount} staff
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(location)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            {!location.is_primary && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Location</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{location.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete(location.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiLocationManagement;
