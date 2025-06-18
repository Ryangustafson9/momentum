
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';

const SettingItem = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b last:border-b-0">
    <Label className="mb-2 sm:mb-0 text-sm font-medium text-gray-700">{label}</Label>
    <div className="w-full sm:w-auto sm:max-w-xs">{children}</div>
  </div>
);

const GeneralSettingsTab = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState(dataService.getGeneralSettings());

  useEffect(() => {
    setSettings(dataService.getGeneralSettings());
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    dataService.saveGeneralSettings(settings);
    toast({
      title: "Settings Saved",
      description: "Your general settings have been updated.",
      className: "bg-green-500 text-white",
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Manage basic information for your gym.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <SettingItem label="Gym Name">
          <Input name="gymName" value={settings.gymName} onChange={handleChange} />
        </SettingItem>
        <SettingItem label="Administrator Email">
          <Input name="adminEmail" type="email" value={settings.adminEmail} onChange={handleChange} />
        </SettingItem>
        <SettingItem label="Timezone">
          <Input name="timezone" value={settings.timezone} onChange={handleChange} placeholder="e.g. America/New_York" />
        </SettingItem>
      </CardContent>
      <CardContent className="border-t pt-6 text-right">
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">Save</Button>
      </CardContent>
    </Card>
  );
};

export default GeneralSettingsTab;


