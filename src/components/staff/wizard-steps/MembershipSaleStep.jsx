import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Settings,
  Check,
  Star,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import BillingScheduleTable from '../BillingScheduleTable';

const MembershipSaleStep = ({ data, updateData, errors }) => {
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [addOnPlans, setAddOnPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const membershipSelection = data.membershipSelection || {};
  const billingConfiguration = data.billingConfiguration || {};

  useEffect(() => {
    fetchMembershipPlans();
  }, []);

  const fetchMembershipPlans = async () => {
    try {
      setIsLoading(true);
      
      // Fetch membership plans
      const { data: plans, error: plansError } = await supabase
        .from('membership_types')
        .select('*')
        .eq('available_for_sale', true)
        .in('category', ['Membership'])
        .order('price');

      if (plansError) throw plansError;

      // Fetch add-on plans
      const { data: addOns, error: addOnsError } = await supabase
        .from('membership_types')
        .select('*')
        .eq('available_for_sale', true)
        .in('category', ['Add-on'])
        .order('price');

      if (addOnsError) throw addOnsError;

      setMembershipPlans(plans || []);
      setAddOnPlans(addOns || []);
    } catch (error) {
      console.error('Error fetching membership plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelection = (planId) => {
    const selectedPlan = membershipPlans.find(plan => plan.id === planId);
    updateData('membershipSelection', {
      selectedPlan: selectedPlan,
      selectedAddOns: membershipSelection.selectedAddOns || []
    });
  };

  const handleAddOnToggle = (addOn) => {
    const currentAddOns = membershipSelection.selectedAddOns || [];
    const isSelected = currentAddOns.some(item => item.id === addOn.id);
    
    let updatedAddOns;
    if (isSelected) {
      updatedAddOns = currentAddOns.filter(item => item.id !== addOn.id);
    } else {
      updatedAddOns = [...currentAddOns, addOn];
    }
    
    updateData('membershipSelection', { 
      ...membershipSelection,
      selectedAddOns: updatedAddOns
    });
  };

  const handleBillingConfigChange = (config) => {
    updateData('billingConfiguration', { ...billingConfiguration, ...config });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getBillingCycleText = (cycle) => {
    const cycles = {
      'monthly': 'Monthly',
      'quarterly': 'Quarterly',
      'semi-annually': 'Semi-Annually',
      'annually': 'Annually'
    };
    return cycles[cycle] || cycle;
  };

  const AddOnCard = ({ plan, isSelected, onToggle }) => (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:border-gray-300'
      }`}
      onClick={() => onToggle(plan)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
          {isSelected && (
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(plan.price)}
          </span>
          <span className="text-sm text-gray-500">
            /{getBillingCycleText(plan.billing_cycle)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm mb-3">{plan.description}</p>

        {plan.features && (
          <div className="space-y-2">
            {plan.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Category</span>
            <Badge variant="secondary">{plan.category}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Membership Selection & Billing Configuration
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Choose a membership plan and configure billing preferences for the new member.
        </p>
      </div>

      {/* Membership Plan Selection */}
      <Card className="shadow-sm border-gray-200/60">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/60">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Membership Plans & Add-ons
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="membership" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
              <TabsTrigger
                value="membership"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600"
              >
                <Users className="h-4 w-4" />
                Membership Plans
              </TabsTrigger>
              <TabsTrigger
                value="addons"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600"
              >
                <Star className="h-4 w-4" />
                Add-on Plans
              </TabsTrigger>
            </TabsList>

            <TabsContent value="membership" className="space-y-4">
              {errors.selectedPlan && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{errors.selectedPlan}</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Select Membership Plan <span className="text-red-500">*</span>
                  </label>

                  {isLoading ? (
                    <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                  ) : (
                    <Select
                      value={membershipSelection.selectedPlan?.id || ''}
                      onValueChange={handlePlanSelection}
                    >
                      <SelectTrigger className="w-full h-12 border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                        <SelectValue placeholder="Choose a membership plan..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {membershipPlans.map(plan => (
                          <SelectItem key={plan.id} value={plan.id} className="py-3">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">{plan.name}</span>
                                <span className="text-sm text-gray-600">
                                  {formatPrice(plan.price)}/{getBillingCycleText(plan.billing_cycle)}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Selected Plan Details */}
                {membershipSelection.selectedPlan && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-lg p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-blue-900 mb-1">
                          {membershipSelection.selectedPlan.name}
                        </h4>
                        <p className="text-sm text-blue-700">
                          {membershipSelection.selectedPlan.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        {membershipSelection.selectedPlan.category}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-2xl font-bold text-blue-900">
                        {formatPrice(membershipSelection.selectedPlan.price)}
                      </div>
                      <div className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                        per {getBillingCycleText(membershipSelection.selectedPlan.billing_cycle)}
                      </div>
                    </div>

                    {membershipSelection.selectedPlan.features && (
                      <div className="pt-4 border-t border-blue-200/60">
                        <p className="text-sm font-semibold text-blue-900 mb-3">Plan Features:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {membershipSelection.selectedPlan.features.slice(0, 6).map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-blue-800">
                              <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="addons" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700">
                  Add-on plans can be selected in addition to the main membership plan. 
                  Multiple add-ons can be selected.
                </p>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {addOnPlans.map(plan => {
                    const isSelected = membershipSelection.selectedAddOns?.some(item => item.id === plan.id);
                    return (
                      <AddOnCard
                        key={plan.id}
                        plan={plan}
                        isSelected={isSelected}
                        onToggle={handleAddOnToggle}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Billing Configuration */}
      {membershipSelection.selectedPlan && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Billing Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Billing Cycle Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Cycle
                </label>
                {errors.billingCycle && (
                  <p className="text-sm text-red-600 mb-2">{errors.billingCycle}</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['monthly', 'quarterly', 'semi-annually', 'annually'].map(cycle => (
                    <Button
                      key={cycle}
                      variant={billingConfiguration.billingCycle === cycle ? 'default' : 'outline'}
                      onClick={() => handleBillingConfigChange({ billingCycle: cycle })}
                      className="justify-center"
                    >
                      {getBillingCycleText(cycle)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Credit Card', 'Bank Transfer', 'Cash'].map(method => (
                    <Button
                      key={method}
                      variant={billingConfiguration.paymentMethod === method ? 'default' : 'outline'}
                      onClick={() => handleBillingConfigChange({ paymentMethod: method })}
                      className="justify-center"
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Schedule Preview */}
      {membershipSelection.selectedPlan && billingConfiguration.billingCycle && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Billing Schedule Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BillingScheduleTable
              membershipPlan={membershipSelection.selectedPlan}
              addOnPlans={membershipSelection.selectedAddOns || []}
              billingCycle={billingConfiguration.billingCycle}
              onScheduleChange={(schedule) => handleBillingConfigChange({ schedule })}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MembershipSaleStep;
