import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast.js';

const JoinOnlineCheckout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!planId) {
      navigate('/join-online');
      return;
    }
    
    loadCheckoutData();
  }, [planId]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      
      // Load selected membership plan
      const { data: plan, error: planError } = await supabase
        .from('membership_types')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) {
        console.error('Error loading plan:', planError);
        toast({
          title: "Error",
          description: "Failed to load selected plan.",
          variant: "destructive",
        });
        navigate('/join-online');
        return;
      }

      setSelectedPlan(plan);

      // Load available add-ons
      const { data: addons, error: addonsError } = await supabase
        .from('membership_types')
        .select('*')
        .eq('category', 'Add-on')
        .eq('available_online', true)
        .eq('active', true)
        .order('price', { ascending: true });

      if (addonsError) {
        console.error('Error loading add-ons:', addonsError);
        toast({
          title: "Warning",
          description: "Failed to load add-ons. You can still proceed with just the membership.",
          variant: "default",
        });
        setAvailableAddons([]);
      } else {
        setAvailableAddons(addons || []);
      }

    } catch (error) {
      console.error('Error in loadCheckoutData:', error);
      toast({
        title: "Error",
        description: "Failed to load checkout data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddonToggle = (addon) => {
    setSelectedAddons(prev => {
      const isSelected = prev.find(a => a.id === addon.id);
      if (isSelected) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const calculateTotal = () => {
    const planPrice = selectedPlan?.price || 0;
    const addonsPrice = selectedAddons.reduce((sum, addon) => sum + (addon.price || 0), 0);
    return planPrice + addonsPrice;
  };

  const formatBillingType = (billingType, durationMonths) => {
    switch(billingType) {
      case 'monthly':
        return 'month';
      case 'quarterly':
        return '3 months';
      case 'yearly':
        return 'year';
      case 'weekly':
        return 'week';
      default:
        if (durationMonths) {
          return durationMonths === 1 ? 'month' : `${durationMonths} months`;
        }
        return 'period';
    }
  };

  const handleProceedToPayment = () => {
    // For now, just show a success message
    // In a real implementation, this would integrate with Stripe
    toast({
      title: "Coming Soon",
      description: "Payment integration will be implemented next. Your selections have been saved.",
    });
    
    console.log('Selected Plan:', selectedPlan);
    console.log('Selected Add-ons:', selectedAddons);
    console.log('Total:', calculateTotal());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-center text-white">
          <p>Plan not found. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 pt-8"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/join-online')}
            className="absolute top-4 left-4 bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>

          <h1 className="text-4xl font-bold text-white mb-4">
            Complete Your Membership
          </h1>
          <p className="text-xl text-white/90">
            Review your selection and add optional services
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Selected Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Selected Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{selectedPlan.name}</h3>
                    <p className="text-gray-600">{selectedPlan.description || 'Premium membership plan'}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">${selectedPlan.price}</span>
                    <span className="text-gray-600">/{formatBillingType(selectedPlan.billing_type, selectedPlan.duration_months)}</span>
                  </div>
                  {selectedPlan.features && selectedPlan.features.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Included Features:</h4>
                      <ul className="space-y-1">
                        {selectedPlan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Add-ons Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Optional Add-ons
                </CardTitle>
                <CardDescription>
                  Enhance your membership with these additional services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableAddons.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No add-ons available at this time.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {availableAddons.map((addon) => (
                      <div
                        key={addon.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedAddons.find(a => a.id === addon.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleAddonToggle(addon)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={!!selectedAddons.find(a => a.id === addon.id)}
                            onChange={() => handleAddonToggle(addon)}
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{addon.name}</h4>
                                <p className="text-sm text-gray-600">{addon.description || 'Additional service'}</p>
                              </div>
                              <div className="text-right">
                                <span className="font-bold">${addon.price}</span>
                                <span className="text-sm text-gray-600">/{formatBillingType(addon.billing_type, addon.duration_months)}</span>
                              </div>
                            </div>
                            {addon.features && addon.features.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {addon.features.map((feature, index) => (
                                  <li key={index} className="text-xs text-gray-600 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>{selectedPlan.name}</span>
                  <span>${selectedPlan.price}</span>
                </div>
                
                {selectedAddons.map((addon) => (
                  <div key={addon.id} className="flex justify-between text-sm">
                    <span>{addon.name}</span>
                    <span>${addon.price}</span>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>• All plans include a 7-day free trial</p>
                  <p>• Cancel anytime</p>
                  <p>• No setup fees</p>
                </div>
              </div>
              
              <Button
                onClick={handleProceedToPayment}
                className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-lg font-semibold"
                size="lg"
              >
                Proceed to Payment - ${calculateTotal().toFixed(2)}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinOnlineCheckout;

