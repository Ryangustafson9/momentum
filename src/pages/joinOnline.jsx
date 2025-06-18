import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Star, Dumbbell, Crown, AlertCircle, Lock, Edit3, Settings, Users, Calendar, Target } from 'lucide-react';
import { getGymName, getContactInfo, isFeatureEnabled, initializeGymBranding } from '@/helpers/gymBranding.js';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast.js';

const JoinOnline = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [onlineJoiningEnabled, setOnlineJoiningEnabled] = useState(null);
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [isStaff, setIsStaff] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    email: 'info@nordicfitness.com', // Default fallback
    phone: '(555) 123-4567'         // Default fallback
  });

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
        console.warn('Failed to parse stored design:', e);
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
      console.error('Error checking user role:', error);
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
        
      } catch (error) {
        console.error('❌ Error loading settings:', error);
      }
    };

    loadAllSettings();
  }, []);

  // Handle authentication status
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Show a message or redirect to login with return URL
        console.log('🔄 User not authenticated, showing sign-in prompt...');
        // Option 1: Redirect to login with return URL
        // navigate('/login?redirect=/join-online');
        
        // Option 2: Show sign-in prompt on the page (better UX)
        // We'll handle this in the JSX below
      } else {
        console.log('✅ User authenticated:', user.display_name);
      }
    }
  }, [user, loading, navigate]);

  const fetchMembershipPlans = async () => {
    try {
      console.log('🔍 Fetching membership plans...');
      
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
        console.error('❌ Error fetching membership plans:', error);
        toast({
          title: "Error loading plans",
          description: "Unable to load membership plans. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Fetched plans:', plans);

      if (!plans || plans.length === 0) {
        console.log('⚠️ No membership plans found with available_online=true and active=true');
        console.log('💡 To fix this, you need to:');
        console.log('   1. Go to /staff/memberships');
        console.log('   2. Create or edit membership plans');
        console.log('   3. Set "Available for Sale" = true');
        console.log('   4. Set "Available Online" = true');
        console.log('   5. Set "Active" = true');
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

      console.log('✅ Transformed plans:', transformedPlans);
      setMembershipPlans(transformedPlans);
    } catch (error) {
      console.error('❌ Error in fetchMembershipPlans:', error);
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

  // Loading state
  if (loading) {
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

  // If online joining is disabled
  if (!onlineJoiningEnabled) {
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

          <div className="space-y-3">
            {isStaff && (
              <Button
                onClick={() => navigate('/staff/settings')}
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

  // If no plans available for online sale
  if (membershipPlans.length === 0) {
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
              onClick={() => navigate('/staff/memberships')}
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
                onClick={() => navigate('/staff/settings')}
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
              onClick={() => navigate(`/join-online/checkout?plan=${selectedPlan}`)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-12 py-4 text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              Continue with {membershipPlans.find(p => p.id === selectedPlan)?.name}
            </Button>
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

