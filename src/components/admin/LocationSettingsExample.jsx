import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocationContext, useLocationData } from '@/contexts/LocationContext';
import LocationService from '@/lib/services/locationService';
import { Building2, Settings, MapPin, DollarSign } from 'lucide-react';
import { logger } from '@/utils/logger';

// Example component showing how to access location settings
const LocationSettingsExample = () => {
  const { currentLocation, availableLocations, switchLocation } = useLocationContext();
  const { data: billingConfig, loading: billingLoading } = useLocationData('billing_config');
  const [locationDetails, setLocationDetails] = useState(null);

  // Example: Load full location configuration
  useEffect(() => {
    if (currentLocation) {
      loadLocationDetails();
    }
  }, [currentLocation]);

  const loadLocationDetails = async () => {
    if (!currentLocation) return;
    
    try {
      const result = await LocationService.getLocationDetails(currentLocation.id);
      if (result.data) {
        setLocationDetails(result.data);
      }
    } catch (error) {
      console.error('Error loading location details:', error);
    }
  };

  if (!currentLocation) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">No location selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Location Settings Access Example
        </h2>
      </div>

      {/* Current Location Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Current Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">{currentLocation.name}</p>
              <p className="text-sm text-gray-600">{currentLocation.display_name}</p>
              <p className="text-sm text-gray-500">{currentLocation.address_line_1}</p>
            </div>
            <div className="space-y-2">
              <Badge variant="outline">{currentLocation.timezone}</Badge>
              <Badge variant="outline">{currentLocation.currency}</Badge>
              {currentLocation.is_24_hour && <Badge>24/7</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Switcher */}
      {availableLocations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Switch Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {availableLocations.map(location => (
                <Button
                  key={location.id}
                  variant={currentLocation.id === location.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchLocation(location.slug)}
                >
                  {location.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Configuration Example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Billing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingLoading ? (
            <p className="text-gray-500">Loading billing configuration...</p>
          ) : billingConfig ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Billing Type</label>
                  <p className="text-sm capitalize">{billingConfig.membership_billing_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Proration Enabled</label>
                  <p className="text-sm">{billingConfig.proration_enabled ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Late Fee Amount</label>
                  <p className="text-sm">${billingConfig.late_fee_amount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Grace Period</label>
                  <p className="text-sm">{billingConfig.payment_grace_period_days} days</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Payment Methods</label>
                <div className="flex gap-2 mt-1">
                  {billingConfig.payment_methods_enabled && Object.entries(billingConfig.payment_methods_enabled).map(([method, enabled]) => (
                    enabled && (
                      <Badge key={method} variant="outline" className="text-xs">
                        {method.replace('_', ' ')}
                      </Badge>
                    )
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No billing configuration found</p>
          )}
        </CardContent>
      </Card>

      {/* Full Location Details Example */}
      {locationDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Full Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Location Details</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(locationDetails, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>How to Access Settings in Your Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Using useLocationContext Hook</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`import { useLocationContext } from '@/contexts/LocationContext';

const MyComponent = () => {
  const { currentLocation, switchLocation } = useLocationContext();
  
  return (
    <div>
      <h3>{currentLocation?.name}</h3>
      <p>Currency: {currentLocation?.currency}</p>
    </div>
  );
};`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Using useLocationData Hook</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`import { useLocationData } from '@/contexts/LocationContext';

const BillingComponent = () => {
  const { data: billingConfig, loading } = useLocationData('billing_config');
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Billing Type: {billingConfig?.membership_billing_type}</p>
      <p>Late Fee: ${billingConfig?.late_fee_amount}</p>
    </div>
  );
};`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Using LocationService Directly</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`import LocationService from '@/lib/services/locationService';

const updateBillingSettings = async (locationId, newConfig) => {
  const result = await LocationService.updateBillingConfig(locationId, newConfig);
  if (result.error) {
    logger.error('Failed to update billing config');
  } else {
    logger.info('Billing config updated successfully');
  }
};`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationSettingsExample;
