import React, { useState } from 'react';
import { 
  FileText, 
  CreditCard, 
  DollarSign, 
  Check, 
  AlertCircle,
  Lock,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const AgreementsPaymentStep = ({ data, updateData, errors }) => {
  const [signatureData, setSignatureData] = useState('');
  
  const agreements = data.agreements || {};
  const payment = data.payment || {};
  const membershipSelection = data.membershipSelection || {};
  const billingConfiguration = data.billingConfiguration || {};

  const handleAgreementChange = (field, value) => {
    updateData('agreements', { ...agreements, [field]: value });
  };

  const handlePaymentChange = (field, value) => {
    updateData('payment', { ...payment, [field]: value });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculateTotalDueToday = () => {
    let total = 0;
    
    // Add membership plan cost
    if (membershipSelection.selectedPlan) {
      total += membershipSelection.selectedPlan.price || 0;
    }
    
    // Add add-on costs
    if (membershipSelection.selectedAddOns) {
      membershipSelection.selectedAddOns.forEach(addOn => {
        total += addOn.price || 0;
      });
    }
    
    return total;
  };

  const totalDueToday = calculateTotalDueToday();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Agreements & Payment Processing
        </h2>
        <p className="text-gray-600">
          Complete membership agreements and process the initial payment to finalize the signup.
        </p>
      </div>

      {/* Membership Summary */}
      <Card className="shadow-sm border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Check className="h-5 w-5" />
            Membership Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Selected Plan:</span>
            <span className="text-blue-900 font-semibold">
              {membershipSelection.selectedPlan?.name || 'No plan selected'}
            </span>
          </div>
          
          {membershipSelection.selectedAddOns?.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Add-ons:</span>
              <div className="flex flex-wrap gap-1">
                {membershipSelection.selectedAddOns.map(addOn => (
                  <Badge key={addOn.id} variant="secondary" className="text-xs">
                    {addOn.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Billing Cycle:</span>
            <span className="text-blue-900 font-semibold">
              {billingConfiguration.billingCycle || 'Not selected'}
            </span>
          </div>
          
          <div className="pt-2 border-t border-blue-200">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total Due Today:</span>
              <span className="text-blue-900">{formatCurrency(totalDueToday)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membership Agreement */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Membership Agreement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
            <h4 className="font-semibold mb-3">Momentum Gym Membership Terms & Conditions</h4>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>1. Membership Terms:</strong> This membership agreement is effective from the start date 
                and continues according to the selected billing cycle. Members agree to pay all fees as scheduled.
              </p>
              <p>
                <strong>2. Payment Terms:</strong> Membership fees are due in advance according to the selected 
                billing cycle. Late payments may result in suspension of membership privileges.
              </p>
              <p>
                <strong>3. Facility Usage:</strong> Members agree to follow all gym rules and regulations. 
                Inappropriate behavior may result in membership termination.
              </p>
              <p>
                <strong>4. Cancellation Policy:</strong> Members may cancel their membership with 30 days written 
                notice. Contracted memberships are subject to early termination fees.
              </p>
              <p>
                <strong>5. Liability Waiver:</strong> Members participate in fitness activities at their own risk. 
                Momentum Gym is not liable for injuries sustained during normal facility use.
              </p>
              <p>
                <strong>6. Privacy Policy:</strong> Member information is kept confidential and used only for 
                membership management and communication purposes.
              </p>
            </div>
          </div>

          {/* Agreement Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms-accepted"
                checked={agreements.termsAccepted || false}
                onCheckedChange={(checked) => handleAgreementChange('termsAccepted', checked)}
              />
              <label htmlFor="terms-accepted" className="text-sm leading-relaxed">
                I have read and agree to the membership terms and conditions outlined above.
                <span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            
            {errors.termsAccepted && (
              <p className="text-sm text-red-600 ml-6">{errors.termsAccepted}</p>
            )}

            <div className="flex items-start gap-3">
              <Checkbox
                id="liability-waiver"
                checked={agreements.liabilityWaiver || false}
                onCheckedChange={(checked) => handleAgreementChange('liabilityWaiver', checked)}
              />
              <label htmlFor="liability-waiver" className="text-sm leading-relaxed">
                I acknowledge the liability waiver and assume responsibility for my safety during facility use.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="marketing-consent"
                checked={agreements.marketingConsent || false}
                onCheckedChange={(checked) => handleAgreementChange('marketingConsent', checked)}
              />
              <label htmlFor="marketing-consent" className="text-sm leading-relaxed">
                I consent to receive promotional emails and updates about gym services and events.
              </label>
            </div>
          </div>

          {/* Digital Signature */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Digital Signature
            </label>
            <Textarea
              placeholder="Type your full name here as your digital signature..."
              value={agreements.digitalSignature || ''}
              onChange={(e) => handleAgreementChange('digitalSignature', e.target.value)}
              className="min-h-[60px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              By typing your name above, you are providing a legally binding digital signature.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Processing */}
      <Card className="shadow-sm bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <CreditCard className="h-5 w-5" />
            Payment Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Summary */}
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              Payment Summary
            </h4>
            
            <div className="space-y-2">
              {membershipSelection.selectedPlan && (
                <div className="flex items-center justify-between text-sm">
                  <span>{membershipSelection.selectedPlan.name}</span>
                  <span>{formatCurrency(membershipSelection.selectedPlan.price)}</span>
                </div>
              )}
              
              {membershipSelection.selectedAddOns?.map(addOn => (
                <div key={addOn.id} className="flex items-center justify-between text-sm">
                  <span>{addOn.name}</span>
                  <span>{formatCurrency(addOn.price)}</span>
                </div>
              ))}
              
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between font-semibold">
                  <span>Total Due Today:</span>
                  <span className="text-lg text-orange-900">{formatCurrency(totalDueToday)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method <span className="text-red-500">*</span>
            </label>
            
            {errors.paymentMethod && (
              <p className="text-sm text-red-600 mb-2">{errors.paymentMethod}</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'credit-card', label: 'Credit Card', icon: CreditCard },
                { id: 'bank-transfer', label: 'Bank Transfer', icon: Shield },
                { id: 'cash', label: 'Cash Payment', icon: DollarSign }
              ].map(method => {
                const Icon = method.icon;
                const isSelected = payment.paymentMethod === method.id;
                
                return (
                  <Button
                    key={method.id}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handlePaymentChange('paymentMethod', method.id)}
                    className={`h-16 flex flex-col items-center gap-2 ${
                      isSelected ? 'bg-orange-600 hover:bg-orange-700' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{method.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Payment Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-sm font-medium text-green-900">Secure Payment Processing</h5>
                <p className="text-sm text-green-700 mt-1">
                  All payment information is processed securely using industry-standard encryption. 
                  Your financial data is protected and never stored on our servers.
                </p>
              </div>
            </div>
          </div>

          {/* Processing Notice */}
          {totalDueToday > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-medium text-blue-900">Payment Processing</h5>
                  <p className="text-sm text-blue-700 mt-1">
                    Clicking "Complete Signup" will process the payment of {formatCurrency(totalDueToday)} 
                    and activate the membership immediately.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgreementsPaymentStep;
