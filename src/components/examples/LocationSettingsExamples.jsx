// Example: How to Access Location Settings in Your Components
// This shows different ways to access the location configurations we created in Phase 1A

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocationContext, useLocationData } from '@/contexts/LocationContext';
import LocationService from '@/lib/services/locationService';
import { logger } from '@/utils/logger';

// Example 1: Using LocationContext Hook
const LocationBasicExample = () => {
  const { currentLocation, availableLocations, switchLocation } = useLocationContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Location Info</CardTitle>
      </CardHeader>
      <CardContent>
        <p><strong>Current:</strong> {currentLocation?.name || 'No location selected'}</p>
        <p><strong>Available Locations:</strong></p>
        <div className="flex gap-2 mt-2">
          {availableLocations.map(location => (
            <Badge 
              key={location.id} 
              variant={currentLocation?.id === location.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => switchLocation(location.slug)}
            >
              {location.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Example 2: Using LocationData Hook for Billing Config
const BillingConfigExample = () => {
  const { data: billingConfig, loading, error } = useLocationData('billing_config');

  if (loading) return <div>Loading billing config...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!billingConfig) return <div>No billing config found</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><strong>Billing Type:</strong> {billingConfig.membership_billing_type}</p>
        <p><strong>Late Fee:</strong> ${billingConfig.late_fee_amount}</p>
        <p><strong>Grace Period:</strong> {billingConfig.payment_grace_period_days} days</p>
        <p><strong>Personal Training:</strong> {billingConfig.personal_training_enabled ? 'Enabled' : 'Disabled'}</p>
        <p><strong>Family Discount:</strong> {billingConfig.family_discount_enabled ? 'Enabled' : 'Disabled'}</p>
      </CardContent>
    </Card>
  );
};

// Example 3: Direct Service Calls
const DirectServiceExample = () => {
  const [locationDetails, setLocationDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const { currentLocation } = useLocationContext();

  const loadLocationDetails = async () => {
    if (!currentLocation) return;
    
    setLoading(true);
    try {
      const result = await LocationService.getLocationDetails(currentLocation.id);
      if (result.data) {
        setLocationDetails(result.data);
      }
    } catch (error) {
      console.error('Error loading location details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocationDetails();
  }, [currentLocation?.id]);

  if (loading) return <div>Loading location details...</div>;
  if (!locationDetails) return <div>No location details available</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Details (Direct Service)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><strong>Name:</strong> {locationDetails.display_name}</p>
        <p><strong>Address:</strong> {locationDetails.address_line_1}</p>
        <p><strong>Phone:</strong> {locationDetails.phone}</p>
        <p><strong>Timezone:</strong> {locationDetails.timezone}</p>
        <p><strong>24/7:</strong> {locationDetails.is_24_hour ? 'Yes' : 'No'}</p>
        
        {locationDetails.location_billing_configs && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <h4 className="font-medium">Billing Settings:</h4>
            <p>Type: {locationDetails.location_billing_configs.membership_billing_type}</p>
            <p>Late Fee: ${locationDetails.location_billing_configs.late_fee_amount}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Example 4: Template Information
const TemplateExample = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const result = await LocationService.getLocationTemplates();
        if (result.data) {
          setTemplates(result.data);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  if (loading) return <div>Loading templates...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Templates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {templates.map(template => (
            <div key={template.id} className="p-3 border rounded">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <Badge variant="outline" className="mt-1">
                    {template.category.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-right text-sm text-gray-500">
                  Used {template.usage_count} times
                  {template.is_momentum_official && (
                    <Badge variant="default" className="ml-2">Official</Badge>
                  )}
                </div>
              </div>
              
              {/* Show template configuration preview */}
              <details className="mt-2">
                <summary className="text-sm cursor-pointer text-blue-600">
                  View Configuration
                </summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(template.billing_config_template, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main component showing all examples
const LocationSettingsExamples = () => {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold mb-4">Location Settings Access Examples</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LocationBasicExample />
        <BillingConfigExample />
        <DirectServiceExample />
        <TemplateExample />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Access Current Location:</h4>
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
{`import { useLocationContext } from '@/contexts/LocationContext';

const MyComponent = () => {
  const { currentLocation, switchLocation } = useLocationContext();
  
  return (
    <div>
      <p>Current: {currentLocation?.name}</p>
      <button onClick={() => switchLocation('northpark')}>
        Switch to Northpark
      </button>
    </div>
  );
};`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Get Billing Configuration:</h4>
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
{`import { useLocationData } from '@/contexts/LocationContext';

const BillingComponent = () => {
  const { data: config, loading } = useLocationData('billing_config');
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Late Fee: ${config?.late_fee_amount}</p>
      <p>Grace Period: {config?.payment_grace_period_days} days</p>
    </div>
  );
};`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Direct Service Access:</h4>
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
{`import LocationService from '@/lib/services/locationService';

const updateBillingConfig = async (locationId, newConfig) => {
  const result = await LocationService.updateBillingConfig(locationId, {
    late_fee_amount: 30.00,
    payment_grace_period_days: 7
  });
  
  if (result.error) {
    logger.error('Update failed:', result.error);
  } else {
    logger.info('Config updated:', result.data);
  }
};`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationSettingsExamples;
