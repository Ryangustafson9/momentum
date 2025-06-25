import React, { useState, useEffect } from 'react';
import { useLocationContext } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  ChevronDown,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Shield,
  Globe
} from 'lucide-react';

const LocationSwitcher = ({
  variant = "dropdown", // "dropdown" | "tabs" | "cards"
  showStats = false,
  showPermissions = false,
  className = ""
}) => {
  const {
    currentLocation,
    availableLocations,
    switchLocation,
    loading,
    error,
    getUserLocationPermissions
  } = useLocationContext();

  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState(null);

  // Load user permissions when component mounts
  useEffect(() => {
    if (showPermissions && getUserLocationPermissions) {
      getUserLocationPermissions().then(setUserPermissions);
    }
  }, [showPermissions, getUserLocationPermissions]);

  // Don't show anything while loading - let the system determine if multi-location is enabled first
  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Error loading locations</span>
      </div>
    );
  }

  // Don't show switcher if multi-location is disabled or only one location
  if (availableLocations.length <= 1) {
    // For single-location setups, don't show anything
    return null;
  }

  const handleLocationSwitch = (locationSlug) => {
    switchLocation(locationSlug);
    setIsOpen(false);
  };

  const getLocationAccessLevel = (locationId) => {
    if (user?.role === 'admin') {
      return 'Admin Access';
    }

    const permission = userPermissions?.permissions?.find(p => p.location_id === locationId);
    if (permission) {
      switch (permission.access_level) {
        case 'full': return 'Full Access';
        case 'read_only': return 'Read Only';
        case 'limited': return 'Limited Access';
        default: return 'Access Granted';
      }
    }

    return 'Access Granted';
  };

  // Dropdown variant (default)
  if (variant === "dropdown") {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={`flex items-center gap-2 ${className}`}
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {currentLocation?.name || 'Select Location'}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Switch Location
            {userPermissions?.hasGlobalAccess && (
              <Badge variant="secondary" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Global Access
              </Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableLocations.map((location) => (
            <DropdownMenuItem
              key={location.id}
              onClick={() => handleLocationSwitch(location.slug)}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-sm">{location.name}</span>
                  {showPermissions && user?.role === 'staff' && (
                    <span className="text-xs text-muted-foreground">
                      {getLocationAccessLevel(location.id)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {showPermissions && user?.role === 'staff' && (
                  <Shield className="h-3 w-3 text-muted-foreground" />
                )}
                {currentLocation?.id === location.id && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Tabs variant
  if (variant === "tabs") {
    return (
      <div className={`flex gap-1 p-1 bg-muted rounded-lg ${className}`}>
        {availableLocations.map((location) => (
          <Button
            key={location.id}
            variant={currentLocation?.id === location.id ? "default" : "ghost"}
            size="sm"
            onClick={() => handleLocationSwitch(location.slug)}
            className="text-xs"
          >
            {location.name}
          </Button>
        ))}
      </div>
    );
  }

  // Cards variant
  if (variant === "cards") {
    return (
      <div className={`grid gap-3 ${availableLocations.length > 2 ? 'grid-cols-2' : 'grid-cols-1'} ${className}`}>
        {availableLocations.map((location) => (
          <LocationCard
            key={location.id}
            location={location}
            isActive={currentLocation?.id === location.id}
            onClick={() => handleLocationSwitch(location.slug)}
            showStats={showStats}
          />
        ))}
      </div>
    );
  }

  return null;
};

// Individual location card component
const LocationCard = ({ location, isActive, onClick, showStats }) => {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {location.name}
          </CardTitle>
          {isActive && (
            <Badge variant="default" className="text-xs">
              Current
            </Badge>
          )}
        </div>
      </CardHeader>
      {(showStats || location.address) && (
        <CardContent className="pt-0">
          {location.address && (
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {location.address}
            </p>
          )}
          {showStats && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{location.member_count || 0} members</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>{location.status || 'active'}</span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default LocationSwitcher;
