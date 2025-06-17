// src/pages/Signup.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthQuery as useAuth } from '@/hooks/useAuthQuery';
import { useToast } from '@/hooks/use-toast.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { getGymLogo, getGymName, getGymColors } from '@/helpers/gymBranding';
import { supabase } from '@/lib/supabaseClient';
import { capitalizeName } from '@/utils/formHelpers.js';

const Signup = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Simple success state from URL
  const showSuccess = searchParams.get('success') === 'true';
  const createdUserName = searchParams.get('name') || '';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [gymLogoError, setGymLogoError] = useState(false);
  const [momentumLogoError, setMomentumLogoError] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(null);
  const [duplicateEmailError, setDuplicateEmailError] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, requirements: {} });

  // Get loading state and user from useAuth hook
  const { signup, loading, user } = useAuth(); // Use signup instead of register
  const { toast } = useToast();

  // Password strength calculation function
  const calculatePasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;
    const score = (metRequirements / 4) * 100;

    return {
      score,
      requirements,
      strength: score === 100 ? 'Strong' : score >= 75 ? 'Good' : score >= 50 ? 'Fair' : 'Weak'
    };
  };

  // Check if passwords match
  const checkPasswordsMatch = (password, confirmPassword) => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  };

  const handleChange = (e) => {
    let value = e.target.value;
    
    // Auto-capitalize first and last names
    if (e.target.name === 'firstName' || e.target.name === 'lastName') {
      value = capitalizeName(value);
    }
    
    const newFormData = {
      ...formData,
      [e.target.name]: value
    };
    
    setFormData(newFormData);

    // Update password strength when password changes
    if (e.target.name === 'password') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);

      // Check if passwords still match
      if (newFormData.confirmPassword) {
        setPasswordsMatch(checkPasswordsMatch(value, newFormData.confirmPassword));
      }
    }

    // Update password match when confirm password changes
    if (e.target.name === 'confirmPassword') {
      setPasswordsMatch(checkPasswordsMatch(newFormData.password, value));
    }

    // Clear duplicate email error when user starts typing again
    if (e.target.name === 'email' && duplicateEmailError) {
      setDuplicateEmailError(false);
    }
  };

  const checkEmailExists = async (email) => {
    console.log('🔍 checkEmailExists called with:', email);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();
      
      console.log('🔍 Supabase query result:', { data, error });
      
      if (error) {
        console.log('🔍 Supabase error code:', error.code);
        console.log('🔍 Supabase error message:', error.message);
      }
      
      const emailExists = !!data;
      console.log('🔍 Email exists result:', emailExists);
      return emailExists;
    } catch (error) {
      console.log('🔍 Caught error in checkEmailExists:', error);
      if (error.code === 'PGRST116') {
        console.log('🔍 PGRST116 - No rows found, email doesn\'t exist');
        return false;
      }
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔍 Form submission started:', formData);

    // Clear previous errors
    setDuplicateEmailError(false);

    // Basic form validation
    if (!formData.firstName.trim()) {
      toast({
        title: "First name required",
        description: "Please enter your first name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.lastName.trim()) {
      toast({
        title: "Last name required",
        description: "Please enter your last name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // PASSWORD VALIDATION: Check if all requirements are met
    const currentStrength = calculatePasswordStrength(formData.password);
    
    // Check using the real-time calculated requirements
    if (!currentStrength.requirements.length) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!currentStrength.requirements.uppercase) {
      toast({
        title: "Password missing uppercase letter",
        description: "Password must contain at least one uppercase letter.",
        variant: "destructive",
      });
      return;
    }

    if (!currentStrength.requirements.number) {
      toast({
        title: "Password missing number",
        description: "Password must contain at least one number.",
        variant: "destructive",
      });
      return;
    }

    if (!currentStrength.requirements.special) {
      toast({
        title: "Password missing special character",
        description: "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>).",
        variant: "destructive",
      });
      return;
    }

    // Password match validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ All password requirements met, proceeding...');
    
    try {
      console.log('🔍 Checking for duplicate email...');
      
      const emailExists = await checkEmailExists(formData.email);
      console.log('🔍 Email exists result:', emailExists);
      
      if (emailExists) {
        console.log('❌ Email already exists - setting duplicate error');
        setDuplicateEmailError(true);
        return;
      }

      console.log('✅ Email is unique, proceeding with registration...');

      const result = await signup(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      console.log('✅ Registration completed:', result);

      if (result) {
        console.log('🎯 Setting success state in URL...');
        
        // Set success state immediately
        setSearchParams({ 
          success: 'true', 
          name: formData.firstName 
        });
        
        console.log('✨ Success state set in URL!');
      }

    } catch (error) {
      console.error('❌ Registration error caught:', error);
      
      if (error.message.includes('already exists') || error.message.includes('already registered')) {
        setDuplicateEmailError(true);
      } else {
        toast({
          title: "Registration failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Auto-clear URL params after 30 seconds
  useEffect(() => {
    if (showSuccess) {
      const timeout = setTimeout(() => {
        setSearchParams({});
      }, 30000);
      
      return () => clearTimeout(timeout);
    }
  }, [showSuccess, setSearchParams]);

  // Add this useEffect to handle authenticated users
  useEffect(() => {
    // Only redirect if user is authenticated, we're not showing success,
    // and we're not in the middle of a signup flow
    if (user && !showSuccess && !searchParams.get('success')) {
      console.log('🔄 User is authenticated and not in signup flow, redirecting...', {
        userRole: user.role,
        showSuccess,
        hasSuccessParam: !!searchParams.get('success')
      });

      // Add a small delay to ensure success state has time to be set
      const redirectTimer = setTimeout(() => {
        // Double-check we're still not showing success
        if (!searchParams.get('success')) {
          // Determine redirect based on user role
          if (user.role === 'admin' || user.role === 'staff') {
            console.log('🎯 Redirecting admin/staff to staff dashboard');
            navigate('/staff/dashboard');
          } else if (user.role === 'member') {
            console.log('🎯 Redirecting member to member dashboard');
            navigate('/member-portal/memberdashboard');
          } else {
            // Non-members should not be auto-redirected to dashboards
            console.log('🎯 Non-member user, staying on current page');
          }
        }
      }, 100); // Small delay to allow success state to be processed

      return () => clearTimeout(redirectTimer);
    }
  }, [user, showSuccess, navigate, searchParams]);

  const gymColors = getGymColors();

  // Calculate if form is valid
  const isFormValid = useMemo(() => {
    const strength = calculatePasswordStrength(formData.password);
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      strength.score === 100 && // All password requirements met
      formData.password === formData.confirmPassword
    );
  }, [formData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-xl w-full max-w-md flex flex-col min-h-[600px]"
      >
        {/* Gym Logo */}
        <div className="text-center mb-4">
          {!gymLogoError ? (
            <img
              src={getGymLogo()}
              alt={`${getGymName()} Logo`}
              className="h-20 mx-auto mb-2 object-contain"
              onLoad={() => console.log('Gym logo loaded')}
              onError={() => setGymLogoError(true)}
            />
          ) : (
            <div className={`h-20 w-20 bg-gradient-to-br ${gymColors.primary} rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg`}>
              <span className="text-white text-3xl font-bold">{gymColors.fallback}</span>
            </div>
          )}
        </div>

        {/* SUCCESS STATE */}
        {showSuccess ? (
          <div className="flex-grow flex flex-col justify-center items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Success!</h1>
            <p className="text-lg text-gray-700 mb-2">
              Welcome to Nordic Fitness, {createdUserName}!
            </p>
            <p className="text-gray-600 mb-8">
              Your account has been created successfully.
            </p>

            <div className="bg-white/20 backdrop-blur-[10px] border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-6 mb-6 w-full rounded-xl">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Ready to start your fitness journey?
              </h2>
              <p className="text-gray-700 mb-4">
                Would you like to sign up for a membership and unlock full access to our facilities?
              </p>
            </div>

            <div className="space-y-3 w-full">
              <Button 
                onClick={async () => {
                  console.log('🔍 Membership button clicked');
                  console.log('🔍 Current user state:', user);
                  
                  // If user is null, wait a bit for auth to update
                  if (!user) {
                    console.log('🔄 User is null, waiting for auth state...');
                    
                    // Wait up to 3 seconds for user state to update
                    let attempts = 0;
                    while (!user && attempts < 6) {
                      await new Promise(resolve => setTimeout(resolve, 500));
                      attempts++;
                      console.log(`🔄 Waiting attempt ${attempts}, user:`, user);
                    }
                  }
                  
                  // Navigate regardless (JoinOnline will handle auth)
                  navigate('/join-online');
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                size="lg"
              >
                Yes, Sign Up for Membership
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  console.log('🔍 Dashboard button clicked', { userRole: user?.role });

                  // Clear success state when going to dashboard
                  setSearchParams({});

                  if (user?.role === 'admin' || user?.role === 'staff') {
                    console.log('🎯 Navigating to staff dashboard');
                    navigate('/staff/dashboard');
                  } else if (user?.role === 'member') {
                    console.log('🎯 Navigating to member dashboard');
                    navigate('/member-portal/memberdashboard');
                  } else {
                    // Non-members should go to a welcome page or profile
                    console.log('🎯 Non-member user, redirecting to profile or welcome');
                    navigate('/profile'); // or wherever non-members should go
                  }
                }}
                className="w-full py-3 text-lg"
                size="lg"
              >
                {user?.role === 'admin' || user?.role === 'staff' ? 'Go to Staff Dashboard' :
                 user?.role === 'member' ? 'Go to Member Dashboard' : 'Go to Profile'}
              </Button>
            </div>
          </div>
        ) : (
          /* FORM STATE */
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Join Nordic Fitness</h1>
              <p className="text-gray-600 mt-2 text-sm">Create your account to get started</p>
            </div>

            <form 
              onSubmit={handleSubmit} 
              className="space-y-4 flex-grow"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* EMAIL FIELD WITH BEAUTIFUL ERROR DISPLAY */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={duplicateEmailError ? 'border-red-400/60 focus:border-red-400 bg-red-50/30' : ''}
                />
                {duplicateEmailError && (
                  <div className="mt-2">
                    <div className="relative overflow-hidden bg-white/70 backdrop-blur-md border border-red-300/40 rounded-xl p-3 shadow-lg">
                      {/* Animated background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400/5 via-pink-400/5 to-red-400/5 animate-pulse"></div>
                      
                      {/* Content */}
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          {/* Icon with glow effect */}
                          <div className="relative">
                            <div className="w-6 h-6 bg-gradient-to-br from-red-400 via-red-500 to-red-600 rounded-full flex items-center justify-center shadow-md">
                              <AlertCircle className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="absolute inset-0 bg-red-400/30 rounded-full blur-sm animate-pulse"></div>
                          </div>
                          
                          <span className="text-sm font-medium bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                            Email already exists
                          </span>
                        </div>
                        
                        {/* Modern button */}
                        <Link to="/login">
                          <button 
                            type="button"
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                          >
                            Sign In
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PASSWORD FIELD WITH STRENGTH INDICATOR */}
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={
                    passwordStrength.score > 0 
                      ? passwordStrength.score === 100 
                        ? 'border-green-400/60 focus:border-green-400 bg-green-50/30'
                        : 'border-red-400/60 focus:border-red-400 bg-red-50/30'
                      : ''
                  }
                />
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2 space-y-3">
                    {/* Strength Bar */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          style={{ width: `${passwordStrength.score}%` }}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.color === 'green' ? 'bg-green-400' : 'bg-red-400'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.color === 'green' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {passwordStrength.strengthText}
                      </span>
                    </div>
                    
                    {/* Requirements Checklist */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {/* Length Requirement */}
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                            passwordStrength.requirements?.length ? 'bg-green-400' : 'bg-gray-300'
                          }`}>
                            {passwordStrength.requirements?.length && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                          </div>
                          <span className={`text-xs ${
                            passwordStrength.requirements?.length ? 'text-green-600 font-medium' : 'text-gray-500'
                          }`}>
                            8+ characters
                          </span>
                        </div>

                        {/* Uppercase Requirement */}
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                            passwordStrength.requirements?.uppercase ? 'bg-green-400' : 'bg-gray-300'
                          }`}>
                            {passwordStrength.requirements?.uppercase && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                          </div>
                          <span className={`text-xs ${
                            passwordStrength.requirements?.uppercase ? 'text-green-600 font-medium' : 'text-gray-500'
                          }`}>
                            Uppercase
                          </span>
                        </div>

                        {/* Number Requirement */}
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                            passwordStrength.requirements?.number ? 'bg-green-400' : 'bg-gray-300'
                          }`}>
                            {passwordStrength.requirements?.number && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                          </div>
                          <span className={`text-xs ${
                            passwordStrength.requirements?.number ? 'text-green-600 font-medium' : 'text-gray-500'
                          }`}>
                            Number
                          </span>
                        </div>

                        {/* Special Character Requirement */}
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                            passwordStrength.requirements?.special ? 'bg-green-400' : 'bg-gray-300'
                          }`}>
                            {passwordStrength.requirements?.special && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                          </div>
                          <span className={`text-xs ${
                            passwordStrength.requirements?.special ? 'text-green-600 font-medium' : 'text-gray-500'
                          }`}>
                            Special (!@#$...)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD FIELD */}
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={
                    passwordsMatch === null ? '' :
                    passwordsMatch 
                      ? 'border-green-400/60 focus:border-green-400 bg-green-50/30'
                      : 'border-red-400/60 focus:border-red-400 bg-red-50/30'
                  }
                />
                
                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      passwordsMatch === true ? 'bg-green-400' : 'bg-red-400'
                    }`}>
                      {passwordsMatch === true ? (
                        <CheckCircle className="w-3 h-3 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    
                    <span className={`text-xs font-medium ${
                      passwordsMatch === true ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {passwordsMatch === true ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <div>
                <Button 
                  type="submit"
                  className={`w-full py-3 text-lg font-semibold transition-all duration-300 shadow-md ${
                    isFormValid 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                  }`}
                  disabled={loading || !isFormValid}
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v16a8 8 0 01-8-8z"></path>
                    </svg>
                  ) : null}
                  Create Account
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-semibold">
                  Sign In
                </Link>
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Signup;