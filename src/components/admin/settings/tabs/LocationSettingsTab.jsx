/**
 * Location Settings Tab Component
 * Manages locations and location templates within the settings interface
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  MapPin,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import SuperAdminLocationManager from '@/components/admin/SuperAdminLocationManager';
import LocationService from '@/lib/services/locationService';

const LocationSettingsTab = () => {
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // For now, we'll create/get the default organization
      const defaultOrg = await getOrCreateDefaultOrganization();
      
      if (defaultOrg) {
        setCurrentOrganization(defaultOrg);
        await loadLocationData(defaultOrg.id);
      }
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to load location data. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateDefaultOrganization = async () => {
    try {
      // First try to get existing organizations
      const result = await LocationService.getOrganizations();
      
      if (result.data && result.data.length > 0) {
        return result.data[0]; // Use the first organization
      }
      
      // If no organizations exist, we'll use the one that should be created by the migration
      // The migration creates a 'momentum' organization
      return {
        id: 'default', // We'll handle this in the service calls
        name: 'Momentum Fitness',
        slug: 'momentum'
      };
    } catch (error) {
      
      return null;
    }
  };

  const loadLocationData = async (organizationId) => {
    try {
      const [locationsResult, templatesResult] = await Promise.all([
        LocationService.getOrganizationLocations(organizationId),
        LocationService.getLocationTemplates()
      ]);

      setLocations(locationsResult.data || []);
      setTemplates(templatesResult.data || []);
    } catch (error) {
      
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-6 w-6 animate-spin mr-2" />
            <span>Loading location settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Location Management</h3>
        <p className="text-sm text-muted-foreground">
          Manage your gym locations, billing configurations, and location templates.
        </p>
      </div>

      {/* Location Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold">{locations.length}</div>
                <p className="text-xs text-muted-foreground">
                  {locations.length === 1 ? 'Location' : 'Locations'} configured
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold">{templates.length}</div>
                <p className="text-xs text-muted-foreground">
                  Setup templates ready
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-emerald-600 mr-3" />
              <div>
                <div className="text-sm font-semibold">{currentOrganization?.name || 'Momentum Fitness'}</div>
                <p className="text-xs text-muted-foreground">
                  Primary organization
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Status */}
      {templates.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No location templates are available. Please ensure the database migration has been applied successfully.
            Templates are required for creating new locations with pre-configured settings.
          </AlertDescription>
        </Alert>
      )}

      {locations.length === 0 && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            No locations have been configured yet. Add your first location to get started with location-specific
            billing and configuration management.
          </AlertDescription>
        </Alert>
      )}

      {/* Location Manager */}
      <Card>
        <CardHeader>
          <CardTitle>Location Manager</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create and manage your gym locations with customized billing and payment configurations.
          </p>
        </CardHeader>
        <CardContent>
          {currentOrganization ? (
            <SuperAdminLocationManager 
              organizationId={currentOrganization.id}
              key={currentOrganization.id}
            />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load organization data. Please check your database configuration.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationSettingsTab;

