import React, { useState } from 'react';
import {
  Save,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const AccountingMethodSettings = ({
  settings,
  onSettingsUpdate,
  showNextButton = false,
  onNext,
  isNextEnabled = false
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async (shouldAdvance = false) => {
    try {
      setIsSaving(true);

      const { accounting_method, ...accountingSettings } = localSettings;

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1,
          accounting_method,
          accounting_settings: accountingSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Accounting settings have been updated successfully.",
        duration: 3000,
      });

      onSettingsUpdate?.(localSettings, shouldAdvance);
    } catch (error) {
      console.error('Error saving accounting settings:', error);
      toast({
        title: "Error",
        description: "Failed to save accounting settings.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    await handleSaveSettings(true);
  };

  return (
    <div className="space-y-4">
      {/* Accounting Method Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Accounting Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="accounting_method">Choose Accounting Method</Label>
            <Select 
              value={localSettings.accounting_method} 
              onValueChange={(value) => handleSettingChange('accounting_method', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accrual">Accrual Accounting</SelectItem>
                <SelectItem value="cash">Cash Accounting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Method Explanations */}
          <div className="space-y-4">
            {localSettings.accounting_method === 'accrual' ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Accrual Accounting (Recommended)</strong><br />
                  Revenue and expenses are recorded when they are earned or incurred, regardless of when cash is received or paid. 
                  This method provides a more accurate picture of your gym's financial performance and is required for businesses 
                  with gross receipts over $27 million. Best for membership-based businesses with recurring revenue.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cash Accounting</strong><br />
                  Revenue and expenses are recorded only when cash is actually received or paid. This method is simpler 
                  but may not accurately reflect your gym's financial performance, especially with membership prepayments 
                  and recurring billing. Generally suitable for smaller businesses with simple transactions.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Fiscal Year Settings */}
          <div>
            <h4 className="font-medium mb-3">Fiscal Year Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fiscal_year_start">Fiscal Year Start</Label>
                <Select 
                  value={localSettings.fiscal_year_start || '01-01'} 
                  onValueChange={(value) => handleSettingChange('fiscal_year_start', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01-01">January 1st (Calendar Year)</SelectItem>
                    <SelectItem value="04-01">April 1st</SelectItem>
                    <SelectItem value="07-01">July 1st</SelectItem>
                    <SelectItem value="10-01">October 1st</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="default_currency">Default Currency</Label>
                <Select 
                  value={localSettings.default_currency || 'USD'} 
                  onValueChange={(value) => handleSettingChange('default_currency', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Configuration */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Account Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Account Numbering</h4>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="account_number_format">Account Number Format</Label>
                <Select 
                  value={localSettings.account_number_format || 'auto'} 
                  onValueChange={(value) => handleSettingChange('account_number_format', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-generate (1000, 1001, 1002...)</SelectItem>
                    <SelectItem value="manual">Manual entry</SelectItem>
                    <SelectItem value="custom">Custom format</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="require_account_codes">Require Account Codes</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Require alternative account codes for integration with external systems
                  </p>
                </div>
                <Switch
                  id="require_account_codes"
                  checked={localSettings.require_account_codes || false}
                  onCheckedChange={(checked) => handleSettingChange('require_account_codes', checked)}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Department & Location Tracking</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable_departments">Enable Department Tracking</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Track revenue and expenses by department (e.g., Personal Training, Group Classes)
                  </p>
                </div>
                <Switch
                  id="enable_departments"
                  checked={localSettings.enable_departments || false}
                  onCheckedChange={(checked) => handleSettingChange('enable_departments', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable_locations">Enable Location Tracking</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Track revenue and expenses by location for multi-location gyms
                  </p>
                </div>
                <Switch
                  id="enable_locations"
                  checked={localSettings.enable_locations !== false}
                  onCheckedChange={(checked) => handleSettingChange('enable_locations', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Integration Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="chart_template">Chart of Accounts Template</Label>
            <Select
              value={localSettings.chart_of_accounts_template || 'Standard Gym COA'}
              onValueChange={(value) => handleSettingChange('chart_of_accounts_template', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard Gym COA">Standard Gym Chart of Accounts</SelectItem>
                <SelectItem value="QuickBooks Gym">QuickBooks Gym Template</SelectItem>
                <SelectItem value="Custom">Custom Template</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 mt-2">
              Choose the chart of accounts template that best fits your business structure
            </p>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Integration Ready:</strong> These settings prepare your accounting system for integration
              with QuickBooks, Xero, and other accounting software.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => handleSaveSettings(false)}
          disabled={isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>

        {showNextButton && (
          <Button
            onClick={handleSaveAndNext}
            disabled={isSaving || !isNextEnabled}
            className="flex items-center gap-2"
          >
            Save & Next: Setup Chart of Accounts
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default AccountingMethodSettings;
