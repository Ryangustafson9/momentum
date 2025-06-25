import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { useLocationAccess } from '@/hooks/useLocationAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Shield, 
  MapPin, 
  ArrowLeft,
  Globe,
  Lock
} from 'lucide-react';

/**
 * Higher-order component that protects routes based on location access permissions
 * Validates that the user has access to the location specified in the URL
 */
const LocationProtectedRoute = ({ 
  children, 
  requiredAction = 'read',
  fallbackPath = '/staff-portal/dashboard',
  showAccessDenied = true 
}) => {
  const { location: locationSlug } = useParams();
  const { user } = useAuth();
  const { availableLocations, currentLocation, loading: locationLoading } = useLocationContext();
  const { 
    hasLocationAccess, 
    canPerformAction, 
    validateLocationAccess,
    loading: accessLoading,
    getPermissionSummary
  } = useLocationAccess();
  
  const navigate = useNavigate();
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    if (!locationLoading && !accessLoading && locationSlug) {
      validateAccess();
    }
  }, [locationSlug, locationLoading, accessLoading, availableLocations]);

  const validateAccess = () => {
    // Find the location by slug
    const targetLocation = availableLocations.find(loc => loc.slug === locationSlug);
    
    if (!targetLocation) {
      setValidationResult({
        hasAccess: false,
        error: 'location_not_found',
        locationSlug,
        message: `Location "${locationSlug}" not found or not accessible.`
      });
      return;
    }

    // Check if user has access to this location
    const hasAccess = hasLocationAccess(targetLocation.id);
    const canPerform = canPerformAction(targetLocation.id, requiredAction);

    if (!hasAccess) {
      setValidationResult({
        hasAccess: false,
        error: 'access_denied',
        location: targetLocation,
        message: `You don't have access to ${targetLocation.name}.`
      });
      return;
    }

    if (!canPerform) {
      setValidationResult({
        hasAccess: false,
        error: 'insufficient_permissions',
        location: targetLocation,
        requiredAction,
        message: `You don't have permission to ${requiredAction} at ${targetLocation.name}.`
      });
      return;
    }

    // Access granted
    setValidationResult({
      hasAccess: true,
      location: targetLocation
    });
  };

  // Show loading state
  if (locationLoading || accessLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating location access...</p>
        </div>
      </div>
    );
  }

  // No location slug in URL - allow access (single location or no location context)
  if (!locationSlug) {
    return children;
  }

  // Validation not complete yet
  if (!validationResult) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Access granted - render children
  if (validationResult.hasAccess) {
    return children;
  }

  // Access denied - show error page if enabled
  if (!showAccessDenied) {
    // Silently redirect
    navigate(fallbackPath, { replace: true });
    return null;
  }

  return <LocationAccessDenied validationResult={validationResult} fallbackPath={fallbackPath} />;
};

/**
 * Component to display when location access is denied
 */
const LocationAccessDenied = ({ validationResult, fallbackPath }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPermissionSummary } = useLocationAccess();
  
  const permissionSummary = getPermissionSummary();

  const getErrorIcon = () => {
    switch (validationResult.error) {
      case 'location_not_found':
        return <MapPin className="h-12 w-12 text-orange-500" />;
      case 'access_denied':
        return <Lock className="h-12 w-12 text-red-500" />;
      case 'insufficient_permissions':
        return <Shield className="h-12 w-12 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-red-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (validationResult.error) {
      case 'location_not_found':
        return 'Location Not Found';
      case 'access_denied':
        return 'Access Denied';
      case 'insufficient_permissions':
        return 'Insufficient Permissions';
      default:
        return 'Access Error';
    }
  };

  const getErrorDescription = () => {
    switch (validationResult.error) {
      case 'location_not_found':
        return `The location "${validationResult.locationSlug}" could not be found or is not available to you.`;
      case 'access_denied':
        return `You don't have permission to access ${validationResult.location?.name || 'this location'}.`;
      case 'insufficient_permissions':
        return `You have access to ${validationResult.location?.name} but cannot perform "${validationResult.requiredAction}" actions.`;
      default:
        return validationResult.message || 'An error occurred while checking location access.';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[600px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getErrorIcon()}
          </div>
          <CardTitle className="text-xl font-semibold">
            {getErrorTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            {getErrorDescription()}
          </p>

          {/* Show user's current access level */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Your Access Level:</span>
              <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                {user?.role === 'admin' ? (
                  <>
                    <Globe className="h-3 w-3 mr-1" />
                    Admin
                  </>
                ) : (
                  <>
                    <Shield className="h-3 w-3 mr-1" />
                    Staff
                  </>
                )}
              </Badge>
            </div>
            
            {permissionSummary && (
              <div className="text-sm text-muted-foreground">
                <p>
                  Access to {permissionSummary.totalAccessibleLocations} location
                  {permissionSummary.totalAccessibleLocations !== 1 ? 's' : ''}
                </p>
                {permissionSummary.hasGlobalAccess && (
                  <p className="text-green-600 font-medium">Global access enabled</p>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => navigate(fallbackPath)}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="w-full"
            >
              Go Back
            </Button>
          </div>

          {/* Contact admin message for staff */}
          {user?.role === 'staff' && validationResult.error === 'access_denied' && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Need access?</strong> Contact your administrator to request access to this location.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationProtectedRoute;
