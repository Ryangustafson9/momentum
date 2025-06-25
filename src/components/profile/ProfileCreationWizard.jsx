import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, User, Phone, CreditCard, CheckCircle } from 'lucide-react';
import ProfileForm from './ProfileForm';
import { MemberProfileService } from '@/services/memberProfileService';

/**
 * Multi-step profile creation wizard with improved UX
 */
const ProfileCreationWizard = ({
  isOpen,
  onClose,
  onComplete,
  userRole = 'member',
  initialData = {},
  showMembershipStep = true
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState(initialData);
  const [createdProfile, setCreatedProfile] = useState(null);

  const steps = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Personal details and contact information',
      icon: User,
      required: true
    },
    {
      id: 2,
      title: 'Contact Details',
      description: 'Phone, address, and emergency contacts',
      icon: Phone,
      required: false
    },
    ...(showMembershipStep ? [{
      id: 3,
      title: 'Membership',
      description: 'Select membership plan and preferences',
      icon: CreditCard,
      required: false
    }] : []),
    {
      id: showMembershipStep ? 4 : 3,
      title: 'Complete',
      description: 'Review and finalize profile creation',
      icon: CheckCircle,
      required: false
    }
  ];

  const totalSteps = steps.length;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = (stepData) => {
    setProfileData(prev => ({ ...prev, ...stepData }));
    handleNext();
  };

  const handleCreateProfile = async (finalData) => {
    setIsLoading(true);
    try {
      // Create temporary profile first
      const result = await MemberProfileService.createTemporaryProfile(finalData);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      setCreatedProfile(result.data);
      
      toast({
        title: "Profile Created",
        description: "Profile has been created successfully!"
      });

      // Move to completion step
      setCurrentStep(totalSteps);
      
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    onComplete?.(createdProfile || profileData);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProfileForm
            initialData={profileData}
            userRole={userRole}
            onSubmit={handleStepComplete}
            showSections={false}
            submitButtonText="Continue"
            cancelButtonText="Cancel"
            onCancel={onClose}
          />
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <p className="text-muted-foreground">Add additional contact details and emergency information</p>
            </div>
            
            <ProfileForm
              initialData={profileData}
              userRole={userRole}
              onSubmit={handleStepComplete}
              showSections={false}
              submitButtonText="Continue"
              cancelButtonText="Back"
              onCancel={handlePrevious}
            />
          </div>
        );

      case 3:
        if (showMembershipStep && currentStep === 3) {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Membership Selection</h3>
                <p className="text-muted-foreground">Choose a membership plan for this member</p>
              </div>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Membership selection will be available after profile creation.</p>
                    <p className="text-sm text-muted-foreground mt-2">You can assign a membership plan from the member's profile page.</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => handleCreateProfile(profileData)} disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Profile'}
                </Button>
              </div>
            </div>
          );
        }
        // Fall through to completion step if no membership step

      case (showMembershipStep ? 4 : 3):
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold">Profile Created Successfully!</h3>
              <p className="text-muted-foreground">The new profile has been created and is ready to use.</p>
            </div>

            {createdProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Profile Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{createdProfile.first_name} {createdProfile.last_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{createdProfile.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Role:</span>
                    <Badge variant="outline" className="capitalize">{createdProfile.role}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge variant="secondary">{createdProfile.status || 'Draft'}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center">
              <Button onClick={handleFinish} className="px-8">
                Complete
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Profile</DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mb-6">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center space-y-2">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                  ${isActive ? 'border-primary bg-primary text-primary-foreground' : 
                    isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                    'border-muted-foreground bg-background text-muted-foreground'}
                `}>
                  <StepIcon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCreationWizard;
