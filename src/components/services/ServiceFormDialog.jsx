import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const ServiceFormDialog = ({ isOpen, onClose, service: editService, categories, onSaved }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    category_id: '',
    service_type: 'single_session',
    duration_minutes: '',
    price: '',
    compare_at_price: '',
    expiration_type: 'time_based',
    expiration_days: '30',
    is_active: true,
    is_featured: false,
    requires_membership: false,
    advance_booking_days: '30',
    cancellation_hours: '24'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editService) {
      setFormData({
        name: editService.name || '',
        description: editService.description || '',
        short_description: editService.short_description || '',
        category_id: editService.category_id || '',
        service_type: editService.service_type || 'single_session',
        duration_minutes: editService.duration_minutes?.toString() || '',
        price: editService.price?.toString() || '',
        compare_at_price: editService.compare_at_price?.toString() || '',
        expiration_type: editService.expiration_type || 'time_based',
        expiration_days: editService.expiration_days?.toString() || '30',
        is_active: editService.is_active !== false,
        is_featured: editService.is_featured || false,
        requires_membership: editService.requires_membership || false,
        advance_booking_days: editService.advance_booking_days?.toString() || '30',
        cancellation_hours: editService.cancellation_hours?.toString() || '24'
      });
    } else {
      // Reset form for new service
      setFormData({
        name: '',
        description: '',
        short_description: '',
        category_id: '',
        service_type: 'single_session',
        duration_minutes: '',
        price: '',
        compare_at_price: '',
        expiration_type: 'time_based',
        expiration_days: '30',
        is_active: true,
        is_featured: false,
        requires_membership: false,
        advance_booking_days: '30',
        cancellation_hours: '24'
      });
    }
  }, [editService, isOpen]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price) {
      toast({
        title: "Error",
        description: "Service name and price are required.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        short_description: formData.short_description.trim() || null,
        category_id: formData.category_id || null,
        service_type: formData.service_type,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        expiration_type: formData.expiration_type,
        expiration_days: formData.expiration_days ? parseInt(formData.expiration_days) : null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        requires_membership: formData.requires_membership,
        advance_booking_days: formData.advance_booking_days ? parseInt(formData.advance_booking_days) : 30,
        cancellation_hours: formData.cancellation_hours ? parseInt(formData.cancellation_hours) : 24,
        updated_at: new Date().toISOString()
      };

      if (editService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editService.id);

        if (error) throw error;

        toast({
          title: "Service Updated",
          description: "Service has been updated successfully.",
          duration: 3000,
        });
      } else {
        const { error } = await supabase
          .from('services')
          .insert(serviceData);

        if (error) throw error;

        toast({
          title: "Service Created",
          description: "Service has been created successfully.",
          duration: 3000,
        });
      }

      onSaved();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: "Failed to save service.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editService ? 'Edit Service' : 'Create New Service'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Rules</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Personal Training Session"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="short_description">Short Description</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                placeholder="Brief description for service cards"
              />
            </div>

            <div>
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the service"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service_type">Service Type</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_session">Single Session</SelectItem>
                    <SelectItem value="single_service">Single Service</SelectItem>
                    <SelectItem value="time_based">Time-based</SelectItem>
                    <SelectItem value="unlimited">Unlimited Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration_minutes">Duration (Minutes)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  placeholder="e.g., 60"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="compare_at_price">Compare At Price</Label>
                <Input
                  id="compare_at_price"
                  type="number"
                  step="0.01"
                  value={formData.compare_at_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, compare_at_price: e.target.value }))}
                  placeholder="Original price (optional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiration_type">Expiration Type</Label>
                <Select 
                  value={formData.expiration_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, expiration_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time_based">Time-based</SelectItem>
                    <SelectItem value="usage_based">Usage-based</SelectItem>
                    <SelectItem value="never">Never Expires</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expiration_days">Expiration Days</Label>
                <Input
                  id="expiration_days"
                  type="number"
                  value={formData.expiration_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiration_days: e.target.value }))}
                  placeholder="Days until expiration"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="advance_booking_days">Advance Booking (Days)</Label>
                <Input
                  id="advance_booking_days"
                  type="number"
                  value={formData.advance_booking_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, advance_booking_days: e.target.value }))}
                  placeholder="How far in advance"
                />
              </div>

              <div>
                <Label htmlFor="cancellation_hours">Cancellation Hours</Label>
                <Input
                  id="cancellation_hours"
                  type="number"
                  value={formData.cancellation_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, cancellation_hours: e.target.value }))}
                  placeholder="Hours before session"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active">Active Service</Label>
                  <p className="text-sm text-gray-600">Service is available for purchase</p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_featured">Featured Service</Label>
                  <p className="text-sm text-gray-600">Highlight this service</p>
                </div>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requires_membership">Requires Membership</Label>
                  <p className="text-sm text-gray-600">Only available to members</p>
                </div>
                <Switch
                  id="requires_membership"
                  checked={formData.requires_membership}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_membership: checked }))}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : (editService ? 'Update Service' : 'Create Service')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceFormDialog;
