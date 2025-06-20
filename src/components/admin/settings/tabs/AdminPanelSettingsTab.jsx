
/**
 * 🔧 MASTER ADMIN PANEL
 * Comprehensive backend settings and administrative controls
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient';
import SettingsCardItem from '@/components/admin/settings/SettingsCardItem.jsx';

import {
  Settings,
  Shield,
  Database,
  Users,
  Lock,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions.jsx';

const AdminPanelSettingsTabContent = () => {
  const { toast } = useToast();
  const { isAdmin, user, role } = usePermissions();
  const [settings, setSettings] = useState({
    requireFirstName: true,
    requireLastName: true,
    requireEmail: true,
    requirePhone: false,
    requireDOB: false,
    requireAddress: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('data-requirements');

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data: currentSettings, error } = await supabase
          .from('general_settings')
          .select('*')
          .single();

        if (error) throw error;

        if (currentSettings) {
          setSettings({
            requireFirstName: currentSettings.require_first_name ?? true,
            requireLastName: currentSettings.require_last_name ?? true,
            requireEmail: currentSettings.require_email ?? true,
            requirePhone: currentSettings.require_phone ?? false,
            requireDOB: currentSettings.require_dob ?? false,
            requireAddress: currentSettings.require_address ?? false,
          });
        }
      } catch (error) {
        console.error("Failed to load admin panel settings:", error);
        toast({
          title: "Error",
          description: "Could not load admin panel settings. Using default values.",
          variant: "destructive",
        });
        setSettings({
          requireFirstName: true, requireLastName: true, requireEmail: true,
          requirePhone: false, requireDOB: false, requireAddress: false,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('general_settings')
        .upsert({
          require_first_name: settings.requireFirstName,
          require_last_name: settings.requireLastName,
          require_email: settings.requireEmail,
          require_phone: settings.requirePhone,
          require_dob: settings.requireDOB,
          require_address: settings.requireAddress,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Admin panel settings have been updated.",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Failed to save admin panel settings:", error);
      toast({
        title: "Error",
        description: "Could not save admin panel settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has admin access
  if (!isAdmin) {
    return (
      <Card className="shadow-lg border-none">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Access Required</h3>
            <p className="text-gray-600">You need administrator privileges to access this panel.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && typeof settings.requireFirstName === 'undefined') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">      {/* Header */}
      <div>        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-3 text-indigo-600" />
            Master Admin Panel
          </h2>
          <p className="text-gray-600 mt-1">Backend settings and administrative controls</p>
        </div>
      </div>

      {/* Admin Panel Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger
            value="data-requirements"
            className="flex items-center space-x-2 data-[state=active]:bg-white"
          >
            <Database className="w-4 h-4" />
            <span>Data Requirements</span>
          </TabsTrigger>
          <TabsTrigger
            value="system-health"
            className="flex items-center space-x-2 data-[state=active]:bg-white"
          >
            <Activity className="w-4 h-4" />
            <span>System Health</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex items-center space-x-2 data-[state=active]:bg-white"
          >
            <Lock className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Data Requirements Tab */}
        <TabsContent value="data-requirements" className="space-y-4">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-indigo-600" />
                Member Data Requirements
              </CardTitle>
              <CardDescription>
                Configure which member information fields are mandatory throughout the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 pt-6">
              <SettingsCardItem label="Require First Name">
                <Switch
                  checked={settings.requireFirstName}
                  onCheckedChange={() => handleToggle('requireFirstName')}
                  id="requireFirstName"
                />
              </SettingsCardItem>
              <SettingsCardItem label="Require Last Name">
                <Switch
                  checked={settings.requireLastName}
                  onCheckedChange={() => handleToggle('requireLastName')}
                  id="requireLastName"
                />
              </SettingsCardItem>
              <SettingsCardItem label="Require Email">
                <Switch
                  checked={settings.requireEmail}
                  onCheckedChange={() => handleToggle('requireEmail')}
                  id="requireEmail"
                />
              </SettingsCardItem>
              <SettingsCardItem label="Require Phone Number">
                <Switch
                  checked={settings.requirePhone}
                  onCheckedChange={() => handleToggle('requirePhone')}
                  id="requirePhone"
                />
              </SettingsCardItem>
              <SettingsCardItem label="Require Date of Birth">
                <Switch
                  checked={settings.requireDOB}
                  onCheckedChange={() => handleToggle('requireDOB')}
                  id="requireDOB"
                />
              </SettingsCardItem>
              <SettingsCardItem label="Require Address">
                <Switch
                  checked={settings.requireAddress}
                  onCheckedChange={() => handleToggle('requireAddress')}
                  id="requireAddress"
                />
              </SettingsCardItem>
            </CardContent>
            <CardContent className="border-t pt-6 text-right">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? 'Saving...' : 'Save Data Requirements'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>        {/* System Health Tab */}
        <TabsContent value="system-health" className="space-y-4">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-600" />
                System Health & Monitoring
              </CardTitle>
              <CardDescription>
                Monitor system performance and health metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Database Status</p>
                      <p className="text-2xl font-bold text-green-900">Healthy</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Active Users</p>
                      <p className="text-2xl font-bold text-blue-900">24</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-800">System Load</p>
                      <p className="text-2xl font-bold text-yellow-900">Normal</p>
                    </div>
                    <Activity className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2 text-red-600" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security policies and access controls.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-red-800">Security Notice</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Advanced security settings will be available in future updates.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-center py-8 text-gray-500">
                  <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>Security configuration panel coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanelSettingsTabContent;


