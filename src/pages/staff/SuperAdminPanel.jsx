
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';
import { ArrowLeft, UserCog, Settings, Shield, DollarSign } from 'lucide-react';

const SettingItem = ({ label, children }) => (
  <div className="flex items-center justify-between py-3 border-b last:border-b-0">
    <Label className="text-sm font-medium text-gray-700">{label}</Label>
    {children}
  </div>
);

const UserProfileSettingsColumn = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState(dataService.getAdminPanelSettings());

  useEffect(() => {
    setSettings(dataService.getAdminPanelSettings());
  }, []);

  const handleChange = (name, value) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    dataService.saveAdminPanelSettings(settings);
    toast({
      title: "User Profile Settings Saved",
      description: "Required fields for member profiles have been updated.",
    });
  };

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center"><UserCog className="mr-2 h-5 w-5 text-primary" /> User Profile</CardTitle>
        <CardDescription>Define required fields for member profiles.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 flex-grow overflow-y-auto">
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
      <CardContent className="border-t pt-4">
        <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90">Save User Profile Settings</Button>
      </CardContent>
    </Card>
  );
};

const PlaceholderSettingsColumn = ({ title, icon }) => {
  const IconComponent = icon;
  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center"><IconComponent className="mr-2 h-5 w-5 text-primary" /> {title}</CardTitle>
        <CardDescription>Configuration for {title.toLowerCase()}.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Settings for {title.toLowerCase()} will be available here soon.</p>
      </CardContent>
    </Card>
  );
};


const SuperAdminPanelPage = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 min-h-screen flex flex-col"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage core system configurations and advanced settings.</p>
        </div>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Staff Portal
        </Button>
      </div>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <UserProfileSettingsColumn />
        <PlaceholderSettingsColumn title="System Defaults" icon={Settings} />
        <PlaceholderSettingsColumn title="Security Policies" icon={Shield} />
        <PlaceholderSettingsColumn title="Billing Integrations" icon={DollarSign} />
      </div>
    </motion.div>
  );
};

export default SuperAdminPanelPage;


