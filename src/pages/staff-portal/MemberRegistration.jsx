import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getGymColors } from '@/utils/gymBranding';

// Step Components
import ChoosePlanStep from './components/ChoosePlanStep';
import PersonalInfoStep from './components/PersonalInfoStep';
import ConfirmationStep from './components/ConfirmationStep';

const STEPS = [
  { id: 1, title: 'Choose Plan', description: 'Select membership type' },
  { id: 2, title: 'Member Info', description: 'Personal details' },
  { id: 3, title: 'Confirmation', description: 'Review and submit' }
];

const MemberRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Membership Plan
    membershipTypeId: null,
    membershipType: null,
    
    // Step 2: Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Step 3: Additional Options
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
    sendWelcomeEmail: true
  });

  const gymColors = getGymColors();

  const updateFormData = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedFromStep = (step) => {
    switch (step) {
      case 1:
        return formData.membershipTypeId && formData.membershipType;
      case 2:
        return formData.firstName && formData.lastName && formData.email;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    const stepProps = {
      formData,
      updateFormData,
      onNext: nextStep,
      onPrev: prevStep,
      canProceed: canProceedFromStep(currentStep)
    };

    switch (currentStep) {
      case 1:
        return <ChoosePlanStep {...stepProps} />;
      case 2:
        return <PersonalInfoStep {...stepProps} />;
      case 3:
        return <ConfirmationStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <img 
            src="/assets/momentum-logo.svg"
            alt="Momentum Gym" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            <Users className="inline-block mr-3 h-8 w-8" style={{ color: gymColors.primary }} />
            Member Registration
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Register a new member in 3 simple steps
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      currentStep >= step.id
                        ? 'text-white shadow-lg'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                    style={{
                      backgroundColor: currentStep >= step.id ? gymColors.primary : undefined
                    }}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${
                      currentStep >= step.id 
                        ? 'text-slate-900 dark:text-slate-100' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div 
                    className={`w-16 h-0.5 mx-4 transition-colors ${
                      currentStep > step.id 
                        ? 'opacity-100' 
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                    style={{
                      backgroundColor: currentStep > step.id ? gymColors.primary : undefined
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-between mt-6"
        >
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceedFromStep(currentStep)}
              className="flex items-center gap-2"
              style={{ backgroundColor: gymColors.primary }}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
};

export default MemberRegistration;
