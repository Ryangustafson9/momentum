
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Globe, 
  Save,
  User,
  Lock,
  CreditCard,
  Bell,
  Palette,
  Settings as SettingsIcon,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { dataService } from '@/services/apiService';

const SettingsSectionCard = ({ title, description, children, onSave, isSaving, saveButtonText, SaveIcon = Save }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {children}
    </CardContent>
    <CardFooter>
      <Button onClick={onSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <SaveIcon className="mr-2 h-4 w-4" />
            {saveButtonText || "Save Changes"}
          </>
        )}
      </Button>
    </CardFooter>
  </Card>
);

const InputField = ({ id, label, value, onChange, Icon, type = "text" }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="flex items-center">
      {Icon && <Icon className="h-4 w-4 mr-2 text-muted-foreground" />}
      {label}
    </Label>
    <Input
      id={id}
      type={type}
      value={value || ''}
      onChange={onChange}
    />
  </div>
);

const GymInformationTab = () => {
  const [gymInfo, setGymInfo] = useState({ name: '', email: '', phone: '', address: '', openingHours: '', website: '' });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await dataService.getGeneralSettings();
        setGymInfo({
          name: settings.gym_name || '',
          email: settings.admin_email || '',
          phone: settings.phone || '', 
          address: settings.address || '', 
          openingHours: settings.opening_hours || '', 
          website: settings.website || '',
        });
      } catch (error) {
        toast({ title: "Error", description: "Could not load gym information.", variant: "destructive" });
      }
    };
    fetchSettings();
  }, [toast]);

  const handleChange = (field, value) => {
    setGymInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dataService.saveGeneralSettings({ 
        gym_name: gymInfo.name, 
        admin_email: gymInfo.email, 
        phone: gymInfo.phone,
        address: gymInfo.address,
        opening_hours: gymInfo.openingHours,
        website: gymInfo.website,
      });
      toast({ title: "Gym Information Saved", description: "Your gym's details have been updated." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save gym information.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsSectionCard
      title="Gym Information"
      description="Update your gym's basic information and contact details."
      onSave={handleSave}
      isSaving={isSaving}
      SaveIcon={Building}
    >
      <InputField id="gym-name" label="Gym Name" value={gymInfo.name} onChange={(e) => handleChange('name', e.target.value)} Icon={Building} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField id="gym-email" label="Email" type="email" value={gymInfo.email} onChange={(e) => handleChange('email', e.target.value)} Icon={Mail} />
        <InputField id="gym-phone" label="Phone" value={gymInfo.phone} onChange={(e) => handleChange('phone', e.target.value)} Icon={Phone} />
      </div>
      <InputField id="gym-address" label="Address" value={gymInfo.address} onChange={(e) => handleChange('address', e.target.value)} Icon={MapPin} />
      <InputField id="gym-hours" label="Opening Hours" value={gymInfo.openingHours} onChange={(e) => handleChange('openingHours', e.target.value)} Icon={Clock} />
      <InputField id="gym-website" label="Website" value={gymInfo.website} onChange={(e) => handleChange('website', e.target.value)} Icon={Globe} />
    </SettingsSectionCard>
  );
};

const AccountSettingsTab = () => {
  const [accountSettings, setAccountSettings] = useState({ email: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const user = dataService.auth.getLoggedInUser();
    if (user) {
      setAccountSettings(prev => ({...prev, email: user.email || ''}));
    }
  }, []);

  const handleChange = (field, value) => {
    setAccountSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (accountSettings.newPassword && accountSettings.newPassword !== accountSettings.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      setIsSaving(false);
      return;
    }
    try {
      
      if (accountSettings.email !== dataService.auth.getLoggedInUser().email) {
         await dataService.updateUserEmail(accountSettings.email);
         toast({ title: "Email Update Initiated", description: "Please check your email to confirm the change." });
      }
      if (accountSettings.newPassword && accountSettings.currentPassword) {
        await dataService.updateUserPassword(accountSettings.currentPassword, accountSettings.newPassword);
        toast({ title: "Password Updated", description: "Your password has been changed successfully." });
        setAccountSettings(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else if (accountSettings.newPassword && !accountSettings.currentPassword) {
        toast({ title: "Error", description: "Current password is required to set a new password.", variant: "destructive" });
        setIsSaving(false);
        return;
      } else {
         toast({ title: "Account Settings", description: "No changes to save or password fields empty." });
      }
    } catch (error) {
      toast({ title: "Error", description: `Failed to update account settings: ${error.message || 'Unknown error'}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsSectionCard
      title="Account Settings"
      description="Update your account information and security settings."
      onSave={handleSave}
      isSaving={isSaving}
      saveButtonText="Save Account Settings"
      SaveIcon={User}
    >
      <InputField id="account-email" label="Email Address" type="email" value={accountSettings.email} onChange={(e) => handleChange('email', e.target.value)} Icon={User} />
      <InputField id="current-password" label="Current Password" type="password" value={accountSettings.currentPassword} onChange={(e) => handleChange('currentPassword', e.target.value)} Icon={Lock} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField id="new-password" label="New Password" type="password" value={accountSettings.newPassword} onChange={(e) => handleChange('newPassword', e.target.value)} />
        <InputField id="confirm-password" label="Confirm New Password" type="password" value={accountSettings.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} />
      </div>
    </SettingsSectionCard>
  );
};

const NotificationPrefsTab = () => {
  const [prefs, setPrefs] = useState({ notifyNewMembers: true, notifyPayments: true, notifyClassChanges: true });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const settings = await dataService.getNotificationSettings();
        setPrefs({
          notifyNewMembers: settings.email_new_member || false,
          notifyPayments: settings.email_payment_confirmation || false, 
          notifyClassChanges: settings.email_class_update || false, 
        });
      } catch (error) {
        toast({ title: "Error", description: "Could not load notification preferences.", variant: "destructive" });
      }
    };
    fetchPrefs();
  }, [toast]);

  const handleChange = (field, value) => {
    setPrefs(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dataService.saveNotificationSettings({
        email_new_member: prefs.notifyNewMembers,
        email_payment_confirmation: prefs.notifyPayments,
        email_class_update: prefs.notifyClassChanges,
      });
      toast({ title: "Notification Preferences Saved", description: "Your notification settings have been updated." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save notification preferences.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const CheckboxItem = ({id, label, checked, onCheckedChange}) => (
     <div className="flex items-center space-x-2">
        <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
        <Label htmlFor={id}>{label}</Label>
    </div>
  );

  return (
    <SettingsSectionCard
      title="Notification Settings"
      description="Manage how you receive notifications from the application."
      onSave={handleSave}
      isSaving={isSaving}
      saveButtonText="Save Notification Settings"
      SaveIcon={Bell}
    >
      <CheckboxItem id="notify-new-members" label="Notify on new member sign-ups" checked={prefs.notifyNewMembers} onCheckedChange={(checked) => handleChange('notifyNewMembers', checked)} />
      <CheckboxItem id="notify-payments" label="Notify on successful payments" checked={prefs.notifyPayments} onCheckedChange={(checked) => handleChange('notifyPayments', checked)} />
      <CheckboxItem id="notify-class-changes" label="Notify on class schedule changes" checked={prefs.notifyClassChanges} onCheckedChange={(checked) => handleChange('notifyClassChanges', checked)} />
    </SettingsSectionCard>
  );
};

const AppearanceSettingsTab = () => {
  const [appearance, setAppearance] = useState({ darkMode: false, colorTheme: 'purple' });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedSettings = dataService.getAppearanceSettings();
    if (savedSettings) {
      setAppearance(savedSettings);
      if (savedSettings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const handleChange = (field, value) => {
    setAppearance(prev => ({ ...prev, [field]: value }));
    if (field === 'darkMode') {
       if (value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    dataService.saveAppearanceSettings(appearance);
    setIsSaving(false);
    toast({ title: "Appearance Settings Saved", description: "Your appearance preferences have been updated." });
    window.dispatchEvent(new CustomEvent('appearanceSettingsUpdated', { detail: appearance }));
  };

  return (
    <SettingsSectionCard
      title="Appearance Settings"
      description="Customize the look and feel of the application."
      onSave={handleSave}
      isSaving={isSaving}
      saveButtonText="Save Appearance Settings"
      SaveIcon={Palette}
    >
      <div className="flex items-center space-x-2">
        <Checkbox id="dark-mode" checked={appearance.darkMode} onCheckedChange={(checked) => handleChange('darkMode', checked)} />
        <Label htmlFor="dark-mode">Enable Dark Mode</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="color-theme">Color Theme</Label>
        <select
          id="color-theme"
          value={appearance.colorTheme}
          onChange={(e) => handleChange('colorTheme', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="purple">Purple (Default)</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="orange">Orange</option>
        </select>
      </div>
    </SettingsSectionCard>
  );
};


const BillingTab = () => {
  const { toast } = useToast();
  
  const handleManageSubscription = () => {
    toast({ title: "Billing Action", description: "Redirecting to subscription management... (placeholder)"});
    // Placeholder for Stripe Customer Portal or similar logic
  };
  
  return (
    <SettingsSectionCard
      title="Billing & Subscription"
      description="Manage your subscription and payment methods."
      onSave={() => toast({title: "Billing", description: "Billing settings updated (placeholder)"})}
      isSaving={false} 
      SaveIcon={CreditCard}
      saveButtonText="Update Billing Information" 
    >
      <div className="p-6 border rounded-lg bg-muted/30 dark:bg-slate-800/50">
        <h4 className="font-semibold">Current Plan: Premium</h4>
        <p className="text-sm text-muted-foreground">Renews on: May 30, 2025</p>
        <Button variant="outline" className="mt-4" onClick={handleManageSubscription}>Manage Subscription</Button>
      </div>
      <div>
        <h4 className="font-medium mb-2">Payment Methods</h4>
        <div className="border rounded-lg p-4 flex items-center justify-between dark:border-slate-700">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 mr-3 text-primary" />
            <div>
              <p className="font-medium">Visa **** **** **** 1234</p>
              <p className="text-sm text-muted-foreground">Expires 12/2027</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">Edit</Button>
        </div>
        <Button variant="link" className="mt-2 px-0">Add new payment method</Button>
      </div>
      <div>
        <h4 className="font-medium mb-2">Billing History</h4>
        <p className="text-sm text-muted-foreground">
          Your billing history will appear here. (Feature coming soon)
        </p>
      </div>
    </SettingsSectionCard>
  );
};


const UserSettingsPage = () => {
  const tabs = [
    { value: "gym", label: "Gym Information", component: <GymInformationTab /> },
    { value: "account", label: "Account", component: <AccountSettingsTab /> },
    { value: "notifications", label: "Notifications", component: <NotificationPrefsTab /> },
    { value: "appearance", label: "Appearance", component: <AppearanceSettingsTab /> },
    { value: "billing", label: "Billing", component: <BillingTab /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 px-4 md:px-6"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <SettingsIcon className="mr-3 h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your gym profile and application preferences.
        </p>
      </div>

      <Tabs defaultValue="gym" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 bg-transparent p-0">
          {tabs.map(tab => (
             <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              className="flex-1 justify-center px-3 py-2.5 text-sm font-medium rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
};

export default UserSettingsPage;


