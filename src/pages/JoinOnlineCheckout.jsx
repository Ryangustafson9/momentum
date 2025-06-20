import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, ArrowLeft, ShoppingCart, Plus, Minus, CreditCard, Building2, Sparkles, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast.js';
import { stripeService } from '@/services/stripeService';

const JoinOnlineCheckout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');
    const [selectedPlan, setSelectedPlan] = useState(null);
  const [availableAddons, setAvailableAddons] = useState([]);  const [selectedAddons, setSelectedAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
    // Billing form state
  const [useCardForRecurring, setUseCardForRecurring] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'bank'
  const [recurringPaymentMethod, setRecurringPaymentMethod] = useState('card'); // for recurring billing when useCardForRecurring is false
  const [billingInfo, setBillingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: '',
    // Bank account fields for initial payment
    accountHolderName: '',
    routingNumber: '',
    accountNumber: '',
    // Recurring payment fields (separate from initial payment)
    recurringCardNumber: '',
    recurringExpiryDate: '',
    recurringCvv: '',
    recurringAccountHolderName: '',
    recurringRoutingNumber: '',
    recurringAccountNumber: ''
  });

  useEffect(() => {
    // First try to get checkout data from sessionStorage (from customize page)
    const checkoutData = sessionStorage.getItem('membershipCheckoutData');
    
    if (checkoutData) {
      try {
        const parsed = JSON.parse(checkoutData);
        console.log('🛒 Loading checkout data from sessionStorage:', parsed);
        loadCheckoutDataFromSession(parsed);
        return;
      } catch (error) {
        console.error('Error parsing checkout data from sessionStorage:', error);
      }
    }
    
    // Fallback to URL parameter approach
    if (!planId) {
      console.log('❌ No plan ID in URL and no sessionStorage data, redirecting to join-online');
      navigate('/join-online');
      return;
    }
    
    console.log('📋 Loading checkout data from URL parameter:', planId);
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

      setSelectedPlan(plan);      // Load available add-ons
      const { data: addons, error: addonsError } = await supabase
        .from('membership_types')
        .select('*')
        .in('category', ['Add-on', 'Add-ons']) // Check both possible category names
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
        console.log('✅ Loaded available add-ons:', addons);
        setAvailableAddons(addons || []);
      }

    } catch (error) {
      console.error('Error in loadCheckoutData:', error);
      toast({
        title: "Error",
        description: "Failed to load checkout data.",
        variant: "destructive",
      });    } finally {
      setLoading(false);
    }
  };

  const loadCheckoutDataFromSession = async (checkoutData) => {
    try {
      setLoading(true);
      
      console.log('🔍 Loading plan data for ID:', checkoutData.plan);
      
      // Load selected membership plan
      const { data: plan, error: planError } = await supabase
        .from('membership_types')
        .select('*')
        .eq('id', checkoutData.plan)
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
      
      // Load add-ons if they were selected in customize page
      if (checkoutData.addons && checkoutData.addons.length > 0) {
        console.log('🔍 Loading selected add-ons:', checkoutData.addons);
        
        const { data: addons, error: addonsError } = await supabase
          .from('membership_types')
          .select('*')
          .in('id', checkoutData.addons);        if (addonsError) {
          console.error('Error loading selected add-ons:', addonsError);
        } else {
          console.log('✅ Loaded selected add-ons from session:', addons);
          setSelectedAddons(addons || []);
        }
      }      // Also load all available add-ons for display
      const { data: allAddons, error: allAddonsError } = await supabase
        .from('membership_types')
        .select('*')
        .in('category', ['Add-on', 'Add-ons']) // Check both possible category names
        .eq('available_online', true)
        .eq('active', true)
        .order('price', { ascending: true });      if (allAddonsError) {
        console.error('Error loading all add-ons:', allAddonsError);
        // If we can't load available add-ons, set empty array
        setAvailableAddons([]);
      } else {
        console.log('✅ Loaded available add-ons:', allAddons);
        setAvailableAddons(allAddons || []);
      }

    } catch (error) {
      console.error('Error in loadCheckoutDataFromSession:', error);
      toast({
        title: "Error",
        description: "Failed to load checkout data.",
        variant: "destructive",
      });
      navigate('/join-online');
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

  const getNextBillingDate = () => {
    if (!selectedPlan) return null;
    
    const now = new Date();
    const nextBilling = new Date(now);
    
    // Add the billing period based on billing_type and duration_months
    if (selectedPlan.billing_type === 'monthly') {
      nextBilling.setMonth(nextBilling.getMonth() + (selectedPlan.duration_months || 1));
    } else if (selectedPlan.billing_type === 'yearly') {
      nextBilling.setFullYear(nextBilling.getFullYear() + (selectedPlan.duration_months ? Math.ceil(selectedPlan.duration_months / 12) : 1));
    } else if (selectedPlan.billing_type === 'weekly') {
      nextBilling.setDate(nextBilling.getDate() + 7);
    } else {
      // Default to monthly
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    }
    
    return nextBilling;
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
  };  const handleProceedToPayment = async () => {
    console.log('🎯 Submit Payment button clicked!');
    console.log('🔍 Current state:', {
      user: user?.email || 'No user',
      selectedPlan: selectedPlan?.name || 'No plan',
      processingPayment,
      loading
    });

    if (!user) {
      console.log('❌ No user logged in, redirecting to login');
      toast({
        title: "Login Required",
        description: "Please log in to complete your membership purchase.",
        variant: "destructive",
      });
      navigate('/login?redirect=/join-online/checkout');
      return;
    }

    if (!selectedPlan) {
      toast({
        title: "Plan Required",
        description: "Please select a membership plan to continue.",
        variant: "destructive",
      });
      return;
    }

    // Comprehensive validation function
    const validateForm = () => {
      const errors = [];

      // Personal Information Validation
      if (!billingInfo.firstName?.trim()) {
        errors.push("First Name is required");
      }
      if (!billingInfo.lastName?.trim()) {
        errors.push("Last Name is required");
      }
      if (!billingInfo.email?.trim()) {
        errors.push("Email Address is required");
      } else if (!/\S+@\S+\.\S+/.test(billingInfo.email)) {
        errors.push("Please enter a valid email address");
      }

      // Initial Payment Method Validation (Credit Card only for initial payment)
      if (!billingInfo.cardNumber?.trim()) {
        errors.push("Card Number is required");
      } else if (billingInfo.cardNumber.replace(/\s/g, '').length < 13) {
        errors.push("Please enter a valid card number");
      }
      
      if (!billingInfo.expiryDate?.trim()) {
        errors.push("Card Expiry Date is required");
      } else if (!/^\d{2}\/\d{2}$/.test(billingInfo.expiryDate)) {
        errors.push("Please enter expiry date in MM/YY format");
      }
      
      if (!billingInfo.cvv?.trim()) {
        errors.push("CVV is required");
      } else if (!/^\d{3,4}$/.test(billingInfo.cvv)) {
        errors.push("CVV must be 3 or 4 digits");
      }

      // Billing Address Validation
      if (!billingInfo.billingAddress?.trim()) {
        errors.push("Billing Address is required");
      }
      if (!billingInfo.city?.trim()) {
        errors.push("City is required");
      }
      if (!billingInfo.state?.trim()) {
        errors.push("State is required");
      }
      if (!billingInfo.zipCode?.trim()) {
        errors.push("ZIP Code is required");
      } else if (!/^\d{5}(-\d{4})?$/.test(billingInfo.zipCode)) {
        errors.push("Please enter a valid ZIP code");
      }

      // Recurring Payment Method Validation (only if different from initial payment)
      if (!useCardForRecurring) {
        if (recurringPaymentMethod === 'card') {
          if (!billingInfo.recurringCardNumber?.trim()) {
            errors.push("Recurring payment card number is required");
          } else if (billingInfo.recurringCardNumber.replace(/\s/g, '').length < 13) {
            errors.push("Please enter a valid recurring payment card number");
          }
          
          if (!billingInfo.recurringExpiryDate?.trim()) {
            errors.push("Recurring payment card expiry date is required");
          } else if (!/^\d{2}\/\d{2}$/.test(billingInfo.recurringExpiryDate)) {
            errors.push("Please enter recurring payment expiry date in MM/YY format");
          }
          
          if (!billingInfo.recurringCvv?.trim()) {
            errors.push("Recurring payment CVV is required");
          } else if (!/^\d{3,4}$/.test(billingInfo.recurringCvv)) {
            errors.push("Recurring payment CVV must be 3 or 4 digits");
          }
        } else if (recurringPaymentMethod === 'bank') {
          if (!billingInfo.recurringAccountHolderName?.trim()) {
            errors.push("Account holder name is required for recurring payments");
          }
          if (!billingInfo.recurringRoutingNumber?.trim()) {
            errors.push("Routing number is required for recurring payments");
          } else if (!/^\d{9}$/.test(billingInfo.recurringRoutingNumber)) {
            errors.push("Routing number must be 9 digits");
          }
          if (!billingInfo.recurringAccountNumber?.trim()) {
            errors.push("Account number is required for recurring payments");
          }
        }
      }

      return errors;
    };

    // Validate all form data
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      // Show the first few errors
      const errorMessage = validationErrors.slice(0, 3).join(', ');
      const additionalErrors = validationErrors.length > 3 ? ` and ${validationErrors.length - 3} more` : '';
      
      toast({
        title: "Please Complete Required Information",
        description: errorMessage + additionalErrors,
        variant: "destructive",
      });
      
      // Log all errors for debugging
      console.warn('❌ Form validation errors:', validationErrors);
      return;
    }

    setProcessingPayment(true);

    try {
      console.log('🔄 Processing payment for user:', user.email);
      console.log('📋 Selected Plan:', selectedPlan);
      console.log('🎯 Selected Add-ons:', selectedAddons);
      console.log('💰 Total:', calculateTotal());
      console.log('💳 Billing Info:', { ...billingInfo, cardNumber: '****', cvv: '***', accountNumber: '****' });

      // Show processing message
      toast({
        title: "Processing Payment",
        description: "Please wait while we process your membership...",
      });

      // Prepare member data
      const memberData = {
        id: user.id,
        email: billingInfo.email,
        firstName: billingInfo.firstName,
        lastName: billingInfo.lastName
      };      // Prepare payment data
      const paymentData = {
        membershipTypeId: selectedPlan.id,
        membershipType: selectedPlan.name,
        priceId: `price_${selectedPlan.id}`, // In real implementation, this would be actual Stripe price ID
        amount: calculateTotal(),
        useRecurring: useCardForRecurring,
        paymentMethod: paymentMethod,
        recurringPaymentMethod: useCardForRecurring ? paymentMethod : recurringPaymentMethod,
        billingInfo: billingInfo,
        addons: selectedAddons.map(addon => ({
          id: addon.id,
          name: addon.name,
          price: addon.price
        }))
      };

      console.log('🚀 Calling stripe service...');
      
      // Add a slight delay to simulate real payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Process membership signup through Stripe service      const result = await stripeService.processMembershipSignup(memberData, paymentData);
      
      console.log('✅ Payment processing result:', result);      if (result.success) {
        // Clear checkout data from sessionStorage
        sessionStorage.removeItem('membershipCheckoutData');
        
        // Set payment result data for the success modal
        setPaymentResult({
          membershipName: selectedPlan.name,
          membershipId: selectedPlan.id,
          amount: calculateTotal().toFixed(2)
        });
        
        // Show success toast
        toast({
          title: "🎉 Payment Successful!",
          description: `Your ${selectedPlan.name} membership has been activated.`,
          duration: 5000,
        });
        
        // Show success modal
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message || 'Payment processing failed');
      }

    } catch (error) {
      console.error('❌ Payment processing error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  // Initialize billing info with user data
  useEffect(() => {
    if (user) {
      setBillingInfo(prev => ({
        ...prev,
        firstName: user.first_name || user.name?.split(' ')[0] || '',
        lastName: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Auto-formatting functions
  const formatCardNumber = (value) => {
    // Remove all non-digit characters
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add space every 4 digits
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

  const formatExpiryDate = (value) => {
    // Remove all non-digit characters
    const v = value.replace(/\D/g, '');
    // Add slash after 2 digits
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const formatCVV = (value) => {
    // Only allow digits, max 4 characters
    return value.replace(/\D/g, '').substring(0, 4);
  };

  const formatZipCode = (value) => {
    // Remove all non-digit characters
    const v = value.replace(/\D/g, '');
    // Add dash after 5 digits if there are more digits
    if (v.length > 5) {
      return v.substring(0, 5) + '-' + v.substring(5, 9);
    }
    return v;
  };

  // Helper function to get field validation status
  const getFieldStatus = (field, value, format) => {
    if (!value?.trim()) return 'empty';
    if (format && !format.test(value)) return 'invalid';
    return 'valid';
  };
  
  // Helper function to get field border color based on status
  const getFieldBorderClass = (field, value, format) => {
    const status = getFieldStatus(field, value, format);
    if (status === 'empty') return '';
    if (status === 'invalid') return 'border-red-500 focus:border-red-500';
    return 'border-green-500 focus:border-green-500';
  };

  // Enhanced billing info change handler with auto-formatting
  const handleBillingInfoChange = (field, value) => {
    let formattedValue = value;
    
    // Apply formatting based on field type
    switch (field) {
      case 'cardNumber':
      case 'recurringCardNumber':
        formattedValue = formatCardNumber(value);
        break;
      case 'expiryDate':
      case 'recurringExpiryDate':
        formattedValue = formatExpiryDate(value);
        break;
      case 'cvv':
      case 'recurringCvv':
        formattedValue = formatCVV(value);
        break;
      case 'zipCode':
        formattedValue = formatZipCode(value);
        break;
      case 'routingNumber':
      case 'recurringRoutingNumber':
        // Only allow digits, max 9 characters
        formattedValue = value.replace(/\D/g, '').substring(0, 9);
        break;
      case 'firstName':
      case 'lastName':
        // Capitalize first letter of each word
        formattedValue = value.replace(/\b\w/g, l => l.toUpperCase());
        break;
      case 'email':
        // Convert to lowercase
        formattedValue = value.toLowerCase();
        break;
      default:
        formattedValue = value;
    }

    setBillingInfo(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  // Prevent form submission on Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Debug component state
  console.log('🔍 JoinOnlineCheckout render state:', {
    user: user?.email || 'No user',
    selectedPlan: selectedPlan?.name || 'No plan',
    loading,
    processingPayment,
    planId
  });

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
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('⚠️ Form submission prevented');
        }}
        onKeyDown={handleKeyDown}
      >
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
              </CardHeader>              <CardContent>
                <div className="mb-4">
                  {selectedAddons.length > 0 ? (
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-700">
                        {selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''} selected
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mb-2">
                      Select additional services to enhance your membership
                    </p>
                  )}
                </div>
                
                {availableAddons.length === 0 ? (
                  <div className="text-center py-4">
                    {selectedAddons.length > 0 ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-3">Your Selected Add-ons:</p>
                        <div className="space-y-2">
                          {selectedAddons.map((addon) => (
                            <div key={addon.id} className="flex justify-between items-center p-2 bg-white border border-green-200 rounded">
                              <div>
                                <span className="font-medium text-green-800">{addon.name}</span>
                                <p className="text-xs text-green-600">{addon.description || 'Additional service'}</p>
                              </div>
                              <span className="font-bold text-green-800">${addon.price}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-green-600 mt-2">
                          These add-ons will be included in your membership
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">No add-ons available at this time.</p>
                    )}
                  </div>
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
                  <div key={addon.id} className="flex justify-between">
                    <span>{addon.name}</span>
                    <span>${addon.price}</span>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                
                {/* Billing Information */}
                {getNextBillingDate() && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-blue-800">Next Billing Date:</span>
                      <span className="text-blue-700">
                        {getNextBillingDate().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="font-medium text-blue-800">Billing Cycle:</span>
                      <span className="text-blue-700 capitalize">
                        {formatBillingType(selectedPlan.billing_type, selectedPlan.duration_months)}
                      </span>
                    </div>
                  </div>
                )}
                  <div className="text-sm text-gray-600 mb-6">
                  <p>• All plans include a 7-day free trial</p>
                  <p>• Cancel anytime</p>
                  <p>• No setup fees</p>
                </div>

                {/* Payment Method and Billing Information Form */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment & Billing Information                  </h3>
                  {/* Payment Method - Credit Card Only */}
                  <div className="mb-6">
                    <Label className="text-lg font-medium mb-4 block">Payment Information</Label>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Credit/Debit Card</span>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        We accept Visa, Mastercard, American Express, and Discover
                      </p>
                    </div>
                  </div>

                  {/* Billing Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>                      <Input
                        id="firstName"
                        value={billingInfo.firstName}
                        onChange={(e) => handleBillingInfoChange('firstName', e.target.value)}
                        onKeyDown={handleKeyDown}
                        required
                        autoComplete="given-name"
                        className={getFieldBorderClass('firstName', billingInfo.firstName)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>                      <Input
                        id="lastName"
                        value={billingInfo.lastName}
                        onChange={(e) => handleBillingInfoChange('lastName', e.target.value)}
                        onKeyDown={handleKeyDown}
                        required
                        autoComplete="family-name"
                        className={getFieldBorderClass('lastName', billingInfo.lastName)}
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <Label htmlFor="email">Email Address *</Label>                    <Input
                      id="email"
                      type="email"
                      value={billingInfo.email}
                      onChange={(e) => handleBillingInfoChange('email', e.target.value)}
                      onKeyDown={handleKeyDown}
                      required
                      autoComplete="email"
                      className={getFieldBorderClass('email', billingInfo.email, /\S+@\S+\.\S+/)}
                    />
                  </div>

                  {/* Card Payment Details */}
                  <div className="mb-4">
                    <Label htmlFor="cardNumber">Card Number *</Label>                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={billingInfo.cardNumber}
                      onChange={(e) => handleBillingInfoChange('cardNumber', e.target.value)}
                      onKeyDown={handleKeyDown}
                      required
                      maxLength="19"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      className={getFieldBorderClass('cardNumber', billingInfo.cardNumber)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date *</Label>                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={billingInfo.expiryDate}
                        onChange={(e) => handleBillingInfoChange('expiryDate', e.target.value)}
                        required
                        maxLength="5"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        className={getFieldBorderClass('expiryDate', billingInfo.expiryDate, /^\d{2}\/\d{2}$/)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV *</Label>                      <Input
                        id="cvv"
                        placeholder="123"
                        value={billingInfo.cvv}
                        onChange={(e) => handleBillingInfoChange('cvv', e.target.value)}
                        required
                        maxLength="4"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        className={getFieldBorderClass('cvv', billingInfo.cvv, /^\d{3,4}$/)}
                      />
                    </div>                  </div>

                  {/* Billing Address */}
                  <div className="mb-4">
                    <Label htmlFor="billingAddress">Billing Address *</Label>                    <Input
                      id="billingAddress"
                      placeholder="123 Main Street"
                      value={billingInfo.billingAddress}
                      onChange={(e) => handleBillingInfoChange('billingAddress', e.target.value)}
                      required
                      autoComplete="street-address"
                      className={getFieldBorderClass('billingAddress', billingInfo.billingAddress)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <Label htmlFor="city">City *</Label>                      <Input
                        id="city"
                        value={billingInfo.city}
                        onChange={(e) => handleBillingInfoChange('city', e.target.value)}
                        required
                        autoComplete="address-level2"
                        className={getFieldBorderClass('city', billingInfo.city)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Select value={billingInfo.state} onValueChange={(value) => handleBillingInfoChange('state', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>                        <SelectContent>
                          <SelectItem value="AL">Alabama</SelectItem>
                          <SelectItem value="AK">Alaska</SelectItem>
                          <SelectItem value="AZ">Arizona</SelectItem>
                          <SelectItem value="AR">Arkansas</SelectItem>
                          <SelectItem value="CA">California</SelectItem>
                          <SelectItem value="CO">Colorado</SelectItem>
                          <SelectItem value="CT">Connecticut</SelectItem>
                          <SelectItem value="DE">Delaware</SelectItem>
                          <SelectItem value="FL">Florida</SelectItem>
                          <SelectItem value="GA">Georgia</SelectItem>
                          <SelectItem value="HI">Hawaii</SelectItem>
                          <SelectItem value="ID">Idaho</SelectItem>
                          <SelectItem value="IL">Illinois</SelectItem>
                          <SelectItem value="IN">Indiana</SelectItem>
                          <SelectItem value="IA">Iowa</SelectItem>
                          <SelectItem value="KS">Kansas</SelectItem>
                          <SelectItem value="KY">Kentucky</SelectItem>
                          <SelectItem value="LA">Louisiana</SelectItem>
                          <SelectItem value="ME">Maine</SelectItem>
                          <SelectItem value="MD">Maryland</SelectItem>
                          <SelectItem value="MA">Massachusetts</SelectItem>
                          <SelectItem value="MI">Michigan</SelectItem>
                          <SelectItem value="MN">Minnesota</SelectItem>
                          <SelectItem value="MS">Mississippi</SelectItem>
                          <SelectItem value="MO">Missouri</SelectItem>
                          <SelectItem value="MT">Montana</SelectItem>
                          <SelectItem value="NE">Nebraska</SelectItem>
                          <SelectItem value="NV">Nevada</SelectItem>
                          <SelectItem value="NH">New Hampshire</SelectItem>
                          <SelectItem value="NJ">New Jersey</SelectItem>
                          <SelectItem value="NM">New Mexico</SelectItem>
                          <SelectItem value="NY">New York</SelectItem>
                          <SelectItem value="NC">North Carolina</SelectItem>
                          <SelectItem value="ND">North Dakota</SelectItem>
                          <SelectItem value="OH">Ohio</SelectItem>
                          <SelectItem value="OK">Oklahoma</SelectItem>
                          <SelectItem value="OR">Oregon</SelectItem>
                          <SelectItem value="PA">Pennsylvania</SelectItem>
                          <SelectItem value="RI">Rhode Island</SelectItem>
                          <SelectItem value="SC">South Carolina</SelectItem>
                          <SelectItem value="SD">South Dakota</SelectItem>
                          <SelectItem value="TN">Tennessee</SelectItem>
                          <SelectItem value="TX">Texas</SelectItem>
                          <SelectItem value="UT">Utah</SelectItem>
                          <SelectItem value="VT">Vermont</SelectItem>
                          <SelectItem value="VA">Virginia</SelectItem>
                          <SelectItem value="WA">Washington</SelectItem>
                          <SelectItem value="WV">West Virginia</SelectItem>
                          <SelectItem value="WI">Wisconsin</SelectItem>
                          <SelectItem value="WY">Wyoming</SelectItem>
                          <SelectItem value="DC">District of Columbia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code *</Label>                      <Input
                        id="zipCode"
                        placeholder="12345 or 12345-6789"
                        value={billingInfo.zipCode}
                        onChange={(e) => handleBillingInfoChange('zipCode', e.target.value)}
                        required
                        maxLength="10"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        className={getFieldBorderClass('zipCode', billingInfo.zipCode, /^\d{5}(-\d{4})?$/)}
                      />
                    </div>
                  </div>

                  {/* Recurring Payment Option */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="recurring-payment"
                        checked={useCardForRecurring}
                        onCheckedChange={setUseCardForRecurring}
                      />
                      <div className="flex-1">
                        <Label htmlFor="recurring-payment" className="font-medium text-blue-800">
                          Use this payment method for recurring billing
                        </Label>
                        <p className="text-sm text-blue-600 mt-1">
                          Use the same payment method above for automatic monthly/annual billing
                        </p>
                      </div>
                    </div>
                  </div>                  {/* Recurring Payment Method Selection (when checkbox is unchecked) */}
                  {!useCardForRecurring && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                      <Label className="text-lg font-medium text-gray-800 mb-3 block">
                        Recurring Billing Payment Method
                      </Label>
                      <p className="text-sm text-gray-600 mb-4">
                        Choose a different payment method for your recurring membership billing
                      </p>
                      
                      <div className="flex gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="recurring-payment-card"
                            name="recurringPaymentMethod"
                            value="card"
                            checked={recurringPaymentMethod === 'card'}
                            onChange={(e) => setRecurringPaymentMethod(e.target.value)}
                            className="w-4 h-4"
                          />                          <Label htmlFor="recurring-payment-card" className="flex items-center gap-2 cursor-pointer">
                            <CreditCard className="w-4 h-4" />
                            Credit/Debit Card
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="recurring-payment-bank"
                            name="recurringPaymentMethod"
                            value="bank"
                            checked={recurringPaymentMethod === 'bank'}
                            onChange={(e) => setRecurringPaymentMethod(e.target.value)}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="recurring-payment-bank" className="flex items-center gap-2 cursor-pointer">
                            <Building2 className="w-4 h-4" />
                            Bank Account
                          </Label>
                        </div>
                      </div>

                      {/* Recurring Payment Details */}
                      {recurringPaymentMethod === 'card' ? (
                        <>
                          <div className="mb-4">
                            <Label htmlFor="recurringCardNumber">Card Number *</Label>                            <Input
                              id="recurringCardNumber"
                              placeholder="1234 5678 9012 3456"
                              value={billingInfo.recurringCardNumber}
                              onChange={(e) => handleBillingInfoChange('recurringCardNumber', e.target.value)}
                              required
                              maxLength="19"
                              inputMode="numeric"
                              autoComplete="cc-number"
                              className={getFieldBorderClass('recurringCardNumber', billingInfo.recurringCardNumber)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="recurringExpiryDate">Expiry Date *</Label>                              <Input
                                id="recurringExpiryDate"
                                placeholder="MM/YY"
                                value={billingInfo.recurringExpiryDate}
                                onChange={(e) => handleBillingInfoChange('recurringExpiryDate', e.target.value)}
                                required
                                maxLength="5"
                                inputMode="numeric"
                                autoComplete="cc-exp"
                                className={getFieldBorderClass('recurringExpiryDate', billingInfo.recurringExpiryDate, /^\d{2}\/\d{2}$/)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="recurringCvv">CVV *</Label>                              <Input
                                id="recurringCvv"
                                placeholder="123"
                                value={billingInfo.recurringCvv}
                                onChange={(e) => handleBillingInfoChange('recurringCvv', e.target.value)}
                                required
                                maxLength="4"
                                inputMode="numeric"
                                autoComplete="cc-csc"
                                className={getFieldBorderClass('recurringCvv', billingInfo.recurringCvv, /^\d{3,4}$/)}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mb-4">
                            <Label htmlFor="recurringAccountHolderName">Account Holder Name *</Label>
                            <Input
                              id="recurringAccountHolderName"
                              value={billingInfo.recurringAccountHolderName}
                              onChange={(e) => handleBillingInfoChange('recurringAccountHolderName', e.target.value)}
                              required
                              className={getFieldBorderClass('recurringAccountHolderName', billingInfo.recurringAccountHolderName)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="recurringRoutingNumber">Routing Number *</Label>                              <Input
                                id="recurringRoutingNumber"
                                placeholder="123456789"
                                value={billingInfo.recurringRoutingNumber}
                                onChange={(e) => handleBillingInfoChange('recurringRoutingNumber', e.target.value)}
                                required
                                maxLength="9"
                                inputMode="numeric"
                                className={getFieldBorderClass('recurringRoutingNumber', billingInfo.recurringRoutingNumber, /^\d{9}$/)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="recurringAccountNumber">Account Number *</Label>
                              <Input
                                id="recurringAccountNumber"
                                value={billingInfo.recurringAccountNumber}
                                onChange={(e) => handleBillingInfoChange('recurringAccountNumber', e.target.value)}
                                required
                                className={getFieldBorderClass('recurringAccountNumber', billingInfo.recurringAccountNumber)}
                              />
                            </div>
                          </div>                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
                <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🎯 Button clicked event:', e);
                  console.log('🔍 Button state:', {
                    disabled: processingPayment || loading || !selectedPlan,
                    processingPayment,
                    loading,
                    selectedPlan: selectedPlan?.name
                  });
                  handleProceedToPayment();
                }}
                disabled={processingPayment || loading || !selectedPlan}
                className={`w-full mt-6 py-3 text-lg font-semibold transition-all duration-200 ${
                  processingPayment || loading || !selectedPlan
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
                size="lg"
              >
                {processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Payment...
                  </>
                ) : loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : !selectedPlan ? (
                  'Select a Plan to Continue'
                ) : (
                  `Submit Payment - $${calculateTotal().toFixed(2)}`
                )}
              </Button>
            </CardContent>
          </Card>        </motion.div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold text-green-800">
              Welcome to Momentum Fitness!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 mt-2">
              Your membership has been successfully activated. You now have access to all the features of your selected plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-6">
            {paymentResult && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">Membership:</span>
                    <span>{paymentResult.membershipName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Plan ID:</span>
                    <span>{paymentResult.membershipId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Amount Paid:</span>
                    <span>${paymentResult.amount}</span>
                  </div>
                </div>
              </div>
            )}
              <Button 
              onClick={() => navigate('/member-portal/dashboard')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-lg font-semibold"
              size="lg"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Go to Member Portal
            </Button>
          </div>        </DialogContent>
      </Dialog>
      </form>
    </div>
  );
};

export default JoinOnlineCheckout;

