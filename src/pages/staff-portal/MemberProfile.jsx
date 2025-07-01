import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Shield, Edit3, Save, CreditCard, CalendarCheck, AlertTriangle, LifeBuoy, Image as ImageIcon,
  Fingerprint, Settings, Settings as SettingsIcon, MessageSquare, CalendarDays, FileText, Users, LogOut, MoreVertical,
  PauseCircle, XCircle, Repeat, Trash2, Briefcase, Home, DollarSign, CheckSquare, Info, PlusCircle, ChevronDown, ChevronUp, UserCog, UserX, UserCheck, Star, Clock, X, KeySquare, ClipboardList, Send, FolderOpen, History, Link, Bell, Calendar, Camera
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient';
import { dataService } from '@/services/apiService';
import { MemberProfileService } from '@/services/memberProfileService';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format, isValid, formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import AssignMembershipDialog from '@/components/admin/members/AssignMembershipDialog';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import FamilyManagementDialog from '@/components/staff/FamilyManagementDialog';
import MemberQuickStats from '@/components/member-profile/MemberQuickStats';
import MemberActivityTimeline from '@/components/member-profile/MemberActivityTimeline';
import MemberNotesLog from '@/components/member-profile/MemberNotesLog';
import FamilySection from '@/components/staff/FamilySection';
import MembershipSignupWizard from '@/components/staff/MembershipSignupWizard';

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return "?";
  const names = name.trim().split(' ');
  if (names.length === 0 || names[0] === "") return "?";
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
};


const statusVariant = (status) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'draft': return 'warning';
    case 'inactive':
    case 'suspended':
    case 'cancelled':
    case 'expired': return 'destructive';
    default: return 'secondary';
  }
};

const DraftProfileBanner = ({ memberData, onActivate }) => {
  const completionStatus = MemberProfileService.getProfileCompletionStatus(memberData);

  if (memberData?.status !== 'draft') return null;

  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Draft Profile - Incomplete
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                This is a new member profile that needs to be completed.
                Profile completion: {completionStatus.completionPercentage}%
              </p>
              {completionStatus.missingFields.length > 0 && (
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Missing required fields: {completionStatus.missingFields.join(', ')}
                </p>
              )}
            </div>
          </div>
          {completionStatus.isComplete && (
            <Button
              onClick={onActivate}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Activate Profile
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ProfileSectionCard = ({
  title,
  icon: Icon,
  children,
  actions,
  description,
  className,
  isLoading = false,
  sectionId,
  isEditing = false,
  onEdit,
  onSave,
  onCancel
}) => (
  <Card className={cn(
    "group relative overflow-hidden rounded-lg border transition-all duration-300",
    "border-gray-200 bg-gray-50 shadow-sm hover:shadow-md hover:border-gray-300 hover:bg-gray-100/50",
    className
  )}>
    <CardHeader className="relative z-10 pb-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-3 text-foreground">
            {Icon && (
              <div className={cn(
                "flex-shrink-0 p-2 rounded-lg transition-colors",
                isEditing 
                  ? "bg-primary/20 text-primary" 
                  : "bg-primary/10 text-primary group-hover:bg-primary/20"
              )}>
                <Icon className="h-4 w-4" />
              </div>
            )}
            <span>{title}</span>
          </CardTitle>
          {description && (
            <CardDescription className="text-sm leading-relaxed max-w-md">
              {description}
            </CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions && (
            <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
              {actions}
            </div>
          )}
          {sectionId && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSave}
                    className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    className="h-8 px-3 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="h-8 px-3 text-primary hover:text-primary/80 hover:bg-primary/10 opacity-60 group-hover:opacity-100 transition-all"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent className="relative z-10 pt-0">
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
              <div className="h-5 bg-muted rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        children
      )}
    </CardContent>
  </Card>
);

const InfoRow = ({ label, value, icon: Icon, children, className = "", isRequired = false, isEmpty = false }) => (
  <div className={cn("group relative p-2 rounded-lg border border-border/40 bg-card/40 hover:bg-card/60 hover:border-border/60 transition-all duration-200", className)}>
    <div className="flex items-start gap-2">
      {Icon && (
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="h-3 w-3 text-primary/70 group-hover:text-primary transition-colors" />
        </div>
      )}
      <div className="flex-grow min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          {isRequired && (
            <span className="text-xs text-destructive">*</span>
          )}
          {isEmpty && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-auto">
              Missing
            </Badge>
          )}
        </div>
        {children || (
          <p className={cn(
            "font-medium text-sm leading-relaxed",
            isEmpty ? "text-muted-foreground italic" : "text-foreground"
          )}>
            {value || 'Not provided'}
          </p>
        )}
      </div>
    </div>
  </div>
);

const EditableInfoRow = ({ 
  label, 
  value, 
  icon: Icon, 
  children, 
  className = "", 
  isRequired = false, 
  isEmpty = false,
  isEditing = false,
  field,
  type = "text",
  editValue,
  onInputChange,
  placeholder,
  options = [], // For select inputs
  useAddressAutocomplete = false, // New prop for address autocomplete
  onAddressSelect // New prop for address selection callback
}) => (
  <div className={cn("group relative p-2 rounded-lg border transition-all duration-300",
    isEditing
      ? "border-blue-300 bg-blue-50/50 shadow-md ring-2 ring-blue-100 transform scale-[1.01]"
      : "border-border/40 bg-card/40 hover:bg-card/60 hover:border-border/60 hover:shadow-sm",
    className
  )}>
    <div className="flex items-start gap-2">
      {Icon && (
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={cn("h-3 w-3 transition-colors",
            isEditing ? "text-primary" : "text-primary/70 group-hover:text-primary"
          )} />
        </div>
      )}
      <div className="flex-grow min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          {isRequired && (
            <span className="text-xs text-destructive">*</span>
          )}
          {isEmpty && !isEditing && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-auto">
              Missing
            </Badge>
          )}
        </div>        {isEditing ? (
          options.length > 0 ? (
            <select
              value={editValue || ''}
              onChange={(e) => onInputChange(field, e.target.value)}
              className="w-full text-sm h-10 px-3 border-2 border-blue-200 bg-white rounded-lg focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm font-medium"
            >
              <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
              {options.map((option) => (
                <option key={option.value || option} value={option.value || option}>
                  {option.label || option}
                </option>
              ))}
            </select>
          ) : type === 'checkbox' ? (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editValue === 'true' || editValue === true}
                onChange={(e) => onInputChange(field, e.target.checked.toString())}
                className="rounded border-border/60 text-primary focus:ring-primary/20"
              />
              <span className="text-sm text-muted-foreground">
                {placeholder || `Check to enable ${label.toLowerCase()}`}
              </span>
            </div>
          ) : type === 'textarea' ? (
            <Textarea
              value={editValue || ''}
              onChange={(e) => onInputChange(field, e.target.value)}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              className="text-sm border-2 border-blue-200 bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm min-h-[80px] font-medium rounded-lg"
              rows={3}
            />
          ) : useAddressAutocomplete ? (
            <AddressAutocomplete
              value={editValue || ''}
              onChange={(value) => onInputChange(field, value)}
              onAddressSelect={onAddressSelect}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              className="text-sm h-10 border-2 border-blue-200 bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm font-medium rounded-lg"
            />
          ) : (
            <Input
              type={type}
              value={editValue || ''}
              onChange={(e) => onInputChange(field, e.target.value)}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              className="text-sm h-10 border-2 border-blue-200 bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm font-medium rounded-lg"
            />
          )
        ) : (
          children || (
            type === 'checkbox' ? (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={value === 'true' || value === true}
                  disabled
                  className="rounded border-border/60"
                />
                <span className={cn(
                  "text-sm",
                  isEmpty ? "text-muted-foreground italic" : "text-foreground"
                )}>
                  {value === 'true' || value === true ? 'Yes' : 'No'}
                </span>
              </div>
            ) : type === 'textarea' ? (
              <div className={cn(
                "text-sm leading-relaxed whitespace-pre-wrap",
                isEmpty ? "text-muted-foreground italic" : "text-foreground"
              )}>
                {value || 'Not provided'}
              </div>
            ) : (
              <p className={cn(
                "font-medium text-sm leading-relaxed",
                isEmpty ? "text-muted-foreground italic" : "text-foreground"
              )}>
                {value || 'Not provided'}
              </p>
            )
          )
        )}
      </div>
    </div>
  </div>
);

const EditProfileModal = ({ isOpen, onClose, memberData, onSave }) => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (memberData) {
      setFormData({
        ...memberData,
        dob: memberData.dob && isValid(new Date(memberData.dob)) ? format(new Date(memberData.dob), 'yyyy-MM-dd') : '',
        join_date: memberData.join_date && isValid(new Date(memberData.join_date)) ? format(new Date(memberData.join_date), 'yyyy-MM-dd') : '',
      });
      setErrors({});
    }
  }, [memberData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !memberData) return null;

  const FormField = ({ label, name, type = "text", required = false, children, ...props }) => (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children || (
        <Input
          id={name}
          name={name}
          type={type}
          value={formData?.[name] || ''}
          onChange={handleChange}
          className={cn(
            "transition-colors",
            errors[name] && "border-destructive focus-visible:ring-destructive"
          )}
          {...props}
        />
      )}
      {errors[name] && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Edit Member Profile
          </DialogTitle>
          <DialogDescription>
            Update {memberData.first_name || 'member'}'s personal information and contact details.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] pr-2">
          <div className="space-y-6 py-4">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Personal Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="First Name" name="first_name" required />
                <FormField label="Last Name" name="last_name" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Date of Birth" name="dob" type="date" />
                <FormField label="Gender" name="gender">
                  <select
                    id="gender"
                    name="gender"
                    value={formData?.gender || ''}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </FormField>
              </div>
              <FormField label="Join Date" name="join_date" type="date" />

              {/* Contact Information - merged into Personal Information */}
              <FormField label="Email Address" name="email" type="email" required />
              <FormField label="Phone Number" name="phone" type="tel" />
              <FormField label="Street Address" name="address" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <FormField label="City" name="city" />
                <FormField label="State" name="state">
                  <select
                    id="state"
                    name="state"
                    value={formData?.state || ''}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select state</option>
                    <option value="AL">Alabama</option>
                    <option value="AK">Alaska</option>
                    <option value="AZ">Arizona</option>
                    <option value="AR">Arkansas</option>
                    <option value="CA">California</option>
                    <option value="CO">Colorado</option>
                    <option value="CT">Connecticut</option>
                    <option value="DE">Delaware</option>
                    <option value="FL">Florida</option>
                    <option value="GA">Georgia</option>
                    {/* Add more states as needed */}
                  </select>
                </FormField>
                <FormField label="ZIP Code" name="zip_code" />
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Emergency Contact
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Emergency Contact Name" name="emergency_contact_name" />
                <FormField label="Relationship" name="emergency_contact_relationship" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Emergency Contact Phone" name="emergency_contact_phone" type="tel" />
                <FormField label="Emergency Contact Email" name="emergency_contact_email" type="email" />
              </div>
            </div>

            {/* Account Status Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Account Status
              </h4>
              <FormField label="Member Status" name="status">
                <select
                  id="status"
                  name="status"
                  value={formData?.status || ''}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </FormField>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const BillingHistorySection = ({ memberId }) => {
  const { toast } = useToast();
  const [billingHistory, setBillingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, payments, transactions

  useEffect(() => {
    fetchBillingHistory();
  }, [memberId]);

  const fetchBillingHistory = async () => {
    try {
      setIsLoading(true);

      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (paymentsError && paymentsError.code !== 'PGRST116') {
        console.error('Payments error:', paymentsError);
      }

      // Fetch transactions (POS purchases)
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', memberId)
        .order('created_at', { ascending: false });

      if (transactionsError && transactionsError.code !== 'PGRST116') {
        console.error('Transactions error:', transactionsError);
      }

      // Combine and sort by date
      const combined = [
        ...(payments || []).map(p => ({ ...p, type: 'payment' })),
        ...(transactions || []).map(t => ({ ...t, type: 'transaction' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setBillingHistory(combined);
    } catch (error) {
      console.error('Error fetching billing history:', error);
      toast({
        title: "Error",
        description: "Failed to load billing history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status, type) => {
    if (type === 'payment') {
      switch (status) {
        case 'succeeded':
          return <Badge variant="success">Paid</Badge>;
        case 'pending':
          return <Badge variant="warning">Pending</Badge>;
        case 'failed':
          return <Badge variant="destructive">Failed</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    } else {
      switch (status) {
        case 'completed':
          return <Badge variant="success">Completed</Badge>;
        case 'pending':
          return <Badge variant="warning">Pending</Badge>;
        case 'cancelled':
          return <Badge variant="destructive">Cancelled</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    }
  };

  const getAmount = (item) => {
    if (item.type === 'payment') {
      return (item.amount / 100).toFixed(2); // Stripe amounts are in cents
    } else {
      return item.total_amount?.toFixed(2) || '0.00';
    }
  };

  const filteredHistory = billingHistory.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'payments') return item.type === 'payment';
    if (filter === 'transactions') return item.type === 'transaction';
    return true;
  });

  if (isLoading) {
    return (
      <ProfileSectionCard
        title="Billing History"
        icon={History}
        description="Payment history and transaction records"

      >
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ProfileSectionCard>
    );
  }

  return (
    <ProfileSectionCard
      title="Billing History"
      icon={History}
      description="Payment history and transaction records"

    >
      <div className="space-y-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({billingHistory.length})
          </Button>
          <Button
            variant={filter === 'payments' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('payments')}
          >
            Payments ({billingHistory.filter(i => i.type === 'payment').length})
          </Button>
          <Button
            variant={filter === 'transactions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('transactions')}
          >
            Purchases ({billingHistory.filter(i => i.type === 'transaction').length})
          </Button>
        </div>

        {/* Billing History Table */}
        {filteredHistory.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item) => (
                  <TableRow key={`${item.type}-${item.id}`}>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(item.created_at), 'MMM d, yyyy')}
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), 'h:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {item.type === 'payment' ? 'Payment' : 'Purchase'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.description ||
                         (item.type === 'transaction' ? `Transaction #${item.transaction_number}` : 'Membership Payment')}
                        {item.type === 'transaction' && item.items && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {Array.isArray(item.items)
                              ? item.items.map(i => i.name).join(', ')
                              : JSON.parse(item.items).map(i => i.name).join(', ')
                            }
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        ${getAmount(item)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status, item.type)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.type === 'payment'
                          ? item.payment_method_details?.type || 'Card'
                          : item.payment_method || 'Cash'
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No billing history found</p>
            <p className="text-sm mt-1">
              {filter === 'all'
                ? 'This member has no payment or transaction history'
                : `No ${filter} found for this member`
              }
            </p>
          </div>
        )}
      </div>
    </ProfileSectionCard>
  );
};

const StaffNotesSection = ({ memberId, staffId }) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState(null); 
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const notesToShow = 3;

  const fetchNotes = useCallback(async () => {
    if (!memberId) return;
    setIsLoadingNotes(true);
    try {
      // TODO: Implement staff notes functionality
      // const staffNotes = await dataService.getStaffMemberNotes(memberId);
      setNotes([]);
    } catch (error) {
      toast({ title: "Error", description: "Could not load staff notes.", variant: "destructive" });
    } finally {
      setIsLoadingNotes(false);
    }
  }, [memberId, toast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSaveNote = async () => {
    if (!newNoteContent.trim()) {
      toast({ title: "Empty Note", description: "Please write something before saving.", variant: "destructive" });
      return;
    }
    try {
      // TODO: Implement staff notes functionality
      // if (editingNote) {
      //   await dataService.updateStaffMemberNote(editingNote.id, newNoteContent);
      //   toast({ title: "Note Updated", description: "Staff note has been successfully updated." });
      // } else {
      //   await dataService.addStaffMemberNote(memberId, staffId, newNoteContent);
      //   toast({ title: "Note Saved", description: "Staff note has been successfully saved." });
      // }
      toast({ title: "Feature Coming Soon", description: "Staff notes functionality will be available soon.", variant: "info" });
      setNewNoteContent('');
      setEditingNote(null);
      fetchNotes();
    } catch (error) {
      toast({ title: "Error Saving Note", description: error.message, variant: "destructive" });
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNewNoteContent(note.content);
  };

  const handleDeleteNote = async (noteId) => {
    try {
      // TODO: Implement staff notes functionality
      // await dataService.deleteStaffMemberNote(noteId);
      toast({ title: "Feature Coming Soon", description: "Staff notes functionality will be available soon.", variant: "info" });
      fetchNotes();
    } catch (error) {
      toast({ title: "Error Deleting Note", description: error.message, variant: "destructive" });
    }
  };
  
  const displayedNotes = showAllNotes ? notes : notes.slice(0, notesToShow);

  return (
    <ProfileSectionCard title="Staff Notes" icon={MessageSquare} description="Internal notes about this member." className="col-span-1 md:col-span-2">
      <div className="space-y-4">
        <div>
          <Label htmlFor="newStaffNote" className="sr-only">New Staff Note</Label>
          <Textarea
            id="newStaffNote"
            placeholder="Type staff note here..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            rows={3}
            className="mb-2"
            aria-label="New staff note"
          />
          <div className="flex justify-between items-center">
            <Button onClick={handleSaveNote} size="sm">
              <Save className="mr-2 h-4 w-4" /> {editingNote ? 'Update Note' : 'Save Note'}
            </Button>
            {editingNote && (
              <Button variant="outline" size="sm" onClick={() => { setEditingNote(null); setNewNoteContent(''); }}>
                Cancel Edit
              </Button>
            )}
          </div>
        </div>
        {isLoadingNotes && (
          <div className="flex items-center justify-center p-4">
            <LoadingSpinner className="mr-2" />
            <span className="text-gray-600">Loading notes...</span>
          </div>
        )}
        {!isLoadingNotes && notes.length === 0 && (
          <p className="text-muted-foreground text-center py-4">No staff notes for this member yet.</p>
        )}
        {!isLoadingNotes && notes.length > 0 && (
          <div className="space-y-3">
            {displayedNotes.map(note => (
              <div key={note.id} className="p-3 border rounded-md bg-slate-50 dark:bg-slate-800/50 relative group">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  By: {note.staff?.name || 'Unknown Staff'} on {format(new Date(note.created_at), 'PPp')}
                  {note.updated_at && new Date(note.updated_at).getTime() !== new Date(note.created_at).getTime() && (
                    <em> (edited {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })})</em>
                  )}
                </p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditNote(note)}>
                        <Edit3 className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteNote(note.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {notes.length > notesToShow && (
              <Button variant="link" onClick={() => setShowAllNotes(!showAllNotes)} className="text-sm p-0 h-auto">
                {showAllNotes ? (
                  <> <ChevronUp className="mr-1 h-4 w-4" /> Show Less Notes </>
                ) : (
                  <> <ChevronDown className="mr-1 h-4 w-4" /> Show All {notes.length} Notes </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </ProfileSectionCard>
  );
};


// Inline Edit Field Component
const InlineEditField = ({
  label,
  value,
  fieldName,
  type = "text",
  icon: Icon,
  isRequired = false,
  placeholder = "",
  options = null,
  onChange,
  className = "",
  tabIndex = 0
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = React.useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Auto-focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'email' || type === 'tel') {
        inputRef.current.select(); // Select all text for easy replacement
      }
    }
  }, [isEditing, type]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Immediately update the global state to trigger unsaved changes detection
    onChange(fieldName, newValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setLocalValue(value || '');
      setIsEditing(false);
    } else if (e.key === 'Tab') {
      // Let tab work naturally to move to next field
      setIsEditing(false);
    }
  };

  return (
    <div className={`flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 ${className}`}>
      <div className="flex items-center w-full">
        {/* Label Column - Fixed Width */}
        <div className="w-32 flex-shrink-0">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {label}
            {isRequired && <span className="text-red-500">*</span>}
          </Label>
        </div>

        {/* Value/Input Column - Flexible Width */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div>
              {options ? (
                <Select value={localValue} onValueChange={(newValue) => {
                  setLocalValue(newValue);
                  onChange(fieldName, newValue);
                  setIsEditing(false);
                }}>
                  <SelectTrigger className="w-64 h-9">
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : type === 'textarea' ? (
                <Textarea
                  ref={inputRef}
                  value={localValue}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setIsEditing(false)}
                  placeholder={placeholder}
                  className="w-64 min-h-[80px]"
                  rows={3}
                />
              ) : (
                <Input
                  ref={inputRef}
                  type={type}
                  value={localValue}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setIsEditing(false)}
                  placeholder={placeholder}
                  className="w-64 h-9"
                  tabIndex={tabIndex}
                />
              )}
            </div>
          ) : (
            <div
              className="py-1 cursor-pointer hover:bg-gray-50 transition-colors flex items-center rounded px-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50"
              onClick={() => setIsEditing(true)}
              onFocus={() => setIsEditing(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsEditing(true);
                }
              }}
              tabIndex={tabIndex}
              role="button"
              aria-label={`Edit ${label}`}
            >
              {value ? (
                <span className="text-sm text-gray-900">{value}</span>
              ) : (
                <span className="text-sm text-gray-400 italic">{placeholder || `Enter ${label.toLowerCase()}`}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Address field component that breaks down full address into components when editing
const AddressField = ({ label, fullAddress, streetAddress, city, state, zipCode, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValues, setLocalValues] = useState({
    streetAddress: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // Parse full address when starting to edit
  const parseAddress = (address) => {
    if (!address) return { streetAddress: '', city: '', state: '', zipCode: '' };

    // Simple address parsing - split by commas and try to identify components
    const parts = address.split(',').map(part => part.trim());

    if (parts.length >= 4) {
      return {
        streetAddress: parts[0],
        city: parts[1],
        state: parts[2],
        zipCode: parts[3]
      };
    } else if (parts.length === 3) {
      return {
        streetAddress: parts[0],
        city: parts[1],
        state: '',
        zipCode: parts[2]
      };
    } else if (parts.length === 2) {
      return {
        streetAddress: parts[0],
        city: parts[1],
        state: '',
        zipCode: ''
      };
    } else {
      return {
        streetAddress: address,
        city: '',
        state: '',
        zipCode: ''
      };
    }
  };

  const handleStartEdit = () => {
    const parsed = parseAddress(fullAddress);
    setLocalValues({
      streetAddress: streetAddress || parsed.streetAddress,
      city: city || parsed.city,
      state: state || parsed.state,
      zipCode: zipCode || parsed.zipCode
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    onChange(localValues);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center w-full">
        {/* Label Column - Fixed Width */}
        <div className="w-32 flex-shrink-0">
          <Label className="text-sm font-medium text-gray-700">{label}</Label>
        </div>

        {/* Value/Input Column - Flexible Width */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              {/* DEV NOTE: Address autocomplete is not live yet - currently using manual input */}
              <div className="relative">
                <AddressAutocomplete
                  value={fullAddress || ''}
                  onChange={(value) => {
                    // Update the full address directly - pass as string
                    onChange(value);
                  }}
                  onAddressSelect={(addressComponents) => {
                    // Handle address selection from autocomplete
                    const fullAddr = [
                      addressComponents.street_number,
                      addressComponents.route,
                      addressComponents.locality,
                      addressComponents.administrative_area_level_1,
                      addressComponents.postal_code
                    ].filter(Boolean).join(' ');

                    // Pass the full address as a string
                    onChange(fullAddr);
                    setIsEditing(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditing(false);
                    } else if (e.key === 'Escape') {
                      setIsEditing(false);
                    }
                  }}
                  onBlur={() => setIsEditing(false)}
                  placeholder="Search Address"
                  className="w-64 h-9"
                  autoFocus
                />
                {/* Dev reminder badge */}
                <div className="absolute -top-2 -right-2 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs px-2 py-1 rounded-full shadow-sm">
                  Dev: Not Live
                </div>
              </div>
            </div>
          ) : (
            <div
              className="py-1 cursor-pointer hover:bg-gray-50 transition-colors flex items-center rounded px-2 w-64"
              onClick={handleStartEdit}
            >
              {fullAddress ? (
                <span className="text-sm text-gray-900 py-1">{fullAddress}</span>
              ) : (
                <span className="text-sm text-gray-400 italic py-1">Search Address</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Custom Field Inline Edit Component
const CustomFieldInlineEdit = ({
  field,
  value,
  onChange,
  className = ""
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Immediately update the global state to trigger unsaved changes detection
    onChange(`custom_field_${field.id}`, newValue);
  };

  const handleKeyDown = (e) => {
    const fieldType = field.type || field.field_type; // Handle both column names
    if (e.key === 'Enter' && fieldType !== 'textarea') {
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setLocalValue(value || '');
      setIsEditing(false);
    } else if (e.key === 'Tab') {
      // Let tab work naturally to move to next field
      setIsEditing(false);
    }
  };

  const renderEditField = () => {
    const fieldType = field.type || field.field_type; // Handle both column names
    switch (fieldType) {
      case 'textarea':
        return (
          <Textarea
            value={localValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setIsEditing(false)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className="w-full min-h-[80px]"
            rows={3}
            autoFocus
          />
        );
      case 'select':
        return (
          <Select value={localValue} onValueChange={(newValue) => {
            setLocalValue(newValue);
            onChange(`custom_field_${field.id}`, newValue);
            setIsEditing(false);
          }}>
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value || option} value={option.value || option}>
                  {option.label || option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localValue === 'true' || localValue === true}
              onChange={(e) => {
                const newValue = e.target.checked.toString();
                setLocalValue(newValue);
                onChange(`custom_field_${field.id}`, newValue);
                setIsEditing(false);
              }}
              className="rounded border-border/60 text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-muted-foreground">
              {field.placeholder || `Check to enable ${field.label.toLowerCase()}`}
            </span>
          </div>
        );
      default:
        return (
          <Input
            type={fieldType === 'email' ? 'email' :
                  fieldType === 'date' ? 'date' :
                  fieldType === 'number' ? 'number' :
                  fieldType === 'url' ? 'url' : 'text'}
            value={localValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setIsEditing(false)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className="w-full h-9"
            autoFocus
          />
        );
    }
  };

  const renderDisplayValue = () => {
    const fieldType = field.type || field.field_type; // Handle both column names
    if (fieldType === 'checkbox') {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={value === 'true' || value === true}
            disabled
            className="rounded border-border/60"
          />
          <span className="text-sm">
            {value === 'true' || value === true ? 'Yes' : 'No'}
          </span>
        </div>
      );
    }

    if (value) {
      return <span className="text-sm text-gray-900">{value}</span>;
    }

    return <span className="text-sm text-gray-400 italic">Not provided</span>;
  };

  return (
    <div className={`flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 ${className}`}>
      <div className="flex items-center w-full">
        {/* Label Column - Fixed Width */}
        <div className="w-32 flex-shrink-0">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {field.label}
            {field.is_required && <span className="text-red-500">*</span>}
          </Label>
        </div>

        {/* Value/Input Column - Flexible Width */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div>
              {renderEditField()}
            </div>
          ) : (
            <div
              className="py-1 cursor-pointer hover:bg-gray-50 transition-colors flex items-center rounded px-2 -mx-2"
              onClick={() => setIsEditing(true)}
            >
              {renderDisplayValue()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StaffMemberProfilePage = () => {
  const { id: systemMemberId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();    const [memberData, setMemberData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Inline editing state
  const [formData, setFormData] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [editingSection, setEditingSection] = useState(null); // 'personal', 'contact', 'emergency'
  const [editFormData, setEditFormData] = useState({});
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [bookings, setBookings] = useState([]);  const [membershipLog, setMembershipLog] = useState([]);
  const [currentMemberships, setCurrentMemberships] = useState([]);
  const [allMemberships, setAllMemberships] = useState([]);
  const [membershipHistory, setMembershipHistory] = useState([]);
  const [isAssignMembershipDialogOpen, setIsAssignMembershipDialogOpen] = useState(false);
  const [isMembershipSignupWizardOpen, setIsMembershipSignupWizardOpen] = useState(false);
  const [isFamilyDialogOpen, setIsFamilyDialogOpen] = useState(false);  const [isEditMembershipDialogOpen, setIsEditMembershipDialogOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState(null);
  const [loggedInStaff, setLoggedInStaff] = useState(null);
  const [billingPreferences, setBillingPreferences] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom fields state
  const [customFields, setCustomFields] = useState([]);
  const [memberCustomFieldValues, setMemberCustomFieldValues] = useState({});

  // Memoize avatar-related values to prevent unnecessary re-renders
  const displayName = useMemo(() => {
    if (memberData?.first_name && memberData?.last_name) {
      return `${memberData.first_name} ${memberData.last_name}`;
    } else if (memberData?.first_name) {
      return memberData.first_name;
    } else if (memberData?.last_name) {
      return memberData.last_name;
    } else if (memberData?.name && memberData.name.trim() !== "") {
      return memberData.name;
    } else if (memberData?.email) {
      return memberData.email.split('@')[0];
    }
    return 'Member Name';
  }, [memberData?.first_name, memberData?.last_name, memberData?.name, memberData?.email]);

  const memberNameForAvatar = useMemo(() => displayName, [displayName]);
  const avatarSrc = useMemo(() => memberData?.profile_picture_url || '', [memberData?.profile_picture_url]);

  // Initialize form data when member data changes
  useEffect(() => {
    if (memberData) {
      const initialData = {
        first_name: memberData.first_name || '',
        last_name: memberData.last_name || '',
        email: memberData.email || '',
        phone: memberData.phone || '',
        address: memberData.address || '',
        date_of_birth: memberData.date_of_birth || memberData.dob || '',
        dob: memberData.dob || memberData.date_of_birth || '',
        gender: memberData.gender || '',
        access_card_number: memberData.access_card_number || '',
        emergency_contact_name: memberData.emergency_contact_name || '',
        emergency_contact_phone: memberData.emergency_contact_phone || '',
        emergency_contact_email: memberData.emergency_contact_email || '',
        emergency_contact_relationship: memberData.emergency_contact_relationship || '',
        join_date: memberData.join_date || '',
        status: memberData.status || '',
        ...memberCustomFieldValues
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
  }, [memberData, memberCustomFieldValues]);
  // Handle field changes
  const handleFieldChange = useCallback((fieldName, value) => {
    console.log('Field change:', { fieldName, value });
    setFormData(prev => {
      const newData = { ...prev, [fieldName]: value };
      // Check if there are unsaved changes
      const hasChanges = Object.keys(newData).some(key => {
        const originalValue = originalData[key];
        const newValue = newData[key];
        return originalValue !== newValue;
      });
      setHasUnsavedChanges(hasChanges);
      return newData;
    });
  }, [originalData]);

  // Handle address changes - simplified for single address field
  const handleAddressChange = useCallback((addressData) => {
    // Handle both direct string values and object with fullAddress property
    const addressValue = typeof addressData === 'string' ? addressData : (addressData.fullAddress || '');
    console.log('handleAddressChange called with:', addressData, 'processed as:', addressValue);

    setFormData(prev => {
      const newData = {
        ...prev,
        address: addressValue
      };

      // Check if there are unsaved changes
      const hasChanges = Object.keys(newData).some(key => newData[key] !== originalData[key]);
      console.log('Address change - hasChanges:', hasChanges, 'newData:', newData, 'originalData:', originalData);
      setHasUnsavedChanges(hasChanges);
      return newData;
    });
  }, [originalData]);

  // Validate required fields
  const validateRequiredFields = () => {
    const errors = [];



    if (!formData.first_name || formData.first_name.trim() === '') {
      errors.push('First Name');
    }

    if (!formData.last_name || formData.last_name.trim() === '') {
      errors.push('Last Name');
    }

    if (!formData.email || formData.email.trim() === '') {
      errors.push('Email');
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errors.push('Valid Email Address');
    }

    if (!formData.phone || formData.phone.trim() === '') {
      errors.push('Phone Number');
    }
    return errors;
  };

  // Global save function
  const handleGlobalSave = async () => {
    console.log('handleGlobalSave called', {
      memberDataId: memberData?.id,
      hasUnsavedChanges,
      formData,
      originalData
    });



    if (!memberData?.id) {
      console.log('Early return - no member ID');
      toast({
        title: "Save Failed",
        description: "No member ID found. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    if (!hasUnsavedChanges) {
      console.log('Early return - no unsaved changes');
      toast({
        title: "No Changes",
        description: "No changes to save.",
        variant: "default"
      });
      return;
    }

    // Validate required fields before saving
    const validationErrors = validateRequiredFields();

    if (validationErrors.length > 0) {
      toast({
        title: "Required Fields Missing",
        description: `Please complete the following required fields: ${validationErrors.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Separate custom fields from regular fields
      const customFieldUpdates = {};
      const profileUpdates = {};

      // Define which fields are valid for the profiles table (based on actual database schema)
      const validProfileFields = [
        'first_name', 'last_name', 'email', 'phone', 'address', 'date_of_birth', 'dob', 'gender',
        'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone',
        'emergency_contact_email', 'access_card_number', 'status', 'join_date'
      ];

      Object.keys(formData).forEach(key => {
        if (key.startsWith('custom_field_')) {
          const fieldId = key.replace('custom_field_', '');
          customFieldUpdates[fieldId] = formData[key];
        } else if (validProfileFields.includes(key)) {
          let value = formData[key];

          // Handle date fields - convert empty strings to null
          if ((key === 'date_of_birth' || key === 'dob' || key === 'join_date') && value === '') {
            value = null;
          }

          // Handle gender field - don't allow empty strings, skip if empty
          if (key === 'gender' && value === '') {
            return; // Skip this field entirely if gender is empty
          }

          // Handle other empty string fields that should be null
          if (value === '' && (key === 'phone' || key === 'address' || key === 'access_card_number' ||
              key === 'emergency_contact_name' || key === 'emergency_contact_phone' ||
              key === 'emergency_contact_email' || key === 'emergency_contact_relationship')) {
            value = null;
          }

          profileUpdates[key] = value;
        } else {
          console.log('Skipping invalid profile field:', key, formData[key]);
        }
      });

      console.log('Updates to apply:', { profileUpdates, customFieldUpdates });      // Update profile data
      if (Object.keys(profileUpdates).length > 0) {
        console.log('Updating profile with:', profileUpdates);
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            ...profileUpdates,
            updated_at: new Date().toISOString()
          })
          .eq('id', memberData.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
          throw profileError;
        }
        console.log('Profile updated successfully');
      }      // Update custom field values
      if (Object.keys(customFieldUpdates).length > 0) {
        console.log('Updating custom fields:', customFieldUpdates);
        for (const [fieldId, value] of Object.entries(customFieldUpdates)) {
          const { error: customFieldError } = await supabase
            .from('member_custom_field_values')
            .upsert({
              member_id: memberData.id,
              custom_field_id: fieldId,
              value: value || null,
              updated_at: new Date().toISOString()
            });

          if (customFieldError) {
            console.error('Custom field update error:', customFieldError);
            throw customFieldError;
          }
        }
        console.log('Custom fields updated successfully');
      }      // Update local state
      setMemberData(prev => ({ ...prev, ...profileUpdates }));
      setMemberCustomFieldValues(prev => ({ ...prev, ...customFieldUpdates }));
      setOriginalData(formData);
      setHasUnsavedChanges(false);

      console.log('Save completed successfully - save button should disappear');
      toast({
        title: "Profile Updated",
        description: "All changes have been saved successfully.",
        variant: "success"
      });

    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Discard changes function
  const handleDiscardChanges = () => {
    setFormData(originalData);
    setHasUnsavedChanges(false);
  };

  // Handle photo upload from file
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    await uploadPhoto(file);
  };

  // Handle camera capture
  const handleTakePhoto = async () => {
    console.log('Take photo clicked');

    // Check if we're on HTTPS or localhost
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      toast({
        title: "Camera Requires HTTPS",
        description: "Camera access requires a secure connection. Please use file upload instead.",
        variant: "destructive"
      });
      return;
    }

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Camera Not Supported",
        description: "Your browser doesn't support camera access. Please use file upload instead.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      console.log('Camera access granted');

      // Create a modal or overlay to show camera preview
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold mb-4">Take Photo</h3>
          <video id="camera-preview" autoplay playsinline class="w-full rounded-lg mb-4"></video>
          <div class="flex gap-2 justify-end">
            <button id="cancel-photo" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
            <button id="capture-photo" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Capture</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const video = document.getElementById('camera-preview');
      video.srcObject = stream;

      // Handle capture
      document.getElementById('capture-photo').onclick = () => {
        console.log('Capturing photo...');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Convert to blob
        canvas.toBlob(async (blob) => {
          console.log('Photo captured, uploading...');
          // Stop camera stream
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);

          if (blob) {
            await uploadPhoto(blob, `camera-${Date.now()}.jpg`);
          }
        }, 'image/jpeg', 0.8);
      };

      // Handle cancel
      document.getElementById('cancel-photo').onclick = () => {
        console.log('Photo capture cancelled');
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      };

    } catch (error) {
      console.error('Camera access error:', error);
      let errorMessage = "Unable to access camera. Please use file upload instead.";

      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera access was denied. Please allow camera access and try again.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found. Please use file upload instead.";
      }

      toast({
        title: "Camera Access Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Common photo upload function
  const uploadPhoto = async (file, fileName = null) => {
    // Validate file type
    if (file.type && !file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      console.log('Starting photo upload for member:', memberData.id);
      console.log('File details:', { name: file.name, size: file.size, type: file.type });

      // Create unique filename
      const fileExt = fileName ? fileName.split('.').pop() : (file.name ? file.name.split('.').pop() : 'jpg');
      const uniqueFileName = fileName || `${memberData.id}-${Date.now()}.${fileExt}`;
      let filePath = `profile-photos/${uniqueFileName}`;

      console.log('Upload path:', filePath);

      // Use the member-photos bucket
      const bucketName = 'member-photos';
      console.log('Using bucket:', bucketName);

      // Upload to Supabase Storage
      console.log('Uploading file to bucket:', bucketName);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting existing files
        });

      console.log('Upload result:', { uploadData, uploadError });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('Generated public URL:', publicUrl);

      // Update member profile with new photo URL
      console.log('Updating profile with photo URL...');
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', memberData.id)
        .select();

      console.log('Profile update result:', { updateData, updateError });

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      // Update local state with new profile picture URL
      setMemberData(prev => ({
        ...prev,
        profile_picture_url: publicUrl
      }));

      console.log('Photo upload completed successfully');
      console.log('Updated memberData with new photo URL:', cacheBustedUrl);
      toast({
        title: "Photo Updated",
        description: "Profile photo has been successfully updated",
        variant: "default"
      });

    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload photo: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      // Reset file input
      const fileInput = document.getElementById('photo-upload');
      if (fileInput) fileInput.value = '';
    }
  };

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true);

    // Get current staff user from auth
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: staffProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setLoggedInStaff(staffProfile || { id: user.id, email: user.email });
      }
    } catch (error) {
      
      setLoggedInStaff({ id: 'temp', email: 'temp@example.com' });
    }

    if (!systemMemberId) {
      setIsLoading(false);
      toast({ title: "Error", description: "No member ID provided.", variant: "destructive" });
      navigate('/staff-portal/dashboard');
      return;
    }

    setIsLoading(true);
    try {
      const { data: member, error: memberError } = await MemberProfileService.getProfileBySystemId(systemMemberId);
      if (memberError) throw memberError;
      if (member) {
        setMemberData(member);
        
        // TODO: Re-enable when billing_preferences table is created
        // const { data: preferencesData, error: preferencesError } = await supabase
        //   .from('billing_preferences')
        //   .select('*')
        //   .eq('member_id', member.id)
        //   .single();

        // if (preferencesError && preferencesError.code !== 'PGRST116') {
        //   console.error('Error fetching billing preferences:', preferencesError);
        //   toast({ title: "Error", description: "Failed to load billing preferences.", variant: "destructive" });
        // } else {
        //   setBillingPreferences(preferencesData);
        // }

        // Set empty billing preferences for now
        setBillingPreferences(null);

        // Fetch current memberships from memberships table (active, on hold, and pending)
        try {
          // First get the memberships
          const { data: memberships, error: membershipsError } = await supabase
            .from('memberships')
            .select('*')
            .eq('system_member_id', member.system_member_id)
            .in('status', ['active', 'on_hold', 'pending', 'frozen']);

          if (membershipsError) {
            console.error('Error fetching memberships:', membershipsError);
            setCurrentMemberships([]);
          } else if (memberships && memberships.length > 0) {
            // Get membership type IDs
            const membershipTypeIds = memberships.map(m => m.membership_type_id).filter(Boolean);

            // Fetch membership types separately
            const { data: membershipTypes, error: typesError } = await supabase
              .from('membership_types')
              .select('id, name, category, price, billing_type, duration_months')
              .in('id', membershipTypeIds);

            if (typesError) {
              console.error('Error fetching membership types:', typesError);
              setCurrentMemberships(memberships);
            } else {
              // Combine the data
              const membershipsWithTypes = memberships.map(membership => ({
                ...membership,
                membership_type: membershipTypes.find(type => type.id === membership.membership_type_id)
              }));
              setCurrentMemberships(membershipsWithTypes);
            }
          } else {
            setCurrentMemberships([]);
          }
        } catch (error) {
          console.error('Error fetching memberships:', error);
          setCurrentMemberships([]);
        }

        // Fetch ALL memberships (including inactive ones) for status determination
        try {
          // First get all memberships
          const { data: allMembershipsData, error: allMembershipsError } = await supabase
            .from('memberships')
            .select('*')
            .eq('system_member_id', member.system_member_id)
            .order('updated_at', { ascending: false });

          if (allMembershipsError) {
            console.error('Error fetching all memberships:', allMembershipsError);
            setAllMemberships([]);
            setMembershipHistory([]);
          } else if (allMembershipsData && allMembershipsData.length > 0) {
            // Get membership type IDs
            const membershipTypeIds = allMembershipsData.map(m => m.membership_type_id).filter(Boolean);

            // Fetch membership types separately
            const { data: membershipTypes, error: typesError } = await supabase
              .from('membership_types')
              .select('id, name, category, price, billing_type, duration_months')
              .in('id', membershipTypeIds);

            if (typesError) {
              console.error('Error fetching membership types:', typesError);
              setAllMemberships(allMembershipsData);
            } else {
              // Combine the data
              const allMembershipsWithTypes = allMembershipsData.map(membership => ({
                ...membership,
                membership_type: membershipTypes.find(type => type.id === membership.membership_type_id)
              }));
              setAllMemberships(allMembershipsWithTypes);

              // Set membership history (inactive memberships only)
              const historicalMemberships = allMembershipsWithTypes.filter(
                membership => !['active', 'on_hold', 'pending', 'frozen'].includes(membership.status?.toLowerCase())
              );
              setMembershipHistory(historicalMemberships);
            }
          } else {
            setAllMemberships([]);
            setMembershipHistory([]);
          }
        } catch (error) {
          console.error('Error fetching all memberships:', error);
          setAllMemberships([]);
          setMembershipHistory([]);
        }
      } else {
        toast({ title: "Not Found", description: `Member with ID ${systemMemberId} not found.`, variant: "destructive" });
        navigate('/staff-portal/dashboard');
      }
    } catch (error) {
      
      toast({ title: "Error", description: `Failed to load profile data: ${error.message}`, variant: "destructive" });
    } finally {
      
      setIsLoading(false);
    }
  }, [systemMemberId, navigate, toast]);

  useEffect(() => {
    if (systemMemberId) {
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        
        setIsLoading(false);
        toast({ 
          title: "Loading Timeout", 
          description: "Profile data is taking too long to load. Please try again.", 
          variant: "destructive" 
        });
      }, 15000); // 15 second timeout

      fetchProfileData().finally(() => {
        clearTimeout(timeoutId);
      });

      return () => clearTimeout(timeoutId);
    }
  }, [systemMemberId]); // Only depend on systemMemberId, not the function
  const handleEditSection = (section) => {
    if (editingSection !== section) {
      // Initialize edit form data with current member data
      setEditFormData({
        first_name: memberData?.first_name || '',
        last_name: memberData?.last_name || '',
        email: memberData?.email || '',
        phone: memberData?.phone || '',
        address: memberData?.address || '',
        city: memberData?.city || '',
        state: memberData?.state || '',
        zip_code: memberData?.zip_code || '',
        dob: memberData?.dob && isValid(new Date(memberData.dob)) ? format(new Date(memberData.dob), 'yyyy-MM-dd') : '',
        gender: memberData?.gender || '',
        emergency_contact_name: memberData?.emergency_contact_name || '',
        emergency_contact_phone: memberData?.emergency_contact_phone || '',
        emergency_contact_email: memberData?.emergency_contact_email || '',
        emergency_contact_relationship: memberData?.emergency_contact_relationship || '',
      });
      setEditingSection(section);
    } else {
      setEditingSection(null);
    }
  };

  const handleEditProfile = () => {
    handleEditSection('personal');
  };  const handleStartEdit = (section) => {
    setEditingSection(section);
    // Initialize edit form data with current member data
    const baseFormData = {
      first_name: memberData?.first_name || '',
      last_name: memberData?.last_name || '',
      dob: memberData?.dob ? new Date(memberData.dob).toISOString().split('T')[0] : '',
      gender: memberData?.gender || '',
      access_card_number: memberData?.access_card_number || '',
      email: memberData?.email || '',
      phone: memberData?.phone || '',
      address: memberData?.address || '',
      city: memberData?.city || '',
      state: memberData?.state || '',
      zip_code: memberData?.zip_code || '',
      emergency_contact_name: memberData?.emergency_contact_name || '',
      emergency_contact_relationship: memberData?.emergency_contact_relationship || '',
      emergency_contact_phone: memberData?.emergency_contact_phone || '',
      emergency_contact_email: memberData?.emergency_contact_email || '',
      
      // Billing preferences
      billing_tax_exempt: memberData?.billing_preferences?.tax_exempt?.toString() || 'false',
      billing_statement_delivery: memberData?.billing_preferences?.statement_delivery || 'email',
      billing_payment_reminders: memberData?.billing_preferences?.payment_reminders?.toString() || 'true'
    };

    // Add custom fields to form data
    customFields.forEach(field => {
      baseFormData[`custom_field_${field.id}`] = memberCustomFieldValues[field.id] || '';
    });

    setEditFormData(baseFormData);
  };

  const handleCancelEdit = (section) => {
    setEditingSection(null);
    setEditFormData({});
  };

  // Global edit functions
  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressSelect = (addressComponents) => {
    // Auto-populate address fields when address is selected from autocomplete
    setEditFormData(prev => ({
      ...prev,
      address: addressComponents.address,
      city: addressComponents.city,
      state: addressComponents.state,
      zip_code: addressComponents.zip_code
    }));
  };
  const handleSaveSectionEdit = async (section) => {
    if (!memberData?.id) return;
    
    try {
      if (section === 'custom') {
        // Handle custom fields separately
        const customFieldUpdates = [];
        
        customFields.forEach(field => {
          const fieldKey = `custom_field_${field.id}`;
          const newValue = editFormData[fieldKey] || '';
          
          customFieldUpdates.push({
            member_id: memberData.id,
            custom_field_id: field.id,
            value: newValue
          });
        });

        // Delete existing values for this member
        await supabase
          .from('member_custom_field_values')
          .delete()
          .eq('member_id', memberData.id);

        // Insert new values (only non-empty ones)
        const nonEmptyUpdates = customFieldUpdates.filter(update => update.value.trim() !== '');
        if (nonEmptyUpdates.length > 0) {
          const { error: insertError } = await supabase
            .from('member_custom_field_values')
            .insert(nonEmptyUpdates);
            
          if (insertError) throw insertError;
        }

        // Update local state
        const newValuesMap = {};
        customFieldUpdates.forEach(update => {
          if (update.value.trim() !== '') {
            newValuesMap[update.custom_field_id] = update.value;
          }
        });
        setMemberCustomFieldValues(newValuesMap);        setEditingSection(null);
        setEditFormData({});
        toast({ title: "Custom Fields Updated", description: "Custom field values have been saved." });
      } else if (section === 'billing') {
        // Handle billing preferences separately
        const billingPreferences = {
          tax_exempt: editFormData.billing_tax_exempt === 'true',
          statement_delivery: editFormData.billing_statement_delivery,
          payment_reminders: editFormData.billing_payment_reminders === 'true'
        };

        const { data: savedMember, error } = await supabase
          .from('profiles')
          .update({ billing_preferences: billingPreferences })
          .eq('id', memberData.id)
          .select()
          .single();

        if (error) throw error;

        setMemberData(savedMember);
        setEditingSection(null);
        setEditFormData({});
        toast({ title: "Billing Preferences Updated", description: "Member's billing preferences have been saved." });
      } else {
        // Handle regular profile fields
        const dob = editFormData.dob && editFormData.dob !== "" ? new Date(editFormData.dob).toISOString().split('T')[0] : null;
          // Filter out custom field data and billing data for regular profile updates
        const profileData = { ...editFormData };
        Object.keys(profileData).forEach(key => {
          if (key.startsWith('custom_field_') || key.startsWith('billing_')) {
            delete profileData[key];
          }
        });
        
        const dataToSave = {
          ...profileData,
          dob,
          first_name: editFormData.first_name || '',
          last_name: editFormData.last_name || '',
        };
        dataToSave.name = `${dataToSave.first_name} ${dataToSave.last_name}`.trim();

        const { data: savedMember, error } = await supabase
          .from('profiles')
          .update(dataToSave)
          .eq('id', memberData.id)
          .select()
          .single();

        if (error) throw error;

        setMemberData(savedMember);
        setEditingSection(null);
        setEditFormData({});
        toast({ title: "Profile Updated", description: "Member's information has been saved." });
        fetchProfileData();
      }
    } catch (error) {
      toast({ title: "Error", description: `Could not save changes. ${error.message}`, variant: "destructive" });
    }
  };

  const handleSaveProfile = async (updatedData) => {
    try {
      const dob = updatedData.dob && updatedData.dob !== "" ? new Date(updatedData.dob).toISOString().split('T')[0] : null;
      const join_date = updatedData.join_date && updatedData.join_date !== "" ? new Date(updatedData.join_date).toISOString().split('T')[0] : null;

      const dataToSave = {
        ...updatedData,
        dob,
        join_date,
        first_name: updatedData.first_name || '',
        last_name: updatedData.last_name || '',
      };
      dataToSave.name = `${dataToSave.first_name} ${dataToSave.last_name}`.trim();

      const { data: savedMember, error } = await supabase
        .from('profiles')
        .update(dataToSave)
        .eq('id', memberData.id)
        .select()
        .single();

      if (error) throw error;

      setMemberData(savedMember);
      toast({ title: "Profile Updated", description: "Member's information has been saved." });
      fetchProfileData();
    } catch (error) {
      
      toast({ title: "Error", description: `Could not save profile changes. ${error.message}`, variant: "destructive" });
    }
  };

  const handleActivateProfile = async () => {
    if (!memberData?.id) return;

    try {
      const { data: activatedProfile, error } = await MemberProfileService.activateProfile(
        memberData.id,
        {
          first_name: memberData.first_name,
          last_name: memberData.last_name,
          email: memberData.email
        }
      );

      if (error) {
        throw error;
      }

      setMemberData(activatedProfile);
      toast({
        title: "Profile Activated",
        description: "Member profile has been successfully activated!"
      });
      fetchProfileData();
    } catch (error) {
      
      toast({
        title: "Activation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleQuickAction = (actionType, membershipData = null) => {
    if (actionType === 'Edit Membership' && membershipData) {
      setEditingMembership(membershipData);
      setIsEditMembershipDialogOpen(true);
    } else {
      toast({ title: "Feature Coming Soon", description: `"${actionType}" functionality is under development.`, variant: "info" });
    }
  };
  const handleMembershipAssigned = () => {
    fetchProfileData();
  };

  const handleMembershipUpdated = () => {
    fetchProfileData();
    setIsEditMembershipDialogOpen(false);
    setEditingMembership(null);
    toast({
      title: "Success",
      description: "Membership updated successfully",
      variant: "success"
    });
  };

  const handleMembershipSignupComplete = (result) => {
    fetchProfileData();
    setIsMembershipSignupWizardOpen(false);
    toast({
      title: "Membership Added Successfully",
      description: "The new membership plan has been assigned to this member.",
      variant: "default"
    });
  };
  if (isLoading || !memberData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">Loading member profile...</p>
            <p className="text-xs text-gray-400">
              Loading: {isLoading ? 'true' : 'false'} |
              Member: {memberData ? 'loaded' : 'loading'} |
              Staff: {loggedInStaff ? 'loaded' : 'loading'}
            </p>
          </div>
        </div>
      </div>
    );
  }
    const currentMembership = membershipTypes.find(mt => mt.id === memberData.current_membership_type_id);
  
  // displayName is now memoized at the top of the component
  


  // EditMembershipDialog Component
  const EditMembershipDialog = ({ isOpen, onClose, membership, onMembershipUpdated }) => {
    const [formData, setFormData] = useState({
      status: '',
      start_date: '',
      end_date: '',
      next_payment_date: '',
      notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      if (membership && isOpen) {
        setFormData({
          status: membership.status || '',
          start_date: membership.start_date ? format(new Date(membership.start_date), 'yyyy-MM-dd') : '',
          end_date: membership.end_date ? format(new Date(membership.end_date), 'yyyy-MM-dd') : '',
          next_payment_date: membership.next_payment_date ? format(new Date(membership.next_payment_date), 'yyyy-MM-dd') : '',
          notes: membership.notes || ''
        });
      }
    }, [membership, isOpen]);

    const handleInputChange = (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handleSubmit = async () => {
      if (!membership) return;

      setIsSubmitting(true);
      try {
        const updateData = {
          status: formData.status,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          next_payment_date: formData.next_payment_date || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('memberships')
          .update(updateData)
          .eq('id', membership.id);

        if (error) throw error;

        onMembershipUpdated();
      } catch (error) {
        console.error('Error updating membership:', error);
        toast({
          title: "Error",
          description: "Failed to update membership. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Membership</DialogTitle>
            <DialogDescription>
              Update membership details for {memberData?.first_name} {memberData?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Membership Type (Read-only) */}
            <div className="space-y-2">
              <Label>Membership Type</Label>
              <Input
                value={membership?.membership_type?.name || 'Unknown'}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
              />
            </div>

            {/* Next Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="next_payment_date">Next Payment Date</Label>
              <Input
                id="next_payment_date"
                type="date"
                value={formData.next_payment_date}
                onChange={(e) => handleInputChange('next_payment_date', e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this membership..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Membership'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (    <div className="min-h-screen transition-all duration-500 bg-gray-50 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-2 sm:px-4 py-6 space-y-6"
      >
      <Card className="overflow-hidden shadow-xl rounded-xl bg-card border-2 border-indigo-200">
        <div className="relative flex flex-col space-y-1.5 p-6 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-100 to-purple-100">


          {/* Profile Content - Left-aligned layout like member portal */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">            {/* Enhanced Profile Photo Section - Left Side */}
            <div className="relative flex-shrink-0">
              <div className="relative group">
                <div className="relative h-24 w-24 lg:h-32 lg:w-32 border-4 border-white shadow-lg transition-all duration-200 group-hover:shadow-xl rounded-full overflow-hidden bg-muted">
                  {avatarSrc ? (
                    <img
                      key={avatarSrc}
                      src={avatarSrc}
                      alt={memberData.name || "Member avatar"}
                      className="w-full h-full object-cover relative z-10"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full relative z-10">
                      <User className="h-12 w-12 lg:h-20 lg:w-20 text-muted-foreground" />
                    </div>
                  )}

                  {/* Initials fallback (always present but hidden when image loads) */}
                  <div className={`absolute inset-0 flex items-center justify-center text-2xl lg:text-4xl font-semibold text-muted-foreground bg-muted rounded-full transition-opacity duration-200 ${avatarSrc ? 'opacity-0 z-0' : 'opacity-100 z-10'}`}>
                    {getInitials(memberNameForAvatar)}
                  </div>
                </div>

                {/* Photo Upload Buttons - Show only on hover */}
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out">
                  {/* Take Picture Button */}
                  <button
                    onClick={handleTakePhoto}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-full text-xs font-medium transition-colors disabled:opacity-50 text-white shadow-lg"
                    title="Take Photo"
                  >
                    <Camera className="h-3 w-3" />
                  </button>

                  {/* Upload Button */}
                  <button
                    onClick={() => document.getElementById('photo-upload').click()}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded-full text-xs font-medium transition-colors disabled:opacity-50 text-white shadow-lg"
                    title="Upload Photo"
                  >
                    <ImageIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}              />
            </div>

            {/* Enhanced Name and Identity Section - Right Side */}
            <div className="flex-1 text-center lg:text-left space-y-3">
              {/* Primary Name Display with Balance */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                    {displayName}
                  </h1>
                </div>

                {/* Balance Display - Top Right - Inlaid Box */}
                <div className="mt-2 lg:mt-0">
                  <div className="bg-white/60 border border-indigo-200/50 rounded-lg p-3 shadow-inner backdrop-blur-sm">
                    <div className="text-center lg:text-right">
                      <div className="text-sm font-medium text-indigo-900">
                        Current Balance: <span className="font-bold">${memberData?.current_balance || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badges Row */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                {/* Membership Status - Based on Detailed Status Logic */}
                {(() => {
                  // currentMemberships now contains active, on_hold, pending, and frozen memberships
                  const hasCurrentMembership = currentMemberships && currentMemberships.length > 0;

                  // Check if user has ever had any membership (including inactive ones)
                  const hasAnyMembershipHistory = allMemberships && allMemberships.length > 0;

                  let actualStatus, statusVar, icon;

                  if (hasCurrentMembership) {
                    // Get the primary current membership (first one)
                    const primaryMembership = currentMemberships[0];

                    // Check for pending cancellation first
                    if (primaryMembership.cancellation_date && new Date(primaryMembership.cancellation_date) > new Date()) {
                      actualStatus = `Cancel On: ${format(new Date(primaryMembership.cancellation_date), 'MMM dd, yyyy')}`;
                      statusVar = 'destructive';
                      icon = <AlertTriangle className="h-4 w-4 mr-1" />;
                    } else {
                      // Show status based on membership status
                      switch (primaryMembership.status?.toLowerCase()) {
                        case 'active':
                          actualStatus = 'Active Member';
                          statusVar = 'default';
                          icon = <CheckSquare className="h-4 w-4 mr-1" />;
                          break;
                        case 'on_hold':
                        case 'frozen':
                          actualStatus = 'On Hold';
                          statusVar = 'secondary';
                          icon = <PauseCircle className="h-4 w-4 mr-1" />;
                          break;
                        case 'pending':
                          actualStatus = 'Pending';
                          statusVar = 'secondary';
                          icon = <Clock className="h-4 w-4 mr-1" />;
                          break;
                        default:
                          actualStatus = 'Active Member';
                          statusVar = 'default';
                          icon = <CheckSquare className="h-4 w-4 mr-1" />;
                      }
                    }
                  } else if (hasAnyMembershipHistory) {
                    // Find the most recent membership to determine status
                    const mostRecentMembership = allMemberships[0]; // Already ordered by created_at desc

                    switch (mostRecentMembership.status?.toLowerCase()) {
                      case 'cancelled':
                        actualStatus = 'Cancelled';
                        statusVar = 'destructive';
                        icon = <X className="h-4 w-4 mr-1" />;
                        break;
                      case 'expired':
                        actualStatus = 'Expired';
                        statusVar = 'secondary';
                        icon = <Clock className="h-4 w-4 mr-1" />;
                        break;
                      case 'pending':
                        actualStatus = 'Pending';
                        statusVar = 'secondary';
                        icon = <Clock className="h-4 w-4 mr-1" />;
                        break;
                      case 'on_hold':
                      case 'frozen':
                        actualStatus = 'On Hold';
                        statusVar = 'secondary';
                        icon = <PauseCircle className="h-4 w-4 mr-1" />;
                        break;
                      default:
                        actualStatus = 'No Active Plan';
                        statusVar = 'secondary';
                        icon = <AlertTriangle className="h-4 w-4 mr-1" />;
                    }
                  } else {
                    // No membership history - this is a guest
                    actualStatus = 'Guest';
                    statusVar = 'outline';
                    icon = <User className="h-4 w-4 mr-1" />;
                  }

                  return (
                    <Badge
                      variant={statusVar}
                      className="px-3 py-1.5 text-sm font-medium"
                    >
                      {icon}
                      {actualStatus}
                    </Badge>
                  );
                })()}

                {/* Member Type */}
                <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                  {memberData.role === 'admin' ? 'Administrator' :
                   memberData.role === 'staff' ? 'Staff Member' :
                   currentMemberships.length > 0 ? 'Member' :
                   (allMemberships && allMemberships.length > 0) ? 'Non-Member' : 'Non-member'}
                </Badge>
              </div>

              {/* Key Information Row */}
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-2 lg:gap-6 text-sm text-muted-foreground">
                {/* Membership Plan */}
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>{currentMembership?.name || 'No Active Plan'}</span>
                </div>

                {/* Join Date */}
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>Joined: {memberData.join_date ? format(new Date(memberData.join_date), 'PP') : 'N/A'}</span>
                </div>

                {/* Email with Action Button */}
                {memberData.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="truncate max-w-[150px]">{memberData.email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `mailto:${memberData.email}`}
                      className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Mail className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Additional Status Indicators */}
              <div className="mt-3 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                {/* First Visit Indicator */}
                {memberData.join_date && new Date(memberData.join_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600">
                    <Star className="h-3 w-3 mr-1" />
                    New Member
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Settings Gear - Bottom Right - Inlaid Box */}
          <div className="absolute bottom-4 right-4">
            <div className="bg-white/60 border border-indigo-200/50 rounded-lg p-3 shadow-inner backdrop-blur-sm">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-indigo-100/50 hover:text-indigo-700"
                onClick={() => {
                  // TODO: Add settings functionality
                  console.log('Settings clicked');
                }}
              >
                <Settings className="h-4 w-4 text-indigo-600" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Draft Profile Banner */}
      <DraftProfileBanner
        memberData={memberData}
        onActivate={handleActivateProfile}
      />

      {/* Contact Information moved to Demographic tab */}
      <div className="hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
           <ProfileSectionCard 
             title="Contact Information" 
             icon={Info} 
             description="Primary contact details"
             className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
           >
              <InfoRow label="Email Address" value={memberData.email} icon={Mail}>
                {memberData.email && (
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{memberData.email}</p>
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `mailto:${memberData.email}`}>
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </InfoRow>
              <InfoRow label="Phone Number" value={memberData.phone} icon={Phone}>
                {memberData.phone && (
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{memberData.phone}</p>
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `tel:${memberData.phone}`}>
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </InfoRow>
              <InfoRow label="Home Address" value={memberData.address} icon={Home} />
              <InfoRow label="Date of Birth" value={memberData.dob ? format(new Date(memberData.dob), 'PP') : 'Not provided'} icon={CalendarDays} />
            </ProfileSectionCard>
            
            <ProfileSectionCard 
              title="Emergency Contact" 
              icon={Shield} 
              description="Who to contact in an emergency"
              className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20"
            >
              <InfoRow label="Contact Name" value={memberData.emergency_contact_name} icon={User} />
              <InfoRow label="Contact Phone" value={memberData.emergency_contact_phone} icon={Phone}>
                {memberData.emergency_contact_phone && (
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{memberData.emergency_contact_phone}</p>
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `tel:${memberData.emergency_contact_phone}`}>
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </InfoRow>
            </ProfileSectionCard>
        </div>
        
        <div className="lg:col-span-2">
          <StaffNotesSection memberId={memberData.id} staffId={loggedInStaff.id} />
        </div>
      </div>
      </div>

      {/* Enhanced Member Insights Section */}
      <div className="space-y-6 mb-6">
        {/* Quick Stats */}
        <MemberQuickStats memberId={memberData.id} memberData={memberData} />

        {/* Activity Timeline and Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MemberActivityTimeline memberId={memberData.id} memberData={memberData} />
          <MemberNotesLog memberId={memberData.id} />
        </div>
      </div>

      {/* Modern Tab Navigation - Separate from content */}
      <div className="mb-3.5">
        <Tabs defaultValue="demographics" className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6 bg-muted">
            <TabsTrigger value="demographics" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="membership" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Membership</span>
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Registrations</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Communication</span>
            </TabsTrigger>
            <TabsTrigger value="notes-documents" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Notes & Documents</span>
            </TabsTrigger>
            <TabsTrigger value="billing-history" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
          </TabsList>          {/* Profile Tab - Enhanced UI/UX with better organization and visual design */}
          <TabsContent value="demographics" className="space-y-6 mt-6 pt-2">
            <div className="space-y-6">

              {/* Personal Information Section */}
              <ProfileSectionCard
                title="Personal Information"
                icon={User}
                description="Personal details, contact information, and mailing address"
                isLoading={isLoading}
                className="h-fit"
              >
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      Personal Information
                    </h4>

                    {/* Clean unified layout - exactly as requested */}
                    <div className="space-y-4">
                      {/* Row 1: First Name, Last Name, Date of Birth */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InlineEditField
                          label="First Name"
                          value={formData.first_name}
                          fieldName="first_name"
                          isRequired={true}
                          placeholder="Enter first name"
                          onChange={handleFieldChange}
                          tabIndex={1}
                        />
                        <InlineEditField
                          label="Last Name"
                          value={formData.last_name}
                          fieldName="last_name"
                          isRequired={true}
                          placeholder="Enter last name"
                          onChange={handleFieldChange}
                          tabIndex={2}
                        />
                        <InlineEditField
                          label="Date of Birth"
                          value={formData.date_of_birth}
                          fieldName="date_of_birth"
                          type="date"
                          placeholder="Select date of birth"
                          onChange={handleFieldChange}
                          tabIndex={3}
                        />
                      </div>

                      {/* Row 2: Member ID, Gender, Email */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center w-full">
                            <div className="w-32 flex-shrink-0">
                              <Label className="text-sm font-medium text-gray-700">Member ID</Label>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="py-1 bg-primary/10 border border-primary/30 rounded px-2 w-full">
                                <span className="text-sm text-gray-900 font-medium">
                                  {memberData?.system_member_id || memberData?.id || 'Not assigned'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <InlineEditField
                          label="Gender"
                          value={formData.gender}
                          fieldName="gender"
                          options={[
                            { value: 'Male', label: 'Male' },
                            { value: 'Female', label: 'Female' },
                            { value: 'Other', label: 'Other' },
                            { value: 'Prefer not to say', label: 'Prefer not to say' }
                          ]}
                          placeholder="Select gender"
                          onChange={handleFieldChange}
                          tabIndex={4}
                        />
                        <InlineEditField
                          label="Email"
                          value={formData.email}
                          fieldName="email"
                          type="email"
                          isRequired={true}
                          placeholder="Enter email address"
                          onChange={handleFieldChange}
                          tabIndex={5}
                        />
                      </div>

                      {/* Row 3: Access Card, [empty], Phone Number */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InlineEditField
                          label="Access Card"
                          value={formData.access_card_number}
                          fieldName="access_card_number"
                          placeholder="Enter access card number"
                          onChange={handleFieldChange}
                          tabIndex={6}
                        />
                        <div></div> {/* Empty middle column */}
                        <InlineEditField
                          label="Phone Number"
                          value={formData.phone}
                          fieldName="phone"
                          type="tel"
                          isRequired={true}
                          placeholder="Enter phone number"
                          onChange={handleFieldChange}
                          tabIndex={7}
                        />
                      </div>

                      {/* Row 4: Address (full width) */}
                      <div className="grid grid-cols-1 gap-4">
                        <AddressField
                          label="Address"
                          fullAddress={formData.address}
                          streetAddress={formData.street_address || ''}
                          city={formData.city}
                          state={formData.state}
                          zipCode={formData.zip_code}
                          onChange={handleAddressChange}
                        />
                      </div>



                      {/* Row 5: Emergency Contact, Relationship, Emergency Phone */}
                      <div className="bg-orange-50/30 rounded-lg p-4 space-y-4 mt-4">
                        <h5 className="text-xs font-medium text-orange-700 uppercase tracking-wide flex items-center gap-2">
                          <Shield className="h-3 w-3" />
                          Emergency Contact
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InlineEditField
                          label="Emergency Contact"
                          value={formData.emergency_contact_name}
                          fieldName="emergency_contact_name"
                          placeholder="Enter emergency contact name"
                          onChange={handleFieldChange}
                          tabIndex={8}
                        />
                        <InlineEditField
                          label="Relationship"
                          value={formData.emergency_contact_relationship}
                          fieldName="emergency_contact_relationship"
                          options={[
                            { value: 'Spouse', label: 'Spouse' },
                            { value: 'Parent', label: 'Parent' },
                            { value: 'Child', label: 'Child' },
                            { value: 'Sibling', label: 'Sibling' },
                            { value: 'Friend', label: 'Friend' },
                            { value: 'Other', label: 'Other' }
                          ]}
                          placeholder="Select relationship"
                          onChange={handleFieldChange}
                          tabIndex={9}
                        />
                        <InlineEditField
                          label="Emergency Phone"
                          value={formData.emergency_contact_phone}
                          fieldName="emergency_contact_phone"
                          type="tel"
                          placeholder="Enter emergency contact phone"
                          onChange={handleFieldChange}
                          tabIndex={10}
                        />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ProfileSectionCard>

            {/* Custom Fields Section */}
            <ProfileSectionCard
              title="Custom Fields"
              icon={Settings}
              description="Additional custom information fields"
              isLoading={isLoading}
              className="h-fit"
            >
              {customFields.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customFields.map((field) => (
                    <CustomFieldInlineEdit
                      key={field.id}
                      field={field}
                      value={formData[`custom_field_${field.id}`] || memberCustomFieldValues[field.id] || ''}
                      onChange={handleFieldChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No custom fields configured</p>
                </div>
              )}
            </ProfileSectionCard>

            {/* Family Section */}
            <ProfileSectionCard
              title="Family Members"
              icon={Users}
              description="Connected family members and their relationship types"
              isLoading={isLoading}
              className="h-fit"
              sectionId="family"
              isEditing={editingSection === 'family'}
              onEdit={() => handleStartEdit('family')}
              onSave={() => handleSaveSectionEdit('family')}
              onCancel={() => handleCancelEdit('family')}
            >
              <FamilySection
                memberData={memberData}
                isEditing={editingSection === 'family'}
                onEdit={() => handleStartEdit('family')}
                onSave={() => handleSaveSectionEdit('family')}
                onCancel={() => handleCancelEdit('family')}
              />
            </ProfileSectionCard>
            </div>
          </TabsContent>

          {/* Membership Tab - Table-based membership management */}
          <TabsContent value="membership" className="space-y-6 mt-6 pt-2">
            <ProfileSectionCard
              title="Membership Management"
              icon={Briefcase}
              description={
                <div className="flex items-center justify-between w-full">
                  <span>Current and historical membership information</span>
                  <div className="flex items-center gap-3 absolute right-6 -mt-3">
                    <Button onClick={() => setIsMembershipSignupWizardOpen(true)} className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Add Plan
                    </Button>
                  </div>
                </div>
              }

            >
              <div className="space-y-6">

                {/* Membership Tables with Subtabs */}
                <Tabs defaultValue="current" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 gap-1 mb-6">
                    <TabsTrigger value="current" className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4" />
                      Current Memberships
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Membership History
                    </TabsTrigger>
                  </TabsList>

                  {/* Current Memberships Tab */}
                  <TabsContent value="current" className="space-y-4">
                    <div className="rounded-lg border border-muted">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Membership Name</TableHead>
                            <TableHead className="font-semibold">Membership ID</TableHead>
                            <TableHead className="font-semibold">Type & Billing</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Primary Member</TableHead>
                            <TableHead className="font-semibold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>                        <TableBody>
                          {currentMemberships.length > 0 ? (
                            currentMemberships.map((membership) => (
                              <TableRow key={membership.id} className="hover:bg-muted/30">
                                <TableCell className="font-medium">
                                  {membership.membership_type?.name || 'Unknown Plan'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {membership.id.slice(0, 8)}...
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <Badge variant="outline" className="text-xs">
                                      {membership.membership_type?.category || 'Membership'}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground">
                                      {membership.membership_type?.billing_type || 'N/A'} •
                                      {membership.membership_type?.duration_months
                                        ? ` ${membership.membership_type.duration_months} months`
                                        : ' Ongoing'
                                      }
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={statusVariant(membership.status)}>
                                    {membership.status || 'Unknown'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {memberData?.first_name} {memberData?.last_name}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleQuickAction('Edit Membership', membership)}>
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleQuickAction('View History')}>
                                      <Clock className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No current memberships found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* Membership History Tab */}
                  <TabsContent value="history" className="space-y-4">
                    <div className="rounded-lg border border-muted">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Membership Name</TableHead>
                            <TableHead className="font-semibold">Membership ID</TableHead>
                            <TableHead className="font-semibold">Type & Billing</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Duration</TableHead>
                            <TableHead className="font-semibold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>                        <TableBody>
                          {membershipHistory.length > 0 ? (
                            membershipHistory.map((membership) => {
                              const isPending = membership.status?.toLowerCase() === 'pending';
                              return (
                                <TableRow 
                                  key={membership.id} 
                                  className={cn(
                                    "hover:bg-muted/30",
                                    isPending && "opacity-75"
                                  )}
                                >
                                  <TableCell className={cn(
                                    "font-medium",
                                    isPending && "italic text-muted-foreground"
                                  )}>
                                    {membership.membership_type?.name || 'Unknown Plan'}
                                  </TableCell>
                                  <TableCell className={cn(
                                    "text-muted-foreground",
                                    isPending && "italic"
                                  )}>
                                    {membership.id.slice(0, 8)}...
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-xs",
                                          isPending && "italic text-muted-foreground border-muted-foreground"
                                        )}
                                      >
                                        {membership.membership_type?.category || 'Membership'}
                                      </Badge>
                                      <div className={cn(
                                        "text-xs text-muted-foreground",
                                        isPending && "italic"
                                      )}>
                                        {membership.membership_type?.billing_type || 'N/A'} •
                                        {membership.membership_type?.duration_months
                                          ? ` ${membership.membership_type.duration_months} months`
                                          : ' Ongoing'
                                        }
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={statusVariant(membership.status)}>
                                      {membership.status || 'Unknown'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className={cn(
                                    "text-muted-foreground text-sm",
                                    isPending && "italic"
                                  )}>
                                    <div className="space-y-1">
                                      {membership.start_date && (
                                        <div>Start: {format(new Date(membership.start_date), 'MMM d, yyyy')}</div>
                                      )}
                                      {membership.cancel_date && (
                                        <div>Cancelled: {format(new Date(membership.cancel_date), 'MMM d, yyyy')}</div>
                                      )}
                                      {membership.end_date && (
                                        <div>End: {format(new Date(membership.end_date), 'MMM d, yyyy')}</div>
                                      )}                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button variant="ghost" size="sm" onClick={() => handleQuickAction('View Details')}>
                                        <Info className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No membership history found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ProfileSectionCard>
          </TabsContent>

          {/* Registrations Tab - Class registrations and event sign-ups */}
          <TabsContent value="registrations" className="space-y-6 mt-6 pt-2">
            <ProfileSectionCard
              title="Class & Event Registrations"
              icon={ClipboardList}
              description="Member's class registrations, event sign-ups, and booking history"

            >
              <div className="space-y-6">
                {/* Current Registrations */}
                <div>
                  <h4 className="font-semibold text-lg mb-4">Current Registrations</h4>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">HIIT Training</h5>
                          <p className="text-sm text-muted-foreground">Mondays & Wednesdays, 6:00 PM</p>
                        </div>
                        <Badge variant="success">Active</Badge>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">Yoga Flow</h5>
                          <p className="text-sm text-muted-foreground">Fridays, 7:00 AM</p>
                        </div>
                        <Badge variant="secondary">Waitlisted</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registration History */}
                <div className="pt-6 border-t">
                  <h4 className="font-semibold text-lg mb-4">Registration History</h4>
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Registration history will be displayed here</p>
                    <p className="text-sm">Track member's past class and event registrations</p>
                  </div>
                </div>

                <div className="pt-6 border-t flex flex-wrap gap-3">
                  <Button onClick={() => handleQuickAction('Register for Class')} className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Register for Class
                  </Button>
                  <Button variant="outline" onClick={() => handleQuickAction('View All Classes')} className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    View All Classes
                  </Button>
                </div>
              </div>
            </ProfileSectionCard>
          </TabsContent>

          {/* Communication Tab - Messages, notifications, and communication history */}
          <TabsContent value="communication" className="space-y-6 mt-6 pt-2">
            <ProfileSectionCard
              title="Communication History"
              icon={Send}
              description="Messages, notifications, and communication logs with this member"

            >
              <div className="space-y-6">
                {/* Recent Communications */}
                <div>
                  <h4 className="font-semibold text-lg mb-4">Recent Communications</h4>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Welcome Email</span>
                            <Badge variant="outline" className="text-xs">Email</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Welcome to Momentum Gym! Here's everything you need to know...</p>
                        </div>
                        <span className="text-xs text-muted-foreground">2 days ago</span>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-green-500" />
                            <span className="font-medium">Class Reminder</span>
                            <Badge variant="outline" className="text-xs">SMS</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Reminder: HIIT Training class tomorrow at 6:00 PM</p>
                        </div>
                        <span className="text-xs text-muted-foreground">1 week ago</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Communication Preferences */}
                <div className="pt-6 border-t">
                  <h4 className="font-semibold text-lg mb-4">Communication Preferences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">Email Notifications</h5>
                          <p className="text-sm text-muted-foreground">Class reminders, promotions</p>
                        </div>
                        <Badge variant="success">Enabled</Badge>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">SMS Notifications</h5>
                          <p className="text-sm text-muted-foreground">Urgent updates, cancellations</p>
                        </div>
                        <Badge variant="secondary">Disabled</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t flex flex-wrap gap-3">
                  <Button onClick={() => handleQuickAction('Send Message')} className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send Message
                  </Button>
                  <Button variant="outline" onClick={() => handleQuickAction('Update Preferences')} className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Update Preferences
                  </Button>
                </div>
              </div>
            </ProfileSectionCard>
          </TabsContent>

          {/* Billing History Tab - Dedicated billing and payment information */}
          <TabsContent value="billing-history" className="space-y-6 mt-6 pt-2">
            {/* Billing Preferences Section */}            <ProfileSectionCard
              title="Billing Preferences"
              icon={Settings}
              description="Essential billing settings"
              isLoading={isLoading}
              className="h-fit bg-gray-50"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">                <EditableInfoRow
                  label="Tax Exempt"
                  value={memberData?.billing_preferences?.tax_exempt ? 'Yes' : 'No'}
                  icon={FileText}
                  isEmpty={memberData?.billing_preferences?.tax_exempt === undefined}
                  field="billing_tax_exempt"
                  editValue={editFormData.billing_tax_exempt}
                  onInputChange={handleInputChange}
                  options={[
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' }
                  ]}
                  placeholder="Select tax status"
                />                <EditableInfoRow
                  label="Statement Delivery"
                  value={memberData?.billing_preferences?.statement_delivery || 'Email'}
                  icon={Mail}
                  isEmpty={!memberData?.billing_preferences?.statement_delivery}
                  field="billing_statement_delivery"
                  editValue={editFormData.billing_statement_delivery}
                  onInputChange={handleInputChange}
                  options={[
                    { value: 'email', label: 'Email' },
                    { value: 'print', label: 'Print' },
                    { value: 'both', label: 'Both' },
                    { value: 'none', label: 'None' }
                  ]}
                  placeholder="Select delivery method"
                /><EditableInfoRow
                  label="Payment Reminders"
                  value={memberData?.billing_preferences?.payment_reminders ? 'Enabled' : 'Disabled'}
                  icon={Bell}
                  isEmpty={memberData?.billing_preferences?.payment_reminders === undefined}
                  field="billing_payment_reminders"
                  editValue={editFormData.billing_payment_reminders}
                  onInputChange={handleInputChange}
                  options={[
                    { value: 'true', label: 'Enabled' },
                    { value: 'false', label: 'Disabled' }
                  ]}
                  placeholder="Select preference"
                />
              </div>
            </ProfileSectionCard>

            {/* Billing History Section */}
            <BillingHistorySection memberId={memberData.id} />
          </TabsContent>

          {/* Notes & Documents Tab - Member notes and document management */}
          <TabsContent value="notes-documents" className="space-y-6 mt-6 pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Member Documents */}
              <div className="lg:col-span-2">
                <ProfileSectionCard
                  title="Member Documents"
                  icon={FolderOpen}
                  description="Uploaded documents, forms, and file attachments"

                >
                  <div className="space-y-4">
                    {/* Document List */}
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div>
                              <h5 className="font-medium">Membership Agreement</h5>
                              <p className="text-sm text-muted-foreground">Signed on {format(new Date(), 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-green-500" />
                            <div>
                              <h5 className="font-medium">Waiver Form</h5>
                              <p className="text-sm text-muted-foreground">Uploaded 2 weeks ago</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                      <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">Upload new documents</p>
                      <Button variant="outline" size="sm">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Choose Files
                      </Button>
                    </div>
                  </div>
                </ProfileSectionCard>
              </div>

              {/* Staff Notes */}
              <div className="lg:col-span-1">
                <ProfileSectionCard
                  title="Staff Notes"
                  icon={MessageSquare}
                  description="Internal notes about this member"

                >
                  <StaffNotesSection memberId={memberData.id} staffId={loggedInStaff.id} />
                </ProfileSectionCard>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals and Dialogs */}
      {memberData && (
        <>
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            memberData={memberData}
            onSave={handleSaveProfile}
          />
          <AssignMembershipDialog
            isOpen={isAssignMembershipDialogOpen}
            onClose={() => setIsAssignMembershipDialogOpen(false)}
            memberId={memberData.id}
            memberName={memberData.name}
            currentMembershipTypeId={memberData.current_membership_type_id}
            onMembershipAssigned={handleMembershipAssigned}
          />

          {/* Membership Signup Wizard */}
          <MembershipSignupWizard
            isOpen={isMembershipSignupWizardOpen}
            onClose={() => setIsMembershipSignupWizardOpen(false)}
            memberId={memberData.id}
            initialMemberData={{
              first_name: memberData.first_name,
              last_name: memberData.last_name,
              email: memberData.email,
              phone: memberData.phone,
              address: memberData.address,
              city: memberData.city,
              state: memberData.state,
              zip_code: memberData.zip_code,
              date_of_birth: memberData.date_of_birth,
              gender: memberData.gender,
              access_card_number: memberData.access_card_number,
              emergency_contact_name: memberData.emergency_contact_name,
              emergency_contact_relationship: memberData.emergency_contact_relationship,
              emergency_contact_phone: memberData.emergency_contact_phone
            }}
            onComplete={handleMembershipSignupComplete}
          />
        </>
      )}

      {memberData && (
        <>
          <EditMembershipDialog
            isOpen={isEditMembershipDialogOpen}
            onClose={() => setIsEditMembershipDialogOpen(false)}
            membership={editingMembership}
            onMembershipUpdated={handleMembershipUpdated}
          />

          {/* Family Dialog */}
          <Dialog open={isFamilyDialogOpen} onOpenChange={setIsFamilyDialogOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family Management
                </DialogTitle>
                <DialogDescription>
                  Manage family relationships, shared memberships, and sponsored memberships for {memberData?.first_name || 'this member'}.
                </DialogDescription>
              </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            <FamilyManagementDialog
              memberData={memberData}
              isOpen={isFamilyDialogOpen}
              onClose={() => setIsFamilyDialogOpen(false)}
              onUpdate={() => {
                // Refresh member data if needed
                if (memberData?.id) {
                  // Could trigger a refresh of member data here
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFamilyDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}

      {/* Floating Global Save Button - Bottom Center of Main Content */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-40" style={{ marginLeft: '8rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDiscardChanges}
            className="px-3 py-2 text-xs font-medium border-gray-300 text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-lg"
          >
            <X className="h-3 w-3 mr-1" />
            Discard
          </Button>
          <Button
            size="sm"
            onClick={handleGlobalSave}
            disabled={isSaving}
            className="px-3 py-2 text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-all duration-200 shadow-lg"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 mr-1" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
    </div>
  );
};

export default StaffMemberProfilePage;



