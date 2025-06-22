import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  Settings,
  MapPin,
  DollarSign,
  Users,
  Calendar,
  Phone,
  Mail,
  Globe,
  Clock,  Edit,
  Copy,
  Trash2,
  AlertTriangle,
  CreditCard,
  ArrowRightLeft,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import LocationService from '@/lib/services/locationService';
import BillingConfigurationManager from './BillingConfigurationManager';
import PaymentProcessorHub from './PaymentProcessorHub';
import MigrationWorkflowManager from './MigrationWorkflowManager';

const SuperAdminLocationManager = ({ organizationId }) => {
  const [locations, setLocations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const { toast } = useToast();

  // Form states for creating new location
  const [newLocationForm, setNewLocationForm] = useState({
    name: '',
    slug: '',
    address_line_1: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
    email: '',
    timezone: 'America/New_York',
    selected_template: null
  });

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [locationsResult, templatesResult] = await Promise.all([
        LocationService.getOrganizationLocations(organizationId),
        LocationService.getLocationTemplates()
      ]);

      if (locationsResult.error) {
        throw new Error('Failed to load locations');
      }
      if (templatesResult.error) {
        throw new Error('Failed to load templates');
      }

      setLocations(locationsResult.data || []);
      setTemplates(templatesResult.data || []);
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to load location data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async () => {
    try {
      const locationData = {
        organization_id: organizationId,
        name: newLocationForm.name,
        slug: newLocationForm.slug || await LocationService.generateLocationSlug(organizationId, newLocationForm.name),
        address_line_1: newLocationForm.address_line_1,
        city: newLocationForm.city,
        state: newLocationForm.state,
        postal_code: newLocationForm.postal_code,
        phone: newLocationForm.phone,
        email: newLocationForm.email,
        timezone: newLocationForm.timezone
      };

      const result = await LocationService.createLocation(
        locationData,
        newLocationForm.selected_template
      );

      if (result.error) {
        throw new Error('Failed to create location');
      }

      toast({
        title: "Success",
        description: `Location "${newLocationForm.name}" created successfully.`
      });

      setIsCreateDialogOpen(false);
      setNewLocationForm({
        name: '',
        slug: '',
        address_line_1: '',
        city: '',
        state: '',
        postal_code: '',
        phone: '',
        email: '',
        timezone: 'America/New_York',
        selected_template: null
      });

      loadData(); // Refresh the list
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to create location. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getLocationStatusBadge = (location) => {
    if (!location.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (location.is_24_hour) {
      return <Badge variant="default">24/7</Badge>;
    }
    return <Badge variant="outline">Active</Badge>;
  };

  const formatAddress = (location) => {
    const parts = [location.address_line_1, location.city, location.state, location.postal_code];
    return parts.filter(part => part).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Location Management</h1>
          <p className="text-gray-600 mt-1">
            Manage gym locations and their configurations
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Location</DialogTitle>
              <DialogDescription>
                Set up a new gym location with billing and payment configurations.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Location Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Northpark"
                    value={newLocationForm.name}
                    onChange={(e) => setNewLocationForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    placeholder="e.g., northpark (auto-generated)"
                    value={newLocationForm.slug}
                    onChange={(e) => setNewLocationForm(prev => ({ ...prev, slug: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  value={newLocationForm.address_line_1}
                  onChange={(e) => setNewLocationForm(prev => ({ ...prev, address_line_1: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Dallas"
                    value={newLocationForm.city}
                    onChange={(e) => setNewLocationForm(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="TX"
                    value={newLocationForm.state}
                    onChange={(e) => setNewLocationForm(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="postal">ZIP Code</Label>
                  <Input
                    id="postal"
                    placeholder="75201"
                    value={newLocationForm.postal_code}
                    onChange={(e) => setNewLocationForm(prev => ({ ...prev, postal_code: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    value={newLocationForm.phone}
                    onChange={(e) => setNewLocationForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="northpark@gym.com"
                    value={newLocationForm.email}
                    onChange={(e) => setNewLocationForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="template">Configuration Template</Label>
                <Select
                  value={newLocationForm.selected_template}
                  onValueChange={(value) => setNewLocationForm(prev => ({ ...prev, selected_template: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{template.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {template.category.replace('_', ' ')}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateLocation}
                  disabled={!newLocationForm.name}
                >
                  Create Location
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map(location => (
          <motion.div
            key={location.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="cursor-pointer"
          >
            <Card className="h-full hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {location.name}
                  </CardTitle>
                  {getLocationStatusBadge(location)}
                </div>
                <p className="text-sm text-gray-600">{location.display_name}</p>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {location.address_line_1 && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">
                        {formatAddress(location)}
                      </span>
                    </div>
                  )}
                  
                  {location.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{location.phone}</span>
                    </div>
                  )}
                  
                  {location.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{location.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {location.timezone}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {location.currency}
                    </span>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLocation(location)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {/* Handle edit */}}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {locations.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No locations found</h3>
            <p className="text-gray-600 mb-4">
              Get started by creating your first gym location.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Location
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Location Configuration Modal */}
      {selectedLocation && (
        <LocationConfigurationModal
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};

// Location Configuration Modal Component
const LocationConfigurationModal = ({ location, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [billingConfig, setBillingConfig] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocationConfig();
  }, [location.id]);

  const loadLocationConfig = async () => {
    try {
      const [billingResult, paymentResult] = await Promise.all([
        LocationService.getBillingConfig(location.id),
        // LocationService.getPaymentConfig(location.id) - implement this
      ]);

      setBillingConfig(billingResult.data);
      // setPaymentConfig(paymentResult.data);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure {location.name}
          </DialogTitle>
          <DialogDescription>
            Manage billing, payment, and operational settings for this location.
          </DialogDescription>
        </DialogHeader>        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <Building2 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="operations">
              <Settings className="w-4 h-4 mr-2" />
              Operations
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[70vh]">
            <TabsContent value="overview" className="space-y-4">
              <OperationsConfigurationForm
                location={location}
                onUpdate={onUpdate}
              />
            </TabsContent>

            <TabsContent value="operations" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Operations Settings</h3>
                <p className="text-muted-foreground">
                  Configure operational settings specific to this location.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <Button variant="outline" className="w-full">
                          Configure Billing
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Access detailed billing settings in the Billing tab
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <CreditCard className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <Button variant="outline" className="w-full">
                          Setup Payments
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Configure payment processors in the Payments tab
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <LocationAnalytics locationId={location.id} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// Simple Operations Configuration Form for location overview
const OperationsConfigurationForm = ({ location, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Location Overview</h3>
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="font-medium">{location.display_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Slug</Label>
                  <p className="font-medium">{location.slug}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="font-medium">{location.phone || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{location.email || 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <p className="font-medium">
                    {location.address_line_1}<br />
                    {location.city}, {location.state} {location.postal_code}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Timezone</Label>
                    <p className="font-medium">{location.timezone}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Currency</Label>
                    <p className="font-medium">{location.default_currency || 'USD'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Quick Actions</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit Details
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure Hours
          </Button>
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Manage Staff
          </Button>
        </div>
      </div>
    </div>
  );
};

const LocationAnalytics = ({ locationId }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Location Analytics</h3>
      <p className="text-gray-600">View revenue, membership, and performance metrics.</p>
      <Card className="p-4">
        <p className="text-sm text-gray-500">Analytics dashboard coming in Phase 1B...</p>
      </Card>
    </div>
  );
};

export default SuperAdminLocationManager;

