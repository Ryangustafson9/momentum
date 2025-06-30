
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Users, Briefcase, Gift, UserCheck, Settings, Eye, DollarSign, Building2, FileText, Calendar, Package, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient';
import { useMultiLocationEnabled } from '@/hooks/useSystemSettings';
import PlanBillingPreview from './PlanBillingPreview';

const MembershipFormField = React.memo(({ label, id, children, className = "" }) => (
  <div className={className}>
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
));
MembershipFormField.displayName = 'MembershipFormField';




const MembershipFormDialog = ({ isOpen, onClose, onSave, membershipData, existingCategories = [] }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [staffRoles, setStaffRoles] = useState([]);

  // Check if multi-location features are enabled
  const { isEnabled: isMultiLocationEnabled, isLoading: isSettingsLoading } = useMultiLocationEnabled();
  const [loadingRoles, setLoadingRoles] = useState(false);

  const initialFormState = useMemo(() => ({
    id: '',
    name: '',
    category: 'Membership',
    billing_type: 'Recurring',
    price: '',
    features: '',
    available_for_sale: true,
    available_online: false,
    duration_months: null,
    billingCycleLength: '1',
    billingCycleUnit: 'Months',
    signUpFee: '',
    person_capacity: 1,
    max_family_members: 1,
    is_addon: false,
    addon_billing_cycle: 'monthly',
    requires_primary_membership: false,
    role_id: '',
    has_secondary: false,
    has_dependents: false,
    max_dependents: 0,

    // Phase 1: Contract Management
    has_contract: false,
    contract_cycle_count: 12,
    lock_rate: false,
    renewal_option: 'renew_cycle_to_cycle', // 'renew_cycle_to_cycle' | 'terminate'

    // Phase 1: Hold Options
    hold_option_type: 'no_charge', // 'charge' | 'credit' | 'no_charge'
    hold_fee_amount: 0,

    // Phase 1: Payment Requirements
    payment_method_required: true,
    pay_now_required: false,

    // Phase 1: Additional Charges
    additional_charges: [],

    // Phase 2: Multi-Location Features
    can_be_sold_at: [], // Array of location IDs
    grant_access_to: [], // Array of location IDs
    revenue_mapping: 'by_home_club', // 'by_home_club' | 'by_location_of_sale'
    accounting_groups: {
      membership_fees: '',
      enrollment_fees: '',
      hold_fees: ''
    },

    // Phase 3: Advanced Features
    // Agreement Terms
    agreement_terms: null, // null = use default, string = custom terms
    electronic_paperwork: true,

    // Sales Date Restrictions
    has_sales_restrictions: false,
    sales_start_date: '',
    sales_end_date: '',

    // Bundles & Packages
    included_packages: [], // Array of package IDs
    included_addons: [], // Array of add-on IDs
    auto_assign_packages: false,

    // Advanced Restrictions
    age_restrictions: {
      enabled: false,
      min_age: 18,
      max_age: null
    },
    membership_limit: {
      enabled: false,
      max_members: null
    }
  }), []);

  const [formData, setFormData] = useState(initialFormState);

  // Fetch staff roles when dialog opens and category is Staff Plans
  useEffect(() => {
    const fetchStaffRoles = async () => {
      if (formData.category === 'Staff Plans' || formData.category === 'Staff') {
        setLoadingRoles(true);
        try {
          const { data, error } = await supabase
            .from('staff_roles')
            .select('id, name, description')
            .order('name');

          if (error) throw error;
          setStaffRoles(data || []);
        } catch (error) {
          
          toast({
            title: "Error",
            description: "Failed to load staff roles",
            variant: "destructive"
          });
        } finally {
          setLoadingRoles(false);
        }
      }
    };

    fetchStaffRoles();
  }, [formData.category, toast]);

  useEffect(() => {
    if (isOpen) {
      if (membershipData) {
        setFormData({
          ...initialFormState,
          ...membershipData,
          features: Array.isArray(membershipData.features) ? membershipData.features.join(', ') : (membershipData.features || ''),
          price: membershipData.price ? String(membershipData.price) : '0',
          signUpFee: membershipData.signUpFee ? String(membershipData.signUpFee) : '',
          duration_months: membershipData.duration_months || null,
          category: membershipData.category || 'Member Plans',
          billing_type: membershipData.billing_type || 'Recurring',
          billingCycleLength: (membershipData.billing_type === 'Paid in Full' && membershipData.duration_months) ? String(membershipData.duration_months) : '1',
          billingCycleUnit: (membershipData.billing_type === 'Paid in Full' && membershipData.duration_months) ? 'Months' : 'Months',
          role_id: membershipData.role_id || '',
          has_secondary: membershipData.has_secondary || false,
          has_dependents: membershipData.has_dependents || false,
          max_dependents: membershipData.max_dependents || 0
        });
      } else {
        // For new memberships, use the pre-populated category if provided
        const newFormData = { ...initialFormState };
        if (membershipData && membershipData.category) {
          newFormData.category = membershipData.category;
        }
        setFormData(newFormData);
      }
    }
  }, [membershipData, isOpen, initialFormState]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  }, []);

  // Helper function to get membership type label based on checkboxes
  const getMembershipTypeLabel = useCallback(() => {
    const hasSecondary = formData.has_secondary || false;
    const hasDependents = formData.has_dependents || false;

    if (!hasSecondary && !hasDependents) return 'Individual';
    if (hasSecondary && !hasDependents) return 'Couple';
    if (!hasSecondary && hasDependents) return 'Individual + Dependents';
    if (hasSecondary && hasDependents) return 'Family';

    return 'Individual';
  }, [formData.has_secondary, formData.has_dependents]);

  // Helper function to update membership type based on checkbox changes
  const updateMembershipType = useCallback((hasSecondary, hasDependents) => {
    let personCapacity = 1;
    let maxFamilyMembers = 1;

    if (!hasSecondary && !hasDependents) {
      // Individual
      personCapacity = 1;
      maxFamilyMembers = 1;
    } else if (hasSecondary && !hasDependents) {
      // Couple
      personCapacity = 2;
      maxFamilyMembers = 2;
    } else if (!hasSecondary && hasDependents) {
      // Individual + Dependents
      personCapacity = 1 + (formData.max_dependents || 0);
      maxFamilyMembers = 1 + (formData.max_dependents || 0);
    } else if (hasSecondary && hasDependents) {
      // Family
      personCapacity = 2 + (formData.max_dependents || 0);
      maxFamilyMembers = 2 + (formData.max_dependents || 0);
    }

    setFormData(prev => ({
      ...prev,
      person_capacity: personCapacity,
      max_family_members: maxFamilyMembers
    }));
  }, [formData.max_dependents]);

  // Update capacity when max_dependents changes
  useEffect(() => {
    if (formData.has_dependents) {
      updateMembershipType(formData.has_secondary, formData.has_dependents);
    }
  }, [formData.max_dependents, formData.has_secondary, formData.has_dependents, updateMembershipType]);

  const handleSelectChange = useCallback((name, value) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Automatically set is_addon based on category
      if (name === 'category') {
        newData.is_addon = value === 'Add-On';
        newData.requires_primary_membership = value === 'Add-On';

        // Reset capacity for add-ons
        if (value === 'Add-On') {
          newData.person_capacity = 1;
          newData.max_family_members = 1;
          newData.has_secondary = false;
          newData.has_dependents = false;
          newData.max_dependents = 0;
        }
      }

      return newData;
    });
  }, []);

  const handleSubmitForm = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!formData.name.trim()) {
        toast({ title: "Validation Error", description: "Membership name is required.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    // Validate price - allow negative for add-ons (credits)
    if (formData.billing_type !== 'N/A' && isNaN(parseFloat(formData.price))) {
        toast({ title: "Validation Error", description: "Price must be a valid number.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    // For non-add-ons, price must be non-negative
    if (formData.billing_type !== 'N/A' && formData.category !== 'Add-On' && parseFloat(formData.price) < 0) {
        toast({ title: "Validation Error", description: "Price must be non-negative for this plan type.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    // Phase 1 Validation
    if (formData.has_contract && (!formData.contract_cycle_count || formData.contract_cycle_count < 1)) {
        toast({ title: "Validation Error", description: "Contract duration must be at least 1 cycle.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    if (formData.hold_option_type === 'charge' && (!formData.hold_fee_amount || formData.hold_fee_amount < 0)) {
        toast({ title: "Validation Error", description: "Hold fee amount must be a valid non-negative number.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    // Phase 3 Validation
    if (formData.has_sales_restrictions) {
        if (!formData.sales_start_date || !formData.sales_end_date) {
            toast({ title: "Validation Error", description: "Both start and end dates are required for sales restrictions.", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        if (new Date(formData.sales_start_date) >= new Date(formData.sales_end_date)) {
            toast({ title: "Validation Error", description: "Sales start date must be before end date.", variant: "destructive" });
            setIsLoading(false);
            return;
        }
    }

    if (formData.age_restrictions?.enabled) {
        if (formData.age_restrictions.min_age && formData.age_restrictions.max_age &&
            formData.age_restrictions.min_age >= formData.age_restrictions.max_age) {
            toast({ title: "Validation Error", description: "Minimum age must be less than maximum age.", variant: "destructive" });
            setIsLoading(false);
            return;
        }
    }

    const dataToSubmit = {
        id: formData.id || (membershipData ? membershipData.id : undefined),
        name: formData.name.trim(),
        price: formData.billing_type === 'N/A' ? 0 : (parseFloat(formData.price) || 0),
        billing_type: formData.billing_type,
        duration_months: formData.billing_type === 'Paid in Full' ? (parseInt(formData.billingCycleLength) || null) : (formData.duration_months ? parseInt(formData.duration_months) : null),
        features: Array.isArray(formData.features) ? formData.features : (formData.features || '').split(',').map(f => f.trim()).filter(f => f),
        available_for_sale: formData.available_for_sale,
        available_online: formData.available_online && formData.available_for_sale, // Online requires for sale
        category: formData.category,
        color: getCategoryColor(formData.category), // Automatic color based on category
        person_capacity: parseInt(formData.person_capacity) || 1,
        max_family_members: parseInt(formData.max_family_members) || 1,
        is_addon: formData.is_addon || false,
        addon_billing_cycle: formData.addon_billing_cycle || 'monthly',
        requires_primary_membership: formData.requires_primary_membership || false,
        role_id: (formData.category === 'Staff') ? formData.role_id || null : null,
        has_secondary: formData.has_secondary || false,
        has_dependents: formData.has_dependents || false,
        max_dependents: parseInt(formData.max_dependents) || 0,

        // Phase 1: Contract Management
        has_contract: formData.has_contract || false,
        contract_cycle_count: parseInt(formData.contract_cycle_count) || 12,
        lock_rate: formData.lock_rate || false,
        renewal_option: formData.renewal_option || 'renew_cycle_to_cycle',

        // Phase 1: Hold Options
        hold_option_type: formData.hold_option_type || 'no_charge',
        hold_fee_amount: parseFloat(formData.hold_fee_amount) || 0,

        // Phase 1: Payment Requirements
        payment_method_required: formData.payment_method_required !== false, // Default to true
        pay_now_required: formData.pay_now_required || false,

        // Phase 1: Additional Charges
        additional_charges: formData.additional_charges || [],

        // Phase 2: Multi-Location Features (use defaults if multi-location disabled)
        can_be_sold_at: isMultiLocationEnabled ? (formData.can_be_sold_at || []) : ['all'],
        grant_access_to: isMultiLocationEnabled ? (formData.grant_access_to || []) : ['all'],
        revenue_mapping: isMultiLocationEnabled ? (formData.revenue_mapping || 'by_home_club') : 'by_home_club',
        accounting_groups: isMultiLocationEnabled ? (formData.accounting_groups || {
          membership_fees: '',
          enrollment_fees: '',
          hold_fees: ''
        }) : {
          membership_fees: '',
          enrollment_fees: '',
          hold_fees: ''
        },

        // Phase 3: Advanced Features
        agreement_terms: formData.agreement_terms || null,
        electronic_paperwork: formData.electronic_paperwork !== false, // Default to true
        has_sales_restrictions: formData.has_sales_restrictions || false,
        sales_start_date: formData.sales_start_date || null,
        sales_end_date: formData.sales_end_date || null,
        included_packages: formData.included_packages || [],
        included_addons: formData.included_addons || [],
        auto_assign_packages: formData.auto_assign_packages || false,
        age_restrictions: formData.age_restrictions || { enabled: false, min_age: 18, max_age: null },
        membership_limit: formData.membership_limit || { enabled: false, max_members: null }
    };
    
    if (dataToSubmit.billing_type === 'Recurring') {
        dataToSubmit.duration_months = null;
    }

    try {
      await onSave(dataToSubmit); 
    } catch (error) {
      // Error toast is handled by the caller (MembershipsPage)
    } finally {
      setIsLoading(false);
    }
  }, [formData, membershipData, onSave, toast]);

  // Hardcoded categories - cannot be changed
  const FIXED_CATEGORIES = [
    { value: 'Membership', label: 'Membership', icon: Users, color: 'text-blue-600' },
    { value: 'Add-On', label: 'Add-On', icon: Gift, color: 'text-green-600' },
    { value: 'Staff', label: 'Staff', icon: Shield, color: 'text-purple-600' },
    { value: 'Guest', label: 'Guest', icon: UserCheck, color: 'text-orange-600' }
  ];

  // Get badge color based on category
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Membership': return '#3B82F6'; // Blue
      case 'Add-On': return '#10B981'; // Green
      case 'Staff': return '#8B5CF6'; // Purple
      case 'Guest': return '#F59E0B'; // Orange
      default: return '#3B82F6'; // Default blue
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const categoryConfig = FIXED_CATEGORIES.find(cat => cat.value === category);
    if (categoryConfig) {
      const IconComponent = categoryConfig.icon;
      return <IconComponent className={`h-5 w-5 ${categoryConfig.color}`} />;
    }
    return <Briefcase className="h-5 w-5 text-gray-600" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-hidden bg-white border-0 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="border-b border-gray-100 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  {getCategoryIcon(formData.category)}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-semibold text-gray-900 tracking-tight">
                    {membershipData && membershipData.id
                      ? 'Edit Plan'
                      : 'Create Plan'
                    }
                  </DialogTitle>
                  <DialogDescription className="text-gray-500 mt-1 text-base">
                    {membershipData && membershipData.id
                      ? 'Modify plan configuration and settings'
                      : 'Set up a new membership plan with pricing and features'
                    }
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium border-gray-200 text-gray-700">
                  {formData.category}
                </Badge>
                {membershipData?.id && (
                  <Badge variant="secondary" className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600">
                    #{membershipData.id}
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[70vh] px-1 py-6">
            {isSettingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">Loading system settings...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitForm} className="space-y-8">

                {/* Membership Configuration Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-blue-50 rounded-lg mr-3">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  Membership Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <MembershipFormField label="Plan Name *" id="mship-name">
                    <Input
                      id="mship-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Premium Membership"
                      required
                      disabled={isLoading}
                      className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11"
                    />
                  </MembershipFormField>

                  <MembershipFormField label="Category" id="mship-category">
                    <Select name="category" value={formData.category} onValueChange={(value) => handleSelectChange('category', value)} disabled={isLoading}>
                      <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIXED_CATEGORIES.map((category) => {
                          const IconComponent = category.icon;
                          return (
                            <SelectItem key={category.value} value={category.value}>
                              <div className="flex items-center">
                                <IconComponent className={`h-4 w-4 mr-2 ${category.color}`} />
                                {category.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </MembershipFormField>

                  {/* Staff Role Selection - Only for Staff Plans */}
                  {formData.category === 'Staff' && (
                    <MembershipFormField label="Staff Role *" id="mship-role_id">
                      <Select
                        name="role_id"
                        value={formData.role_id}
                        onValueChange={(value) => handleSelectChange('role_id', value)}
                        disabled={isLoading || loadingRoles}
                      >
                        <SelectTrigger className="border-purple-200 focus:border-purple-400">
                          <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select staff role"} />
                        </SelectTrigger>
                        <SelectContent>
                          {staffRoles.map(role => (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center">
                                <Shield className="h-4 w-4 mr-2 text-purple-600" />
                                <div>
                                  <div className="font-medium">{role.name}</div>
                                  {role.description && (
                                    <div className="text-xs text-gray-500">{role.description}</div>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                          {staffRoles.length === 0 && !loadingRoles && (
                            <SelectItem value="" disabled>No staff roles available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </MembershipFormField>
                  )}



                </div>

                {/* Membership Type Configuration - Only for Membership and Guest plans */}
                {(formData.category === 'Membership' || formData.category === 'Guest') && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="space-y-6">
                      {/* Membership Type Display */}
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Membership Type</label>
                          <div className="text-lg font-semibold text-blue-600 mt-2">
                            {getMembershipTypeLabel()}
                          </div>
                        </div>
                      </div>

                      {/* Additional Members Configuration */}
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-3 block">Additional Members</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id="has-secondary"
                                checked={formData.has_secondary || false}
                                onCheckedChange={(checked) => {
                                  handleInputChange({ target: { name: 'has_secondary', checked, type: 'checkbox' } });
                                  updateMembershipType(checked, formData.has_dependents);
                                }}
                                disabled={isLoading}
                              />
                              <Label htmlFor="has-secondary" className="text-sm font-medium">
                                Has Secondary
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id="has-dependents"
                                checked={formData.has_dependents || false}
                                onCheckedChange={(checked) => {
                                  handleInputChange({ target: { name: 'has_dependents', checked, type: 'checkbox' } });
                                  updateMembershipType(formData.has_secondary, checked);
                                  // Reset max_dependents if unchecking
                                  if (!checked) {
                                    handleInputChange({ target: { name: 'max_dependents', value: 0 } });
                                  }
                                }}
                                disabled={isLoading}
                              />
                              <Label htmlFor="has-dependents" className="text-sm font-medium">
                                Has Dependents
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Max Dependents Field */}
                      {formData.has_dependents && (
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <MembershipFormField label="Maximum Dependents" id="mship-max_dependents">
                            <Input
                              id="mship-max_dependents"
                              name="max_dependents"
                              type="number"
                              min="1"
                              max="10"
                              value={formData.max_dependents || ''}
                              onChange={handleInputChange}
                              placeholder="e.g., 4"
                              disabled={isLoading}
                              className="border-blue-200 focus:border-blue-400"
                            />
                          </MembershipFormField>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Billing Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-green-50 rounded-lg mr-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  Billing & Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <MembershipFormField label="Billing Type" id="mship-billing_type">
                    <Select name="billing_type" value={formData.billing_type} onValueChange={(value) => handleSelectChange('billing_type', value)} disabled={isLoading}>
                      <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11">
                        <SelectValue placeholder="Select billing type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Recurring">🔄 Recurring</SelectItem>
                        <SelectItem value="Paid in Full">💰 Paid in Full</SelectItem>
                        <SelectItem value="N/A">🚫 N/A (Staff/Free)</SelectItem>
                      </SelectContent>
                    </Select>
                  </MembershipFormField>

                  {formData.billing_type === 'Recurring' && (
                    <>
                      <MembershipFormField label="Cycle Length" id="mship-billingCycleLength">
                        <Input
                          id="mship-billingCycleLength"
                          name="billingCycleLength"
                          type="number"
                          min="1"
                          value={formData.billingCycleLength}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="border-green-200 focus:border-green-400"
                          placeholder="1"
                        />
                      </MembershipFormField>
                      <MembershipFormField label="Cycle Unit" id="mship-billingCycleUnit">
                        <Select name="billingCycleUnit" value={formData.billingCycleUnit} onValueChange={(value) => handleSelectChange('billingCycleUnit', value)} disabled={isLoading}>
                          <SelectTrigger className="border-green-200 focus:border-green-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Days">📅 Days</SelectItem>
                            <SelectItem value="Weeks">📆 Weeks</SelectItem>
                            <SelectItem value="Months">🗓️ Months</SelectItem>
                          </SelectContent>
                        </Select>
                      </MembershipFormField>
                    </>
                  )}

                  {formData.billing_type === 'Paid in Full' && (
                    <>
                      <MembershipFormField label="Duration" id="mship-duration">
                        <Input
                          id="mship-duration"
                          name="billingCycleLength"
                          type="number"
                          min="1"
                          value={formData.billingCycleLength}
                          onChange={handleInputChange}
                          placeholder="12"
                          disabled={isLoading}
                          className="border-green-200 focus:border-green-400"
                        />
                      </MembershipFormField>
                      <MembershipFormField label="Duration Unit" id="mship-duration-unit">
                        <Select name="billingCycleUnit" value={formData.billingCycleUnit} onValueChange={(value) => handleSelectChange('billingCycleUnit', value)} disabled={isLoading}>
                          <SelectTrigger className="border-green-200 focus:border-green-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Days">📅 Days</SelectItem>
                            <SelectItem value="Weeks">📆 Weeks</SelectItem>
                            <SelectItem value="Months">🗓️ Months</SelectItem>
                          </SelectContent>
                        </Select>
                      </MembershipFormField>
                    </>
                  )}

                  {formData.billing_type !== 'N/A' && (
                    <MembershipFormField
                      label={formData.category === 'Add-On' ? "Amount ($) * (Use negative for credits)" : "Membership Fee ($) *"}
                      id="mship-price"
                    >
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          id="mship-price"
                          name="price"
                          type="number"
                          step="0.01"
                          min={formData.category === 'Add-On' ? undefined : "0"} // Allow negative for add-ons
                          value={formData.price}
                          onChange={handleInputChange}
                          required={formData.billing_type !== 'N/A'}
                          disabled={isLoading}
                          className={`pl-8 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11 ${
                            formData.category === 'Add-On' && parseFloat(formData.price) < 0
                              ? 'text-green-600 font-semibold'
                              : ''
                          }`}
                          placeholder={formData.category === 'Add-On' ? "-25.00 (credit) or 15.00 (charge)" : "0.00"}
                        />
                      </div>
                      {formData.category === 'Add-On' && (
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Enter negative amounts (e.g., -25.00) to create monthly credits
                        </p>
                      )}
                    </MembershipFormField>
                  )}

                  {formData.billing_type !== 'N/A' && (
                    <MembershipFormField label="Enrollment Fee ($)" id="mship-signUpFee">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          id="mship-signUpFee"
                          name="signUpFee"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.signUpFee}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          disabled={isLoading}
                          className="pl-8 border-green-200 focus:border-green-400"
                        />
                      </div>
                    </MembershipFormField>
                  )}
                </div>

                {/* Billing Preview within Billing Section */}
                {formData.billing_type !== 'N/A' && (
                  <div className="mt-6 pt-6 border-t border-green-200">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                      <Eye className="h-4 w-4 mr-2 text-green-600" />
                      Billing Preview
                    </h4>

                    {/* Plan Billing Preview */}
                    <div className="bg-white rounded-lg border border-green-200">
                      <PlanBillingPreview membershipData={formData} />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Contract Settings Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-orange-50 rounded-lg mr-3">
                    <Shield className="h-5 w-5 text-orange-600" />
                  </div>
                  Contract & Terms
                </h3>

                <div className="space-y-6">
                  {/* Contract Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <Label className="text-base font-medium">Has Contract</Label>
                      <p className="text-sm text-gray-600 mt-1">Lock members into recurring billing for a set duration</p>
                    </div>
                    <Checkbox
                      checked={formData.has_contract}
                      onCheckedChange={(checked) => handleInputChange({ target: { name: 'has_contract', checked, type: 'checkbox' } })}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Contract Details - Only show when has_contract is true */}
                  {formData.has_contract && (
                    <div className="space-y-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MembershipFormField label="Contract Duration (Cycles)" id="contract-cycle-count">
                          <Input
                            id="contract-cycle-count"
                            name="contract_cycle_count"
                            type="number"
                            min="1"
                            max="60"
                            value={formData.contract_cycle_count}
                            onChange={handleInputChange}
                            placeholder="12"
                            disabled={isLoading}
                            className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11"
                          />
                        </MembershipFormField>

                        <MembershipFormField label="Renewal Option" id="renewal-option">
                          <Select
                            name="renewal_option"
                            value={formData.renewal_option}
                            onValueChange={(value) => handleSelectChange('renewal_option', value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11">
                              <SelectValue placeholder="Select renewal option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="renew_cycle_to_cycle">Continue Month-to-Month</SelectItem>
                              <SelectItem value="terminate">Auto-Cancel After Contract</SelectItem>
                            </SelectContent>
                          </Select>
                        </MembershipFormField>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                        <div>
                          <Label className="text-sm font-medium">Lock Rate</Label>
                          <p className="text-xs text-gray-600 mt-1">Keep contracted rate after renewal</p>
                        </div>
                        <Checkbox
                          checked={formData.lock_rate}
                          onCheckedChange={(checked) => handleInputChange({ target: { name: 'lock_rate', checked, type: 'checkbox' } })}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}

                  {/* Hold Options */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Hold Options</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MembershipFormField label="Hold Billing Type" id="hold-option-type">
                        <Select
                          name="hold_option_type"
                          value={formData.hold_option_type}
                          onValueChange={(value) => handleSelectChange('hold_option_type', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11">
                            <SelectValue placeholder="Select hold option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no_charge">No Charge</SelectItem>
                            <SelectItem value="charge">Charge Hold Fee</SelectItem>
                          </SelectContent>
                        </Select>
                      </MembershipFormField>

                      {formData.hold_option_type === 'charge' && (
                        <MembershipFormField label="Hold Fee Amount ($)" id="hold-fee-amount">
                          <Input
                            id="hold-fee-amount"
                            name="hold_fee_amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.hold_fee_amount}
                            onChange={handleInputChange}
                            placeholder="25.00"
                            disabled={isLoading}
                            className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11"
                          />
                        </MembershipFormField>
                      )}
                    </div>
                  </div>

                  {/* Payment Requirements */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Payment Requirements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <Checkbox
                          checked={formData.payment_method_required}
                          onCheckedChange={(checked) => handleInputChange({ target: { name: 'payment_method_required', checked, type: 'checkbox' } })}
                          disabled={isLoading}
                        />
                        <div>
                          <Label className="font-medium">Payment Method Required</Label>
                          <p className="text-xs text-gray-500">Member must have payment method on file</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <Checkbox
                          checked={formData.pay_now_required}
                          onCheckedChange={(checked) => handleInputChange({ target: { name: 'pay_now_required', checked, type: 'checkbox' } })}
                          disabled={isLoading}
                        />
                        <div>
                          <Label className="font-medium">Pay Now Required</Label>
                          <p className="text-xs text-gray-500">Payment required to activate membership</p>
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
              </motion.div>

              {/* Multi-Location Settings Section - Only show if multi-location is enabled */}
              {isMultiLocationEnabled && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
                >
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-indigo-50 rounded-lg mr-3">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  Multi-Location Access
                </h3>

                <div className="space-y-6">
                  {/* Revenue Mapping */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Revenue Mapping</h4>
                    <MembershipFormField label="Revenue Mapping Method" id="revenue-mapping">
                      <Select
                        name="revenue_mapping"
                        value={formData.revenue_mapping}
                        onValueChange={(value) => handleSelectChange('revenue_mapping', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11">
                          <SelectValue placeholder="Select revenue mapping" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="by_home_club">By Home Club</SelectItem>
                          <SelectItem value="by_location_of_sale">By Location of Sale</SelectItem>
                        </SelectContent>
                      </Select>
                    </MembershipFormField>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {formData.revenue_mapping === 'by_home_club' ? (
                        <p><strong>By Home Club:</strong> Revenue maps to member's home location regardless of where sold</p>
                      ) : (
                        <p><strong>By Location of Sale:</strong> Revenue maps to the location where membership was sold</p>
                      )}
                    </div>
                  </div>

                  {/* Location Access */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Location Access</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Can Be Sold At</Label>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 min-h-[120px]">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.can_be_sold_at.includes('all') || formData.can_be_sold_at.length === 0}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    handleInputChange({ target: { name: 'can_be_sold_at', value: ['all'] } });
                                  } else {
                                    handleInputChange({ target: { name: 'can_be_sold_at', value: [] } });
                                  }
                                }}
                                disabled={isLoading}
                              />
                              <Label className="text-sm">All Locations</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.can_be_sold_at.includes('main')}
                                onCheckedChange={(checked) => {
                                  const current = formData.can_be_sold_at.filter(id => id !== 'all');
                                  if (checked) {
                                    handleInputChange({ target: { name: 'can_be_sold_at', value: [...current, 'main'] } });
                                  } else {
                                    handleInputChange({ target: { name: 'can_be_sold_at', value: current.filter(id => id !== 'main') } });
                                  }
                                }}
                                disabled={isLoading}
                              />
                              <Label className="text-sm">Main Location</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.can_be_sold_at.includes('online')}
                                onCheckedChange={(checked) => {
                                  const current = formData.can_be_sold_at.filter(id => id !== 'all');
                                  if (checked) {
                                    handleInputChange({ target: { name: 'can_be_sold_at', value: [...current, 'online'] } });
                                  } else {
                                    handleInputChange({ target: { name: 'can_be_sold_at', value: current.filter(id => id !== 'online') } });
                                  }
                                }}
                                disabled={isLoading}
                              />
                              <Label className="text-sm">Online Sales</Label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Grant Access To</Label>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 min-h-[120px]">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.grant_access_to.includes('all') || formData.grant_access_to.length === 0}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    handleInputChange({ target: { name: 'grant_access_to', value: ['all'] } });
                                  } else {
                                    handleInputChange({ target: { name: 'grant_access_to', value: [] } });
                                  }
                                }}
                                disabled={isLoading}
                              />
                              <Label className="text-sm">All Locations</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.grant_access_to.includes('main')}
                                onCheckedChange={(checked) => {
                                  const current = formData.grant_access_to.filter(id => id !== 'all');
                                  if (checked) {
                                    handleInputChange({ target: { name: 'grant_access_to', value: [...current, 'main'] } });
                                  } else {
                                    handleInputChange({ target: { name: 'grant_access_to', value: current.filter(id => id !== 'main') } });
                                  }
                                }}
                                disabled={isLoading}
                              />
                              <Label className="text-sm">Main Location</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.grant_access_to.includes('satellite')}
                                onCheckedChange={(checked) => {
                                  const current = formData.grant_access_to.filter(id => id !== 'all');
                                  if (checked) {
                                    handleInputChange({ target: { name: 'grant_access_to', value: [...current, 'satellite'] } });
                                  } else {
                                    handleInputChange({ target: { name: 'grant_access_to', value: current.filter(id => id !== 'satellite') } });
                                  }
                                }}
                                disabled={isLoading}
                              />
                              <Label className="text-sm">Satellite Locations</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accounting Groups */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Accounting Groups</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <MembershipFormField label="Membership Fees Group" id="accounting-membership">
                        <Input
                          id="accounting-membership"
                          name="accounting_groups.membership_fees"
                          value={formData.accounting_groups?.membership_fees || ''}
                          onChange={(e) => {
                            const updatedGroups = { ...formData.accounting_groups, membership_fees: e.target.value };
                            handleInputChange({ target: { name: 'accounting_groups', value: updatedGroups } });
                          }}
                          placeholder="e.g., MEMBERSHIP_REV"
                          disabled={isLoading}
                          className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11"
                        />
                      </MembershipFormField>

                      <MembershipFormField label="Enrollment Fees Group" id="accounting-enrollment">
                        <Input
                          id="accounting-enrollment"
                          name="accounting_groups.enrollment_fees"
                          value={formData.accounting_groups?.enrollment_fees || ''}
                          onChange={(e) => {
                            const updatedGroups = { ...formData.accounting_groups, enrollment_fees: e.target.value };
                            handleInputChange({ target: { name: 'accounting_groups', value: updatedGroups } });
                          }}
                          placeholder="e.g., ENROLLMENT_REV"
                          disabled={isLoading}
                          className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11"
                        />
                      </MembershipFormField>

                      <MembershipFormField label="Hold Fees Group" id="accounting-hold">
                        <Input
                          id="accounting-hold"
                          name="accounting_groups.hold_fees"
                          value={formData.accounting_groups?.hold_fees || ''}
                          onChange={(e) => {
                            const updatedGroups = { ...formData.accounting_groups, hold_fees: e.target.value };
                            handleInputChange({ target: { name: 'accounting_groups', value: updatedGroups } });
                          }}
                          placeholder="e.g., HOLD_REV"
                          disabled={isLoading}
                          className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11"
                        />
                      </MembershipFormField>
                    </div>
                  </div>
                </div>
              </motion.div>
              )}

              {/* Advanced Features Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-purple-50 rounded-lg mr-3">
                    <Settings className="h-5 w-5 text-purple-600" />
                  </div>
                  Advanced Features
                </h3>

                <div className="space-y-8">
                  {/* Agreement Terms */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Agreement Terms & Paperwork</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <Checkbox
                          checked={formData.electronic_paperwork}
                          onCheckedChange={(checked) => handleInputChange({ target: { name: 'electronic_paperwork', checked, type: 'checkbox' } })}
                          disabled={isLoading}
                        />
                        <div>
                          <Label className="font-medium">Electronic Paperwork</Label>
                          <p className="text-xs text-gray-500">Generate electronic agreements when selling</p>
                        </div>
                      </div>

                      <MembershipFormField label="Agreement Terms" id="agreement-terms">
                        <Select
                          name="agreement_terms"
                          value={formData.agreement_terms || 'default'}
                          onValueChange={(value) => handleSelectChange('agreement_terms', value === 'default' ? null : value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11">
                            <SelectValue placeholder="Select agreement terms" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default Terms</SelectItem>
                            <SelectItem value="standard_v1">Standard Terms v1.0</SelectItem>
                            <SelectItem value="premium_v1">Premium Terms v1.0</SelectItem>
                            <SelectItem value="corporate_v1">Corporate Terms v1.0</SelectItem>
                          </SelectContent>
                        </Select>
                      </MembershipFormField>
                    </div>
                  </div>

                  {/* Sales Date Restrictions */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Sales Restrictions</h4>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <Checkbox
                        checked={formData.has_sales_restrictions}
                        onCheckedChange={(checked) => handleInputChange({ target: { name: 'has_sales_restrictions', checked, type: 'checkbox' } })}
                        disabled={isLoading}
                      />
                      <div>
                        <Label className="font-medium">Limited Sales Period</Label>
                        <p className="text-xs text-gray-500">Restrict when this membership can be sold</p>
                      </div>
                    </div>

                    {formData.has_sales_restrictions && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                        <MembershipFormField label="Sales Start Date" id="sales-start-date">
                          <Input
                            id="sales-start-date"
                            name="sales_start_date"
                            type="date"
                            value={formData.sales_start_date}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11"
                          />
                        </MembershipFormField>

                        <MembershipFormField label="Sales End Date" id="sales-end-date">
                          <Input
                            id="sales-end-date"
                            name="sales_end_date"
                            type="date"
                            value={formData.sales_end_date}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-11"
                          />
                        </MembershipFormField>
                      </div>
                    )}
                  </div>

                  {/* Age & Membership Restrictions */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Member Restrictions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Age Restrictions */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <Checkbox
                            checked={formData.age_restrictions?.enabled}
                            onCheckedChange={(checked) => {
                              const updatedRestrictions = { ...formData.age_restrictions, enabled: checked };
                              handleInputChange({ target: { name: 'age_restrictions', value: updatedRestrictions } });
                            }}
                            disabled={isLoading}
                          />
                          <div>
                            <Label className="font-medium">Age Restrictions</Label>
                            <p className="text-xs text-gray-500">Set minimum/maximum age requirements</p>
                          </div>
                        </div>

                        {formData.age_restrictions?.enabled && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Min Age</Label>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                value={formData.age_restrictions?.min_age || ''}
                                onChange={(e) => {
                                  const updatedRestrictions = {
                                    ...formData.age_restrictions,
                                    min_age: parseInt(e.target.value) || null
                                  };
                                  handleInputChange({ target: { name: 'age_restrictions', value: updatedRestrictions } });
                                }}
                                placeholder="18"
                                disabled={isLoading}
                                className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-10 mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Max Age</Label>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                value={formData.age_restrictions?.max_age || ''}
                                onChange={(e) => {
                                  const updatedRestrictions = {
                                    ...formData.age_restrictions,
                                    max_age: parseInt(e.target.value) || null
                                  };
                                  handleInputChange({ target: { name: 'age_restrictions', value: updatedRestrictions } });
                                }}
                                placeholder="65"
                                disabled={isLoading}
                                className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-10 mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Membership Limit */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <Checkbox
                            checked={formData.membership_limit?.enabled}
                            onCheckedChange={(checked) => {
                              const updatedLimit = { ...formData.membership_limit, enabled: checked };
                              handleInputChange({ target: { name: 'membership_limit', value: updatedLimit } });
                            }}
                            disabled={isLoading}
                          />
                          <div>
                            <Label className="font-medium">Membership Limit</Label>
                            <p className="text-xs text-gray-500">Limit total number of active memberships</p>
                          </div>
                        </div>

                        {formData.membership_limit?.enabled && (
                          <div>
                            <Label className="text-sm">Max Active Members</Label>
                            <Input
                              type="number"
                              min="1"
                              value={formData.membership_limit?.max_members || ''}
                              onChange={(e) => {
                                const updatedLimit = {
                                  ...formData.membership_limit,
                                  max_members: parseInt(e.target.value) || null
                                };
                                handleInputChange({ target: { name: 'membership_limit', value: updatedLimit } });
                              }}
                              placeholder="500"
                              disabled={isLoading}
                              className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-10 mt-1"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bundles & Packages */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Bundles & Packages</h4>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <Checkbox
                        checked={formData.auto_assign_packages}
                        onCheckedChange={(checked) => handleInputChange({ target: { name: 'auto_assign_packages', checked, type: 'checkbox' } })}
                        disabled={isLoading}
                      />
                      <div>
                        <Label className="font-medium">Auto-Assign Packages</Label>
                        <p className="text-xs text-gray-500">Automatically assign included packages when membership is sold</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Included Packages */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Included Packages</Label>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 min-h-[100px]">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.included_packages.includes('personal_training')}
                                onCheckedChange={(checked) => {
                                  const current = formData.included_packages.filter(id => id !== 'personal_training');
                                  if (checked) {
                                    handleInputChange({ target: { name: 'included_packages', value: [...current, 'personal_training'] } });
                                  } else {
                                    handleInputChange({ target: { name: 'included_packages', value: current } });
                                  }
                                }}
                                disabled={isLoading}
                              />
                              <Label className="text-sm">Personal Training Package</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.included_packages.includes('group_classes')}
                                onCheckedChange={(checked) => {
                                  const current = formData.included_packages.filter(id => id !== 'group_classes');
                                  if (checked) {
                                    handleInputChange({ target: { name: 'included_packages', value: [...current, 'group_classes'] } });
                                  } else {
                                    handleInputChange({ target: { name: 'included_packages', value: current } });
                                  }
                                }}
                                disabled={isLoading}
                              />
                              <Label className="text-sm">Group Classes Package</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.included_packages.includes('nutrition')}
                                onCheckedChange={(checked) => {
                                  const current = formData.included_packages.filter(id => id !== 'nutrition');
                                  if (checked) {
                                    handleInputChange({ target: { name: 'included_packages', value: [...current, 'nutrition'] } });
                                  } else {
                                    handleInputChange({ target: { name: 'included_packages', value: current } });
                                  }
                                }}
                                disabled={isLoading}
                              />
                              <Label className="text-sm">Nutrition Consultation</Label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Included Add-ons */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Included Add-ons</Label>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 min-h-[100px]">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.included_addons.includes('locker_rental')}
                                onCheckedChange={(checked) => {
                                  const current = formData.included_addons.filter(id => id !== 'locker_rental');
                                  if (checked) {
                                    handleInputChange({ target: { name: 'included_addons', value: [...current, 'locker_rental'] } });
                                  } else {
                                    handleInputChange({ target: { name: 'included_addons', value: current } });
                                  }
                                }}
                                disabled={isLoading}
                              />
                              <Label className="text-sm">Locker Rental</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.included_addons.includes('towel_service')}
                                onCheckedChange={(checked) => {
                                  const current = formData.included_addons.filter(id => id !== 'towel_service');
                                  if (checked) {
                                    handleInputChange({ target: { name: 'included_addons', value: [...current, 'towel_service'] } });
                                  } else {
                                    handleInputChange({ target: { name: 'included_addons', value: current } });
                                  }
                                }}
                                disabled={isLoading}
                              />
                              <Label className="text-sm">Towel Service</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.included_addons.includes('guest_passes')}
                                onCheckedChange={(checked) => {
                                  const current = formData.included_addons.filter(id => id !== 'guest_passes');
                                  if (checked) {
                                    handleInputChange({ target: { name: 'included_addons', value: [...current, 'guest_passes'] } });
                                  } else {
                                    handleInputChange({ target: { name: 'included_addons', value: current } });
                                  }
                                }}
                                disabled={isLoading}
                              />
                              <Label className="text-sm">Monthly Guest Passes</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Plan Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200"
              >
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-blue-600" />
                  Plan Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-800">Basic Info</h4>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Category: {formData.category}</li>
                      <li>• Billing: {formData.billing_type}</li>
                      {formData.has_contract && <li>• Contract: {formData.contract_cycle_count} cycles</li>}
                      {formData.has_secondary && <li>• Includes Secondary</li>}
                      {formData.has_dependents && <li>• Includes Dependents ({formData.max_dependents || 'unlimited'})</li>}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-800">Advanced Features</h4>
                    <ul className="space-y-1 text-blue-700">
                      {formData.has_sales_restrictions && <li>• Sales Date Restrictions</li>}
                      {formData.age_restrictions?.enabled && <li>• Age Restrictions</li>}
                      {formData.membership_limit?.enabled && <li>• Membership Limit</li>}
                      {formData.auto_assign_packages && <li>• Auto-Assign Packages</li>}
                      {!formData.electronic_paperwork && <li>• No Electronic Paperwork</li>}
                      {formData.agreement_terms && <li>• Custom Agreement Terms</li>}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-800">Included Items</h4>
                    <ul className="space-y-1 text-blue-700">
                      {formData.included_packages?.length > 0 && (
                        <li>• {formData.included_packages.length} Package(s)</li>
                      )}
                      {formData.included_addons?.length > 0 && (
                        <li>• {formData.included_addons.length} Add-on(s)</li>
                      )}
                      {formData.additional_charges?.length > 0 && (
                        <li>• {formData.additional_charges.length} Additional Charge(s)</li>
                      )}
                      {(!formData.included_packages?.length && !formData.included_addons?.length && !formData.additional_charges?.length) && (
                        <li className="text-blue-500">• No additional items</li>
                      )}
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Settings & Features */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-purple-50 rounded-lg mr-3">
                    <Settings className="h-5 w-5 text-purple-600" />
                  </div>
                  Settings & Features
                </h3>

                <div className="space-y-6">
                  {/* Availability Checkboxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <Checkbox
                        id="mship-available_for_sale-settings"
                        name="available_for_sale"
                        checked={formData.available_for_sale}
                        onCheckedChange={(checked) => {
                          handleInputChange({ target: { name: 'available_for_sale', checked, type: 'checkbox' } });
                          if (!checked) {
                            handleInputChange({ target: { name: 'available_online', checked: false, type: 'checkbox' } });
                          }
                        }}
                        disabled={isLoading}
                      />
                      <div>
                        <Label htmlFor="mship-available_for_sale-settings" className="font-medium">Available for Sale</Label>
                        <p className="text-xs text-gray-500">Staff can sell this plan</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <Checkbox
                        id="mship-available_online-settings"
                        name="available_online"
                        checked={formData.available_online}
                        onCheckedChange={(checked) => handleInputChange({ target: { name: 'available_online', checked, type: 'checkbox' } })}
                        disabled={isLoading || !formData.available_for_sale}
                      />
                      <div>
                        <Label htmlFor="mship-available_online-settings" className={`font-medium ${!formData.available_for_sale ? 'text-gray-400' : ''}`}>
                          Available Online
                        </Label>
                        <p className="text-xs text-gray-500">Members can purchase online</p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <MembershipFormField label="Features & Benefits" id="mship-features">
                    <Textarea
                      id="mship-features"
                      name="features"
                      value={formData.features}
                      onChange={handleInputChange}
                      placeholder="e.g., Gym Access, Group Classes, Personal Training"
                      rows={3}
                      disabled={isLoading}
                      className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </MembershipFormField>

                  {/* Additional Charges */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900">Additional Charges</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newCharge = { id: Date.now(), description: '', fee: 0 };
                          const updatedCharges = [...(formData.additional_charges || []), newCharge];
                          handleInputChange({ target: { name: 'additional_charges', value: updatedCharges } });
                        }}
                        disabled={isLoading}
                        className="text-sm"
                      >
                        <Gift className="h-4 w-4 mr-1" />
                        Add Charge
                      </Button>
                    </div>

                    {formData.additional_charges && formData.additional_charges.length > 0 ? (
                      <div className="space-y-3">
                        {formData.additional_charges.map((charge, index) => (
                          <div key={charge.id || index} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                              <div className="md:col-span-2">
                                <Label className="text-sm font-medium">Description</Label>
                                <Input
                                  value={charge.description || ''}
                                  onChange={(e) => {
                                    const updatedCharges = [...formData.additional_charges];
                                    updatedCharges[index] = { ...charge, description: e.target.value };
                                    handleInputChange({ target: { name: 'additional_charges', value: updatedCharges } });
                                  }}
                                  placeholder="e.g., Member Card, Swim Cap"
                                  disabled={isLoading}
                                  className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-10 mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Fee ($)</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={charge.fee || ''}
                                    onChange={(e) => {
                                      const updatedCharges = [...formData.additional_charges];
                                      updatedCharges[index] = { ...charge, fee: parseFloat(e.target.value) || 0 };
                                      handleInputChange({ target: { name: 'additional_charges', value: updatedCharges } });
                                    }}
                                    placeholder="0.00"
                                    disabled={isLoading}
                                    className="border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-10"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const updatedCharges = formData.additional_charges.filter((_, i) => i !== index);
                                      handleInputChange({ target: { name: 'additional_charges', value: updatedCharges } });
                                    }}
                                    disabled={isLoading}
                                    className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                        <Gift className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No additional charges configured</p>
                        <p className="text-xs text-gray-400 mt-1">Add one-time fees that apply when this membership is sold</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-8 border-t border-gray-100 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-8 py-2.5 border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {membershipData ? 'Save Changes' : 'Create Plan'}
                </Button>
              </div>
            </form>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default MembershipFormDialog;



