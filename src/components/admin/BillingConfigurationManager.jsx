// Advanced Billing Configuration Manager
// Comprehensive interface for managing detailed billing settings per location
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
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Gift, 
  DollarSign, 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Info,
  TrendingUp,
  Users,
  Receipt
} from 'lucide-react';
import LocationService from '@/lib/services/locationService';
import { useLocationContext } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';

const BillingConfigurationManager = () => {
  const { currentLocation } = useLocationContext();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { toast } = useToast();

  // Default configuration structure
  const defaultConfig = {
    // Billing Cycles & Timing
    membership_billing_type: 'monthly',
    billing_cycle_type: 'anniversary', // anniversary, unified, custom
    unified_billing_date: 1, // 1-28 for unified billing
    billing_advance_days: 0, // 0 = bill on due date, 7 = bill 7 days early
    proration_enabled: true,
    proration_method: 'daily', // daily, monthly
    
    // Payment Collection
    auto_payment_enabled: true,
    auto_payment_required: false, // Force auto-pay for new members
    payment_grace_period_days: 3,
    late_fee_amount: 25,
    late_fee_type: 'flat', // flat, percentage
    late_fee_cap: 100, // Maximum late fee
    
    // Failed Payment Handling
    payment_retry_enabled: true,
    payment_retry_attempts: 3,
    payment_retry_interval_days: 7,
    auto_suspend_enabled: true,
    auto_suspend_days: 14,
    auto_cancel_enabled: false,
    auto_cancel_days: 60,
    
    // Family & Group Discounts
    family_discount_enabled: true,
    family_discount_type: 'percentage', // percentage, flat
    family_discount_percent: 10,
    family_discount_flat_amount: 15,
    family_discount_max_members: 6,
    group_discount_enabled: false,
    group_discount_min_members: 10,
    group_discount_percent: 15,
    
    // Referral Program
    referral_program_enabled: true,
    referral_reward_type: 'credit', // credit, discount, cash
    referral_reward_amount: 25,
    referral_reward_applies_to: 'both', // referrer, referee, both
    
    // Additional Revenue Streams
    personal_training_enabled: true,
    personal_training_hourly_rate: 75,
    personal_training_package_discount: 10,
    
    day_pass_enabled: true,
    day_pass_price: 25,
    day_pass_membership_credit: true, // Apply towards membership if they join
    
    guest_pass_enabled: true,
    guest_pass_price: 15,
    guest_pass_monthly_limit: 3,
    
    locker_rental_enabled: true,
    locker_rental_monthly: 15,
    locker_rental_deposit: 25,
    
    retail_sales_enabled: true,
    retail_markup_percent: 40,
    
    // Fees & Charges
    initiation_fee_enabled: false,
    initiation_fee_amount: 50,
    initiation_fee_waiver_promotion: false,
    
    processing_fee_enabled: false,
    processing_fee_amount: 2.50,
    processing_fee_type: 'flat', // flat, percentage
    
    // Annual Memberships
    annual_discount_enabled: true,
    annual_discount_percent: 10,
    annual_discount_months_free: 2, // Alternative to percentage
    
    // Compliance & Regulations
    tax_rate: 0, // Local tax rate
    tax_included_in_price: false,
    contract_required: false,
    contract_minimum_months: 12,
    cancellation_notice_days: 30,
    
    // Freezes & Holds
    freeze_enabled: true,
    freeze_max_days_per_year: 60,
    freeze_fee_per_month: 10,
    freeze_min_duration_days: 7,
    freeze_max_duration_days: 90,
    
    // Transfers
    transfer_enabled: true,
    transfer_fee: 25,
    transfer_approval_required: true,
    
    // Special Programs
    student_discount_enabled: true,
    student_discount_percent: 15,
    student_verification_required: true,
    
    senior_discount_enabled: true,
    senior_discount_percent: 10,
    senior_discount_age_threshold: 65,
    
    military_discount_enabled: true,
    military_discount_percent: 20,
    military_verification_required: true
  };

  useEffect(() => {
    if (currentLocation) {
      loadBillingConfig();
    }
  }, [currentLocation]);

  const loadBillingConfig = async () => {
    setLoading(true);
    try {
      const result = await LocationService.getBillingConfig(currentLocation.id);
      if (result.data) {
        setConfig({ ...defaultConfig, ...result.data });
      } else {
        setConfig(defaultConfig);
      }
    } catch (error) {
      
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
    setHasChanges(true);
  };

  const validateConfig = () => {
    const errors = {};

    // Validate payment retry settings
    if (config.payment_retry_enabled) {
      if (config.payment_retry_attempts < 1 || config.payment_retry_attempts > 10) {
        errors.payment_retry_attempts = 'Retry attempts must be between 1 and 10';
      }
      if (config.payment_retry_interval_days < 1 || config.payment_retry_interval_days > 30) {
        errors.payment_retry_interval_days = 'Retry interval must be between 1 and 30 days';
      }
    }

    // Validate suspension settings
    if (config.auto_suspend_enabled && config.auto_suspend_days < config.payment_grace_period_days) {
      errors.auto_suspend_days = 'Auto-suspend days must be greater than grace period';
    }

    // Validate discount percentages
    if (config.family_discount_enabled && config.family_discount_type === 'percentage') {
      if (config.family_discount_percent < 0 || config.family_discount_percent > 50) {
        errors.family_discount_percent = 'Family discount must be between 0% and 50%';
      }
    }

    // Validate billing cycle settings
    if (config.billing_cycle_type === 'unified') {
      if (config.unified_billing_date < 1 || config.unified_billing_date > 28) {
        errors.unified_billing_date = 'Unified billing date must be between 1 and 28';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateConfig()) {
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before saving",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const result = await LocationService.updateBillingConfig(currentLocation.id, config);
      if (result.data) {
        setHasChanges(false);
        toast({
          title: "Success",
          description: "Billing configuration updated successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update billing configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const ConfigSection = ({ title, description, children, icon: Icon }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5" />}
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );

  const ValidationError = ({ field }) => {
    if (!validationErrors[field]) return null;
    return (
      <p className="text-sm text-red-500 mt-1">{validationErrors[field]}</p>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading billing configuration...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load billing configuration. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Billing Configuration</h2>
          <p className="text-muted-foreground">
            Configure detailed billing settings for {currentLocation?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadBillingConfig} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || saving}
            className={hasChanges ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {hasChanges ? "Save Changes" : "Saved"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Changes Indicator */}
      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your configuration.
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Tabs */}
      <Tabs defaultValue="billing-cycles" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="billing-cycles">
            <Calendar className="w-4 h-4 mr-2" />
            Billing Cycles
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="discounts">
            <Gift className="w-4 h-4 mr-2" />
            Discounts
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="w-4 h-4 mr-2" />
            Revenue Streams
          </TabsTrigger>
          <TabsTrigger value="policies">
            <Receipt className="w-4 h-4 mr-2" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="compliance">
            <Settings className="w-4 h-4 mr-2" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Billing Cycles Tab */}
        <TabsContent value="billing-cycles" className="space-y-6">
          <ConfigSection
            title="Billing Cycles & Timing"
            description="Configure when and how members are billed"
            icon={Calendar}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Billing Type</Label>
                <Select
                  value={config.membership_billing_type}
                  onValueChange={(value) => updateConfig('membership_billing_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="session_based">Session-Based</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Billing Cycle</Label>
                <Select
                  value={config.billing_cycle_type}
                  onValueChange={(value) => updateConfig('billing_cycle_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anniversary">Anniversary (Bill on join date)</SelectItem>
                    <SelectItem value="unified">Unified (Same date for all)</SelectItem>
                    <SelectItem value="custom">Custom Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {config.billing_cycle_type === 'unified' && (
              <div>
                <Label>Unified Billing Date</Label>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={config.unified_billing_date}
                  onChange={(e) => updateConfig('unified_billing_date', parseInt(e.target.value))}
                />
                <ValidationError field="unified_billing_date" />
                <p className="text-sm text-muted-foreground mt-1">
                  Day of month to bill all members (1-28)
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Billing Advance Days</Label>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  value={config.billing_advance_days}
                  onChange={(e) => updateConfig('billing_advance_days', parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Days to bill before due date (0 = on due date)
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Proration Enabled</Label>
                  <Switch
                    checked={config.proration_enabled}
                    onCheckedChange={(checked) => updateConfig('proration_enabled', checked)}
                  />
                </div>

                {config.proration_enabled && (
                  <div>
                    <Label>Proration Method</Label>
                    <Select
                      value={config.proration_method}
                      onValueChange={(value) => updateConfig('proration_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily Proration</SelectItem>
                        <SelectItem value="monthly">Monthly Proration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </ConfigSection>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <ConfigSection
            title="Payment Collection"
            description="Configure how payments are collected from members"
            icon={CreditCard}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Payment Enabled</Label>
                  <p className="text-sm text-muted-foreground">Allow members to set up automatic payments</p>
                </div>
                <Switch
                  checked={config.auto_payment_enabled}
                  onCheckedChange={(checked) => updateConfig('auto_payment_enabled', checked)}
                />
              </div>

              {config.auto_payment_enabled && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Auto-Payment</Label>
                    <p className="text-sm text-muted-foreground">Force new members to set up auto-payment</p>
                  </div>
                  <Switch
                    checked={config.auto_payment_required}
                    onCheckedChange={(checked) => updateConfig('auto_payment_required', checked)}
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Grace Period (Days)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={config.payment_grace_period_days}
                    onChange={(e) => updateConfig('payment_grace_period_days', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Late Fee Amount ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={config.late_fee_amount}
                    onChange={(e) => updateConfig('late_fee_amount', parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Late Fee Cap ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={config.late_fee_cap}
                    onChange={(e) => updateConfig('late_fee_cap', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </ConfigSection>

          <ConfigSection
            title="Failed Payment Handling"
            description="Configure how to handle failed payments"
            icon={AlertTriangle}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Payment Retry Enabled</Label>
                  <p className="text-sm text-muted-foreground">Automatically retry failed payments</p>
                </div>
                <Switch
                  checked={config.payment_retry_enabled}
                  onCheckedChange={(checked) => updateConfig('payment_retry_enabled', checked)}
                />
              </div>

              {config.payment_retry_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Retry Attempts</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={config.payment_retry_attempts}
                      onChange={(e) => updateConfig('payment_retry_attempts', parseInt(e.target.value))}
                    />
                    <ValidationError field="payment_retry_attempts" />
                  </div>

                  <div>
                    <Label>Retry Interval (Days)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={config.payment_retry_interval_days}
                      onChange={(e) => updateConfig('payment_retry_interval_days', parseInt(e.target.value))}
                    />
                    <ValidationError field="payment_retry_interval_days" />
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Suspend Enabled</Label>
                    <p className="text-sm text-muted-foreground">Automatically suspend members for failed payments</p>
                  </div>
                  <Switch
                    checked={config.auto_suspend_enabled}
                    onCheckedChange={(checked) => updateConfig('auto_suspend_enabled', checked)}
                  />
                </div>

                {config.auto_suspend_enabled && (
                  <div>
                    <Label>Auto-Suspend After (Days)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="90"
                      value={config.auto_suspend_days}
                      onChange={(e) => updateConfig('auto_suspend_days', parseInt(e.target.value))}
                    />
                    <ValidationError field="auto_suspend_days" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Cancel Enabled</Label>
                    <p className="text-sm text-muted-foreground">Automatically cancel memberships after extended non-payment</p>
                  </div>
                  <Switch
                    checked={config.auto_cancel_enabled}
                    onCheckedChange={(checked) => updateConfig('auto_cancel_enabled', checked)}
                  />
                </div>

                {config.auto_cancel_enabled && (
                  <div>
                    <Label>Auto-Cancel After (Days)</Label>
                    <Input
                      type="number"
                      min="30"
                      max="365"
                      value={config.auto_cancel_days}
                      onChange={(e) => updateConfig('auto_cancel_days', parseInt(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>
          </ConfigSection>
        </TabsContent>        {/* Continue with other tabs... */}
        {/* Discounts Tab */}
        <TabsContent value="discounts" className="space-y-6">
          <ConfigSection
            title="Family & Group Discounts"
            description="Configure discounts for families and groups"
            icon={Users}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Family Discount Enabled</Label>
                  <p className="text-sm text-muted-foreground">Offer discounts for family memberships</p>
                </div>
                <Switch
                  checked={config.family_discount_enabled}
                  onCheckedChange={(checked) => updateConfig('family_discount_enabled', checked)}
                />
              </div>

              {config.family_discount_enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Discount Type</Label>
                      <Select
                        value={config.family_discount_type}
                        onValueChange={(value) => updateConfig('family_discount_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="flat">Flat Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>
                        {config.family_discount_type === 'percentage' ? 'Discount (%)' : 'Discount ($)'}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step={config.family_discount_type === 'percentage' ? "1" : "0.01"}
                        value={config.family_discount_type === 'percentage' 
                          ? config.family_discount_percent 
                          : config.family_discount_flat_amount}
                        onChange={(e) => {
                          const value = config.family_discount_type === 'percentage' 
                            ? parseInt(e.target.value) 
                            : parseFloat(e.target.value);
                          updateConfig(
                            config.family_discount_type === 'percentage' 
                              ? 'family_discount_percent' 
                              : 'family_discount_flat_amount', 
                            value
                          );
                        }}
                      />
                      <ValidationError field="family_discount_percent" />
                    </div>

                    <div>
                      <Label>Max Family Members</Label>
                      <Input
                        type="number"
                        min="2"
                        max="10"
                        value={config.family_discount_max_members}
                        onChange={(e) => updateConfig('family_discount_max_members', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Group Discount Enabled</Label>
                  <p className="text-sm text-muted-foreground">Offer discounts for corporate groups</p>
                </div>
                <Switch
                  checked={config.group_discount_enabled}
                  onCheckedChange={(checked) => updateConfig('group_discount_enabled', checked)}
                />
              </div>

              {config.group_discount_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Group Size</Label>
                    <Input
                      type="number"
                      min="5"
                      max="100"
                      value={config.group_discount_min_members}
                      onChange={(e) => updateConfig('group_discount_min_members', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label>Group Discount (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={config.group_discount_percent}
                      onChange={(e) => updateConfig('group_discount_percent', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>
          </ConfigSection>

          <ConfigSection
            title="Referral Program"
            description="Configure member referral rewards"
            icon={Gift}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Referral Program Enabled</Label>
                  <p className="text-sm text-muted-foreground">Reward members for referring new members</p>
                </div>
                <Switch
                  checked={config.referral_program_enabled}
                  onCheckedChange={(checked) => updateConfig('referral_program_enabled', checked)}
                />
              </div>

              {config.referral_program_enabled && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Reward Type</Label>
                    <Select
                      value={config.referral_reward_type}
                      onValueChange={(value) => updateConfig('referral_reward_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit">Account Credit</SelectItem>
                        <SelectItem value="discount">Membership Discount</SelectItem>
                        <SelectItem value="cash">Cash Reward</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Reward Amount ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={config.referral_reward_amount}
                      onChange={(e) => updateConfig('referral_reward_amount', parseFloat(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label>Applies To</Label>
                    <Select
                      value={config.referral_reward_applies_to}
                      onValueChange={(value) => updateConfig('referral_reward_applies_to', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="referrer">Referrer Only</SelectItem>
                        <SelectItem value="referee">New Member Only</SelectItem>
                        <SelectItem value="both">Both Parties</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </ConfigSection>

          <ConfigSection
            title="Special Discounts"
            description="Configure special population discounts"
          >
            <div className="space-y-6">
              {/* Student Discount */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Student Discount</Label>
                    <p className="text-sm text-muted-foreground">Discount for students with valid ID</p>
                  </div>
                  <Switch
                    checked={config.student_discount_enabled}
                    onCheckedChange={(checked) => updateConfig('student_discount_enabled', checked)}
                  />
                </div>

                {config.student_discount_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Student Discount (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={config.student_discount_percent}
                        onChange={(e) => updateConfig('student_discount_percent', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-6">
                      <Label>Verification Required</Label>
                      <Switch
                        checked={config.student_verification_required}
                        onCheckedChange={(checked) => updateConfig('student_verification_required', checked)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Senior Discount */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Senior Discount</Label>
                    <p className="text-sm text-muted-foreground">Discount for senior citizens</p>
                  </div>
                  <Switch
                    checked={config.senior_discount_enabled}
                    onCheckedChange={(checked) => updateConfig('senior_discount_enabled', checked)}
                  />
                </div>

                {config.senior_discount_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Senior Discount (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={config.senior_discount_percent}
                        onChange={(e) => updateConfig('senior_discount_percent', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Age Threshold</Label>
                      <Input
                        type="number"
                        min="50"
                        max="80"
                        value={config.senior_discount_age_threshold}
                        onChange={(e) => updateConfig('senior_discount_age_threshold', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Military Discount */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Military Discount</Label>
                    <p className="text-sm text-muted-foreground">Discount for military personnel</p>
                  </div>
                  <Switch
                    checked={config.military_discount_enabled}
                    onCheckedChange={(checked) => updateConfig('military_discount_enabled', checked)}
                  />
                </div>

                {config.military_discount_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Military Discount (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={config.military_discount_percent}
                        onChange={(e) => updateConfig('military_discount_percent', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-6">
                      <Label>Verification Required</Label>
                      <Switch
                        checked={config.military_verification_required}
                        onCheckedChange={(checked) => updateConfig('military_verification_required', checked)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ConfigSection>
        </TabsContent>

        {/* Revenue Streams Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <ConfigSection
            title="Personal Training"
            description="Configure personal training services and pricing"
            icon={TrendingUp}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Personal Training Enabled</Label>
                  <p className="text-sm text-muted-foreground">Offer personal training services</p>
                </div>
                <Switch
                  checked={config.personal_training_enabled}
                  onCheckedChange={(checked) => updateConfig('personal_training_enabled', checked)}
                />
              </div>

              {config.personal_training_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hourly Rate ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={config.personal_training_hourly_rate}
                      onChange={(e) => updateConfig('personal_training_hourly_rate', parseFloat(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label>Package Discount (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      value={config.personal_training_package_discount}
                      onChange={(e) => updateConfig('personal_training_package_discount', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Discount for purchasing PT packages
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ConfigSection>

          <ConfigSection
            title="Day Passes & Guest Access"
            description="Configure temporary access pricing"
          >
            <div className="space-y-6">
              {/* Day Pass */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Day Pass Enabled</Label>
                    <p className="text-sm text-muted-foreground">Allow non-members to purchase day passes</p>
                  </div>
                  <Switch
                    checked={config.day_pass_enabled}
                    onCheckedChange={(checked) => updateConfig('day_pass_enabled', checked)}
                  />
                </div>

                {config.day_pass_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Day Pass Price ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={config.day_pass_price}
                        onChange={(e) => updateConfig('day_pass_price', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-6">
                      <Label>Credit Towards Membership</Label>
                      <Switch
                        checked={config.day_pass_membership_credit}
                        onCheckedChange={(checked) => updateConfig('day_pass_membership_credit', checked)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Guest Pass */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Guest Pass Enabled</Label>
                    <p className="text-sm text-muted-foreground">Allow members to bring guests</p>
                  </div>
                  <Switch
                    checked={config.guest_pass_enabled}
                    onCheckedChange={(checked) => updateConfig('guest_pass_enabled', checked)}
                  />
                </div>

                {config.guest_pass_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Guest Pass Price ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={config.guest_pass_price}
                        onChange={(e) => updateConfig('guest_pass_price', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Monthly Guest Limit</Label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={config.guest_pass_monthly_limit}
                        onChange={(e) => updateConfig('guest_pass_monthly_limit', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ConfigSection>

          <ConfigSection
            title="Additional Services"
            description="Configure additional revenue streams"
          >
            <div className="space-y-6">
              {/* Locker Rental */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Locker Rental</Label>
                    <p className="text-sm text-muted-foreground">Rent lockers to members</p>
                  </div>
                  <Switch
                    checked={config.locker_rental_enabled}
                    onCheckedChange={(checked) => updateConfig('locker_rental_enabled', checked)}
                  />
                </div>

                {config.locker_rental_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Monthly Rate ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={config.locker_rental_monthly}
                        onChange={(e) => updateConfig('locker_rental_monthly', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Security Deposit ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={config.locker_rental_deposit}
                        onChange={(e) => updateConfig('locker_rental_deposit', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Retail Sales */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Retail Sales</Label>
                    <p className="text-sm text-muted-foreground">Sell supplements, apparel, and equipment</p>
                  </div>
                  <Switch
                    checked={config.retail_sales_enabled}
                    onCheckedChange={(checked) => updateConfig('retail_sales_enabled', checked)}
                  />
                </div>

                {config.retail_sales_enabled && (
                  <div>
                    <Label>Default Markup (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="200"
                      value={config.retail_markup_percent}
                      onChange={(e) => updateConfig('retail_markup_percent', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Default markup percentage for retail items
                    </p>
                  </div>
                )}
              </div>
            </div>
          </ConfigSection>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <ConfigSection
            title="Membership Policies"
            description="Configure membership terms and policies"
            icon={Receipt}
          >
            <div className="space-y-6">
              {/* Initiation Fee */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Initiation Fee</Label>
                    <p className="text-sm text-muted-foreground">One-time fee for new members</p>
                  </div>
                  <Switch
                    checked={config.initiation_fee_enabled}
                    onCheckedChange={(checked) => updateConfig('initiation_fee_enabled', checked)}
                  />
                </div>

                {config.initiation_fee_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Initiation Fee Amount ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={config.initiation_fee_amount}
                        onChange={(e) => updateConfig('initiation_fee_amount', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-6">
                      <Label>Promotional Waiver</Label>
                      <Switch
                        checked={config.initiation_fee_waiver_promotion}
                        onCheckedChange={(checked) => updateConfig('initiation_fee_waiver_promotion', checked)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Processing Fee */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Processing Fee</Label>
                    <p className="text-sm text-muted-foreground">Fee for payment processing</p>
                  </div>
                  <Switch
                    checked={config.processing_fee_enabled}
                    onCheckedChange={(checked) => updateConfig('processing_fee_enabled', checked)}
                  />
                </div>

                {config.processing_fee_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Fee Type</Label>
                      <Select
                        value={config.processing_fee_type}
                        onValueChange={(value) => updateConfig('processing_fee_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat">Flat Amount</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>
                        {config.processing_fee_type === 'flat' ? 'Fee Amount ($)' : 'Fee Percentage (%)'}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step={config.processing_fee_type === 'flat' ? "0.01" : "0.1"}
                        value={config.processing_fee_amount}
                        onChange={(e) => updateConfig('processing_fee_amount', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Annual Membership */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Annual Membership Discount</Label>
                    <p className="text-sm text-muted-foreground">Discount for paying annually</p>
                  </div>
                  <Switch
                    checked={config.annual_discount_enabled}
                    onCheckedChange={(checked) => updateConfig('annual_discount_enabled', checked)}
                  />
                </div>

                {config.annual_discount_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Annual Discount (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="25"
                        value={config.annual_discount_percent}
                        onChange={(e) => updateConfig('annual_discount_percent', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Equivalent Free Months</Label>
                      <Input
                        type="number"
                        min="0"
                        max="3"
                        value={config.annual_discount_months_free}
                        onChange={(e) => updateConfig('annual_discount_months_free', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ConfigSection>

          <ConfigSection
            title="Membership Flexibility"
            description="Configure freeze and transfer policies"
          >
            <div className="space-y-6">
              {/* Freeze Policy */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Membership Freeze</Label>
                    <p className="text-sm text-muted-foreground">Allow members to freeze their membership</p>
                  </div>
                  <Switch
                    checked={config.freeze_enabled}
                    onCheckedChange={(checked) => updateConfig('freeze_enabled', checked)}
                  />
                </div>

                {config.freeze_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Max Days Per Year</Label>
                      <Input
                        type="number"
                        min="0"
                        max="365"
                        value={config.freeze_max_days_per_year}
                        onChange={(e) => updateConfig('freeze_max_days_per_year', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Monthly Freeze Fee ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={config.freeze_fee_per_month}
                        onChange={(e) => updateConfig('freeze_fee_per_month', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Minimum Duration (Days)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={config.freeze_min_duration_days}
                        onChange={(e) => updateConfig('freeze_min_duration_days', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Maximum Duration (Days)</Label>
                      <Input
                        type="number"
                        min="7"
                        max="365"
                        value={config.freeze_max_duration_days}
                        onChange={(e) => updateConfig('freeze_max_duration_days', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Transfer Policy */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Membership Transfer</Label>
                    <p className="text-sm text-muted-foreground">Allow members to transfer their membership</p>
                  </div>
                  <Switch
                    checked={config.transfer_enabled}
                    onCheckedChange={(checked) => updateConfig('transfer_enabled', checked)}
                  />
                </div>

                {config.transfer_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Transfer Fee ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={config.transfer_fee}
                        onChange={(e) => updateConfig('transfer_fee', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-6">
                      <Label>Approval Required</Label>
                      <Switch
                        checked={config.transfer_approval_required}
                        onCheckedChange={(checked) => updateConfig('transfer_approval_required', checked)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ConfigSection>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <ConfigSection
            title="Tax & Legal Compliance"
            description="Configure tax and legal requirements"
            icon={Settings}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    step="0.01"
                    value={config.tax_rate}
                    onChange={(e) => updateConfig('tax_rate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="flex items-center justify-between pt-6">
                  <Label>Tax Included in Price</Label>
                  <Switch
                    checked={config.tax_included_in_price}
                    onCheckedChange={(checked) => updateConfig('tax_included_in_price', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Contract Required</Label>
                    <p className="text-sm text-muted-foreground">Require signed contract for membership</p>
                  </div>
                  <Switch
                    checked={config.contract_required}
                    onCheckedChange={(checked) => updateConfig('contract_required', checked)}
                  />
                </div>

                {config.contract_required && (
                  <div>
                    <Label>Minimum Contract Months</Label>
                    <Input
                      type="number"
                      min="1"
                      max="24"
                      value={config.contract_minimum_months}
                      onChange={(e) => updateConfig('contract_minimum_months', parseInt(e.target.value))}
                    />
                  </div>
                )}

                <div>
                  <Label>Cancellation Notice (Days)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="90"
                    value={config.cancellation_notice_days}
                    onChange={(e) => updateConfig('cancellation_notice_days', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Required notice period for membership cancellation
                  </p>
                </div>
              </div>
            </div>
          </ConfigSection>
        </TabsContent>
        {/* This is a comprehensive start - we can continue with the remaining tabs */}
      </Tabs>
    </div>
  );
};

export default BillingConfigurationManager;

