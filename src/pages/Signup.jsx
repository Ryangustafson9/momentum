// src/pages/Signup.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast.js';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { getGymColors, getGymLogo, getGymName } from '@/utils/gymBranding';
import { useBranding } from '@/hooks/useBranding';
import { supabase } from '@/lib/supabaseClient';
import { capitalizeName, calculatePasswordStrength } from '@/utils/formHelpers.js';
import { isOnlineJoiningAllowed, clubSettingsUtils } from '@/services/clubSettingsService';
import { normalizeRole, getDefaultRoute } from '@/utils/roleUtils.js';

const Signup = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Local success state that doesn't rely on URL params
  const [localSuccess, setLocalSuccess] = useState(false);
  const [successUserName, setSuccessUserName] = useState('');
  
  // Simple success state from URL (fallback)
  const urlSuccess = searchParams.get('success') === 'true';
  const createdUserName = searchParams.get('name') || '';
  
  // Combined success state
  const showSuccess = localSuccess || urlSuccess;
  const displayName = successUserName || createdUserName;
  // Debug URL parameters
  useEffect(() => {
    
  }, [searchParams, urlSuccess, localSuccess, showSuccess, displayName]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // ✅ REAL-TIME EMAIL VALIDATION: Initialize email validation hook
  const {
    email: validatedEmail,
    validationState,
    errorMessage: emailErrorMessage,
    isValid: isEmailValid,
    isValidating: isEmailValidating,
    handleEmailChange,
    EMAIL_VALIDATION_STATES,
    getValidationStatus
  } = useEmailValidation({
    debounceMs: 800, // Wait 800ms after user stops typing
    checkDuplicates: true
  });
  
  const [gymLogoError, setGymLogoError] = useState(false);
  const [momentumLogoError, setMomentumLogoError] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(null);
  const [duplicateEmailError, setDuplicateEmailError] = useState(false);
  const [allowOnlineJoining, setAllowOnlineJoining] = useState(true);
  const [clubSettingsLoading, setClubSettingsLoading] = useState(true);

  // Get loading state and user from useAuth hook
  const { signup, loading, user } = useAuth(); // Use signup instead of register
  const { toast } = useToast();
  const { clubName } = useBranding();

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
    
    // ✅ REAL-TIME EMAIL VALIDATION: Handle email changes
    if (e.target.name === 'email') {
      handleEmailChange(value);
      // Clear duplicate email error when user starts typing
      if (duplicateEmailError) {
        setDuplicateEmailError(false);
      }
    }
    
    const newFormData = {
      ...formData,
      [e.target.name]: value
    };
    
    setFormData(newFormData);

    // Check if passwords match when password changes
    if (e.target.name === 'password') {
      // Check if passwords still match
      if (newFormData.confirmPassword) {
        setPasswordsMatch(checkPasswordsMatch(value, newFormData.confirmPassword));
      }
    }

    // Update password match when confirm password changes
    if (e.target.name === 'confirmPassword') {
      setPasswordsMatch(checkPasswordsMatch(newFormData.password, value));
    }
  };

  const checkEmailExists = async (email) => {
    try {
      // Check profiles table for existing email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email.toLowerCase()) // Case-insensitive check
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        
        // If there's an error checking, assume email doesn't exist to allow signup attempt
        return false;
      }

      const emailExists = !!profileData;
      return emailExists;

    } catch (error) {
      
      // If we can't check, assume email doesn't exist to allow signup attempt
      return false;
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
    }    // ✅ REAL-TIME EMAIL VALIDATION: Use validated email from hook
    if (!validatedEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    // ✅ REAL-TIME EMAIL VALIDATION: Check if email validation passed
    if (!isEmailValid) {
      toast({
        title: "Email validation failed",
        description: emailErrorMessage || "Please enter a valid email address.",
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
    try {
      // ✅ REAL-TIME EMAIL VALIDATION: Email already validated, skip duplicate check
      // The hook already checked for duplicates in real-time
      
      const result = await signup(validatedEmail, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      if (result && (result.user || result.profile)) {
        
        
        // Set local success state immediately
        setLocalSuccess(true);
        setSuccessUserName(formData.firstName);
        
        // Also set URL params as backup
        setSearchParams({ 
          success: 'true', 
          name: formData.firstName 
        });
        
        
        
      } else {
        
      }

    } catch (error) {
      

      // Check for various duplicate email error messages from Supabase
      const errorMessage = error.message?.toLowerCase() || '';
      const isDuplicateEmail =
        errorMessage.includes('already exists') ||
        errorMessage.includes('already registered') ||
        errorMessage.includes('user already registered') ||
        errorMessage.includes('email already taken') ||
        errorMessage.includes('duplicate') ||
        error.code === 'user_already_exists';

      if (isDuplicateEmail) {
        
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

  // ⭐ REMOVED: Auto-clear URL params - let user control when to leave success page  // Load club settings on component mount
  useEffect(() => {
    const loadClubSettings = async () => {
      try {
        setClubSettingsLoading(true);
        const joiningAllowed = await isOnlineJoiningAllowed();
        setAllowOnlineJoining(joiningAllowed);
      } catch (error) {
        
        // Default to allowing online joining if settings can't be loaded
        setAllowOnlineJoining(true);
      } finally {
        setClubSettingsLoading(false);
      }
    };

    loadClubSettings();
  }, []);

  // Add this useEffect to handle authenticated users
  useEffect(() => {
    // Only redirect if user is authenticated, we're not showing success,
    // and we're not in the middle of a signup flow
    if (user && !showSuccess && !searchParams.get('success') && !localSuccess) {
      

      // Add a longer delay to ensure success state has time to be set
      const redirectTimer = setTimeout(() => {
        // Double-check we're still not showing success
        const currentSuccess = new URLSearchParams(window.location.search).get('success');
        if (!currentSuccess && !localSuccess) {
          
          // Determine redirect based on user role
          if (user.role === 'admin' || user.role === 'staff') {
            
            navigate('/staff-portal/dashboard');
          } else if (user.role === 'member') {
            
            navigate('/member-portal/dashboard');
          } else {
            // Non-members should not be auto-redirected to dashboards
            
          }
        } else {
          
        }
      }, 2000); // Increased to 2 seconds to allow success state to be processed

      return () => clearTimeout(redirectTimer);
    }
  }, [user, showSuccess, localSuccess, navigate, searchParams]);
  const gymColors = getGymColors();

  

  // ⭐ FIXED: Define passwordStrength first
  const passwordStrength = useMemo(() => {
    return calculatePasswordStrength(formData.password);
  }, [formData.password]);

  // Calculate if form is valid
  const isFormValid = useMemo(() => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      passwordStrength.score === 100 && // All password requirements met
      formData.password === formData.confirmPassword
    );
  }, [formData, passwordStrength]);

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
              onLoad={async () =>  {
                // Wait up to 3 seconds for user state to update
                let attempts = 0;
                while (!user && attempts < 6) {
                  await new Promise(resolve => setTimeout(resolve, 500));
                  attempts++;
                }
                // Navigate regardless (JoinOnline will handle auth)
                navigate('/join-online');
              }}
            />
          ) : (
            <div className="h-20 mx-auto mb-2 flex items-center justify-center bg-gray-100 rounded-lg">
              <span className="text-gray-500 text-sm">Logo not available</span>
            </div>
          )}
        </div>

        {showSuccess ? (
          /* SUCCESS STATE - Account Created */
          <div className="text-center py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {displayName}!
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Your account has been successfully created.
            </p>
            
            <div className="flex flex-col gap-4">
              <Button
                onClick={() => {
                  // Clear success state when going to dashboard
                  setSearchParams({});                  if (user?.role === 'admin' || user?.role === 'staff') {
                    navigate('/staff-portal/dashboard');
                  } else if (user?.role === 'member') {
                    navigate('/member-portal/dashboard');
                  } else {
                    // Non-members should go to a welcome page or profile
                    navigate('/dashboard');
                  }
                }}
                className="w-full py-3 text-lg"
                size="lg"
              >
                {allowOnlineJoining ? (
                  user?.role === 'admin' || user?.role === 'staff' ? 'Go to Staff Dashboard' :
                  user?.role === 'member' ? 'Go to Member Dashboard' : 'Go to Profile'
                ) : (
                  'Go to Dashboard'
                )}
              </Button>
            </div>
          </div>
        ) : (          /* FORM STATE */
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Join {clubName}</h1>
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
              </div>              {/* EMAIL FIELD WITH REAL-TIME VALIDATION */}
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={validatedEmail}
                    onChange={(e) => {
                      // Update both the validation hook and form data
                      handleChange(e);
                    }}
                    placeholder="you@example.com"
                    className={`pr-10 ${
                      validationState === EMAIL_VALIDATION_STATES.VALID 
                        ? 'border-green-400/60 focus:border-green-400 bg-green-50/30' 
                        : validationState === EMAIL_VALIDATION_STATES.INVALID_FORMAT || 
                          validationState === EMAIL_VALIDATION_STATES.DUPLICATE ||
                          validationState === EMAIL_VALIDATION_STATES.ERROR
                        ? 'border-red-400/60 focus:border-red-400 bg-red-50/30'
                        : validationState === EMAIL_VALIDATION_STATES.VALIDATING
                        ? 'border-blue-400/60 focus:border-blue-400 bg-blue-50/30'
                        : ''
                    }`}
                  />
                  
                  {/* Real-time validation icon */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {validationState === EMAIL_VALIDATION_STATES.VALID && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {(validationState === EMAIL_VALIDATION_STATES.INVALID_FORMAT || 
                      validationState === EMAIL_VALIDATION_STATES.DUPLICATE ||
                      validationState === EMAIL_VALIDATION_STATES.ERROR) && (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                    {validationState === EMAIL_VALIDATION_STATES.VALIDATING && (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                  </div>
                </div>
                
                {/* Real-time validation feedback */}
                {emailErrorMessage && (
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
                            {emailErrorMessage}
                          </span>
                        </div>
                        
                        {/* Show "Sign In" button only for duplicate email */}
                        {validationState === EMAIL_VALIDATION_STATES.DUPLICATE && (
                          <Link to="/login">
                            <button 
                              type="button"
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                              Sign In
                            </button>
                          </Link>
                        )}
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
                      <div className="flex-1 bg-gray-200 rounded-full h-2">                        <div
                          style={{ width: `${passwordStrength.score}%` }}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.score === 100 ? 'bg-green-500' : 
                            passwordStrength.score >= 75 ? 'bg-yellow-400' : 
                            passwordStrength.score >= 50 ? 'bg-orange-400' : 
                            'bg-red-400'
                          }`}
                        />
                      </div>                      <span className={`text-xs font-medium ${
                        passwordStrength.color === 'green' ? 'text-green-600' : 
                        passwordStrength.color === 'yellow' ? 'text-yellow-600' : 
                        passwordStrength.color === 'orange' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {passwordStrength.strength}
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

