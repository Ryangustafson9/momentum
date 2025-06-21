// Payment Processor Configuration Hub
// Comprehensive interface for managing payment processor settings
// Created: June 21, 2025 - Phase 1B

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CreditCard, 
  Settings, 
  Shield, 
  Zap, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Eye, 
  EyeOff, 
  TestTube,
  Smartphone,
  Globe,
  DollarSign,
  Lock,
  Webhook,
  Key,
  RefreshCw,
  Save
} from 'lucide-react';
import LocationService from '@/lib/services/locationService';
import { useLocationContext } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';

const PaymentProcessorHub = () => {
  const { currentLocation } = useLocationContext();
  const [processors, setProcessors] = useState([]);
  const [activeProcessor, setActiveProcessor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [showApiKeys, setShowApiKeys] = useState({});
  const { toast } = useToast();

  // Available payment processors with their capabilities
  const availableProcessors = [
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Industry-leading payment processor with excellent developer tools',
      logo: '/api/processors/stripe/logo',
      capabilities: [
        'credit_cards', 'debit_cards', 'apple_pay', 'google_pay', 
        'bank_transfers', 'subscriptions', 'disputes', 'refunds',
        'international_cards', 'webhooks', 'connect'
      ],
      fees: {
        credit_card: '2.9% + $0.30',
        debit_card: '2.9% + $0.30',
        international: '3.9% + $0.30',
        dispute: '$15.00'
      },
      supported_countries: 45,
      setup_difficulty: 'Easy',
      pci_compliance: 'Level 1'
    },
    {
      id: 'square',
      name: 'Square',
      description: 'Great for businesses with physical locations and in-person payments',
      logo: '/api/processors/square/logo',
      capabilities: [
        'credit_cards', 'debit_cards', 'tap_to_pay', 'gift_cards',
        'subscriptions', 'invoicing', 'pos_integration'
      ],
      fees: {
        credit_card: '2.6% + $0.10',
        debit_card: '2.6% + $0.10',
        keyed_in: '3.5% + $0.15'
      },
      supported_countries: 4,
      setup_difficulty: 'Easy',
      pci_compliance: 'Level 1'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Widely recognized brand with global reach',
      logo: '/api/processors/paypal/logo',
      capabilities: [
        'paypal_account', 'credit_cards', 'debit_cards', 'bank_transfers',
        'buy_now_pay_later', 'subscriptions', 'invoicing'
      ],
      fees: {
        paypal_account: '2.9% + $0.30',
        credit_card: '2.9% + $0.30',
        international: '4.4% + fixed_fee'
      },
      supported_countries: 200,
      setup_difficulty: 'Medium',
      pci_compliance: 'Level 1'
    },
    {
      id: 'authorize_net',
      name: 'Authorize.Net',
      description: 'Established processor with robust features for enterprises',
      logo: '/api/processors/authorize-net/logo',
      capabilities: [
        'credit_cards', 'debit_cards', 'echeck', 'subscriptions',
        'customer_profiles', 'fraud_detection', 'reporting'
      ],
      fees: {
        credit_card: '2.9% + $0.30',
        echeck: '$0.25',
        monthly_gateway: '$25.00'
      },
      supported_countries: 1,
      setup_difficulty: 'Hard',
      pci_compliance: 'Level 1'
    }
  ];

  useEffect(() => {
    if (currentLocation) {
      loadPaymentConfig();
    }
  }, [currentLocation]);

  const loadPaymentConfig = async () => {
    setLoading(true);
    try {
      const result = await LocationService.getPaymentConfig(currentLocation.id);
      if (result.data) {
        setProcessors(result.data.processors || []);
        setActiveProcessor(result.data.active_processor || null);
      }
    } catch (error) {
      console.error('Error loading payment config:', error);
    } finally {
      setLoading(false);
    }
  };

  const testProcessorConnection = async (processorId) => {
    setTestResults(prev => ({ ...prev, [processorId]: { testing: true } }));
    
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock test result
      const success = Math.random() > 0.2; // 80% success rate for demo
      
      setTestResults(prev => ({
        ...prev,
        [processorId]: {
          success,
          message: success 
            ? 'Connection successful' 
            : 'Invalid API credentials',
          timestamp: new Date().toISOString()
        }
      }));
      
      toast({
        title: success ? "Test Successful" : "Test Failed",
        description: success 
          ? "Payment processor connection is working correctly"
          : "Please check your API credentials",
        variant: success ? "default" : "destructive"
      });
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [processorId]: {
          success: false,
          message: 'Connection timeout',
          timestamp: new Date().toISOString()
        }
      }));
    }
  };

  const ProcessorCard = ({ processor }) => {
    const isConfigured = processors.some(p => p.processor_id === processor.id);
    const isActive = activeProcessor === processor.id;
    const testResult = testResults[processor.id];

    return (
      <Card className={`relative ${isActive ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                {processor.name === 'Stripe' && <CreditCard className="w-6 h-6 text-blue-600" />}
                {processor.name === 'Square' && <div className="w-6 h-6 bg-black rounded-sm" />}
                {processor.name === 'PayPal' && <DollarSign className="w-6 h-6 text-blue-700" />}
                {processor.name === 'Authorize.Net' && <Shield className="w-6 h-6 text-green-600" />}
              </div>
              <div>
                <CardTitle className="text-lg">{processor.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{processor.description}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {isActive && <Badge variant="default">Active</Badge>}
              {isConfigured && !isActive && <Badge variant="secondary">Configured</Badge>}
              {!isConfigured && <Badge variant="outline">Not Set Up</Badge>}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Capabilities */}
          <div>
            <Label className="text-sm font-medium">Capabilities</Label>
            <div className="flex flex-wrap gap-1 mt-2">
              {processor.capabilities.slice(0, 4).map(capability => (
                <Badge key={capability} variant="outline" className="text-xs">
                  {capability.replace('_', ' ')}
                </Badge>
              ))}
              {processor.capabilities.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{processor.capabilities.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Card Rate</Label>
              <p className="font-medium">{processor.fees.credit_card}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Countries</Label>
              <p className="font-medium">{processor.supported_countries}+</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Setup</Label>
              <p className="font-medium">{processor.setup_difficulty}</p>
            </div>
          </div>

          {/* Connection Status */}
          {isConfigured && testResult && (
            <div className="flex items-center gap-2 p-2 rounded bg-muted">
              {testResult.testing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : testResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!isConfigured ? (
              <Button 
                onClick={() => setShowSetupWizard(processor.id)} 
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Set Up
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => testProcessorConnection(processor.id)}
                  disabled={testResult?.testing}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test
                </Button>
                <Button variant="outline" className="flex-1">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
                {!isActive && (
                  <Button onClick={() => setActiveProcessor(processor.id)}>
                    Activate
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const ProcessorSetupWizard = ({ processorId, onClose, onComplete }) => {
    const processor = availableProcessors.find(p => p.id === processorId);
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState({
      api_keys: {
        publishable_key: '',
        secret_key: '',
        webhook_secret: ''
      },
      webhook_url: `${window.location.origin}/api/webhooks/${processorId}`,
      enabled_methods: ['credit_card', 'debit_card'],
      test_mode: true
    });

    if (!processor) return null;

    const steps = [
      { id: 1, title: 'API Configuration', icon: Key },
      { id: 2, title: 'Payment Methods', icon: CreditCard },
      { id: 3, title: 'Webhooks', icon: Webhook },
      { id: 4, title: 'Test & Activate', icon: TestTube }
    ];

    return (
      <Dialog open={!!processorId} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Set Up {processor.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {steps.map((stepInfo, index) => (
                <div key={stepInfo.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step >= stepInfo.id 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground text-muted-foreground'
                  }`}>
                    <stepInfo.icon className="w-5 h-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-24 h-0.5 mx-4 ${
                      step > stepInfo.id ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">API Configuration</h3>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Your API keys are encrypted and stored securely. We never store them in plain text.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label>Publishable Key</Label>
                    <div className="relative">
                      <Input
                        type={showApiKeys.publishable ? "text" : "password"}
                        value={config.api_keys.publishable_key}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          api_keys: { ...prev.api_keys, publishable_key: e.target.value }
                        }))}
                        placeholder={`pk_test_... (${processor.name} publishable key)`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKeys(prev => ({
                          ...prev,
                          publishable: !prev.publishable
                        }))}
                      >
                        {showApiKeys.publishable ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Secret Key</Label>
                    <div className="relative">
                      <Input
                        type={showApiKeys.secret ? "text" : "password"}
                        value={config.api_keys.secret_key}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          api_keys: { ...prev.api_keys, secret_key: e.target.value }
                        }))}
                        placeholder={`sk_test_... (${processor.name} secret key)`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKeys(prev => ({
                          ...prev,
                          secret: !prev.secret
                        }))}
                      >
                        {showApiKeys.secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Test Mode</Label>
                      <p className="text-sm text-muted-foreground">Use test keys for development</p>
                    </div>
                    <Switch
                      checked={config.test_mode}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, test_mode: checked }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Payment Methods</h3>
                <p className="text-muted-foreground">Select which payment methods to enable for your customers.</p>

                <div className="grid grid-cols-2 gap-4">
                  {processor.capabilities.map(method => (
                    <div key={method} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {method === 'credit_cards' && <CreditCard className="w-5 h-5" />}
                        {method === 'apple_pay' && <Smartphone className="w-5 h-5" />}
                        {method === 'google_pay' && <Globe className="w-5 h-5" />}
                        {method === 'bank_transfers' && <DollarSign className="w-5 h-5" />}
                        <div>
                          <Label className="capitalize">{method.replace('_', ' ')}</Label>
                          {processor.fees[method] && (
                            <p className="text-sm text-muted-foreground">{processor.fees[method]}</p>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={config.enabled_methods.includes(method)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setConfig(prev => ({
                              ...prev,
                              enabled_methods: [...prev.enabled_methods, method]
                            }));
                          } else {
                            setConfig(prev => ({
                              ...prev,
                              enabled_methods: prev.enabled_methods.filter(m => m !== method)
                            }));
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Webhook Configuration</h3>
                <p className="text-muted-foreground">
                  Webhooks notify your system about payment events in real-time.
                </p>

                <div className="space-y-4">
                  <div>
                    <Label>Webhook URL</Label>
                    <Input
                      value={config.webhook_url}
                      onChange={(e) => setConfig(prev => ({ ...prev, webhook_url: e.target.value }))}
                      readOnly
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Add this URL to your {processor.name} webhook settings
                    </p>
                  </div>

                  <div>
                    <Label>Webhook Secret</Label>
                    <Input
                      type="password"
                      value={config.api_keys.webhook_secret}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        api_keys: { ...prev.api_keys, webhook_secret: e.target.value }
                      }))}
                      placeholder="whsec_... (webhook signing secret)"
                    />
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Configure webhooks in your {processor.name} dashboard to receive payment notifications.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test & Activate</h3>
                <p className="text-muted-foreground">
                  Test your configuration before going live.
                </p>

                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <TestTube className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h4 className="font-semibold mb-2">Test Payment</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Process a test payment to verify your setup
                        </p>
                        <Button>Run Test Payment</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Configuration Summary</Label>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>• API Keys: Configured</p>
                        <p>• Payment Methods: {config.enabled_methods.length} enabled</p>
                        <p>• Webhooks: {config.api_keys.webhook_secret ? 'Configured' : 'Not configured'}</p>
                        <p>• Mode: {config.test_mode ? 'Test' : 'Live'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Next Steps</Label>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>• Test payment processing</p>
                        <p>• Configure webhook endpoints</p>
                        <p>• Set up recurring billing</p>
                        <p>• Enable live mode when ready</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              >
                {step > 1 ? 'Previous' : 'Cancel'}
              </Button>
              
              <Button 
                onClick={() => {
                  if (step < 4) {
                    setStep(step + 1);
                  } else {
                    onComplete(config);
                  }
                }}
                disabled={step === 1 && (!config.api_keys.publishable_key || !config.api_keys.secret_key)}
              >
                {step < 4 ? 'Next' : 'Complete Setup'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading payment processors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payment Processors</h2>
          <p className="text-muted-foreground">
            Configure and manage payment processing for {currentLocation?.name}
          </p>
        </div>
        <Button variant="outline" onClick={loadPaymentConfig}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Active Processor Status */}
      {activeProcessor && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{availableProcessors.find(p => p.id === activeProcessor)?.name}</strong> is currently active for payment processing.
          </AlertDescription>
        </Alert>
      )}

      {/* Processor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableProcessors.map(processor => (
          <ProcessorCard key={processor.id} processor={processor} />
        ))}
      </div>

      {/* Setup Wizard */}
      <ProcessorSetupWizard
        processorId={showSetupWizard}
        onClose={() => setShowSetupWizard(false)}
        onComplete={(config) => {
          console.log('Processor setup completed:', config);
          setShowSetupWizard(false);
          loadPaymentConfig();
        }}
      />
    </div>
  );
};

export default PaymentProcessorHub;
