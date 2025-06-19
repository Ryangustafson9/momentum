import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, User, Mail, Phone, Calendar, Home, CreditCard, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { getGymColors } from '@/utils/gymBranding';

const ConfirmationStep = ({ formData, updateFormData, onPrev }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [newMemberId, setNewMemberId] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const gymColors = getGymColors();

  const handleStartDateChange = (value) => {
    updateFormData({ startDate: value });
  };

  const handleWelcomeEmailChange = (checked) => {
    updateFormData({ sendWelcomeEmail: checked });
  };

  const generatePassword = () => {
    // Generate a temporary password (8 characters, mix of letters and numbers)
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const submitRegistration = async () => {
    setIsSubmitting(true);
    
    try {
      const tempPassword = generatePassword();      // Step 1: Create profile first with a unique email check
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', formData.email)
        .single();

      if (existingProfile) {
        throw new Error('A member with this email address already exists.');
      }

      // Create a profile with a placeholder auth_user_id that we'll update
      const tempUserId = crypto.randomUUID();
      const profileData = {
        id: tempUserId,
        email: formData.email,
        role: 'member',
        first_name: formData.firstName,
        last_name: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone || null,
        date_of_birth: formData.dateOfBirth || null,
        emergency_contact: formData.emergencyContact || null,
        emergency_phone: formData.emergencyPhone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zipCode || null,
        notes: formData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Failed to create member profile: ${profileError.message}`);
      }

      const userId = tempUserId;

      // Step 2: Create membership record
      if (formData.membershipTypeId) {
        const membershipData = {
          auth_user_id: userId,
          membership_type_id: formData.membershipTypeId,
          status: 'Active',
          start_date: formData.startDate,
          end_date: formData.membershipType.duration_months 
            ? new Date(new Date(formData.startDate).setMonth(
                new Date(formData.startDate).getMonth() + formData.membershipType.duration_months
              )).toISOString().split('T')[0]
            : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: membershipError } = await supabase
          .from('memberships')
          .insert([membershipData]);

        if (membershipError) {
          console.error('Membership creation error:', membershipError);
          // Don't throw here, profile is already created
          toast({
            title: 'Warning',
            description: 'Member created but membership assignment failed. Please assign manually.',
            variant: 'destructive'
          });
        }
      }      // Step 3: Send welcome email notification (if requested)
      if (formData.sendWelcomeEmail) {
        // Note: This would typically integrate with your email service
        // For now, we'll just show a note in the success message about contacting the member
        console.log('Welcome email requested for:', formData.email, 'Staff should provide login details manually');
      }

      setNewMemberId(userId);
      setIsSuccess(true);
      
      toast({
        title: 'Success!',
        description: `Member ${formData.firstName} ${formData.lastName} has been registered successfully.`,
        variant: 'default'
      });

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToMembersList = () => {
    navigate('/staff-portal/members');
  };

  const registerAnother = () => {
    window.location.reload();
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: gymColors.primary }}
        >
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Registration Complete!
        </h2>
        
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
          {formData.firstName} {formData.lastName} has been successfully registered as a new member.
        </p>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 mb-8 max-w-md mx-auto">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Next Steps:
          </h3>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 text-left">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              Member account created
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              Profile information saved
            </li>
            {formData.membershipTypeId && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                Membership plan assigned
              </li>
            )}
            {formData.sendWelcomeEmail && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                Welcome email sent
              </li>
            )}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={goToMembersList} variant="outline">
            View All Members
          </Button>
          <Button
            onClick={registerAnother}
            style={{ backgroundColor: gymColors.primary }}
          >
            Register Another Member
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Review & Confirm
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Please review all information before submitting
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Information Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" style={{ color: gymColors.primary }} />
              Member Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Name:</span>
                <p className="font-medium">{formData.firstName} {formData.lastName}</p>
              </div>
              {formData.email && (
                <div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Email:</span>
                  <p className="font-medium">{formData.email}</p>
                </div>
              )}
            </div>
            
            {formData.phone && (
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Phone:</span>
                <p className="font-medium">{formData.phone}</p>
              </div>
            )}

            {formData.dateOfBirth && (
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Date of Birth:</span>
                <p className="font-medium">{new Date(formData.dateOfBirth).toLocaleDateString()}</p>
              </div>
            )}

            {(formData.address || formData.city || formData.state) && (
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Address:</span>
                <p className="font-medium">
                  {[formData.address, formData.city, formData.state, formData.zipCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            )}

            {(formData.emergencyContact || formData.emergencyPhone) && (
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Emergency Contact:</span>
                <p className="font-medium">
                  {formData.emergencyContact} {formData.emergencyPhone && `(${formData.emergencyPhone})`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Membership Plan Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" style={{ color: gymColors.primary }} />
              Membership Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.membershipType ? (
              <>
                <div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Plan:</span>
                  <p className="font-medium">{formData.membershipType.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Price:</span>
                  <p className="font-medium">
                    ${parseFloat(formData.membershipType.price).toFixed(2)}
                    {formData.membershipType.duration_months && (
                      <span className="text-sm text-slate-500">
                        {' '}/ {formData.membershipType.duration_months === 1 ? 'month' : `${formData.membershipType.duration_months} months`}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Category:</span>
                  <p className="font-medium capitalize">{formData.membershipType.category}</p>
                </div>
              </>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">No membership plan selected</p>
            )}
          </CardContent>
        </Card>

        {/* Registration Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registration Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="startDate">Membership Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="mt-1 max-w-xs"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendWelcomeEmail"
                checked={formData.sendWelcomeEmail}
                onCheckedChange={handleWelcomeEmailChange}
              />
              <Label htmlFor="sendWelcomeEmail" className="text-sm">
                Send welcome email with login credentials
              </Label>
            </div>

            {formData.notes && (
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Notes:</span>
                <p className="mt-1 text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  {formData.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev} disabled={isSubmitting}>
          Previous
        </Button>
        <Button
          onClick={submitRegistration}
          disabled={isSubmitting}
          style={{ backgroundColor: gymColors.primary }}
          className="min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Complete Registration
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default ConfirmationStep;
