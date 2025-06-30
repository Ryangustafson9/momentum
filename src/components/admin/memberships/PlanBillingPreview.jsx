import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Clock, CreditCard } from 'lucide-react';
import { useLocationContext } from '@/contexts/LocationContext';
import LocationService from '@/lib/services/locationService';

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
const getOrdinalSuffix = (day) => {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const PlanBillingPreview = ({ membershipData }) => {
  const { currentLocation } = useLocationContext();
  const [billingConfig, setBillingConfig] = useState(null);

  useEffect(() => {
    const loadBillingConfig = async () => {
      try {
        // Use currentLocation.id if available, otherwise use default location for single-location mode
        const locationId = currentLocation?.id || '00000000-0000-0000-0000-000000000001';
        const result = await LocationService.getBillingConfig(locationId);
        if (result.data) {
          setBillingConfig(result.data);
        }
      } catch (error) {
        console.warn('Failed to load billing config for preview:', error);
      }
    };

    loadBillingConfig();
  }, [currentLocation]);

  const getBillingInfo = () => {
    const billingType = membershipData.billing_type || 'Recurring';
    const price = parseFloat(membershipData.price) || 0;
    const signUpFee = parseFloat(membershipData.signUpFee) || 0;
    const cycleLength = parseInt(membershipData.billingCycleLength) || 1;
    const cycleUnit = membershipData.billingCycleUnit || 'Months';

    let frequency = '';
    let nextBilling = '';
    
    if (billingType === 'N/A') {
      frequency = 'Free Plan';
      nextBilling = 'No billing required';
    } else if (billingType === 'Paid in Full') {
      frequency = `One-time payment for ${cycleLength} ${cycleUnit.toLowerCase()}`;
      nextBilling = 'Single payment only';
    } else if (billingType === 'Recurring') {
      frequency = `Every ${cycleLength} ${cycleUnit.toLowerCase()}`;

      // Calculate next billing date based on billing configuration
      let nextBillingDate = new Date();

      if (billingConfig?.billing_cycle_type === 'unified' && billingConfig?.unified_billing_day) {
        // Unified billing: all members billed on the same day of the month
        const billingDay = billingConfig.unified_billing_day;
        const today = new Date();

        // Set to the billing day of current month
        nextBillingDate.setDate(billingDay);

        // If the billing day has already passed this month, move to next month
        if (nextBillingDate <= today) {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          nextBillingDate.setDate(billingDay);
        }

        frequency = `Monthly on the ${billingDay}${getOrdinalSuffix(billingDay)}`;
      } else {
        // Anniversary billing: based on signup date + cycle
        if (cycleUnit === 'Days') {
          nextBillingDate.setDate(nextBillingDate.getDate() + cycleLength);
        } else if (cycleUnit === 'Weeks') {
          nextBillingDate.setDate(nextBillingDate.getDate() + (cycleLength * 7));
        } else if (cycleUnit === 'Months') {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + cycleLength);
        }
      }

      nextBilling = nextBillingDate.toLocaleDateString();
    }

    return { billingType, price, signUpFee, frequency, nextBilling };
  };

  const { billingType, price, signUpFee, frequency, nextBilling } = getBillingInfo();

  if (billingType === 'N/A') {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Free Plan</h4>
          <p className="text-gray-600">This plan has no billing requirements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Billing Details */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Clock className="h-4 w-4 mr-2 text-green-600" />
            Billing Details
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Billing Type:</span>
              <span className="font-medium">{billingType}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Frequency:</span>
              <span className="font-medium">{frequency}</span>
            </div>
            
            {billingType === 'Recurring' && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Next Billing:</span>
                <span className="font-medium">{nextBilling}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-green-600" />
            Pricing Summary
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {price < 0 ? 'Credit Amount:' : 'Plan Price:'}
              </span>
              <span className={`font-medium ${price < 0 ? 'text-green-600' : 'text-blue-600'}`}>
                {price < 0 ? `-$${Math.abs(price).toFixed(2)}` : `$${price.toFixed(2)}`}
              </span>
            </div>
            
            {signUpFee > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Enrollment Fee:</span>
                <span className="font-medium text-blue-600">${signUpFee.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center py-3 border-t border-gray-200 bg-gray-50 px-3 rounded">
              <span className="font-semibold text-gray-900">
                {price < 0 ? 'Net Credit:' : (billingType === 'Paid in Full' ? 'Total Amount:' : 'First Payment:')}
              </span>
              <span className={`font-bold text-lg ${price < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {price < 0 && signUpFee === 0
                  ? `-$${Math.abs(price).toFixed(2)}`
                  : `$${(price + signUpFee).toFixed(2)}`
                }
              </span>
            </div>
            
            {billingType === 'Recurring' && (signUpFee > 0 || price < 0) && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">
                  {price < 0 ? 'Recurring Credit:' : 'Recurring Amount:'}
                </span>
                <span className={`font-medium ${price < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {price < 0 ? `-$${Math.abs(price).toFixed(2)}` : `$${price.toFixed(2)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Example Schedule */}
      {billingType === 'Recurring' && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 flex items-center mb-4">
            <Calendar className="h-4 w-4 mr-2 text-green-600" />
            Example Billing Schedule
          </h4>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-gray-900">Today</div>
                <div className="text-gray-600">Setup & First Payment</div>
                <div className="font-semibold text-green-600">${(price + signUpFee).toFixed(2)}</div>
              </div>
              
              <div className="text-center">
                <div className="font-medium text-gray-900">{nextBilling}</div>
                <div className="text-gray-600">Next Billing</div>
                <div className="font-semibold text-green-600">${price.toFixed(2)}</div>
              </div>
              
              <div className="text-center">
                <div className="font-medium text-gray-900">Ongoing</div>
                <div className="text-gray-600">{frequency}</div>
                <div className="font-semibold text-green-600">${price.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanBillingPreview;
