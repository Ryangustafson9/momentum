
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';

const SettingItem = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b last:border-b-0">
    <Label className="mb-2 sm:mb-0 text-sm font-medium text-gray-700">{label}</Label>
    <div className="w-full sm:w-auto sm:max-w-xs">{children}</div>
  </div>
);

const NotificationSettingsTab = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState(dataService.getNotificationSettings());

  useEffect(() => {
    setSettings(dataService.getNotificationSettings());
  }, []);

  const handleChange = (name, value) => {
    setSettings({ ...settings, [name]: value });
  };

  const handleSave = () => {
    dataService.saveNotificationSettings(settings);
    toast({
      title: "Notification Settings Saved",
      description: "Your notification settings have been updated.",
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Configure when and how users are notified.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <SettingItem label="Email on New Member Signup">
          <Switch checked={settings.emailNewMember} onCheckedChange={(val) => handleChange('emailNewMember', val)} id="emailNewMemberSwitch" />
        </SettingItem>
        <SettingItem label="Email on Class Booking Confirmation">
          <Switch checked={settings.emailClassBooking} onCheckedChange={(val) => handleChange('emailClassBooking', val)} id="emailClassBookingSwitch" />
        </SettingItem>
        <SettingItem label="SMS Payment Reminders (if SMS enabled)">
          <Switch checked={settings.smsPaymentReminder || false} onCheckedChange={(val) => handleChange('smsPaymentReminder', val)} id="smsPaymentReminderSwitch" />
        </SettingItem>
      </CardContent>
      <CardContent className="border-t pt-6 text-right">
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">Save Notification Settings</Button>
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsTab;


