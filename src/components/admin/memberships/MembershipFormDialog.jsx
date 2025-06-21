
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Shield, Users, Briefcase, Gift, UserCheck, Settings, Calendar, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient';
import BillingSchedulePreview from './BillingSchedulePreview';

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
  const [loadingRoles, setLoadingRoles] = useState(false);

  const initialFormState = useMemo(() => ({
    id: '',
    name: '',
    category: 'Member Plans',
    billing_type: 'Recurring',
    price: '',
    features: '',
    color: '#3B82F6',
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
    role_id: ''
  }), []);

  const [formData, setFormData] = useState(initialFormState);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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
          console.error('Error fetching staff roles:', error);
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
          role_id: membershipData.role_id || ''
        });
        setIsNewCategory(false);
        setNewCategoryName('');
      } else {
        // For new memberships, use the pre-populated category if provided
        const newFormData = { ...initialFormState };
        if (membershipData && membershipData.category) {
          newFormData.category = membershipData.category;
        }
        setFormData(newFormData);
        setIsNewCategory(false);
        setNewCategoryName('');
      }
    }
  }, [membershipData, isOpen, initialFormState]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  }, []);
  
  const handleSelectChange = useCallback((name, value) => {
    if (name === 'category' && value === '__new__') {
      setIsNewCategory(true);
      setFormData(prev => ({ ...prev, category: '' }));
    } else {
      setIsNewCategory(false);
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleSubmitForm = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);

    let finalCategory = formData.category;
    if (isNewCategory && newCategoryName.trim()) {
      finalCategory = newCategoryName.trim();
    } else if (isNewCategory && !newCategoryName.trim()) {
      toast({ title: "Validation Error", description: "New category name cannot be empty.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    if (!formData.name.trim()) {
        toast({ title: "Validation Error", description: "Membership name is required.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    if (formData.billing_type !== 'N/A' && (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0)) {
        toast({ title: "Validation Error", description: "Price must be a valid non-negative number for this billing type.", variant: "destructive" });
        setIsLoading(false);
        return;
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
        category: finalCategory,
        color: formData.color,
        person_capacity: parseInt(formData.person_capacity) || 1,
        max_family_members: parseInt(formData.max_family_members) || 1,
        is_addon: formData.is_addon || false,
        addon_billing_cycle: formData.addon_billing_cycle || 'monthly',
        requires_primary_membership: formData.requires_primary_membership || false,
        role_id: (finalCategory === 'Staff Plans' || finalCategory === 'Staff') ? formData.role_id || null : null
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
  }, [formData, isNewCategory, newCategoryName, membershipData, onSave, toast]);

  const allCategories = useMemo(() => {
    const defaultCategories = ['Member Plans', 'Staff Plans', 'Add-ons', 'Guest Plans'];
    const combined = new Set([...defaultCategories, ...existingCategories]);
    return Array.from(combined);
  }, [existingCategories]);

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Member Plans': return <Users className="h-5 w-5 text-blue-600" />;
      case 'Staff Plans': case 'Staff': return <Shield className="h-5 w-5 text-purple-600" />;
      case 'Add-ons': return <Gift className="h-5 w-5 text-green-600" />;
      case 'Guest Plans': return <UserCheck className="h-5 w-5 text-orange-600" />;
      default: return <Briefcase className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="border-b border-gray-200 pb-4">
            <div className="flex items-center space-x-3">
              {getCategoryIcon(formData.category)}
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {membershipData && membershipData.id
                    ? 'Edit Membership Plan'
                    : `Create New ${formData.category.replace(' Plans', '')} Plan`
                  }
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  {membershipData && membershipData.id
                    ? 'Update the details of this membership plan.'
                    : `Configure a new ${formData.category.toLowerCase().replace(' plans', '')} plan with all necessary settings.`
                  }
                </DialogDescription>
              </div>
            </div>

            {/* Category Badge */}
            <div className="flex items-center space-x-2 mt-3">
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border-indigo-200"
              >
                {formData.category}
              </Badge>
              {formData.category === 'Staff Plans' && (
                <Badge variant="outline" className="text-purple-600 border-purple-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Permissions Required
                </Badge>
              )}
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Plan Details
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Billing Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="overflow-y-auto max-h-[60vh] px-1">
            <form onSubmit={handleSubmitForm} className="space-y-8">

              {/* Basic Information Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <MembershipFormField label="Plan Name *" id="mship-name">
                    <Input
                      id="mship-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Premium Membership"
                      required
                      disabled={isLoading}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </MembershipFormField>

                  <MembershipFormField label="Category" id="mship-category">
                    <Select name="category" value={isNewCategory ? '__new__' : formData.category} onValueChange={(value) => handleSelectChange('category', value)} disabled={isLoading}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-400">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Member Plans">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-blue-600" />
                            Member Plans
                          </div>
                        </SelectItem>
                        <SelectItem value="Staff Plans">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-purple-600" />
                            Staff Plans
                          </div>
                        </SelectItem>
                        <SelectItem value="Add-ons">
                          <div className="flex items-center">
                            <Gift className="h-4 w-4 mr-2 text-green-600" />
                            Add-ons
                          </div>
                        </SelectItem>
                        <SelectItem value="Guest Plans">
                          <div className="flex items-center">
                            <UserCheck className="h-4 w-4 mr-2 text-orange-600" />
                            Guest Plans
                          </div>
                        </SelectItem>
                        {allCategories.filter(cat => !['Member Plans', 'Staff Plans', 'Add-ons', 'Guest Plans'].includes(cat)).map(cat =>
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        )}
                        <SelectItem value="__new__">Create New Category...</SelectItem>
                      </SelectContent>
                    </Select>
                  </MembershipFormField>

                  {/* Staff Role Selection - Only for Staff Plans */}
                  {(formData.category === 'Staff Plans' || formData.category === 'Staff') && (
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
                  {isNewCategory && (
                    <MembershipFormField label="New Category Name *" id="mship-new-category">
                      <Input
                        id="mship-new-category"
                        name="newCategoryName"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter category name"
                        disabled={isLoading}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </MembershipFormField>
                  )}

                  <MembershipFormField label="Badge Color" id="mship-color">
                    <div className="flex items-center space-x-2">
                      <Input
                        id="mship-color"
                        name="color"
                        type="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        className="h-10 w-16 border-blue-200 focus:border-blue-400"
                        disabled={isLoading}
                      />
                      <div
                        className="h-10 px-3 rounded-md border border-blue-200 flex items-center text-sm font-medium"
                        style={{ backgroundColor: formData.color, color: '#fff' }}
                      >
                        Preview
                      </div>
                    </div>
                  </MembershipFormField>
                </div>
              </motion.div>

              {/* Billing Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-green-600" />
                  Billing & Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <MembershipFormField label="Billing Type" id="mship-billing_type">
                    <Select name="billing_type" value={formData.billing_type} onValueChange={(value) => handleSelectChange('billing_type', value)} disabled={isLoading}>
                      <SelectTrigger className="border-green-200 focus:border-green-400">
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
                    <MembershipFormField label="Membership Fee ($) *" id="mship-price">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          id="mship-price"
                          name="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={handleInputChange}
                          required={formData.billing_type !== 'N/A'}
                          disabled={isLoading}
                          className="pl-8 border-green-200 focus:border-green-400"
                          placeholder="0.00"
                        />
                      </div>
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
              </motion.div>

          <h3 className="md:col-span-3 font-semibold text-base mt-6 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">Restrictions & Availability</h3>
          <div className="md:col-span-3 space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mship-available_for_sale"
                name="available_for_sale"
                checked={formData.available_for_sale}
                onCheckedChange={(checked) => {
                  handleInputChange({ target: { name: 'available_for_sale', checked, type: 'checkbox' } });
                  // If disabling for sale, also disable online
                  if (!checked) {
                    handleInputChange({ target: { name: 'available_online', checked: false, type: 'checkbox' } });
                  }
                }}
                disabled={isLoading}
              />
              <Label htmlFor="mship-available_for_sale" className="text-sm font-medium">
                Available for Sale
              </Label>
              <span className="text-xs text-muted-foreground ml-2">
                Staff can sell this membership type
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mship-available_online"
                name="available_online"
                checked={formData.available_online}
                onCheckedChange={(checked) => handleInputChange({ target: { name: 'available_online', checked, type: 'checkbox' } })}
                disabled={isLoading || !formData.available_for_sale}
              />
              <Label htmlFor="mship-available_online" className={`text-sm font-medium ${!formData.available_for_sale ? 'text-muted-foreground' : ''}`}>
                Available Online
              </Label>
              <span className="text-xs text-muted-foreground ml-2">
                Members can purchase this online {!formData.available_for_sale ? '(requires "Available for Sale")' : ''}
              </span>
            </div>
          </div>
          
          <h3 className="md:col-span-3 font-semibold text-base mt-6 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">Membership Capacity & Type</h3>

          <div className="md:col-span-3 space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mship-is_addon"
                name="is_addon"
                checked={formData.is_addon}
                onCheckedChange={(checked) => {
                  handleInputChange({ target: { name: 'is_addon', checked, type: 'checkbox' } });
                  // If making it an add-on, set requires_primary_membership to true
                  if (checked) {
                    handleInputChange({ target: { name: 'requires_primary_membership', checked: true, type: 'checkbox' } });
                    handleInputChange({ target: { name: 'person_capacity', value: 1, type: 'number' } });
                    handleInputChange({ target: { name: 'max_family_members', value: 1, type: 'number' } });
                  }
                }}
                disabled={isLoading}
              />
              <Label htmlFor="mship-is_addon" className="text-sm font-medium">
                This is an Add-on Service
              </Label>
              <span className="text-xs text-muted-foreground ml-2">
                Add-on services require a primary membership
              </span>
            </div>

            {formData.is_addon && (
              <div className="flex items-center space-x-2 ml-6">
                <Checkbox
                  id="mship-requires_primary_membership"
                  name="requires_primary_membership"
                  checked={formData.requires_primary_membership}
                  onCheckedChange={(checked) => handleInputChange({ target: { name: 'requires_primary_membership', checked, type: 'checkbox' } })}
                  disabled={isLoading}
                />
                <Label htmlFor="mship-requires_primary_membership" className="text-sm font-medium">
                  Requires Primary Membership
                </Label>
              </div>
            )}
          </div>

          {!formData.is_addon && (
            <>
              <MembershipFormField label="Person Capacity" id="mship-person_capacity">
                <Select
                  name="person_capacity"
                  value={String(formData.person_capacity)}
                  onValueChange={(value) => {
                    const numValue = parseInt(value);
                    handleSelectChange('person_capacity', numValue);
                    // Update max_family_members to match person_capacity
                    handleSelectChange('max_family_members', numValue);
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Individual (1 person)</SelectItem>
                    <SelectItem value="2">Couple (2 people)</SelectItem>
                    <SelectItem value="3">Small Family (3 people)</SelectItem>
                    <SelectItem value="4">Family (4 people)</SelectItem>
                    <SelectItem value="5">Large Family (5 people)</SelectItem>
                    <SelectItem value="6">Extended Family (6 people)</SelectItem>
                  </SelectContent>
                </Select>
              </MembershipFormField>

              <MembershipFormField label="Max Family Members" id="mship-max_family_members">
                <Input
                  id="mship-max_family_members"
                  name="max_family_members"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.max_family_members}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </MembershipFormField>
            </>
          )}

          {formData.is_addon && (
            <MembershipFormField label="Add-on Billing Cycle" id="mship-addon_billing_cycle">
              <Select
                name="addon_billing_cycle"
                value={formData.addon_billing_cycle}
                onValueChange={(value) => handleSelectChange('addon_billing_cycle', value)}
                disabled={isLoading}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </MembershipFormField>
          )}

          <h3 className="md:col-span-3 font-semibold text-base mt-6 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">Other Information</h3>
          <MembershipFormField label="Features (comma-separated)" id="mship-features" className="md:col-span-3">
            <Textarea id="mship-features" name="features" value={formData.features} onChange={handleInputChange} placeholder="e.g., Gym Access, Group Classes" rows={2} disabled={isLoading}/>
          </MembershipFormField>
          
              {/* Quick Settings for remaining fields */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-purple-600" />
                  Settings & Features
                </h3>

                <div className="space-y-4">
                  {/* Availability Checkboxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-purple-200">
                      <Checkbox
                        id="mship-available_for_sale"
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
                        <Label htmlFor="mship-available_for_sale" className="font-medium">Available for Sale</Label>
                        <p className="text-xs text-gray-500">Staff can sell this plan</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-purple-200">
                      <Checkbox
                        id="mship-available_online"
                        name="available_online"
                        checked={formData.available_online}
                        onCheckedChange={(checked) => handleInputChange({ target: { name: 'available_online', checked, type: 'checkbox' } })}
                        disabled={isLoading || !formData.available_for_sale}
                      />
                      <div>
                        <Label htmlFor="mship-available_online" className={`font-medium ${!formData.available_for_sale ? 'text-gray-400' : ''}`}>
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
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </MembershipFormField>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-end space-x-3 pt-6 border-t border-gray-200"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {membershipData ? 'Save Changes' : 'Create Plan'}
                </Button>
              </motion.div>
            </form>
            </TabsContent>

            <TabsContent value="billing" className="overflow-y-auto max-h-[60vh] px-1">
              <BillingSchedulePreview
                membershipData={formData}
                onUpdate={(updatedData) => {
                  // Handle any updates from the billing preview if needed
                  console.log('Billing preview update:', updatedData);
                }}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default MembershipFormDialog;


