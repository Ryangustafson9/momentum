import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Shield, Edit3, Save, CreditCard, CalendarCheck, AlertTriangle, LifeBuoy, Image as ImageIcon,
  Fingerprint, Settings, Settings as SettingsIcon, MessageSquare, CalendarDays, FileText, Users, LogOut, MoreVertical,
  PauseCircle, XCircle, Repeat, Trash2, Briefcase, Home, DollarSign, CheckSquare, Info, PlusCircle, ChevronDown, ChevronUp, UserCog, UserX, UserCheck, Star, Clock, X, KeySquare, ClipboardList, Send, FolderOpen, History, Link, Bell, Calendar
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Contact Information
              </h4>
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
    onChange(fieldName, newValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setLocalValue(value || '');
      setIsEditing(false);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        {Icon && <Icon className="h-4 w-4 text-gray-500" />}
        {label}
        {isRequired && <span className="text-red-500">*</span>}
      </Label>

      {isEditing ? (
        <div className="space-y-2">
          {options ? (
            <Select value={localValue} onValueChange={(newValue) => {
              setLocalValue(newValue);
              onChange(fieldName, newValue);
              setIsEditing(false);
            }}>
              <SelectTrigger className="w-full">
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
              value={localValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setIsEditing(false)}
              placeholder={placeholder}
              className="w-full"
              autoFocus
            />
          ) : (
            <Input
              type={type}
              value={localValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setIsEditing(false)}
              placeholder={placeholder}
              className="w-full"
              autoFocus
            />
          )}
        </div>
      ) : (
        <div
          className="min-h-[40px] px-3 py-2 border border-gray-200 rounded-md cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center"
          onClick={() => setIsEditing(true)}
        >
          {value ? (
            <span className="text-gray-900">{value}</span>
          ) : (
            <span className="text-gray-400 italic">{placeholder || `Enter ${label.toLowerCase()}`}</span>
          )}
        </div>
      )}
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
            className="w-full"
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
            <SelectTrigger className="w-full">
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
            className="w-full"
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
      return <span className="text-gray-900">{value}</span>;
    }

    return <span className="text-gray-400 italic">Not provided</span>;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        {field.label}
        {field.is_required && <span className="text-red-500">*</span>}
      </Label>

      {isEditing ? (
        <div className="space-y-2">
          {renderEditField()}
        </div>
      ) : (
        <div
          className="min-h-[40px] px-3 py-2 border border-gray-200 rounded-md cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center"
          onClick={() => setIsEditing(true)}
        >
          {renderDisplayValue()}
        </div>
      )}
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

  // Initialize form data when member data changes
  useEffect(() => {
    if (memberData) {
      const initialData = {
        first_name: memberData.first_name || '',
        last_name: memberData.last_name || '',
        email: memberData.email || '',
        phone: memberData.phone || '',
        address: memberData.address || '',
        city: memberData.city || '',
        state: memberData.state || '',
        zip_code: memberData.zip_code || '',
        date_of_birth: memberData.date_of_birth || '',
        gender: memberData.gender || '',
        access_card_number: memberData.access_card_number || '',
        emergency_contact_name: memberData.emergency_contact_name || '',
        emergency_contact_phone: memberData.emergency_contact_phone || '',
        emergency_contact_relationship: memberData.emergency_contact_relationship || '',
        notes: memberData.notes || '',
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
      const hasChanges = Object.keys(newData).some(key => newData[key] !== originalData[key]);
      console.log('Has changes:', hasChanges, { newData, originalData });
      setHasUnsavedChanges(hasChanges);
      return newData;
    });
  }, [originalData]);
  // Global save function
  const handleGlobalSave = async () => {
    console.log('handleGlobalSave called', { 
      memberDataId: memberData?.id, 
      hasUnsavedChanges, 
      formData 
    });
    
    if (!memberData?.id || !hasUnsavedChanges) {
      console.log('Early return - no member ID or no unsaved changes');
      return;
    }

    setIsSaving(true);
    try {
      // Separate custom fields from regular fields
      const customFieldUpdates = {};
      const profileUpdates = {};

      Object.keys(formData).forEach(key => {
        if (key.startsWith('custom_field_')) {
          const fieldId = key.replace('custom_field_', '');
          customFieldUpdates[fieldId] = formData[key];
        } else {
          profileUpdates[key] = formData[key];
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

      console.log('Save completed successfully');
      toast({
        title: "Profile Updated",
        description: "All changes have been saved successfully.",
        variant: "default"
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
      navigate('/staff/dashboard');
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

        // Fetch other related data
        fetchInitialData(member.id);
      } else {
        toast({ title: "Not Found", description: `Member with ID ${systemMemberId} not found.`, variant: "destructive" });
        navigate('/staff/members');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-600">Loading member profile...</p>
          <p className="text-xs text-gray-400 mt-2">
            Loading: {isLoading ? 'true' : 'false'} |
            Member: {memberData ? 'loaded' : 'loading'} |
            Staff: {loggedInStaff ? 'loaded' : 'loading'}
          </p>
        </div>
      </div>
    );
  }
    const currentMembership = membershipTypes.find(mt => mt.id === memberData.current_membership_type_id);
  
  // Construct member name with proper fallbacks
  let displayName = "Member Name"; // Default fallback
  if (memberData.first_name && memberData.last_name) {
    displayName = `${memberData.first_name} ${memberData.last_name}`;
  } else if (memberData.first_name) {
    displayName = memberData.first_name;
  } else if (memberData.last_name) {
    displayName = memberData.last_name;
  } else if (memberData.name && memberData.name.trim() !== "") {
    displayName = memberData.name;
  } else if (memberData.email) {
    displayName = memberData.email.split('@')[0]; // Use email username as fallback
  }
  
  const memberNameForAvatar = displayName;
  const avatarSrc = memberData.profile_picture_url || '';

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

  return (    <div className="min-h-screen transition-all duration-500 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-2 sm:px-4 py-6 space-y-6"
      >
      <Card className="overflow-hidden shadow-xl rounded-xl bg-card">
        <div className="relative p-6 flex flex-col items-center bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/20">
          {/* Email Button - Top Left */}
          {memberData?.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = `mailto:${memberData.email}`}
              className="absolute top-4 left-4 px-3 py-2 text-xs font-medium border-blue-300 text-blue-600 hover:bg-blue-50 transition-all duration-200 z-10"
            >
              <Mail className="h-3 w-3 mr-1" />
              Email
            </Button>
          )}

          {/* Global Save Button - Top Right */}
          {hasUnsavedChanges && (
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscardChanges}
                className="px-3 py-2 text-xs font-medium border-gray-300 text-gray-600 hover:bg-gray-50 transition-all duration-200"
              >
                <X className="h-3 w-3 mr-1" />
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleGlobalSave}
                disabled={isSaving}
                className="px-3 py-2 text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
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
          {/* Enhanced Profile Photo Section */}
          <div className="relative">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-lg">
              {avatarSrc ? (
                <AvatarImage src={avatarSrc} alt={memberData.name || "Member avatar"} />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-muted rounded-full">
                  <User className="h-20 w-20 text-muted-foreground" />
                </div>
              )}
              <AvatarFallback className="text-4xl">{getInitials(memberNameForAvatar)}</AvatarFallback>
            </Avatar>
            
            {/* Status Indicator Overlay */}
            <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-2 shadow-lg">
              {memberData.status === 'Active' ? (
                <CheckSquare className="h-6 w-6 text-green-500" />
              ) : memberData.status === 'Inactive' ? (
                <PauseCircle className="h-6 w-6 text-yellow-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
            </div>
          </div>

          {/* Enhanced Name and Identity Section */}
          <div className="mt-6 text-center space-y-3">
            {/* Primary Name Display */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                {displayName}
              </h1>
            </div>

            {/* Status Badges Row */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Membership Status */}
              <Badge 
                variant={statusVariant(memberData.status)} 
                className="px-3 py-1.5 text-sm font-medium"
              >
                {memberData.status === 'Active' && <CheckSquare className="h-4 w-4 mr-1" />}
                {memberData.status === 'Inactive' && <PauseCircle className="h-4 w-4 mr-1" />}
                {(!memberData.status || memberData.status === 'Unknown') && <AlertTriangle className="h-4 w-4 mr-1" />}
                {memberData.status || 'Unknown'}
              </Badge>

              {/* Corporate Affiliation - Placeholder for future feature */}
              {/* TODO: Add corporate affiliation when implemented */}
              {/* {memberData.corporate_affiliation && (
                <Badge variant="outline" className="px-3 py-1.5 text-sm border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900/30">
                  <Briefcase className="h-4 w-4 mr-1" />
                  {memberData.corporate_affiliation.company_name} Employee
                </Badge>
              )} */}

              {/* Member Type */}
              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                {memberData.role === 'admin' ? 'Administrator' : 
                 memberData.role === 'staff' ? 'Staff Member' : 'Member'}
              </Badge>
            </div>

            {/* Key Information Row */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
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

              {/* Email (for quick reference) */}
              {memberData.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{memberData.email}</span>
                </div>
              )}
            </div>            {/* Quick Actions removed - global edit functionality disabled */}

            {/* Additional Status Indicators */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {/* First Visit Indicator */}
              {memberData.join_date && new Date(memberData.join_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600">
                  <Star className="h-3 w-3 mr-1" />
                  New Member
                </Badge>
              )}
              
              {/* Verification Status - Placeholder for corporate members */}
              {/* TODO: Add verification status for corporate members */}
              {/* {memberData.verification_status === 'verified' && (
                <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 dark:bg-green-900/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )} */}
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
      </div>      {/* Modern Tab Navigation - Separate from content */}
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

              {/* Personal & Contact Information Section */}
              <ProfileSectionCard
                title="Personal & Contact Information"
                icon={User}
                description="Personal details, contact information, and mailing address"
                isLoading={isLoading}
                className="h-fit"
              >
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      Personal Details
                    </h4>

                    {/* Member ID and Access Card - Top row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <InfoRow
                        label="Member ID"
                        value={memberData?.system_member_id || memberData?.id}
                        icon={Fingerprint}
                        className="bg-primary/5 border-primary/20"
                      />
                      <InlineEditField
                        label="Access Card"
                        value={formData.access_card_number}
                        fieldName="access_card_number"
                        icon={KeySquare}
                        placeholder="Enter access card number"
                        onChange={handleFieldChange}
                      />
                    </div>

                    {/* First Name and Last Name - Second row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <InlineEditField
                        label="First Name"
                        value={formData.first_name}
                        fieldName="first_name"
                        icon={User}
                        isRequired={true}
                        placeholder="Enter first name"
                        onChange={handleFieldChange}
                      />
                      <InlineEditField
                        label="Last Name"
                        value={formData.last_name}
                        fieldName="last_name"
                        icon={User}
                        isRequired={true}
                        placeholder="Enter last name"
                        onChange={handleFieldChange}
                      />
                    </div>

                    {/* Date of Birth and Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <InlineEditField
                        label="Date of Birth"
                        value={formData.date_of_birth}
                        fieldName="date_of_birth"
                        type="date"
                        icon={CalendarDays}
                        placeholder="Select date of birth"
                        onChange={handleFieldChange}
                      />
                      <InlineEditField
                        label="Gender"
                        value={formData.gender}
                        fieldName="gender"
                        icon={User}
                        options={[
                          { value: 'Male', label: 'Male' },
                          { value: 'Female', label: 'Female' },
                          { value: 'Other', label: 'Other' },
                          { value: 'Prefer not to say', label: 'Prefer not to say' }
                        ]}
                        placeholder="Select gender"
                        onChange={handleFieldChange}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-green-600" />
                      Contact Information
                    </h4>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InlineEditField
                          label="Email Address"
                          value={formData.email}
                          fieldName="email"
                          type="email"
                          icon={Mail}
                          isRequired={true}
                          placeholder="Enter email address"
                          onChange={handleFieldChange}
                        />
                        <InlineEditField
                          label="Phone Number"
                          value={formData.phone}
                          fieldName="phone"
                          type="tel"
                          icon={Phone}
                          isRequired={true}
                          placeholder="Enter phone number"
                          onChange={handleFieldChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mailing Address */}
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Home className="h-4 w-4 text-purple-600" />
                      Mailing Address
                    </h4>

                    <div className="space-y-4">
                      <InlineEditField
                        label="Street Address"
                        value={formData.address}
                        fieldName="address"
                        icon={Home}
                        placeholder="Enter street address"
                        onChange={handleFieldChange}
                      />

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        <InlineEditField
                          label="City"
                          value={formData.city}
                          fieldName="city"
                          icon={Home}
                          placeholder="Enter city"
                          onChange={handleFieldChange}
                        />
                        <InlineEditField
                          label="State"
                          value={formData.state}
                          fieldName="state"
                          icon={Home}
                          placeholder="Enter state"
                          onChange={handleFieldChange}
                        />
                        <InlineEditField
                          label="ZIP Code"
                          value={formData.zip_code}
                          fieldName="zip_code"
                          icon={Home}
                          placeholder="Enter ZIP code"
                          onChange={handleFieldChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact Section */}
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-orange-600" />
                      Emergency Contact
                    </h4>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InlineEditField
                          label="Contact Name"
                          value={formData.emergency_contact_name}
                          fieldName="emergency_contact_name"
                          icon={User}
                          placeholder="Enter emergency contact name"
                          onChange={handleFieldChange}
                        />
                        <InlineEditField
                          label="Relationship"
                          value={formData.emergency_contact_relationship}
                          fieldName="emergency_contact_relationship"
                          icon={Users}
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
                        />
                      </div>
                      <InlineEditField
                        label="Emergency Phone"
                        value={formData.emergency_contact_phone}
                        fieldName="emergency_contact_phone"
                        type="tel"
                        icon={Phone}
                        placeholder="Enter emergency contact phone"
                        onChange={handleFieldChange}
                      />
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      Notes
                    </h4>
                    <InlineEditField
                      label="Member Notes"
                      value={formData.notes}
                      fieldName="notes"
                      type="textarea"
                      icon={FileText}
                      placeholder="Add notes about this member..."
                      onChange={handleFieldChange}
                    />
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
                                No active memberships found
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
    </motion.div>
    </div>
  );
};

export default StaffMemberProfilePage;



