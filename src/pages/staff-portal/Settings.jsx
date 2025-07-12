import { useEffect, useState } from 'react';
import { Settings, Bell, Shield, CreditCard, BarChart3, Palette, ClipboardList, Database, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SettingsPageLayout from '@/components/admin/settings/SettingsPageLayout.jsx';
import GeneralSettingsTab from '@/components/admin/settings/tabs/GeneralSettingsTab.jsx';
import NotificationSettingsTab from '@/components/admin/settings/tabs/NotificationSettingsTab.jsx';
import SecuritySettingsTab from '@/components/admin/settings/tabs/SecuritySettingsTab.jsx';
import BillingSettingsTab from '@/components/admin/settings/tabs/BillingSettingsTab.jsx';
import ReportingSettingsTab from '@/components/admin/settings/tabs/ReportingSettingsTab.jsx';
import AppearanceSettingsTab from '@/components/admin/settings/tabs/AppearanceSettingsTab.jsx';
import BrandingSettingsTab from '@/components/admin/settings/tabs/BrandingSettingsTab.jsx';
import CustomFieldsSettingsTab from '@/components/admin/settings/tabs/CustomFieldsSettingsTab.jsx';
import SystemSettingsPanel from '@/components/admin/settings/SystemSettingsPanel.jsx';
import AccountingTab from '@/components/admin/AccountingTab.jsx';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { initializeGymBranding } from '@/utils/gymBranding.js';



// Enhanced Tab Configuration
const SETTINGS_TAB_CONFIG = [
  {
    id: "system",
    label: "System",
    icon: Database,
    component: SystemSettingsPanel,
    description: "Configure system-wide features like multi-location support and core functionality.",
    color: "blue"
  },
  {
    id: "general",
    label: "General",
    icon: Settings,
    component: GeneralSettingsTab,
    description: "Manage basic gym information and operational settings.",
    color: "gray"
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    component: NotificationSettingsTab,
    description: "Configure email and app notification preferences.",
    color: "yellow"
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    component: SecuritySettingsTab,
    description: "Set password policies, access controls, and other security measures.",
    color: "red"
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    component: BillingSettingsTab,
    description: "Configure payment gateways, currency, and tax settings.",
    color: "green"
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: Calculator,
    component: AccountingTab,
    description: "Manage accounting methods, chart of accounts, and financial settings.",
    color: "emerald"
  },
  {
    id: "reporting",
    label: "Reporting",
    icon: BarChart3,
    component: ReportingSettingsTab,
    description: "Customize report generation and analytics display.",
    color: "purple"
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    component: AppearanceSettingsTab,
    description: "Manage themes, branding, and UI customization.",
    color: "pink"
  },
  {
    id: "custom-fields",
    label: "Custom Fields",
    icon: ClipboardList,
    component: CustomFieldsSettingsTab,
    description: "Create and manage custom fields for member profiles.",
    color: "indigo"
  },
  {
    id: "branding",
    label: "Branding",
    icon: Palette,
    component: BrandingSettingsTab,
    description: "Upload your club's logo and avatar for display in the app.",
    color: "orange"
  }
];

// Enhanced Tab Trigger Component
const EnhancedTabTrigger = ({ tab, isActive }) => {
  const IconComponent = tab.icon;

  return (
    <TabsTrigger
      value={tab.id}
      className={`
        relative flex items-center justify-center gap-0.5 px-1 py-0.5 text-sm font-medium
        transition-all duration-200 rounded-lg border border-transparent min-h-[10px]
        ${isActive
          ? 'bg-white text-primary shadow-md border-gray-200'
          : 'text-gray-600 hover:bg-white/60 hover:text-primary hover:shadow-sm'
        }
      `}
    >
      <div className="flex flex-col items-center gap-0">
        <IconComponent className="h-3 w-3" />
        <span className="text-[10px] font-medium leading-none">{tab.label}</span>
      </div>
    </TabsTrigger>
  );
};

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");

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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Enhanced Tab Navigation with Two Rows */}
        <div className="bg-gray-100 p-1 rounded-xl">
          <TabsList className="grid w-full grid-cols-5 gap-1 h-auto bg-transparent">
            {SETTINGS_TAB_CONFIG.slice(0, 5).map(tab => (
              <EnhancedTabTrigger
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
              />
            ))}
          </TabsList>
          <TabsList className="grid w-full grid-cols-5 gap-1 h-auto bg-transparent" style={{ marginTop: '5px' }}>
            {SETTINGS_TAB_CONFIG.slice(5, 10).map(tab => (
              <EnhancedTabTrigger
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
              />
            ))}
          </TabsList>
        </div>

        {/* Tab Content with Enhanced Styling */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {SETTINGS_TAB_CONFIG.map(tab => (
              activeTab === tab.id && (
                <TabsContent key={tab.id} value={tab.id} className="m-0">
                  <motion.div
                    key={activeTab}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
                  >
                    <tab.component
                      onSettingsChange={tab.id === 'general' ? handleSettingsChange : undefined}
                    />
                  </motion.div>
                </TabsContent>
              )
            ))}
          </AnimatePresence>
        </div>
      </Tabs>
    </SettingsPageLayout>
  );
};

export default AdminSettingsPage;


