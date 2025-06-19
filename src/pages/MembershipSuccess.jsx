import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  CreditCard, 
  Calendar, 
  QrCode, 
  ArrowRight,
  Star,
  Crown,
  Dumbbell,
  Download,
  Smartphone
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getGymName } from '@/utils/gymBranding';

const MembershipSuccess = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');

  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessCardNumber, setAccessCardNumber] = useState('');

  // Generate unique access card number
  const generateAccessCardNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${random}`;
  };

  // Fetch membership details
  useEffect(() => {
    const fetchMembershipData = async () => {
      if (!user?.id || !planId) {
        navigate('/dashboard');
        return;
      }

      try {
        // Get the membership plan details
        const { data: plan, error: planError } = await supabase
          .from('membership_types')
          .select('*')
          .eq('id', planId)
          .single();

        if (planError || !plan) {
          console.error('Error fetching plan:', planError);
          navigate('/dashboard');
          return;
        }

        // Get the user's membership record
        const { data: membership, error: membershipError } = await supabase
          .from('memberships')
          .select('*')
          .eq('user_id', user.id)
          .eq('membership_type_id', planId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (membershipError) {
          console.error('Error fetching membership:', membershipError);
          // Continue anyway - we have the plan data
        }

        // Calculate next billing date
        const startDate = membership?.start_date ? new Date(membership.start_date) : new Date();
        const nextBillingDate = new Date(startDate);
        
        switch(plan.billing_type) {
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
            nextBillingDate.setMonth(nextBillingDate.getMonth() + (plan.duration_months || 1));
        }

        // Generate access card number
        const cardNumber = generateAccessCardNumber();
        setAccessCardNumber(cardNumber);

        setMembershipData({
          plan,
          membership,
          nextBillingDate,
          accessCardNumber: cardNumber
        });
      } catch (error) {
        console.error('Error:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchMembershipData();
  }, [user, planId, navigate]);

  const getDesignForCategory = (category) => {
    const designs = {
      'Standard': {
        icon: <Dumbbell className="w-6 h-6" />,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800'
      },
      'Premium': {
        icon: <Star className="w-6 h-6" />,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-800'
      },
      'VIP': {
        icon: <Crown className="w-6 h-6" />,
        color: 'from-yellow-500 to-yellow-600',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-800'
      }
    };
    return designs[category] || designs['Standard'];
  };

  const formatBillingType = (billingType) => {
    switch(billingType) {
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      case 'weekly': return 'Weekly';
      default: return 'Monthly';
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading your membership details...</p>
        </div>
      </div>
    );
  }

  if (!user || !membershipData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">Unable to load membership details.</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { plan, nextBillingDate } = membershipData;
  const design = getDesignForCategory(plan.category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 pt-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-500" />
          </motion.div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to {getGymName()}!
          </h1>
          <p className="text-xl text-white/90">
            Your {plan.name} membership is now active
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Membership Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="h-fit">
              <CardHeader className={`${design.bgColor} rounded-t-lg`}>
                <CardTitle className={`flex items-center ${design.textColor}`}>
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${design.color} flex items-center justify-center text-white mr-3`}>
                    {design.icon}
                  </div>
                  {plan.name} Membership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="text-center py-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/{formatBillingType(plan.billing_type).toLowerCase()}</span>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Member:</span>
                    <span className="font-medium">{user.first_name} {user.last_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Start Date:</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Next Billing:
                    </span>
                    <span className="font-medium">{nextBillingDate.toLocaleDateString()}</span>
                  </div>
                </div>

                <Separator />

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    What's included:
                  </h4>
                  <ul className="space-y-1">
                    {plan.features?.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Access Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="w-5 h-5 mr-2" />
                  Digital Access Card
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Access Card Visual */}
                <div className={`bg-gradient-to-r ${design.color} rounded-lg p-6 text-white`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{getGymName()}</h3>
                      <p className="text-sm opacity-90">{plan.name} Member</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-75">Access Card</p>
                      <p className="font-mono text-sm">{accessCardNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm opacity-75">Member Name</p>
                      <p className="font-semibold">{user.first_name} {user.last_name}</p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded flex items-center justify-center">
                      <QrCode className="w-10 h-10" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Access Card Number:</span>
                    <span className="font-mono font-medium">{accessCardNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Valid From:</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm text-gray-600 flex items-center">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Use this card to access the gym
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      Save Card
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <QrCode className="w-3 h-3 mr-1" />
                      Show QR
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-6"
            >
              <Button
                onClick={() => navigate('/member/dashboard')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 text-lg font-semibold"
              >
                Continue to Member Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MembershipSuccess;
