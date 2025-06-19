
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bell, Shield, CreditCard, Users, LayoutPanelLeft } from 'lucide-react';

const iconMap = {
  general: Settings,
  admin_panel: LayoutPanelLeft,
  notifications: Bell,
  security: Shield,
  billing: CreditCard,
  users: Users,
};

const SettingsTabs = ({ defaultValue, children, tabsConfig }) => {
  return (
    <Tabs defaultValue={defaultValue} className="flex flex-col gap-6">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2 bg-transparent p-0">
        {tabsConfig.map(tab => {
          const IconComponent = tab.Icon || iconMap[tab.value] || Settings;
          return (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value} 
              className="flex-1 justify-center px-3 py-2.5 text-sm font-medium rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <IconComponent className="mr-2 h-5 w-5" />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
      <div className="flex-1">
        {children}
      </div>
    </Tabs>
  );
};

export default SettingsTabs;


