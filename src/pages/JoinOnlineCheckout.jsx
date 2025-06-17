import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthQuery as useAuth } from '@/hooks/useAuthQuery';
import { useToast } from '@/hooks/use-toast.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, CreditCard, Lock, ArrowLeft, Star, Crown, Dumbbell, Calendar, QrCode, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getGymName } from '@/helpers/gymBranding';

const JoinOnlineCheckout = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [checkoutData, setCheckoutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [membershipData, setMembershipData] = useState(null);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // Load checkout data and fetch plan details
  useEffect(() => {
    const loadCheckoutData = () => {
      // Try to load from sessionStorage first (from customize page)
      const storedData = sessionStorage.getItem('membershipCheckoutData');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setCheckoutData(parsed);
          return parsed.plan; // Return plan ID for fetching
        } catch (error) {
          console.error('Error parsing checkout data:', error);
        }
      }

      // Fallback to URL parameter
      return planId;
    };

    const fetchPlanDetails = async () => {
      const planIdToFetch = loadCheckoutData();

      if (!planIdToFetch) {
        toast({
          title: "No plan selected",
          description: "Please select a membership plan first.",
          variant: "destructive",
        });
        navigate('/join-online');
        return;
      }

      try {
        // Fetch main plan
        const { data: plan, error } = await supabase
          .from('membership_types')
          .select('*')
          .eq('id', planIdToFetch)
          .eq('available_online', true)
          .single();

        if (error || !plan) {
          toast({
            title: "Plan not found",
            description: "The selected membership plan is not available.",
            variant: "destructive",
          });
          navigate('/join-online');
          return;
        }

        // Add design info based on category
        const planWithDesign = {
          ...plan,
          ...getDesignForCategory(plan.category, plan.name)
        };

        setSelectedPlan(planWithDesign);

        // Load add-ons if specified in checkout data
        if (checkoutData?.addons && checkoutData.addons.length > 0) {
          const { data: addons, error: addonsError } = await supabase
            .from('membership_types')
            .select('*')
            .in('id', checkoutData.addons)
            .eq('is_addon', true);

          if (!addonsError && addons) {
            setSelectedAddons(addons);
          }
        }

        // Load family members from checkout data
        if (checkoutData?.familyMembers) {
          setFamilyMembers(checkoutData.familyMembers);
        }

      } catch (error) {
        console.error('Error fetching plan:', error);
        toast({
          title: "Error",
          description: "Failed to load plan details.",
          variant: "destructive",
        });
        navigate('/join-online');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanDetails();
  }, [planId, navigate, toast]);

  const getDesignForCategory = (category, name) => {
    const designs = {
      'Standard': {
        icon: <Dumbbell className="w-6 h-6" />,
        color: 'from-blue-500 to-blue-600',
        popular: false
      },
      'Premium': {
        icon: <Star className="w-6 h-6" />,
        color: 'from-purple-500 to-purple-600',
        popular: true
      },
      'VIP': {
        icon: <Crown className="w-6 h-6" />,
        color: 'from-yellow-500 to-yellow-600',
        popular: false
      }
    };
    return designs[category] || designs['Standard'];
  };

  const formatBillingType = (billingType, durationMonths) => {
    switch(billingType) {
      case 'monthly': return 'month';
      case 'quarterly': return '3 months';
      case 'yearly': return 'year';
      case 'weekly': return 'week';
      default:
        if (durationMonths) {
          return durationMonths === 1 ? 'month' : `${durationMonths} months`;
        }
        return 'period';
    }
  };

  // Calculate total cost including add-ons
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

  // Generate unique access card number
  const generateAccessCardNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${random}`;
  };

  // Format credit card number (add spaces every 4 digits)
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format expiry date (MM/YY)
  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Format CVV (3-4 digits only)
  const formatCVV = (value) => {
    return value.replace(/[^0-9]/gi, '').substring(0, 4);
  };

  // Format phone number (XXX) XXX-XXXX
  const formatPhoneNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 6) {
      return `(${v.substring(0, 3)}) ${v.substring(3, 6)}-${v.substring(6, 10)}`;
    } else if (v.length >= 3) {
      return `(${v.substring(0, 3)}) ${v.substring(3)}`;
    }
    return v;
  };

  // Format ZIP code (5 digits only)
  const formatZipCode = (value) => {
    return value.replace(/[^0-9]/gi, '').substring(0, 5);
  };

  const handleInputChange = (field, value) => {
    let formattedValue = value;

    // Apply formatting based on field type
    switch (field) {
      case 'cardNumber':
        formattedValue = formatCardNumber(value);
        break;
      case 'expiryDate':
        formattedValue = formatExpiryDate(value);
        break;
      case 'cvv':
        formattedValue = formatCVV(value);
        break;
      case 'zipCode':
        formattedValue = formatZipCode(value);
        break;
      case 'cardholderName':
        // Only allow letters and spaces
        formattedValue = value.replace(/[^a-zA-Z\s]/g, '');
        break;
      default:
        formattedValue = value;
    }

    setPaymentData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('🔄 Processing membership purchase...', { userId: user.id, planId: selectedPlan.id });

      // 1. Update user role to 'member'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'member',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('❌ Error updating user role:', profileError);
        throw new Error('Failed to update user role');
      }

      console.log('✅ User role updated to member');

      // 1.5. Refresh user profile in auth context to reflect role change
      try {
        console.log('🔄 Refreshing user profile in auth context...');
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const updatedProfile = await fetchUserProfile(authUser);
          setUserSafely(updatedProfile);

          // Trigger a token refresh to force auth state change event
          // This will notify all components using useAuthSimple about the role change
          console.log('🔄 Triggering auth refresh to sync all components...');
          await supabase.auth.refreshSession();

          console.log('✅ User profile refreshed and auth state synchronized');
        }
      } catch (error) {
        console.error('⚠️ Error refreshing user profile:', error);
        // Don't throw - this is not critical for the purchase process
      }

      // 2. Create primary membership record
      const membershipData = {
        auth_user_id: user.id,
        user_id: user.id,
        current_membership_type_id: selectedPlan.id,
        status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        monthly_fee: selectedPlan.price,
        is_primary_member: true,
        family_role: 'primary',
        family_member_count: familyMembers.length + 1,
        max_family_members: selectedPlan.max_family_members || selectedPlan.person_capacity || 1,
        total_monthly_cost: calculateTotalCost(),
        addon_membership_ids: selectedAddons.map(a => a.id)
      };

      const { data: newMembership, error: membershipError } = await supabase
        .from('memberships')
        .insert(membershipData)
        .select()
        .single();

      if (membershipError) {
        console.error('❌ Error creating membership:', membershipError);
        throw new Error('Failed to create membership record');
      }

      console.log('✅ Primary membership record created:', newMembership.id);

      // 3. Create add-on records
      if (selectedAddons.length > 0) {
        const addonRecords = selectedAddons.map(addon => ({
          membership_id: newMembership.id,
          addon_type_id: addon.id,
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
          monthly_cost: addon.price,
          billing_cycle: addon.billing_type || 'monthly'
        }));

        const { error: addonsError } = await supabase
          .from('membership_addons')
          .insert(addonRecords);

        if (addonsError) {
          console.error('❌ Error creating add-ons:', addonsError);
        } else {
          console.log('✅ Add-on records created');
        }
      }

      // 4. Create family member profiles and records
      if (familyMembers.length > 0) {
        for (const member of familyMembers) {
          // Create profile for family member (if they don't have one)
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', member.email)
            .single();

          let profileId;
          if (existingProfile) {
            profileId = existingProfile.id;
          } else if (member.email) {
            // Create a basic profile for family member
            const { data: newProfile, error: profileError } = await supabase
              .from('profiles')
              .insert({
                email: member.email,
                first_name: member.firstName,
                last_name: member.lastName,
                role: 'member'
              })
              .select()
              .single();

            if (profileError) {
              console.error('❌ Error creating family member profile:', profileError);
              continue;
            }
            profileId = newProfile.id;
          }

          // Create family member record
          if (profileId) {
            const { error: familyError } = await supabase
              .from('family_members')
              .insert({
                primary_membership_id: newMembership.id,
                member_profile_id: profileId,
                family_role: member.relationship,
                relationship: member.relationship,
                date_of_birth: member.dateOfBirth || null
              });

            if (familyError) {
              console.error('❌ Error creating family member record:', familyError);
            } else {
              console.log('✅ Family member record created for:', member.firstName);
            }
          }
        }
      }

      // Calculate next billing date
      const startDate = new Date();
      const nextBillingDate = new Date(startDate);

      switch(selectedPlan.billing_type) {
        case 'monthly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
          break;
        case 'yearly':
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          break;
        default:
          nextBillingDate.setMonth(nextBillingDate.getMonth() + (selectedPlan.duration_months || 1));
      }

      // Generate access card number
      const accessCardNumber = generateAccessCardNumber();

      // Set membership data for success card
      setMembershipData({
        plan: selectedPlan,
        nextBillingDate,
        accessCardNumber,
        startDate
      });

      // Show success card instead of redirecting
      setShowSuccessCard(true);
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-6">Please sign in to complete your membership purchase.</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Plan Not Found</h1>
            <p className="text-gray-600 mb-6">The selected membership plan could not be found.</p>
            <Button onClick={() => navigate('/join-online')} className="w-full">
              Back to Plans
            </Button>
          </CardContent>
        </Card>
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
            Join {getGymName()} today and start your fitness journey!
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${selectedPlan.color} flex items-center justify-center text-white mr-3`}>
                    {selectedPlan.icon}
                  </div>
                  {selectedPlan.name} Membership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <span className="text-4xl font-bold text-gray-900">{formatPrice(calculateTotalCost())}</span>
                  <span className="text-gray-600">/{formatBillingType(selectedPlan.billing_type, selectedPlan.duration_months)}</span>
                  {selectedAddons.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Base: {formatPrice(selectedPlan.price)} + Add-ons: {formatPrice(selectedAddons.reduce((sum, a) => sum + a.price, 0))}
                    </p>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">What's included:</h4>
                  <ul className="space-y-2">
                    {selectedPlan.features?.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Selected Add-ons */}
                {selectedAddons.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Selected Add-ons:</h4>
                    <ul className="space-y-2">
                      {selectedAddons.map((addon) => (
                        <li key={addon.id} className="flex items-center justify-between">
                          <span className="text-gray-700">{addon.name}</span>
                          <span className="font-medium">{formatPrice(addon.price)}/month</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedAddons.length > 0 && <Separator />}

                {/* Family Members */}
                {familyMembers.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Family Members:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-gray-700">You (Primary Member)</span>
                      </li>
                      {familyMembers.map((member, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">
                            {member.firstName} {member.lastName} ({member.relationship})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {familyMembers.length > 0 && <Separator />}

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    🎉 7-day free trial included • Cancel anytime
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="cardholderName">Cardholder Name</Label>
                    <Input
                      id="cardholderName"
                      value={paymentData.cardholderName}
                      onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                      placeholder="John Doe"
                      maxLength={50}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      value={paymentData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        value={paymentData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        value={paymentData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="billingAddress">Billing Address</Label>
                    <Input
                      id="billingAddress"
                      value={paymentData.billingAddress}
                      onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                      placeholder="123 Main St"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={paymentData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={paymentData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="State"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={paymentData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        placeholder="12345"
                        maxLength={5}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={processing}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-lg font-semibold"
                    >
                      {processing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 mr-2" />
                          Complete Purchase - ${selectedPlan.price}
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Your payment information is secure and encrypted. By completing this purchase, you agree to our terms of service.
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Success Card Modal */}
      {showSuccessCard && membershipData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Success Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome to {getGymName()}!
                </h2>
                <p className="text-gray-600">
                  Your {membershipData.plan.name} membership is now active
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Membership Details */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${membershipData.plan.color} flex items-center justify-center text-white mr-2`}>
                      {membershipData.plan.icon}
                    </div>
                    Membership Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{membershipData.plan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">${membershipData.plan.price}/{formatBillingType(membershipData.plan.billing_type, membershipData.plan.duration_months)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{membershipData.startDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Next Billing:
                      </span>
                      <span className="font-medium">{membershipData.nextBillingDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Access Card */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center">
                    <QrCode className="w-5 h-5 mr-2" />
                    Digital Access Card
                  </h3>
                  <div className={`bg-gradient-to-r ${membershipData.plan.color} rounded-lg p-4 text-white mb-4`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold">{getGymName()}</h4>
                        <p className="text-xs opacity-90">{membershipData.plan.name} Member</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-75">Access Card</p>
                        <p className="font-mono text-sm">{membershipData.accessCardNumber}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs opacity-75">Member</p>
                        <p className="font-semibold text-sm">{user.first_name} {user.last_name}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center">
                        <QrCode className="w-8 h-8" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    Use this card number to access the gym
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => navigate('/member/memberdashboard')}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  Continue to Member Dashboard
                </Button>
                <Button
                  onClick={() => setShowSuccessCard(false)}
                  variant="outline"
                  className="px-4"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default JoinOnlineCheckout;
