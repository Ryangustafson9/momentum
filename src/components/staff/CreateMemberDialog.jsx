import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Shield, Save, X, AlertTriangle, UserPlus, Calendar, MapPin, CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient';

const CreateMemberDialog = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const firstNameRef = useRef(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    access_card_number: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_email: '',
    emergency_contact_relationship: '',
    status: 'active'
  });

  // Auto-focus first field when dialog opens
  useEffect(() => {
    if (isOpen && firstNameRef.current) {
      setTimeout(() => {
        firstNameRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        address: '',
        access_card_number: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_email: '',
        emergency_contact_relationship: '',
        status: 'active'
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors below and try again.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate system member ID
      const systemMemberId = Math.floor(100000 + Math.random() * 900000);
      
      // Prepare data for database
      const memberData = {
        system_member_id: systemMemberId,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        access_card_number: formData.access_card_number.trim() || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
        emergency_contact_email: formData.emergency_contact_email.trim() || null,
        emergency_contact_relationship: formData.emergency_contact_relationship || null,
        status: formData.status,
        role: 'member',
        display_name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([memberData])
        .select()
        .single();

      if (error) {
        console.error('Error creating member:', error);
        throw error;
      }

      toast({
        title: "Member Created",
        description: `${memberData.display_name} has been successfully added to the system.`,
        variant: "default"
      });

      onSuccess?.(data);
      onClose();

    } catch (error) {
      console.error('Error creating member:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create member. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-4xl max-h-[90vh] overflow-hidden bg-gray-50"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-3 text-foreground">
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            Create New Member
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Enter the member's information below. Required fields are marked with an asterisk (*).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            {/* Personal Information Section */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-3 text-foreground">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Row 1: First Name, Last Name, Date of Birth */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="First Name"
                    required
                    error={errors.first_name}
                  >
                    <Input
                      ref={firstNameRef}
                      value={formData.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      placeholder="Enter first name"
                      className={errors.first_name ? "border-destructive" : ""}
                      tabIndex={1}
                    />
                  </FormField>
                  
                  <FormField
                    label="Last Name"
                    required
                    error={errors.last_name}
                  >
                    <Input
                      value={formData.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      placeholder="Enter last name"
                      className={errors.last_name ? "border-destructive" : ""}
                      tabIndex={2}
                    />
                  </FormField>
                  
                  <FormField
                    label="Date of Birth"
                    icon={Calendar}
                  >
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleChange('date_of_birth', e.target.value)}
                      tabIndex={3}
                    />
                  </FormField>
                </div>

                {/* Row 2: Gender, Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Gender">
                    <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                      <SelectTrigger tabIndex={4}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  <FormField
                    label="Email Address"
                    required
                    error={errors.email}
                    icon={Mail}
                  >
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className={errors.email ? "border-destructive" : ""}
                      tabIndex={5}
                    />
                  </FormField>
                </div>

                {/* Row 3: Phone, Access Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Phone Number"
                    required
                    error={errors.phone}
                    icon={Phone}
                  >
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      className={errors.phone ? "border-destructive" : ""}
                      tabIndex={6}
                    />
                  </FormField>
                  
                  <FormField
                    label="Access Card Number"
                    icon={CreditCard}
                  >
                    <Input
                      value={formData.access_card_number}
                      onChange={(e) => handleChange('access_card_number', e.target.value)}
                      placeholder="Enter access card number"
                      tabIndex={7}
                    />
                  </FormField>
                </div>

                {/* Address */}
                <FormField
                  label="Address"
                  icon={MapPin}
                >
                  <Input
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Enter full address"
                    tabIndex={8}
                  />
                </FormField>
              </CardContent>
            </Card>

            {/* Emergency Contact Section */}
            <Card className="border-gray-200 bg-white shadow-sm mt-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-3 text-foreground">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-orange-100 text-orange-600">
                    <Shield className="h-4 w-4" />
                  </div>
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Emergency Contact Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Emergency Contact Name">
                    <Input
                      value={formData.emergency_contact_name}
                      onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                      placeholder="Enter emergency contact name"
                      tabIndex={9}
                    />
                  </FormField>

                  <FormField label="Relationship">
                    <Select
                      value={formData.emergency_contact_relationship}
                      onValueChange={(value) => handleChange('emergency_contact_relationship', value)}
                    >
                      <SelectTrigger tabIndex={10}>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Child">Child</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                        <SelectItem value="Friend">Friend</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Emergency Phone" icon={Phone}>
                    <Input
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                      placeholder="Enter emergency contact phone"
                      tabIndex={11}
                    />
                  </FormField>
                </div>

                {/* Emergency Email */}
                <FormField label="Emergency Contact Email" icon={Mail}>
                  <Input
                    type="email"
                    value={formData.emergency_contact_email}
                    onChange={(e) => handleChange('emergency_contact_email', e.target.value)}
                    placeholder="Enter emergency contact email"
                    tabIndex={12}
                  />
                </FormField>
              </CardContent>
            </Card>
          </div>

          {/* Dialog Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Member
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Form Field Component
const FormField = ({ label, required = false, error, icon: Icon, children, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
      {Icon && <Icon className="h-3 w-3 text-gray-500" />}
      {label}
      {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
    {error && (
      <p className="text-xs text-destructive flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        {error}
      </p>
    )}
  </div>
);

export default CreateMemberDialog;
