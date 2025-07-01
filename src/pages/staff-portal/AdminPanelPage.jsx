import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StaffPermissionsManagement from '@/components/admin/StaffPermissionsManagement';
import ConfigurationTemplatesManager from '@/components/admin/ConfigurationTemplatesManager';
import BillingConfigurationManager from '@/components/billing/BillingConfigurationManager';
import SystemSettingsManager from '@/components/admin/SystemSettingsManager';
import PaymentProcessorHub from '@/components/billing/PaymentProcessorHub';
import MigrationWorkflowManager from '@/components/admin/MigrationWorkflowManager';
import BillingConfigurationPanel from '@/components/billing/BillingConfigurationPanel';
import MultiLocationManagement from '@/components/admin/MultiLocationManagement';
import ScriptsAndCronManager from '@/components/admin/ScriptsAndCronManager';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  Shield,
  Building2,
  FileText,
  DollarSign,
  CreditCard,
  ArrowRightLeft,
  Clock,
  Settings
} from 'lucide-react';

// Enhanced Tab Configuration
const ADMIN_TAB_CONFIG = [
  {
    id: 'permissions',
    label: 'Permissions',
    icon: Shield,
    description: 'Manage staff roles and permissions',
    color: 'red'
  },
  {
    id: 'multi-location',
    label: 'Multi-Location',
    icon: Building2,
    description: 'Configure multiple gym locations',
    color: 'blue'
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: FileText,
    description: 'Manage configuration templates',
    color: 'purple'
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: DollarSign,
    description: 'Configure billing settings and policies',
    color: 'green'
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: CreditCard,
    description: 'Payment processor configuration',
    color: 'indigo'
  },
  {
    id: 'migrations',
    label: 'Migrations',
    icon: ArrowRightLeft,
    description: 'Data migration and import tools',
    color: 'orange'
  },
  {
    id: 'scripts',
    label: 'Scripts & Cron',
    icon: Clock,
    description: 'Automated tasks and scheduled jobs',
    color: 'teal'
  },
  {
    id: 'system-settings',
    label: 'System Settings',
    icon: Settings,
    description: 'Global system features and toggles',
    color: 'gray'
  }
];

// Enhanced Tab Trigger Component
const EnhancedTabTrigger = ({ tab, isActive }) => {
  const Icon = tab.icon;

  return (
    <TabsTrigger
      value={tab.id}
      title={tab.description} // Add tooltip with description
      className={`
        relative flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium
        transition-all duration-200 rounded-lg border border-transparent
        ${isActive
          ? 'bg-white text-primary shadow-sm border-gray-200'
          : 'text-gray-600 hover:bg-white/60 hover:text-primary hover:shadow-sm'
        }
      `}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{tab.label}</span>
    </TabsTrigger>
  );
};
const AdminPanelPage = () => {
  const [activeTab, setActiveTab] = useState('permissions');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 px-4 md:px-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">
            Manage system settings, permissions, and configurations
          </p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          <SlidersHorizontal className="w-4 h-4 mr-1" />
          System Configuration
        </Badge>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-xl grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1">
          {ADMIN_TAB_CONFIG.map(tab => (
            <EnhancedTabTrigger
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
            />
          ))}
        </TabsList>

        {/* Tab Content with Enhanced Styling */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {ADMIN_TAB_CONFIG.map(tab => (
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
                    {/* Render appropriate component based on tab */}
                    {tab.id === 'permissions' && <StaffPermissionsManagement />}
                    {tab.id === 'multi-location' && <MultiLocationManagement />}
                    {tab.id === 'templates' && <ConfigurationTemplatesManager />}
                    {tab.id === 'billing' && <BillingConfigurationManager />}
                    {tab.id === 'payments' && <PaymentProcessorHub />}
                    {tab.id === 'migrations' && <MigrationWorkflowManager />}
                    {tab.id === 'scripts' && <ScriptsAndCronManager />}
                    {tab.id === 'system-settings' && <SystemSettingsManager />}
                  </motion.div>
                </TabsContent>
              )
            ))}
          </AnimatePresence>
        </div>
      </Tabs>
    </motion.div>
  );
};
export default AdminPanelPage;
