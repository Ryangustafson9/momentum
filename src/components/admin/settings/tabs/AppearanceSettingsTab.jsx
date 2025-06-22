
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Palette } from 'lucide-react';
import SettingsCardItem from '@/components/admin/settings/SettingsCardItem.jsx';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';
import { useTheme } from '@/hooks/useTheme.jsx';


const AppearanceSettingsTabContent = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({ sidebarInitiallyOpen: true });
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    const fetchLayoutSettings = async () => {
      setIsLoading(true);
      try {
        const layoutSettings = await dataService.getLayoutSettings();
        setSettings(layoutSettings);
      } catch (error) {
        
        toast({
          title: "Error",
          description: "Could not load appearance settings. Using defaults.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLayoutSettings();
  }, [toast]);

  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
     toast({
      title: "Theme Changed",
      description: `Theme set to ${selectedTheme}.`,
    });
  };

  const handleSidebarToggle = (value) => {
    setSettings(prev => ({ ...prev, sidebarInitiallyOpen: value }));
  };

  const handleSaveLayoutSettings = async () => {
    setIsLoading(true);
    try {
      await dataService.saveLayoutSettings({ sidebarInitiallyOpen: settings.sidebarInitiallyOpen });
      toast({
        title: "Layout Settings Saved",
        description: "Sidebar preference has been updated. It will apply on next page load or refresh.",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      
      toast({
        title: "Error Saving Layout",
        description: "Could not save sidebar preference.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center">
          <Palette className="mr-2 h-5 w-5 text-primary" /> Appearance & Layout
        </CardTitle>
        <CardDescription>Manage themes, branding, and UI customization options.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 pt-6">
        <SettingsCardItem 
          label="Application Theme"
          description="Choose between light, dark, or system default theme."
        >
          <div className="flex space-x-2">
            <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => handleThemeChange('light')}>Light</Button>
            <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => handleThemeChange('dark')}>Dark</Button>
            <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => handleThemeChange('system')}>System</Button>
          </div>
        </SettingsCardItem>
        <SettingsCardItem 
          label="Admin Sidebar Initially Open"
          description="Determines if the admin sidebar is open or closed by default when the page loads."
        >
          <Switch 
            checked={settings.sidebarInitiallyOpen} 
            onCheckedChange={handleSidebarToggle}
            id="sidebarInitiallyOpen"
          />
        </SettingsCardItem>

         <div className="text-center py-8">
          <Palette className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-4 text-muted-foreground">
            More appearance settings (e.g., custom logo upload, primary color selection) are planned.
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">This section is currently for display and future development.</p>
        </div>
      </CardContent>
      <CardContent className="border-t pt-6 text-right">
        <Button onClick={handleSaveLayoutSettings} disabled={isLoading} className="bg-primary hover:bg-primary/90">
          {isLoading ? 'Saving...' : 'Save Layout Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettingsTabContent;



