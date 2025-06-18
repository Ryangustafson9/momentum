
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';

const SettingItem = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b last:border-b-0">
    <Label className="mb-2 sm:mb-0 text-sm font-medium text-gray-700">{label}</Label>
    <div className="w-full sm:w-auto">{children}</div>
  </div>
);

const AdminPanelSettingsTab = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState(dataService.getAdminPanelSettings());

  useEffect(() => {
    setSettings(dataService.getAdminPanelSettings());
  }, []);

  const handleChange = (name, value) => {
    setSettings({ ...settings, [name]: value });
  };

  const handleSave = () => {
    dataService.saveAdminPanelSettings(settings);
    toast({
      title: "Admin Panel Settings Saved",
      description: "Your admin panel settings have been updated.",
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Admin Panel Settings</CardTitle>
        <CardDescription>Control backend functions and data requirements.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-sm font-semibold text-gray-800 pb-2">Member Profile Required Fields:</p>
        <SettingItem label="Require First Name">
          <Switch checked={settings.requireFirstName} onCheckedChange={(val) => handleChange('requireFirstName', val)} id="requireFirstNameSwitch" />
        </SettingItem>
        <SettingItem label="Require Last Name">
          <Switch checked={settings.requireLastName} onCheckedChange={(val) => handleChange('requireLastName', val)} id="requireLastNameSwitch" />
        </SettingItem>
        <SettingItem label="Require Email Address">
          <Switch checked={settings.requireEmail} onCheckedChange={(val) => handleChange('requireEmail', val)} id="requireEmailSwitch" />
        </SettingItem>
        <SettingItem label="Require Phone Number">
          <Switch checked={settings.requirePhone} onCheckedChange={(val) => handleChange('requirePhone', val)} id="requirePhoneSwitch" />
        </SettingItem>
        <SettingItem label="Require Date of Birth">
          <Switch checked={settings.requireDOB} onCheckedChange={(val) => handleChange('requireDOB', val)} id="requireDOBSwitch" />
        </SettingItem>
        <SettingItem label="Require Address">
          <Switch checked={settings.requireAddress} onCheckedChange={(val) => handleChange('requireAddress', val)} id="requireAddressSwitch" />
        </SettingItem>
      </CardContent>
      <CardContent className="border-t pt-6 text-right">
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">Save Admin Panel Settings</Button>
      </CardContent>
    </Card>
  );
};

export default AdminPanelSettingsTab;


