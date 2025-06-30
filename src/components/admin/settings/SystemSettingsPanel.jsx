import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, Building2, Globe, FileText, BarChart3, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import ClubSwitcher from '@/components/admin/ClubSwitcher';

const SystemSettingsPanel = () => {
  const { toast } = useToast();
  const { 
    settings, 
    isLoading, 
    updateSetting,
    isMultiLocationEnabled,
    isOnlineJoiningEnabled,
    isElectronicAgreementsEnabled,
    isPosIntegrationEnabled,
    isAdvancedReportingEnabled
  } = useSystemSettings();

  const handleSettingChange = async (key, value) => {
    const result = await updateSetting(key, value);
    
    if (result.success) {
      toast({
        title: "Settings Updated",
        description: `${getSettingLabel(key)} has been ${value ? 'enabled' : 'disabled'}.`,
        variant: "default",
      });
    } else {
      toast({
        title: "Update Failed",
        description: `Failed to update ${getSettingLabel(key)}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const getSettingLabel = (key) => {
    const labels = {
      multi_location_enabled: 'Multi-Location Features',
      online_joining_enabled: 'Online Joining',
      electronic_agreements_enabled: 'Electronic Agreements',
      pos_integration_enabled: 'POS Integration',
      advanced_reporting_enabled: 'Advanced Reporting'
    };
    return labels[key] || key;
  };

  const settingsConfig = [
    {
      key: 'multi_location_enabled',
      label: 'Multi-Location Features',
      description: 'Enable multi-location management, revenue mapping, and location-specific access controls.',
      icon: Building2,
      value: isMultiLocationEnabled,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      key: 'online_joining_enabled',
      label: 'Online Joining',
      description: 'Allow members to sign up and purchase memberships through the online portal.',
      icon: Globe,
      value: isOnlineJoiningEnabled,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      key: 'electronic_agreements_enabled',
      label: 'Electronic Agreements',
      description: 'Enable digital membership agreements and electronic signature collection.',
      icon: FileText,
      value: isElectronicAgreementsEnabled,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      key: 'pos_integration_enabled',
      label: 'POS Integration',
      description: 'Enable point-of-sale integration for retail and additional services.',
      icon: CreditCard,
      value: isPosIntegrationEnabled,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      key: 'advanced_reporting_enabled',
      label: 'Advanced Reporting',
      description: 'Enable advanced analytics, custom reports, and business intelligence features.',
      icon: BarChart3,
      value: isAdvancedReportingEnabled,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading system settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Club Switcher - Only show if multi-location is enabled */}
      {isMultiLocationEnabled && (
        <ClubSwitcher />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure system-wide features and functionality for your gym management system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settingsConfig.map((setting) => {
            const IconComponent = setting.icon;
            return (
              <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${setting.bgColor}`}>
                    <IconComponent className={`h-5 w-5 ${setting.color}`} />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={setting.key} className="text-base font-medium cursor-pointer">
                      {setting.label}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {setting.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={setting.key}
                  checked={setting.value}
                  onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
                  className="ml-4"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p><strong>Multi-Location Features:</strong> When disabled, all location-specific options will be hidden and single-location defaults will be used.</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <p><strong>Online Joining:</strong> Controls whether the public-facing membership signup portal is accessible.</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <p><strong>Feature Changes:</strong> Some settings may require a page refresh to take full effect.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettingsPanel;
