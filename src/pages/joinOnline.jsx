import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, Star, Dumbbell, Crown, AlertCircle, Lock, Edit3, Settings, Users, Calendar, Target, ArrowRight, ArrowLeft, User, Mail, Phone, Shield } from 'lucide-react';
import { getGymName, getContactInfo, isFeatureEnabled, initializeGymBranding, getGymColors } from '@/utils/gymBranding.js';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast.js';
import { normalizeRole } from '@/utils/roleUtils';

const JoinOnline = () => {
  const { user, signup, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [onlineJoiningEnabled, setOnlineJoiningEnabled] = useState(null);
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [isStaff, setIsStaff] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Plan Selection, 2: User Info, 3: Confirmation
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreeToTerms: false
  });
  const [contactInfo, setContactInfo] = useState({
    email: 'info@momentumfitness.com',
    phone: '(555) 123-4567'
  });

  // THEME: Get branded colors for consistent styling
  const gymColors = getGymColors();

  // Default design configurations based on category
  const getDesignForCategory = (category, name) => {
    // Try to get stored design from localStorage first
    const storageKey = `plan_design_${name.toLowerCase().replace(/\s+/g, '_')}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          icon: getIconComponent(parsed.icon),
          color: parsed.color,
          popular: parsed.popular,
          description: parsed.description
        };
      } catch (e) {
        
      }
    }

    // Default designs based on category
    const designs = {
      'Standard': {
        icon: <Dumbbell className="w-8 h-8" />,
        color: 'from-blue-500 to-blue-600',
        popular: false
      },
      'Premium': {
        icon: <Star className="w-8 h-8" />,
        color: 'from-purple-500 to-purple-600',
        popular: true
      },
      'VIP': {
        icon: <Crown className="w-8 h-8" />,
        color: 'from-yellow-500 to-yellow-600',
        popular: false
      }
    };

    return designs[category] || designs['Standard'];
  };

  const getIconComponent = (iconName) => {
    const icons = {
      'dumbbell': <Dumbbell className="w-8 h-8" />,
      'star': <Star className="w-8 h-8" />,
      'crown': <Crown className="w-8 h-8" />,
      'users': <Users className="w-8 h-8" />,
      'calendar': <Calendar className="w-8 h-8" />,
      'target': <Target className="w-8 h-8" />
    };
    return icons[iconName] || icons['dumbbell'];
  };

  // Format billing type for display
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

  // Check user role
  useEffect(() => {
    if (user) {
      checkUserRole();
    }
  }, [user]);

  const checkUserRole = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!error && profile) {
        setIsStaff(['admin', 'staff'].includes(profile.role));
      }
    } catch (error) {
      
    }
  };

  // Check if online joining is enabled and fetch membership plans
  useEffect(() => {
    const loadAllSettings = async () => {
      try {
        // Load all settings at once
        await initializeGymBranding();
        
        // Set contact info
        const contactData = getContactInfo();
        setContactInfo({
          email: contactData.email,
          phone: contactData.phone
        });
        
        // Set online joining status
        setOnlineJoiningEnabled(isFeatureEnabled('online_joining'));
        
        // Load membership plans
        await fetchMembershipPlans();

        // Mark settings as loaded
        setSettingsLoaded(true);

      } catch (error) {
        
        setSettingsLoaded(true); // Still mark as loaded to prevent infinite loading
      }
    };

    loadAllSettings();
  }, []);

  // Handle authentication status
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Show a message or redirect to login with return URL
        
        // Option 1: Redirect to login with return URL
        // navigate('/login?redirect=/join-online');
        
        // Option 2: Show sign-in prompt on the page (better UX)
        // We'll handle this in the JSX below
      } else {
        
      }
    }
  }, [user, authLoading, navigate]);

  const fetchMembershipPlans = async () => {
    try {
      
      
      const { data: plans, error } = await supabase
        .from('membership_types')
        .select(`
          id,
          name,
          price,
          billing_type,
          duration_months,
          features,
          available_online,
          category,
          color
        `)
        .eq('available_online', true)
        .eq('category', 'Membership')
        .order('price', { ascending: true });

      if (error) {
        
        toast({
          title: "Error loading plans",
          description: "Unable to load membership plans. Please try again.",
          variant: "destructive",
        });
        return;
      }

      

      if (!plans || plans.length === 0) {
        
        
        
        
        
        
        
        setMembershipPlans([]);
        return;
      }

      // Transform the data with designs
      const transformedPlans = plans.map((plan, index) => {
        const design = getDesignForCategory(plan.category, plan.name);
        
        return {
          id: plan.id,
          name: plan.name,
          price: parseFloat(plan.price),
          interval: formatBillingType(plan.billing_type, plan.duration_months),
          description: plan.description || design.description || 'Great membership option',
          icon: design.icon,
          color: design.color,
          features: plan.features || [],
          popular: design.popular,
          billingType: plan.billing_type,
          durationMonths: plan.duration_months
        };
      });

      
      setMembershipPlans(transformedPlans);
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to load membership options.",
        variant: "destructive",
      });
    }
  };

  const handleEditPlan = (plan) => {
    toast({
      title: "Edit Plan Design",
      description: `Design editor for ${plan.name} - Coming soon!`,
    });
  };

  // Validation functions
  const validateStep1 = () => {
    return selectedPlan !== null;
  };

  const validateStep2 = () => {
    const { firstName, lastName, email, password, confirmPassword, phone, agreeToTerms } = formData;
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !phone.trim()) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return false;
    }
    
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return false;
    }
    
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return false;
    }
    
    if (password.length > 20) {
      toast({ title: "Error", description: "Password must be no more than 20 characters", variant: "destructive" });
      return false;
    }
    
    if (!email.includes('@')) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return false;
    }
    
    if (!agreeToTerms) {
      toast({ title: "Error", description: "Please agree to the terms and conditions", variant: "destructive" });
      return false;
    }
    
    return true;
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle step navigation
  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Complete signup process
  const handleCompleteSignup = async () => {
    if (!validateStep2()) return;
    
    setIsLoading(true);
    
    try {
      
      
      // Step 1: Check if email already exists
      const { data: existingProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', formData.email.toLowerCase().trim());
      
      if (checkError) {
        throw new Error('Error checking existing users: ' + checkError.message);
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        toast({
          title: "Account Already Exists",
          description: "An account with this email already exists. Please sign in instead.",
          variant: "destructive"
        });
        return;
      }
      
      // Step 2: Create auth user using signup from AuthContext
      
      const { user: newUser } = await signup(formData.email, formData.password);
      
      if (!newUser) {
        throw new Error('Failed to create user account');
      }
      
      
      
      // Step 3: Create profile with membership plan
      
      const profileData = {
        id: newUser.id,
        email: formData.email.toLowerCase().trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim(),
        role: normalizeRole('member'),
        current_membership_type_id: selectedPlan.id,
        status: 'Active',
        join_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);
      
      if (profileError) {
        
        throw new Error('Failed to create user profile: ' + profileError.message);
      }
      
      
      
      // Step 4: Create membership record (optional, depending on your business logic)
      if (selectedPlan) {
        
        const membershipData = {
          user_id: newUser.id,
          membership_type_id: selectedPlan.id,
          start_date: new Date().toISOString(),
          status: 'active',
          payment_status: 'pending', // Will be updated after payment
          created_at: new Date().toISOString()
        };
        
        const { error: membershipError } = await supabase
          .from('memberships')
          .insert([membershipData]);
        
        if (membershipError) {
          
          // Don't fail the whole process for this
        } else {
          
        }
      }
        // Success! Show welcome message and redirect
      toast({
        title: "Welcome to " + getGymName() + "!",
        description: "Your account has been created successfully. Welcome to our community!",
        variant: "default"
      });
      
      
        // Redirect to member dashboard
      setTimeout(() => {
        navigate('/member-portal/dashboard');
      }, 2000);
      
    } catch (error) {
      
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength calculation helper
  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
    
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // Calculate score
    if (checks.length) score += 2;
    if (checks.lowercase) score += 1;
    if (checks.uppercase) score += 1;
    if (checks.numbers) score += 1;
    if (checks.special) score += 1;
    
    // Determine strength level
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500', requirements: checks };
    if (score <= 4) return { score, label: 'Fair', color: 'bg-yellow-500', requirements: checks };
    if (score <= 5) return { score, label: 'Good', color: 'bg-blue-500', requirements: checks };
    return { score, label: 'Strong', color: 'bg-green-500', requirements: checks };
  };

  // Password Strength Meter Component
  const PasswordStrengthMeter = ({ password }) => {
    const strength = calculatePasswordStrength(password);
    const progressWidth = (strength.score / 6) * 100;
    
    return (
      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Password Strength</span>
          <span className={`text-xs font-medium ${
            strength.label === 'Strong' ? 'text-green-600' :
            strength.label === 'Good' ? 'text-blue-600' :
            strength.label === 'Fair' ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {strength.label}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${strength.color}`} 
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        
        {password && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`flex items-center gap-1 ${strength.requirements.length ? 'text-green-600' : 'text-gray-400'}`}>
              {strength.requirements.length ? <Shield className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
              8+ characters
            </div>
            <div className={`flex items-center gap-1 ${strength.requirements.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
              {strength.requirements.uppercase ? <Shield className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
              Uppercase letter
            </div>
            <div className={`flex items-center gap-1 ${strength.requirements.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
              {strength.requirements.lowercase ? <Shield className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
              Lowercase letter
            </div>
            <div className={`flex items-center gap-1 ${strength.requirements.numbers ? 'text-green-600' : 'text-gray-400'}`}>
              {strength.requirements.numbers ? <Shield className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
              Number
            </div>
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading membership options...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-xl w-full max-w-md text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Join Nordic Fitness
          </h1>
          <p className="text-gray-600 mb-6">
            Please sign in to view membership options and complete your registration.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/login?redirect=/join-online')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sign In
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/signup')}
              className="w-full"
            >
              Create Account
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // If settings haven't loaded yet (but auth is complete), show loading
  if (!authLoading && !settingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading membership options...</p>
        </div>
      </div>
    );
  }

  // If online joining is disabled (only check after settings are loaded)
  if (settingsLoaded && onlineJoiningEnabled === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-xl w-full max-w-md text-center"
        >
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-gray-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Online Membership Not Available
          </h1>
          
          <p className="text-gray-600 mb-6">
            {getGymName()} currently requires in-person membership sign-ups. 
            Please visit our facility to speak with our membership team.
          </p>

          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Visit us during business hours or call to schedule an appointment with our membership specialists.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">            {isStaff && (
              <Button
                onClick={() => navigate('/staff-portal/settings')}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white mb-2"
              >
                <Settings className="w-4 h-4 mr-2" />
                Enable Online Joining
              </Button>
            )}
            
            <Button
              onClick={() => navigate('/contact')}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              Contact Us
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // If no plans available for online sale - only show this when:
  // 1. Settings have been loaded (settingsLoaded = true)
  // 2. Online joining is enabled (onlineJoiningEnabled = true)
  // 3. No membership plans were found (membershipPlans.length === 0)
  if (settingsLoaded && onlineJoiningEnabled && membershipPlans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-xl w-full max-w-md text-center"
        >
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No Plans Available
          </h1>
          <p className="text-gray-600 mb-6">
            There are currently no membership plans available for online purchase.
          </p>
            {isStaff && (
            <Button
              onClick={() => navigate('/staff-portal/memberships')}
              className="w-full mb-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Memberships
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  // Main membership selection page
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 pt-8"
        >
          {/* Back to Login Button - Top Right */}
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
            >
              ← Back to Login
            </Button>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to {getGymName()}, {user.user_metadata?.firstName}!
          </h1>
          <p className="text-xl text-white/90 mb-2">
            Choose your membership plan and start your fitness journey today
          </p>
          <p className="text-white/75">
            All plans include a 7-day free trial • Cancel anytime
          </p>
          
          {/* Staff Controls */}
          {isStaff && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/staff-portal/settings')}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Online Joining Settings
              </Button>
            </div>
          )}
        </motion.div>

        {/* Membership Plans */}
        <div className={`grid gap-6 mb-8 ${
          membershipPlans.length === 1 ? 'max-w-md mx-auto' :
          membershipPlans.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
          'md:grid-cols-3'
        }`}>
          {membershipPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className={`relative h-full cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedPlan === plan.id 
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' 
                    : ''
                } ${plan.popular ? 'border-2 border-yellow-400' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {/* Staff Edit Button */}
                {isStaff && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPlan(plan);
                    }}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                )}

                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black font-semibold">
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center text-white mb-4`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/{plan.interval}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full mt-6 py-3 text-lg font-semibold transition-all duration-300 ${
                      selectedPlan === plan.id
                        ? `bg-gradient-to-r ${plan.color} text-white shadow-lg`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-8"
          >
            <Button
              onClick={() => navigate(`/join-online/customize?plan=${selectedPlan}`)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-12 py-4 text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              Continue with {membershipPlans.find(p => p.id === selectedPlan)?.name}
            </Button>
          </motion.div>
        )}

        {/* User Info Form - Step 2 */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-xl w-full max-w-md mx-auto mb-8"
          >
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
              Your Information
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="mt-1"
                    placeholder="John"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="mt-1"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="mt-1"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="mt-1"
                    placeholder="••••••"
                    required
                  />
                  <PasswordStrengthMeter password={formData.password} />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="mt-1"
                    placeholder="••••••"
                    required
                  />
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
                <Label htmlFor="agreeToTerms" className="ml-3 block text-sm text-gray-700">
                  I agree to the{" "}
                  <a href="/terms" className="text-indigo-600 hover:underline">
                    terms and conditions
                  </a>
                </Label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button
                onClick={prevStep}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <Button
                onClick={nextStep}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                isLoading={isLoading}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Password Strength Meter */}
            <PasswordStrengthMeter password={formData.password} />
          </motion.div>
        )}

        {/* Confirmation Step - Step 3 */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-xl w-full max-w-md mx-auto mb-8"
          >
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
              Confirm Your Details
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700">
                    First Name
                  </Label>
                  <p className="mt-1 text-gray-900">
                    {formData.firstName}
                  </p>
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </Label>
                  <p className="mt-1 text-gray-900">
                    {formData.lastName}
                  </p>
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700">
                  Email
                </Label>
                <p className="mt-1 text-gray-900">
                  {formData.email}
                </p>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700">
                  Phone
                </Label>
                <p className="mt-1 text-gray-900">
                  {formData.phone}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <p className="mt-1 text-gray-900">
                    ********
                  </p>
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </Label>
                  <p className="mt-1 text-gray-900">
                    ********
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={handleCompleteSignup}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                isLoading={isLoading}
              >
                Complete Signup
              </Button>
            </div>

            <div className="mt-4 text-center">
              <Button
                onClick={prevStep}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Edit
              </Button>
            </div>
          </motion.div>
        )}

        {/* Contact Information Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 mb-8"
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              Questions? Contact us.
            </h3>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm">📧</span>
                </div>
                <a 
                  href={`mailto:${contactInfo.email}`}
                  className="hover:text-white transition-colors underline"
                >
                  {contactInfo.email}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm">📞</span>
                </div>
                <a 
                  href={`tel:${contactInfo.phone.replace(/[^\d+]/g, '')}`}
                  className="hover:text-white transition-colors underline"
                >
                  {contactInfo.phone}
                </a>
              </div>
            </div>

            <p className="text-white/75 mt-4 text-sm">
              Our team is here to help you find the perfect membership plan.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinOnline;


