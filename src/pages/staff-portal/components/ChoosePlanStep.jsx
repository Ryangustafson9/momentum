import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, CreditCard, Users, Shield, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { getGymColors } from '@/utils/gymBranding';
import LoadingSpinner from '@/components/LoadingSpinner';

const ChoosePlanStep = ({ formData, updateFormData, onNext, canProceed }) => {
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const gymColors = getGymColors();

  useEffect(() => {
    fetchMembershipTypes();
  }, []);

  const fetchMembershipTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_types')
        .select('*')
        .eq('available_for_sale', true)
        .order('category', { ascending: true })
        .order('price', { ascending: true });

      if (error) throw error;
      setMembershipTypes(data || []);
    } catch (error) {
      console.error('Error fetching membership types:', error);
      toast({
        title: 'Error',
        description: 'Failed to load membership plans',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectPlan = (plan) => {
    updateFormData({
      membershipTypeId: plan.id,
      membershipType: plan
    });
  };

  const getPlanIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'membership':
        return <Users className="h-6 w-6" />;
      case 'staff':
        return <Shield className="h-6 w-6" />;
      case 'add-ons':
        return <Package className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const formatDuration = (months) => {
    if (!months) return 'Ongoing';
    if (months === 1) return '1 month';
    if (months === 12) return '1 year';
    return `${months} months`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner text="Loading membership plans..." />
      </div>
    );
  }

  // Group plans by category
  const groupedPlans = membershipTypes.reduce((acc, plan) => {
    const category = plan.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(plan);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Choose Membership Plan
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Select the membership plan for the new member
        </p>
      </div>

      {Object.entries(groupedPlans).map(([category, plans]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            {getPlanIcon(category)}
            {category} Plans
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 ${
                    formData.membershipTypeId === plan.id
                      ? 'ring-2 shadow-lg'
                      : 'hover:shadow-md border-slate-200 dark:border-slate-700'
                  }`}
                  style={{
                    ringColor: formData.membershipTypeId === plan.id ? gymColors.primary : undefined
                  }}
                  onClick={() => selectPlan(plan)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold">
                        {plan.name}
                      </CardTitle>
                      {formData.membershipTypeId === plan.id && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: gymColors.primary }}
                        >
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {plan.description}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold" style={{ color: gymColors.primary }}>
                          {formatPrice(plan.price)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {formatDuration(plan.duration_months)}
                        </Badge>
                      </div>

                      {plan.billing_type && (
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          <span className="font-medium">Billing:</span> {plan.billing_type}
                        </div>
                      )}

                      {plan.features && plan.features.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Features:
                          </div>
                          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            {plan.features.slice(0, 3).map((feature, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                            {plan.features.length > 3 && (
                              <li className="text-xs text-slate-500">
                                +{plan.features.length - 3} more features
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <span>
                          {plan.available_online ? 'Online Sale' : 'In-Person Only'}
                        </span>
                        <span className="capitalize">
                          {plan.category}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {formData.membershipType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4"
        >
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Selected Plan
          </h4>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{formData.membershipType.name}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {formatPrice(formData.membershipType.price)} · {formatDuration(formData.membershipType.duration_months)}
              </div>
            </div>
            <Button
              onClick={onNext}
              disabled={!canProceed}
              style={{ backgroundColor: gymColors.primary }}
            >
              Continue
            </Button>
          </div>
        </motion.div>
      )}

      {membershipTypes.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No Membership Plans Available
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Please contact an administrator to set up membership plans.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ChoosePlanStep;
