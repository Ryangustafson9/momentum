import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  CreditCard,
  FileText,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  X,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

// Import step components
import PersonalInfoStep from './wizard-steps/PersonalInfoStep';
import MembershipSaleStep from './wizard-steps/MembershipSaleStep';
import AgreementsPaymentStep from './wizard-steps/AgreementsPaymentStep';

const WIZARD_STEPS = [
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Confirm member details and contact information',
    icon: User,
    component: PersonalInfoStep
  },
  {
    id: 'membership-sale',
    title: 'Membership & Billing',
    description: 'Select membership plan and configure billing',
    icon: CreditCard,
    component: MembershipSaleStep
  },
  {
    id: 'agreements-payment',
    title: 'Agreements & Payment',
    description: 'Complete agreements and process payment',
    icon: FileText,
    component: AgreementsPaymentStep
  }
];

const MembershipSignupWizard = ({
  isOpen,
  onClose,
  memberId = null,
  initialMemberData = null,
  onComplete
}) => {
  // Always start at step 0 (Personal Information Confirmation)
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    personalInfo: initialMemberData || {},
    membershipSelection: {},
    billingConfiguration: {},
    agreements: {},
    payment: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  // Reset wizard when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0); // Always start at step 0 (Personal Information)
      setWizardData({
        personalInfo: initialMemberData || {},
        membershipSelection: {},
        billingConfiguration: {},
        agreements: {},
        payment: {}
      });
      setErrors({});
    }
  }, [isOpen, initialMemberData, memberId]);

  const updateWizardData = (stepKey, data) => {
    setWizardData(prev => ({
      ...prev,
      [stepKey]: { ...prev[stepKey], ...data }
    }));
  };

  const validateStep = async (stepIndex) => {
    setIsValidating(true);
    const step = WIZARD_STEPS[stepIndex];
    const stepErrors = {};

    try {
      switch (step.id) {
        case 'personal-info':
          const personalInfo = wizardData.personalInfo || {};
          if (!personalInfo.first_name?.trim()) {
            stepErrors.first_name = 'First name is required';
          }
          if (!personalInfo.last_name?.trim()) {
            stepErrors.last_name = 'Last name is required';
          }
          if (!personalInfo.email?.trim()) {
            stepErrors.email = 'Email is required';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email)) {
            stepErrors.email = 'Please enter a valid email address';
          }
          if (!personalInfo.phone?.trim()) {
            stepErrors.phone = 'Phone number is required';
          } else if (!/^[\d\s\-\(\)\+\.]{10,}$/.test(personalInfo.phone.replace(/\s/g, ''))) {
            stepErrors.phone = 'Please enter a valid phone number (minimum 10 digits)';
          }
          break;

        case 'membership-sale':
          if (!wizardData.membershipSelection?.selectedPlan) {
            stepErrors.selectedPlan = 'Please select a membership plan';
          }
          if (!wizardData.billingConfiguration?.billingCycle) {
            stepErrors.billingCycle = 'Please select a billing cycle';
          }
          if (!wizardData.billingConfiguration?.paymentMethod) {
            stepErrors.paymentMethod = 'Please select a payment method';
          }
          break;

        case 'agreements-payment':
          if (!wizardData.agreements?.termsAccepted) {
            stepErrors.termsAccepted = 'You must accept the terms and conditions';
          }
          if (!wizardData.agreements?.liabilityWaiver) {
            stepErrors.liabilityWaiver = 'You must accept the liability waiver';
          }
          if (!wizardData.agreements?.digitalSignature?.trim()) {
            stepErrors.digitalSignature = 'Digital signature is required';
          }
          break;
      }

      setErrors(stepErrors);
      return Object.keys(stepErrors).length === 0;
    } finally {
      setIsValidating(false);
    }
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      if (currentStep < WIZARD_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
        // Clear errors when moving to next step
        setErrors({});
      } else {
        await handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Process the complete membership signup
      const result = await processMembershipSignup(wizardData, memberId);
      
      toast({
        title: "Membership Created Successfully",
        description: "The new membership has been set up and payment processed.",
        variant: "default"
      });

      onComplete?.(result);
      onClose();
    } catch (error) {
      console.error('Error completing membership signup:', error);
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to complete membership signup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processMembershipSignup = async (data, existingMemberId) => {
    // Implementation for processing the complete signup
    // This would handle member creation, membership assignment, billing setup, and payment processing
    
    let memberId = existingMemberId;
    
    // Create or update member profile
    if (!memberId) {
      const { data: newMember, error: memberError } = await supabase
        .from('profiles')
        .insert([{
          ...data.personalInfo,
          role: 'member',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (memberError) throw memberError;
      memberId = newMember.id;
    } else {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(data.personalInfo)
        .eq('id', memberId);

      if (updateError) throw updateError;
    }

    // Create membership record
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .insert([{
        member_id: memberId,
        membership_type_id: data.membershipSelection.selectedPlan.id,
        status: 'active',
        billing_cycle: data.billingConfiguration.billingCycle,
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (membershipError) throw membershipError;

    // Process payment (mock implementation)
    const paymentResult = {
      id: `payment_${Date.now()}`,
      amount: data.payment.amount,
      status: 'completed',
      method: data.payment.paymentMethod
    };

    return {
      memberId,
      membership,
      payment: paymentResult
    };
  };

  const CurrentStepComponent = WIZARD_STEPS[currentStep]?.component;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 bg-slate-50 flex flex-col">
        <DialogHeader className="px-6 py-4 bg-white border-b border-gray-200/60 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {memberId ? 'Add Membership Plan' : 'New Membership Signup'}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Complete the membership signup process in 3 simple steps
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/60 flex-shrink-0">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 shadow-sm",
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200'
                        : isCompleted
                        ? 'bg-green-600 border-green-600 text-white shadow-green-200'
                        : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                    )}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <p className={cn(
                        "text-sm font-medium transition-colors",
                        isActive
                          ? 'text-blue-700'
                          : isCompleted
                          ? 'text-green-700'
                          : 'text-gray-500'
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 max-w-32">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={cn(
                      "mx-8 h-0.5 w-20 transition-colors duration-300 mt-6",
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 min-h-0">
          <div className="max-w-6xl mx-auto p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {CurrentStepComponent && (
                  <div className="bg-white rounded-lg overflow-hidden">
                    <CurrentStepComponent
                      data={wizardData}
                      updateData={updateWizardData}
                      errors={errors}
                      memberId={memberId}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-200/60 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || isLoading || isValidating}
              className={cn(
                "flex items-center gap-2 min-w-[100px] transition-all duration-200",
                "hover:bg-gray-50 hover:border-gray-400",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 font-medium">
                Step {currentStep + 1} of {WIZARD_STEPS.length}
              </div>
              {(isLoading || isValidating) && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isValidating ? 'Validating...' : 'Processing...'}
                </div>
              )}
            </div>

            <Button
              onClick={handleNext}
              disabled={isLoading || isValidating}
              className={cn(
                "flex items-center gap-2 min-w-[140px] transition-all duration-200",
                "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
                "shadow-sm hover:shadow-md",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
              )}
            >
              {isLoading || isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isValidating ? 'Validating...' : 'Processing...'}
                </>
              ) : currentStep === WIZARD_STEPS.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Complete Signup
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MembershipSignupWizard;
