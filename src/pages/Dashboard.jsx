import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  MapPin,
  Phone,
  Mail,
  Clock,
  CreditCard,
  Star,
  ArrowRight,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useClubFeature } from '@/components/ClubSettingsRoute.jsx';

const Dashboard = () => {
  const { user, authReady, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [clubInfo, setClubInfo] = useState(null);

  // Check if user was redirected from a disabled feature
  const redirectState = location.state;
  const isFeatureDisabled = redirectState?.reason === 'feature_disabled';
  const disabledFeatureMessage = redirectState?.message;
  const contactInfo = redirectState?.contactInfo;

  // Check if online joining is enabled
  const { loading: joiningLoading, isEnabled: joiningEnabled } = useClubFeature('joining');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Simulate loading club info
  useEffect(() => {
    const timer = setTimeout(() => {
      setClubInfo({
        name: "Momentum Fitness",
        address: "123 Fitness Street, Wellness City, WC 12345",
        phone: "(555) 123-4567",
        email: "info@momentumfitness.com",
        hours: {
          weekdays: "5:00 AM - 11:00 PM",
          saturday: "6:00 AM - 10:00 PM", 
          sunday: "7:00 AM - 9:00 PM"
        },
        features: [
          "State-of-the-art equipment",
          "Personal training available",
          "Group fitness classes",
          "24/7 access for members",
          "Locker rooms & showers",
          "Free parking"
        ],
        membershipOptions: [
          { name: "Monthly", price: "$49", features: ["Full gym access", "Basic classes"] },
          { name: "Quarterly", price: "$129", features: ["Full gym access", "All classes", "1 PT session"] },
          { name: "Annual", price: "$449", features: ["Full gym access", "All classes", "4 PT sessions", "Priority booking"] }
        ]
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
      // User will be redirected automatically by your auth system
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleDashboardAccess = () => {
    if (user?.role === 'member') {
      navigate('/member/dashboard');
    } else if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'staff') {
      navigate('/staff/dashboard');
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Auth Controls */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Momentum</h2>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="hidden sm:flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {(user.first_name || user.display_name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {user.first_name || user.display_name || 'User'}
                      </p>
                      <p className="text-gray-500 capitalize">{user.role || 'member'}</p>
                    </div>
                  </div>

                  {/* My Profile Button */}
                  <Button
                    onClick={() => navigate('/profile')}
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </Button>

                  {/* Sign Out Button */}
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </>
              ) : (
                /* Sign In Button */
                <Button
                  onClick={handleSignIn}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  size="sm"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Feature Disabled Notification */}
      {isFeatureDisabled && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-amber-50 border-l-4 border-amber-400 p-4 mx-4 mt-4 rounded-r-lg"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Feature Currently Unavailable
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>{disabledFeatureMessage}</p>
                {contactInfo && (
                  <div className="mt-3 space-y-1">
                    <p className="font-medium">Contact us:</p>
                    <p>📞 {contactInfo.phone}</p>
                    <p>✉️ {contactInfo.email}</p>
                    <p>🕒 {contactInfo.hours}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to {clubInfo?.name || "Our Fitness Center"}
          </h1>          {user ? (
            <p className="text-xl text-gray-600 mb-6">
              Hello {user.first_name || user.name?.split(' ')[0] || user.email?.split('@')[0] || 'there'}! Ready to continue your fitness journey?
            </p>
          ) : (
            <p className="text-xl text-gray-600 mb-6">
              Your fitness journey starts here. Sign in to access your personalized dashboard.
            </p>
          )}
        </motion.div>

        {clubInfo && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Club Info Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Visit Us
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <span className="text-sm text-gray-600">{clubInfo.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{clubInfo.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{clubInfo.email}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Hours Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Mon - Fri:</span>
                    <span className="text-gray-600">{clubInfo.hours.weekdays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Saturday:</span>
                    <span className="text-gray-600">{clubInfo.hours.saturday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Sunday:</span>
                    <span className="text-gray-600">{clubInfo.hours.sunday}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Membership CTA / User Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="md:col-span-2 lg:col-span-1"
            >
              <Card className="h-full bg-gradient-to-br from-blue-600 to-purple-700 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    {user ? (
                      user.role === 'nonmember' ? 'Sign Up for Membership' : 'Your Account'
                    ) : 'Join Today!'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user ? (
                    user.role === 'nonmember' ? (
                      <>
                        <p className="mb-4 text-blue-100">
                          {joiningEnabled
                            ? "Ready to take your fitness to the next level? Choose from our flexible membership plans and start your journey today!"
                            : "Ready to take your fitness to the next level? Contact us to learn about our membership options and start your journey today!"
                          }
                        </p>
                        {joiningEnabled ? (
                          <Button
                            onClick={() => navigate('/join-online')}
                            className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold flex items-center justify-center gap-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            View Membership Plans
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-blue-200">
                              Contact us to get started:
                            </p>
                            <div className="text-sm text-blue-100 space-y-1">
                              <p>📞 (555) 123-4567</p>
                              <p>✉️ info@nordicfitness.com</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="mb-4 text-blue-100">
                          Access your personalized dashboard to track your progress and manage your membership.
                        </p>
                        <Button
                          onClick={handleDashboardAccess}
                          className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold flex items-center justify-center gap-2"
                        >
                          Go to Dashboard
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </>
                    )
                  ) : (
                    <>
                      <p className="mb-4 text-blue-100">
                        Start your fitness journey with us. Choose from flexible membership options.
                      </p>
                      <Button
                        onClick={handleSignIn}
                        className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold flex items-center justify-center gap-2"
                      >
                        Get Started
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;


