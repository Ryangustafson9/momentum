import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Info,
  Settings,
  Users,
  Calendar,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const SystemSettingsManager = () => {
  const [settings, setSettings] = useState({
    timeclock_enabled: false,
    timeclock_location_tracking: true,
    timeclock_break_tracking: true,
    timeclock_overtime_threshold: 40,
    member_self_checkin: true,
    staff_schedule_management: true,
    multi_location_enabled: false,
    advanced_reporting_enabled: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    try {
      setIsLoading(true);

      // Load from system_settings table (existing structure)
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        // Map the database columns to our state structure
        setSettings({
          timeclock_enabled: data.timeclock_enabled || false,
          timeclock_location_tracking: data.timeclock_location_tracking !== false,
          timeclock_break_tracking: data.timeclock_break_tracking !== false,
          timeclock_overtime_threshold: data.timeclock_overtime_threshold || 40,
          member_self_checkin: data.member_self_checkin !== false,
          staff_schedule_management: data.staff_schedule_management !== false,
          multi_location_enabled: data.multi_location_enabled || false,
          advanced_reporting_enabled: data.advanced_reporting_enabled !== false
        });
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSystemSettingsTable = async () => {
    try {
      const { error } = await supabase.rpc('create_system_settings_table');
      if (error) throw error;
    } catch (error) {
      console.warn('Could not create system_settings table:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1,
          timeclock_enabled: settings.timeclock_enabled,
          timeclock_location_tracking: settings.timeclock_location_tracking,
          timeclock_break_tracking: settings.timeclock_break_tracking,
          timeclock_overtime_threshold: settings.timeclock_overtime_threshold,
          member_self_checkin: settings.member_self_checkin,
          staff_schedule_management: settings.staff_schedule_management,
          multi_location_enabled: settings.multi_location_enabled,
          advanced_reporting_enabled: settings.advanced_reporting_enabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setHasChanges(false);
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save system settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      timeclock_enabled: false,
      timeclock_location_tracking: true,
      timeclock_break_tracking: true,
      timeclock_overtime_threshold: 40,
      member_self_checkin: true,
      staff_schedule_management: true,
      multi_location_enabled: false,
      advanced_reporting_enabled: true
    });
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading system settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6" />
            System Settings
          </h2>
          <p className="text-gray-600 mt-1">
            Configure global system features and functionality
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetToDefaults}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Timeclock Settings */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Timeclock System
            <Badge variant={settings.timeclock_enabled ? "default" : "secondary"}>
              {settings.timeclock_enabled ? "Enabled" : "Disabled"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="timeclock-enabled" className="text-base font-medium">
                Enable Timeclock
              </Label>
              <p className="text-sm text-gray-600">
                Allow staff to clock in and out for shift tracking
              </p>
            </div>
            <Switch
              id="timeclock-enabled"
              checked={settings.timeclock_enabled}
              onCheckedChange={(checked) => handleSettingChange('timeclock_enabled', checked)}
            />
          </div>

          {settings.timeclock_enabled && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Location Tracking</Label>
                    <p className="text-xs text-gray-600">
                      Track which location staff clock in/out from
                    </p>
                  </div>
                  <Switch
                    checked={settings.timeclock_location_tracking}
                    onCheckedChange={(checked) => handleSettingChange('timeclock_location_tracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Break Tracking</Label>
                    <p className="text-xs text-gray-600">
                      Allow staff to clock out for breaks
                    </p>
                  </div>
                  <Switch
                    checked={settings.timeclock_break_tracking}
                    onCheckedChange={(checked) => handleSettingChange('timeclock_break_tracking', checked)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Staff Management Settings */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Staff Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Schedule Management</Label>
              <p className="text-sm text-gray-600">
                Enable staff scheduling and shift management
              </p>
            </div>
            <Switch
              checked={settings.staff_schedule_management}
              onCheckedChange={(checked) => handleSettingChange('staff_schedule_management', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Member Features */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Member Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Self Check-in</Label>
              <p className="text-sm text-gray-600">
                Allow members to check themselves in
              </p>
            </div>
            <Switch
              checked={settings.member_self_checkin}
              onCheckedChange={(checked) => handleSettingChange('member_self_checkin', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Features */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            System Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Multi-Location</Label>
              <p className="text-sm text-gray-600">
                Enable multi-location management features
              </p>
            </div>
            <Switch
              checked={settings.multi_location_enabled}
              onCheckedChange={(checked) => handleSettingChange('multi_location_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Advanced Reporting</Label>
              <p className="text-sm text-gray-600">
                Enable detailed analytics and reporting features
              </p>
            </div>
            <Switch
              checked={settings.advanced_reporting}
              onCheckedChange={(checked) => handleSettingChange('advanced_reporting', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Info */}
      {hasChanges && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">You have unsaved changes</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Click "Save Changes" to apply your settings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemSettingsManager;
