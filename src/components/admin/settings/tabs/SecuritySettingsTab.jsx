
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';
import SettingsCardItem from '@/components/admin/settings/SettingsCardItem.jsx';
import { Shield } from 'lucide-react';

const SecuritySettingsTabContent = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({ twoFactorAuthEnabled: false, sessionTimeout: 30 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const currentSettings = await dataService.getSecuritySettings();
        setSettings(currentSettings);
      } catch (error) {
        
        toast({
          title: "Error",
          description: "Could not load security settings. Using default values.",
          variant: "destructive",
        });
        setSettings({ twoFactorAuthEnabled: false, sessionTimeout: 30 });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e) => {
    const value = e.target.name === 'sessionTimeout' ? parseInt(e.target.value, 10) : e.target.value;
    setSettings({ ...settings, [e.target.name]: value });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await dataService.saveSecuritySettings(settings);
      toast({
        title: "Settings Saved",
        description: "Security settings have been updated.",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Could not save security settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && typeof settings.twoFactorAuthEnabled === 'undefined') {
    return <div>Loading security settings...</div>;
  }

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center">
           <Shield className="mr-2 h-5 w-5 text-primary" /> Security Configuration
        </CardTitle>
        <CardDescription>Manage password policies, access controls, and other security features.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 pt-6">
        <SettingsCardItem 
          label="Enable Two-Factor Authentication"
          description="Enhance account security by requiring a second form of verification (Feature under development)."
        >
          <Switch
            checked={settings.twoFactorAuthEnabled}
            onCheckedChange={() => handleToggle('twoFactorAuthEnabled')}
            id="twoFactorAuthEnabled"
            disabled 
          />
        </SettingsCardItem>
        <SettingsCardItem 
          label="Session Timeout (minutes)"
          description="Automatically log out users after a period of inactivity (Feature under development)."
        >
          <Input
            name="sessionTimeout"
            type="number"
            value={settings.sessionTimeout || 30}
            onChange={handleChange}
            min="5"
            max="120"
            className="w-24"
            disabled
          />
        </SettingsCardItem>
         <div className="text-center py-8">
          <Shield className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-4 text-muted-foreground">
            Advanced security features like password complexity, 2FA, and session management are planned.
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">This section is currently for display and future development.</p>
        </div>
      </CardContent>
      <CardContent className="border-t pt-6 text-right">
        <Button onClick={handleSave} disabled={isLoading || true} className="bg-primary hover:bg-primary/90">
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SecuritySettingsTabContent;



