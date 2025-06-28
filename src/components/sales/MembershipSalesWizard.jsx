import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, CreditCard, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

// Import phase components
import PersonalInfoStep from './steps/PersonalInfoStep';
import MembershipSelectionStep from './steps/MembershipSelectionStep';
import AgreementStep from './steps/AgreementStep';

const STEPS = [
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Confirm member details',
    icon: User,
    component: PersonalInfoStep
  },
  {
    id: 'membership-selection',
    title: 'Membership & Billing',
    description: 'Select plan and configure billing',
    icon: CreditCard,
    component: MembershipSelectionStep
  },
  {
    id: 'agreement',
    title: 'Agreement & Signature',
    description: 'Review and sign agreement',
    icon: FileText,
    component: AgreementStep
  }
];

const MembershipSalesWizard = ({ 
  isOpen, 
  onClose, 
  existingMember = null, 
  onComplete 
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [salesData, setSalesData] = useState({
    // Personal Information
    personalInfo: {
      first_name: existingMember?.first_name || '',
      last_name: existingMember?.last_name || '',
      email: existingMember?.email || '',
      phone: existingMember?.phone || '',
      address: existingMember?.address || '',
      city: existingMember?.city || '',
      state: existingMember?.state || '',
      zip_code: existingMember?.zip_code || '',
      dob: existingMember?.dob || '',
      emergency_contact_name: existingMember?.emergency_contact_name || '',
      emergency_contact_phone: existingMember?.emergency_contact_phone || '',
      emergency_contact_relationship: existingMember?.emergency_contact_relationship || ''
    },
    // Membership Selection
    membershipSelection: {
      membershipTypeId: '',
      startDate: new Date().toISOString().split('T')[0],
      billDate: null,
      primaryMemberId: existingMember?.id || null,
      monthlyFee: 0,
      enrollmentFee: 0,
      contractLength: 0,
      billingSchedule: []
    },
    // Agreement
    agreement: {
      terms: '',
      signature: null,
      signedAt: null,
      ipAddress: null
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [stepValidation, setStepValidation] = useState({
    'personal-info': false,
    'membership-selection': false,
    'agreement': false
  });

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

  // Get current step component
  const CurrentStepComponent = STEPS[currentStep]?.component;

  // Handle step navigation
  const handleNext = async () => {
    const currentStepId = STEPS[currentStep].id;
    
    // Validate current step before proceeding
    if (!stepValidation[currentStepId]) {
      toast({
        title: "Incomplete Information",
        description: "Please complete all required fields before proceeding.",
        variant: "destructive"
      });
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - complete the sale
      await handleCompleteSale();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle completing the sale
  const handleCompleteSale = async () => {
    try {
      setIsLoading(true);

      console.log('Completing sale with data:', salesData);

      // Step 1: Validate existing member
      if (!existingMember?.id) {
        throw new Error('No existing member provided. Cannot create membership without a member profile.');
      }

      const memberId = existingMember.id;

      // Step 2: Check if member already has an active membership and end it
      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', memberId)
        .eq('status', 'active')
        .maybeSingle();

      if (existingMembership) {
        console.log('Found existing active membership, ending it before creating new one:', existingMembership);

        // End the existing membership
        const { error: endMembershipError } = await supabase
          .from('memberships')
          .update({
            status: 'cancelled',
            end_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMembership.id);

        if (endMembershipError) {
          console.error('Error ending existing membership:', endMembershipError);
          throw new Error('Failed to end existing membership. Please try again.');
        }

        console.log('Successfully ended existing membership');
      }

      // Step 3: Use existing member's system_member_id
      const systemMemberId = existingMember.system_member_id;

      if (!systemMemberId) {
        throw new Error('Member profile must have a system_member_id before creating a membership. Please ensure the profile was created properly.');
      }

      // Step 4: Create membership record
      const membershipData = {
        user_id: memberId,
        system_member_id: systemMemberId,
        membership_type_id: salesData.membershipSelection.membershipType.id,
        start_date: new Date().toISOString().split('T')[0],
        expiration_date: salesData.membershipSelection.membershipType.duration_months
          ? new Date(Date.now() + salesData.membershipSelection.membershipType.duration_months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null,
        status: 'active',
        monthly_fee: salesData.membershipSelection.monthlyFee,
        auto_renew: true,
        is_primary_member: true,
        role: 'member'
      };

      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .insert(membershipData)
        .select()
        .single();

      if (membershipError) throw membershipError;

      console.log('Membership created successfully for existing member:', membership);

      toast({
        title: "Membership Created Successfully",
        description: existingMembership
          ? `${salesData.personalInfo.first_name}'s previous membership was ended and new membership has been created and is now active.`
          : `${salesData.personalInfo.first_name}'s membership has been created and is now active.`
      });

      onComplete?.(salesData);
      onClose();
    } catch (error) {
      console.error('Error completing sale:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete the membership sale. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update sales data
  const updateSalesData = (section, data) => {
    setSalesData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data
      }
    }));
  };

  // Update step validation
  const updateStepValidation = (stepId, isValid) => {
    setStepValidation(prev => ({
      ...prev,
      [stepId]: isValid
    }));
  };

  // Reset wizard when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsLoading(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">
            {existingMember ? 'Add Membership' : 'New Membership Sale'}
          </DialogTitle>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {STEPS.length}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
          </div>
        </DialogHeader>

        {/* Step Navigation */}
        <div className="flex justify-center space-x-4 pb-4 border-b">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = stepValidation[step.id];
            const isPast = index < currentStep;
            
            return (
              <div
                key={step.id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : isPast 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <div className="hidden sm:block">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs opacity-75">{step.description}</div>
                </div>
                {isCompleted && (
                  <Badge variant="secondary" className="ml-2">✓</Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {CurrentStepComponent && (
            <CurrentStepComponent
              salesData={salesData}
              updateSalesData={updateSalesData}
              updateStepValidation={updateStepValidation}
              existingMember={existingMember}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={isLoading || !stepValidation[STEPS[currentStep].id]}
              className="flex items-center space-x-2"
            >
              <span>
                {currentStep === STEPS.length - 1 ? 'Complete Sale' : 'Next'}
              </span>
              {currentStep < STEPS.length - 1 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MembershipSalesWizard;
