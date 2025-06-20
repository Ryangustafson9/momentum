import React, { useEffect } from 'react';
import { Settings, Bell, Shield, CreditCard, Users, LayoutDashboard, BarChart3, Palette } from 'lucide-react';
import SettingsPageLayout from '@/components/admin/settings/SettingsPageLayout.jsx';
import SettingsTabs from '@/components/admin/settings/SettingsTabs.jsx';
import GeneralSettingsTab from '@/components/admin/settings/tabs/GeneralSettingsTab.jsx';
import NotificationSettingsTab from '@/components/admin/settings/tabs/NotificationSettingsTab.jsx';
import SecuritySettingsTab from '@/components/admin/settings/tabs/SecuritySettingsTab.jsx';
import BillingSettingsTab from '@/components/admin/settings/tabs/BillingSettingsTab.jsx';
import ReportingSettingsTab from '@/components/admin/settings/tabs/ReportingSettingsTab.jsx';
import AppearanceSettingsTab from '@/components/admin/settings/tabs/AppearanceSettingsTab.jsx';
import { TabsContent } from '@/components/ui/tabs';
import { initializeGymBranding } from '@/utils/gymBranding.js';


const settingsTabsConfig = [
  { 
    value: "general", 
    label: "General", 
    Icon: Settings, 
    component: <GeneralSettingsTab />,
    description: "Manage basic gym information and operational settings."
  },
  { 
    value: "notifications", 
    label: "Notifications", 
    Icon: Bell, 
    component: <NotificationSettingsTab />,
    description: "Configure email and app notification preferences."  },
  { 
    value: "security", 
    label: "Security", 
    Icon: Shield, 
    component: <SecuritySettingsTab />,
    description: "Set password policies, access controls, and other security measures."
  },
  { 
    value: "billing", 
    label: "Billing", 
    Icon: CreditCard, 
    component: <BillingSettingsTab />,
    description: "Configure payment gateways, currency, and tax settings."
  },
  {
    value: "reporting",
    label: "Reporting",
    Icon: BarChart3,
    component: <ReportingSettingsTab />,
    description: "Customize report generation and analytics display."
  },
  {
    value: "appearance",
    label: "Appearance",
    Icon: Palette,
    component: <AppearanceSettingsTab />,
    description: "Manage themes, branding, and UI customization."
  }
];

const AdminSettingsPage = () => {
  // Initialize gym branding when settings page loads
  useEffect(() => {
    initializeGymBranding();
  }, []);

  // Refresh gym branding when general settings are saved
  const handleSettingsChange = () => {
    initializeGymBranding();
  };

  return (
    <SettingsPageLayout
      pageTitle="Application Settings"
      pageDescription="Tailor the application to your gym's specific needs and preferences."
    >
      <SettingsTabs defaultValue="general" tabsConfig={settingsTabsConfig}>
        {settingsTabsConfig.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            {React.cloneElement(tab.component, { 
              onSettingsChange: tab.value === 'general' ? handleSettingsChange : undefined 
            })}
          </TabsContent>
        ))}
      </SettingsTabs>
    </SettingsPageLayout>
  );
};

export default AdminSettingsPage;


