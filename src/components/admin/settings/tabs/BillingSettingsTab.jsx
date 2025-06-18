
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';
import SettingsCardItem from '@/components/admin/settings/SettingsCardItem.jsx';
import { CreditCard, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";


const BillingSettingsTabContent = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({ currency: 'USD', taxRate: 0, paymentGateway: 'stripe' });
  const [isLoading, setIsLoading] = useState(true);
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripePriceId, setStripePriceId] = useState('');


  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const currentSettings = await dataService.getBillingSettings();
        const storedStripeKey = localStorage.getItem('stripePublishableKey') || '';
        const storedPriceId = localStorage.getItem('stripePriceId') || '';
        setSettings(currentSettings);
        setStripePublishableKey(storedStripeKey);
        setStripePriceId(storedPriceId);

      } catch (error) {
        console.error("Failed to load billing settings:", error);
        toast({
          title: "Error",
          description: "Could not load billing settings. Using default values.",
          variant: "destructive",
        });
        setSettings({ currency: 'USD', taxRate: 0, paymentGateway: 'stripe' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name === 'taxRate' ? parseFloat(value) : value;
    setSettings({ ...settings, [name]: val });
  };

  const handleSaveKeys = () => {
     if (!stripePublishableKey || !stripePriceId) {
      toast({
        title: "Missing Information",
        description: "Please provide both Stripe Publishable Key and Price ID.",
        variant: "destructive",
      });
      return;
    }
    localStorage.setItem('stripePublishableKey', stripePublishableKey);
    localStorage.setItem('stripePriceId', stripePriceId);
    toast({
      title: "Stripe Keys Saved",
      description: "Your Stripe API keys have been saved locally.",
      className: "bg-green-500 text-white",
    });
  };

  const handleSaveCoreSettings = async () => {
    setIsLoading(true);
    try {
      await dataService.saveBillingSettings(settings);
      toast({
        title: "Settings Saved",
        description: "Billing settings have been updated.",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Failed to save billing settings:", error);
      toast({
        title: "Error",
        description: "Could not save billing settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && typeof settings.currency === 'undefined') {
    return <div>Loading billing settings...</div>;
  }

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5 text-primary" /> Billing & Payments
        </CardTitle>
        <CardDescription>Configure payment gateways, currency, taxes, and other billing related settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 pt-6">
        <SettingsCardItem 
          label="Currency"
          description="Set the default currency for all transactions."
        >
          <Input name="currency" value={settings.currency || 'USD'} onChange={handleChange} placeholder="e.g. USD, EUR" className="w-24" />
        </SettingsCardItem>
        <SettingsCardItem 
          label="Tax Rate (%)"
          description="Default tax rate to apply to sales, if applicable."
        >
          <Input name="taxRate" type="number" value={settings.taxRate || 0} onChange={handleChange} min="0" step="0.01" className="w-24" />
        </SettingsCardItem>
        <SettingsCardItem 
          label="Payment Gateway"
          description="Primary payment gateway for processing transactions."
        >
           <Input name="paymentGateway" value={settings.paymentGateway || 'stripe'} onChange={handleChange} disabled placeholder="stripe" />
        </SettingsCardItem>

        <div className="pt-6 mt-4 border-t">
          <h3 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-200">Stripe Configuration (Client-Only Checkout)</h3>
           <Alert variant="default" className="mb-4 bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700">
            <AlertTriangle className="h-4 w-4 !text-blue-600 dark:!text-blue-400" />
            <AlertTitle className="text-blue-700 dark:text-blue-300">Important Stripe Setup</AlertTitle>
            <AlertDescription className="text-blue-600 dark:text-blue-400 text-xs">
              To use Stripe for payments, you need to:
              <ol className="list-decimal list-inside pl-4 mt-1">
                <li>Enable Client-only Checkout in your <a href="https://dashboard.stripe.com/settings/checkout" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800 dark:hover:text-blue-200">Stripe Checkout settings</a>.</li>
                <li>Create a product and price in Stripe, then copy the <strong>Price ID</strong>.</li>
                <li>Obtain your <strong>Publishable API Key</strong> from your <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800 dark:hover:text-blue-200">Stripe API Keys settings</a>.</li>
                <li>Whitelist your domain in Stripe settings for live mode.</li>
              </ol>
              API keys are stored locally in your browser and are not sent to our servers.
            </AlertDescription>
          </Alert>
          <SettingsCardItem label="Stripe Publishable API Key">
            <Input 
              type="password" 
              value={stripePublishableKey} 
              onChange={(e) => setStripePublishableKey(e.target.value)} 
              placeholder="pk_test_YOURKEY or pk_live_YOURKEY" 
            />
          </SettingsCardItem>
          <SettingsCardItem label="Stripe Price ID (for default membership)">
            <Input 
              value={stripePriceId} 
              onChange={(e) => setStripePriceId(e.target.value)} 
              placeholder="price_YOURPRICEID" 
            />
          </SettingsCardItem>
           <div className="text-right mt-3">
            <Button onClick={handleSaveKeys} size="sm" variant="outline" disabled={isLoading}>Save Stripe Keys</Button>
          </div>
        </div>

      </CardContent>
      <CardContent className="border-t pt-6 text-right">
        <Button onClick={handleSaveCoreSettings} disabled={isLoading} className="bg-primary hover:bg-primary/90">
          {isLoading ? 'Saving...' : 'Save Core Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BillingSettingsTabContent;


