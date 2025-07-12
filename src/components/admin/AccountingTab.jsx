import React, { useState, useEffect } from 'react';
import {
  Calculator,
  FileText,
  Settings,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

// Component imports
import RevenueMappingManager from './RevenueMappingManager';
import ChartOfAccountsManager from './ChartOfAccountsManager';
import AccountingMethodSettings from './AccountingMethodSettings';

// Updated AccountingTab component - cleaned up stats and progress
const AccountingTab = () => {
  const [activeTab, setActiveTab] = useState("accounting-method");
  const [accountingSettings, setAccountingSettings] = useState({
    accounting_method: 'accrual',
    fiscal_year_start: '01-01',
    default_currency: 'USD',
    enable_departments: false,
    enable_locations: true,
    account_number_format: 'auto',
    require_account_codes: false,
    chart_of_accounts_template: 'Standard Gym COA'
  });

  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAccountingData();
  }, []);



  const loadAccountingData = async () => {
    try {
      setIsLoading(true);
      await loadAccountingSettings();
    } catch (error) {
      console.error('Error loading accounting data:', error);
      toast({
        title: "Error",
        description: "Failed to load accounting data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAccountingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('accounting_method, accounting_settings')
        .limit(1);

      if (error) throw error;

      if (data?.[0]) {
        setAccountingSettings(prev => ({
          ...prev,
          accounting_method: data[0].accounting_method || 'accrual',
          ...data[0].accounting_settings
        }));
      }
    } catch (error) {
      console.error('Error loading accounting settings:', error);
    }
  };

  const handleSettingsUpdate = (newSettings, shouldAdvance = false) => {
    setAccountingSettings(prev => ({ ...prev, ...newSettings }));

    // Auto-advance to next step if requested
    if (shouldAdvance && newSettings.accounting_method) {
      setTimeout(() => {
        setActiveTab("chart-of-accounts");
        toast({
          title: "Settings Saved",
          description: "Proceeding to Chart of Accounts setup...",
          duration: 3000,
        });
      }, 1000);
    }
  };



  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-2">
          <Calculator className="h-8 w-8 animate-pulse" />
          <span className="text-xl">Loading accounting settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Calculator className="h-6 w-6 text-blue-600" />
            Accounting
          </h2>
          <p className="text-gray-600 mt-1">
            Manage accounting methods, chart of accounts, and financial settings
          </p>
        </div>
      </div>





      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger
            value="accounting-method"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Accounting Method
          </TabsTrigger>
          <TabsTrigger
            value="chart-of-accounts"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Chart of Accounts
          </TabsTrigger>
          <TabsTrigger
            value="revenue-mapping"
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Revenue Mapping
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Accounting Method Tab */}
        <TabsContent value="accounting-method" className="mt-6">
          <div className="space-y-6">
            <AccountingMethodSettings
              settings={accountingSettings}
              onSettingsUpdate={handleSettingsUpdate}
            />
          </div>
        </TabsContent>

        {/* Chart of Accounts Tab */}
        <TabsContent value="chart-of-accounts" className="mt-6">
          <div className="space-y-6">
            <ChartOfAccountsManager
              accountingSettings={accountingSettings}
            />
          </div>
        </TabsContent>

        {/* Revenue Mapping Tab */}
        <TabsContent value="revenue-mapping" className="mt-6">
          <div className="space-y-6">
            <RevenueMappingManager />
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Financial Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Financial Reporting</p>
                <p>Financial reports and analytics are coming soon.</p>
                <p className="text-sm mt-2">
                  This will include profit & loss statements, balance sheets, 
                  cash flow reports, and custom financial analytics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Notice */}
      <Alert>
        <Calculator className="h-4 w-4" />
        <AlertDescription>
          <strong>Accounting Integration:</strong> This accounting system is designed to integrate 
          with popular accounting software like QuickBooks, Xero, and others. Chart of accounts 
          can be exported and synchronized with your existing accounting system.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AccountingTab;
