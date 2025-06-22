import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient';
import { Save, Building, Phone, Mail, Globe } from 'lucide-react';

// Simple Toggle Switch Component (internal)
const SimpleSwitch = ({ checked, onCheckedChange, id }) => (
  <label className="flex items-center cursor-pointer">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="sr-only"
    />
    <div className={`w-11 h-6 rounded-full p-1 transition-colors ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    }`}>
      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </div>
  </label>
);

// Simple Separator Component (internal)
const SimpleSeparator = () => (
  <div className="w-full h-px bg-gray-200 my-6" />
);

const GeneralSettingsTab = (props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    gym_name: 'Nordic Fitness',
    contact_email: 'info@nordicfitness.com',
    contact_phone: '(555) 123-4567',
    address: '',
    website: '',
    online_joining_enabled: true,
  });

  // Load settings from database
  const loadSettings = async () => {
    try {
      
      
      const { data, error } = await supabase
        .from('general_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        
        return;
      }

      if (data) {
        
        setSettings(prev => ({
          ...prev,
          ...data
        }));
      } else {
        
      }
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Could not load general settings. Using default values.",
        variant: "destructive",
      });
    }
  };

  // Save settings to database
  const saveSettings = async () => {
    setLoading(true);
    try {
      
      
      const { error } = await supabase
        .from('general_settings')
        .upsert({
          id: 1,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      

      // Call parent callback if provided
      if (props.onSettingsChange) {
        props.onSettingsChange();
      }

      toast({
        title: "Settings Saved",
        description: "General settings have been updated successfully.",
      });
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Gym Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Gym Information
          </CardTitle>
          <CardDescription>
            Basic information about your fitness facility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gym_name">Gym Name</Label>
              <Input
                id="gym_name"
                value={settings.gym_name}
                onChange={(e) => handleChange('gym_name', e.target.value)}
                placeholder="Enter gym name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={settings.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://yourgym.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={settings.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Enter gym address"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            Contact details displayed to members and visitors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={settings.contact_email}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                placeholder="info@yourgym.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={settings.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Online Features */}
      <Card>
        <CardHeader>
          <CardTitle>Online Features</CardTitle>
          <CardDescription>
            Control what features are available online
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="online_joining">Online Membership Joining</Label>
              <div className="text-sm text-muted-foreground">
                Allow visitors to sign up for memberships online
              </div>
            </div>
            <SimpleSwitch
              id="online_joining"
              checked={settings.online_joining_enabled}
              onCheckedChange={(checked) => handleChange('online_joining_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <SimpleSeparator />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default GeneralSettingsTab;



