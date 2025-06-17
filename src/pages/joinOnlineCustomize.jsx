import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, CheckCircle, Users, Package } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import AddOnSelector from '@/components/membership/AddOnSelector';
import MultiPersonSelector from '@/components/membership/MultiPersonSelector';
import { LoadingSpinner } from '@/shared/components/LoadingStates';

const JoinOnlineCustomize = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  const planId = searchParams.get('plan');

  useEffect(() => {
    if (planId) {
      fetchSelectedPlan();
    } else {
      navigate('/join-online');
    }
  }, [planId]);

  const fetchSelectedPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_types')
        .select('*')
        .eq('id', planId)
        .eq('available_online', true)
        .single();

      if (error || !data) {
        toast({
          title: 'Error',
          description: 'Selected membership plan not found.',
          variant: 'destructive'
        });
        navigate('/join-online');
        return;
      }

      setSelectedPlan(data);
    } catch (error) {
      console.error('Error fetching plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to load membership plan details.',
        variant: 'destructive'
      });
      navigate('/join-online');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalCost = () => {
    const baseCost = selectedPlan?.price || 0;
    const addonsCost = selectedAddons.reduce((total, addon) => total + (addon.price || 0), 0);
    return baseCost + addonsCost;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  const handleContinueToCheckout = () => {
    const checkoutData = {
      plan: selectedPlan.id,
      addons: selectedAddons.map(a => a.id),
      familyMembers: familyMembers,
      totalCost: calculateTotalCost()
    };

    // Store in sessionStorage for checkout page
    sessionStorage.setItem('membershipCheckoutData', JSON.stringify(checkoutData));
    
    navigate('/join-online/checkout');
  };

  const isMultiPersonPlan = selectedPlan && (selectedPlan.person_capacity > 1 || selectedPlan.max_family_members > 1);
  const maxMembers = selectedPlan?.max_family_members || selectedPlan?.person_capacity || 1;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-600">Loading membership customization...</p>
        </div>
      </div>
    );
  }

  if (!selectedPlan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/join-online')}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Customize Your Membership
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Enhance your {selectedPlan.name} with add-ons and family members
          </p>
        </motion.div>

        {/* Selected Plan Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Selected Plan: {selectedPlan.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white/80">{selectedPlan.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      {selectedPlan.category}
                    </Badge>
                    {isMultiPersonPlan && (
                      <Badge className="bg-purple-100 text-purple-800">
                        <Users className="w-3 h-3 mr-1" />
                        Up to {maxMembers} members
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">
                    {formatPrice(selectedPlan.price)}
                  </div>
                  <div className="text-white/70">
                    /{selectedPlan.billing_type?.toLowerCase() || 'month'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Step Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              currentStep >= 1 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
            }`}>
              <Package className="w-4 h-4" />
              <span>Add-ons</span>
            </div>
            <ArrowRight className="w-4 h-4 text-white/50" />
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              currentStep >= 2 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
            }`}>
              <Users className="w-4 h-4" />
              <span>Family</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-8">
          {/* Step 1: Add-ons */}
          {currentStep === 1 && (
            <AddOnSelector
              selectedAddons={selectedAddons}
              onAddonsChange={setSelectedAddons}
              primaryMembershipPrice={selectedPlan.price}
            />
          )}

          {/* Step 2: Family Members */}
          {currentStep === 2 && isMultiPersonPlan && (
            <MultiPersonSelector
              selectedPlan={selectedPlan}
              familyMembers={familyMembers}
              onFamilyMembersChange={setFamilyMembers}
              maxMembers={maxMembers}
            />
          )}

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center space-x-4"
          >
            {currentStep === 1 && (
              <>
                {isMultiPersonPlan ? (
                  <Button
                    onClick={() => setCurrentStep(2)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 text-lg font-semibold"
                  >
                    Next: Family Members
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleContinueToCheckout}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 text-lg font-semibold"
                  >
                    Continue to Checkout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </>
            )}

            {currentStep === 2 && (
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Add-ons
                </Button>
                <Button
                  onClick={handleContinueToCheckout}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 text-lg font-semibold"
                >
                  Continue to Checkout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </motion.div>

          {/* Cost Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Total Monthly Cost
                </h3>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {formatPrice(calculateTotalCost())}
                </div>
                <p className="text-white/70 text-sm">
                  {familyMembers.length + 1} member{familyMembers.length !== 0 ? 's' : ''} • {selectedAddons.length} add-on{selectedAddons.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default JoinOnlineCustomize;
