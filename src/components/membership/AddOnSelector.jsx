import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const AddOnSelector = ({ selectedAddons, onAddonsChange, primaryMembershipPrice = 0 }) => {
  const [availableAddons, setAvailableAddons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    fetchAvailableAddons();
  }, []);

  const fetchAvailableAddons = async () => {
    try {
      console.log('🔍 Fetching available add-ons...');

      const { data, error } = await supabase
        .from('membership_types')
        .select('*')
        .eq('is_addon', true)
        .eq('available_online', true)
        .eq('available_for_sale', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('❌ Error fetching add-ons:', error);
        return;
      }

      console.log('✅ Found add-ons:', data?.length || 0, data);
      setAvailableAddons(data || []);
    } catch (error) {
      console.error('❌ Error fetching add-ons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddonToggle = (addon, isChecked) => {
    const updatedAddons = isChecked
      ? [...selectedAddons, addon]
      : selectedAddons.filter(a => a.id !== addon.id);
    
    onAddonsChange(updatedAddons);
  };

  const calculateTotalAddonCost = () => {
    return selectedAddons.reduce((total, addon) => total + (addon.price || 0), 0);
  };

  const calculateTotalMonthlyCost = () => {
    return primaryMembershipPrice + calculateTotalAddonCost();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  const getBillingCycleText = (billingType) => {
    switch (billingType?.toLowerCase()) {
      case 'monthly': return '/month';
      case 'quarterly': return '/quarter';
      case 'yearly': return '/year';
      default: return '/month';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">Loading Add-On Services...</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse bg-white/10">
              <CardContent className="p-4">
                <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (availableAddons.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            Add-On Services
          </h3>
          <p className="text-white/80">
            No add-on services are currently available for online purchase.
          </p>
        </div>



        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-white/50 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">
              No Add-ons Available
            </h4>
            <p className="text-white/70">
              You can continue with your base membership or contact our staff for additional services.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">
          Enhance Your Membership
        </h3>
        <p className="text-white/80">
          Add optional services to customize your fitness experience
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableAddons.map((addon, index) => {
          const isSelected = selectedAddons.some(a => a.id === addon.id);
          
          return (
            <motion.div
              key={addon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className={`relative cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected 
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent bg-white/10' 
                    : 'hover:bg-white/5'
                }`}
                onClick={() => handleAddonToggle(addon, !isSelected)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {addon.name}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xl font-bold text-green-600">
                            {formatPrice(addon.price)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {getBillingCycleText(addon.billing_type)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleAddonToggle(addon, checked)}
                      className="mt-1"
                    />
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {addon.features && addon.features.length > 0 && (
                    <ul className="space-y-1 text-sm text-gray-600">
                      {addon.features.slice(0, 3).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-2">
                          <Plus className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {addon.features.length > 3 && (
                        <li className="text-gray-500 text-xs">
                          +{addon.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  )}

                  {addon.billing_type !== 'monthly' && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Billed {addon.billing_type}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Cost Summary */}
      {selectedAddons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold text-white mb-4">
                Your Selection Summary
              </h4>
              
              <div className="space-y-2 text-white/90">
                <div className="flex justify-between">
                  <span>Base Membership</span>
                  <span>{formatPrice(primaryMembershipPrice)}/month</span>
                </div>
                
                {selectedAddons.map(addon => (
                  <div key={addon.id} className="flex justify-between text-sm">
                    <span>{addon.name}</span>
                    <span>{formatPrice(addon.price)}{getBillingCycleText(addon.billing_type)}</span>
                  </div>
                ))}
                
                <hr className="border-white/20 my-3" />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Monthly Cost</span>
                  <span className="text-green-400">
                    {formatPrice(calculateTotalMonthlyCost())}
                  </span>
                </div>
              </div>
              
              <p className="text-white/70 text-sm mt-3">
                Add-ons can be modified or cancelled anytime from your member dashboard
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AddOnSelector;
