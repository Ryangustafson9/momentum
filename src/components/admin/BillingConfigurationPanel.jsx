// 🚀 BILLING CONFIGURATION PANEL - Super Admin billing settings interface
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Calendar, 
  DollarSign, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Save,
  RotateCcw,
  Info,
  CreditCard,
  Mail,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useBillingConfig, useUpdateBillingConfig, useProrationCalculation } from '@/hooks/useBillingConfig';
import HouseChargesManager from './HouseChargesManager.jsx';
import { useToast } from '@/hooks/use-toast';

const BillingConfigurationPanel = ({ organizationId = 'default-org-id' }) => {
  const { toast } = useToast();
  const { data: config, isLoading, error } = useBillingConfig(organizationId);
  const updateConfigMutation = useUpdateBillingConfig();
  const { validateBillingConfig } = useProrationCalculation();
  
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Initialize form data when config loads
  React.useEffect(() => {
    if (config && Object.keys(formData).length === 0) {
      setFormData(config);
    }
  }, [config]);

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      setHasChanges(true);
      
      // Validate on change
      const validation = validateBillingConfig(newData);
      setValidationErrors(validation.errors);
      
      return newData;
    });
  };

  // Handle array field changes (retry intervals)
  const handleRetryIntervalsChange = (index, value) => {
    const newIntervals = [...(formData.retry_intervals || [])];
    newIntervals[index] = parseInt(value);
    handleFieldChange('retry_intervals', newIntervals);
  };

  const addRetryInterval = () => {
    const newIntervals = [...(formData.retry_intervals || []), 7];
    handleFieldChange('retry_intervals', newIntervals);
  };

  const removeRetryInterval = (index) => {
    const newIntervals = formData.retry_intervals?.filter((_, i) => i !== index) || [];
    handleFieldChange('retry_intervals', newIntervals);
  };

  // Save configuration
  const handleSave = async () => {
    const validation = validateBillingConfig(formData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before saving",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateConfigMutation.mutateAsync({
        organizationId,
        configData: formData
      });
      setHasChanges(false);
      setValidationErrors([]);
    } catch (error) {
      
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData(config);
    setHasChanges(false);
    setValidationErrors([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading billing configuration...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error loading billing configuration: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing Configuration</h2>
          <p className="text-gray-600">Configure automated billing settings for your organization</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || validationErrors.length > 0 || updateConfigMutation.isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-medium mb-2">Please fix the following errors:</div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Tabs */}
      <Tabs defaultValue="membership" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="membership">Membership Billing</TabsTrigger>
          <TabsTrigger value="house-charges">House Charges</TabsTrigger>
          <TabsTrigger value="failed-payments">Failed Payments</TabsTrigger>
          <TabsTrigger value="invoices">Invoices & Notifications</TabsTrigger>
        </TabsList>

        {/* Membership Billing Tab */}
        <TabsContent value="membership">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Membership Billing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Billing Type Selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Billing Method</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.membership_billing_type === 'anniversary'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleFieldChange('membership_billing_type', 'anniversary')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        formData.membership_billing_type === 'anniversary'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`} />
                      <div>
                        <h3 className="font-medium">Anniversary Billing</h3>
                        <p className="text-sm text-gray-600">
                          Bill each member on their individual join date anniversary
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.membership_billing_type === 'unified'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleFieldChange('membership_billing_type', 'unified')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        formData.membership_billing_type === 'unified'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`} />
                      <div>
                        <h3 className="font-medium">Unified Billing</h3>
                        <p className="text-sm text-gray-600">
                          Bill all members on the same day each month with proration
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Unified Billing Settings */}
              {formData.membership_billing_type === 'unified' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="unified_billing_day">Unified Billing Day</Label>
                      <Select 
                        value={formData.unified_billing_day?.toString()} 
                        onValueChange={(value) => handleFieldChange('unified_billing_day', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day of month" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                            <SelectItem key={day} value={day.toString()}>
                              {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="proration_enabled"
                        checked={formData.proration_enabled}
                        onCheckedChange={(checked) => handleFieldChange('proration_enabled', checked)}
                      />
                      <Label htmlFor="proration_enabled">Enable Proration</Label>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      With unified billing, new members will be prorated from their join date to the next billing cycle.
                      Existing members will be migrated to the new billing schedule gradually.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* House Charges Tab */}
        <TabsContent value="house-charges">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                House Charges Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="house_charges_enabled"
                  checked={formData.house_charges_enabled}
                  onCheckedChange={(checked) => handleFieldChange('house_charges_enabled', checked)}
                />
                <Label htmlFor="house_charges_enabled">Enable House Charges Billing</Label>
              </div>

              {formData.house_charges_enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="house_charges_frequency">Billing Frequency</Label>
                      <Select 
                        value={formData.house_charges_frequency} 
                        onValueChange={(value) => handleFieldChange('house_charges_frequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="custom">Custom Interval</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.house_charges_frequency !== 'custom' ? (
                      <div>
                        <Label htmlFor="house_charges_billing_day">Billing Day</Label>
                        <Select 
                          value={formData.house_charges_billing_day?.toString()} 
                          onValueChange={(value) => handleFieldChange('house_charges_billing_day', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing day" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.house_charges_frequency === 'weekly' ? (
                              ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
                                <SelectItem key={index} value={(index + 1).toString()}>{day}</SelectItem>
                              ))
                            ) : (
                              Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                <SelectItem key={day} value={day.toString()}>
                                  {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="house_charges_custom_interval">Custom Interval (Days)</Label>
                        <Input
                          id="house_charges_custom_interval"
                          type="number"
                          min="1"
                          max="365"
                          value={formData.house_charges_custom_interval || ''}
                          onChange={(e) => handleFieldChange('house_charges_custom_interval', parseInt(e.target.value))}
                          placeholder="Enter days between billing"
                        />
                      </div>
                    )}
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      House charges (locker rentals, towel service, etc.) will be billed separately from membership fees.
                      This allows for different billing schedules and easier itemization on invoices.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* House Charges Manager */}
              <div className="mt-6">
                <HouseChargesManager organizationId={organizationId} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Failed Payments Tab */}
        <TabsContent value="failed-payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Failed Payment Handling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="failed_payment_retry_enabled"
                  checked={formData.failed_payment_retry_enabled}
                  onCheckedChange={(checked) => handleFieldChange('failed_payment_retry_enabled', checked)}
                />
                <Label htmlFor="failed_payment_retry_enabled">Enable Automatic Payment Retries</Label>
              </div>

              {formData.failed_payment_retry_enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div>
                    <Label>Retry Intervals (Days)</Label>
                    <div className="space-y-2 mt-2">
                      {(formData.retry_intervals || []).map((interval, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="1"
                            max="30"
                            value={interval}
                            onChange={(e) => handleRetryIntervalsChange(index, e.target.value)}
                            className="w-24"
                          />
                          <span className="text-sm text-gray-600">days after failure</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRetryInterval(index)}
                            disabled={formData.retry_intervals?.length <= 1}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addRetryInterval}>
                        Add Retry Interval
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="auto_suspend_after_retries">Auto-suspend After Retries</Label>
                      <Input
                        id="auto_suspend_after_retries"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.auto_suspend_after_retries || ''}
                        onChange={(e) => handleFieldChange('auto_suspend_after_retries', parseInt(e.target.value))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="auto_cancel_after_days">Auto-cancel After Days</Label>
                      <Input
                        id="auto_cancel_after_days"
                        type="number"
                        min="1"
                        max="90"
                        value={formData.auto_cancel_after_days || ''}
                        onChange={(e) => handleFieldChange('auto_cancel_after_days', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices & Notifications Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Invoice & Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Invoice Settings */}
              <div className="space-y-4">
                <h3 className="font-medium">Invoice Configuration</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
                    <Input
                      id="invoice_prefix"
                      value={formData.invoice_prefix || ''}
                      onChange={(e) => handleFieldChange('invoice_prefix', e.target.value)}
                      placeholder="INV"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <Label htmlFor="invoice_numbering_start">Starting Number</Label>
                    <Input
                      id="invoice_numbering_start"
                      type="number"
                      min="1"
                      value={formData.invoice_numbering_start || ''}
                      onChange={(e) => handleFieldChange('invoice_numbering_start', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="invoice_due_days">Payment Due Days</Label>
                    <Input
                      id="invoice_due_days"
                      type="number"
                      min="1"
                      max="90"
                      value={formData.invoice_due_days || ''}
                      onChange={(e) => handleFieldChange('invoice_due_days', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Settings */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center">
                  <Bell className="w-4 h-4 mr-2" />
                  Email Notifications
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="send_invoice_emails"
                      checked={formData.send_invoice_emails}
                      onCheckedChange={(checked) => handleFieldChange('send_invoice_emails', checked)}
                    />
                    <Label htmlFor="send_invoice_emails">Send invoice emails automatically</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="send_payment_reminders"
                      checked={formData.send_payment_reminders}
                      onCheckedChange={(checked) => handleFieldChange('send_payment_reminders', checked)}
                    />
                    <Label htmlFor="send_payment_reminders">Send payment reminder emails</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="send_failed_payment_notifications"
                      checked={formData.send_failed_payment_notifications}
                      onCheckedChange={(checked) => handleFieldChange('send_failed_payment_notifications', checked)}
                    />
                    <Label htmlFor="send_failed_payment_notifications">Send failed payment notifications</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingConfigurationPanel;

