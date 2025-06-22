
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';
import SettingsCardItem from '@/components/admin/settings/SettingsCardItem.jsx';

const NotificationSettingsTabContent = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({ emailNewMember: true, emailClassBooking: true });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const currentSettings = await dataService.getNotificationSettings();
        setSettings(currentSettings);
      } catch (error) {
        
        toast({
          title: "Error",
          description: "Could not load notification settings. Using default values.",
          variant: "destructive",
        });
         setSettings({ emailNewMember: true, emailClassBooking: true });
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
      await dataService.saveNotificationSettings(settings);
      toast({
        title: "Settings Saved",
        description: "Notification settings have been updated.",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      
       toast({
        title: "Error",
        description: "Could not save notification settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && typeof settings.emailNewMember === 'undefined') {
    return <div>Loading notification settings...</div>;
  }

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b">
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>Manage email notifications sent by the system.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 pt-6">
        <SettingsCardItem 
          label="New Member Welcome Email"
          description="Send a welcome email when a new member signs up."
        >
          <Switch
            checked={settings.emailNewMember}
            onCheckedChange={() => handleToggle('emailNewMember')}
            id="emailNewMember"
          />
        </SettingsCardItem>
        <SettingsCardItem 
          label="Class Booking Confirmation"
          description="Send an email confirmation when a member books a class."
        >
          <Switch
            checked={settings.emailClassBooking}
            onCheckedChange={() => handleToggle('emailClassBooking')}
            id="emailClassBooking"
          />
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

export default NotificationSettingsTabContent;



