
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';
import SettingsCardItem from '@/components/admin/settings/SettingsCardItem.jsx';

const AdminPanelSettingsTabContent = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    requireFirstName: true,
    requireLastName: true,
    requireEmail: true,
    requirePhone: false,
    requireDOB: false,
    requireAddress: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const currentSettings = await dataService.getAdminPanelSettings();
        setSettings(currentSettings);
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
      await dataService.saveAdminPanelSettings(settings);
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

  if (isLoading && typeof settings.requireFirstName === 'undefined') {
    return <div>Loading admin panel settings...</div>;
  }

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b">
        <CardTitle>Member Data Requirements</CardTitle>
        <CardDescription>Configure which member information fields are mandatory in the admin panel.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 pt-6">
        <SettingsCardItem label="Require First Name">
          <Switch checked={settings.requireFirstName} onCheckedChange={() => handleToggle('requireFirstName')} id="requireFirstName" />
        </SettingsCardItem>
        <SettingsCardItem label="Require Last Name">
          <Switch checked={settings.requireLastName} onCheckedChange={() => handleToggle('requireLastName')} id="requireLastName" />
        </SettingsCardItem>
        <SettingsCardItem label="Require Email">
          <Switch checked={settings.requireEmail} onCheckedChange={() => handleToggle('requireEmail')} id="requireEmail" />
        </SettingsCardItem>
        <SettingsCardItem label="Require Phone Number">
          <Switch checked={settings.requirePhone} onCheckedChange={() => handleToggle('requirePhone')} id="requirePhone" />
        </SettingsCardItem>
        <SettingsCardItem label="Require Date of Birth">
          <Switch checked={settings.requireDOB} onCheckedChange={() => handleToggle('requireDOB')} id="requireDOB" />
        </SettingsCardItem>
        <SettingsCardItem label="Require Address">
          <Switch checked={settings.requireAddress} onCheckedChange={() => handleToggle('requireAddress')} id="requireAddress" />
        </SettingsCardItem>
      </CardContent>
      <CardContent className="border-t pt-6 text-right">
        <Button onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary/90">
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminPanelSettingsTabContent;


