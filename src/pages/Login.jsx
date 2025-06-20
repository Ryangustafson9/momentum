import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getGymName } from '@/utils/gymBranding';
import { getDefaultRoute, normalizeRole } from '@/utils/roleUtils';
import { showToast } from '@/utils/toastUtils';
import { useLoading } from '@/hooks/useLoading';
import PasswordResetModal from '@/components/PasswordResetModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clubLogoError, setClubLogoError] = useState(false);
  const [momentumLogoError, setMomentumLogoError] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { withLoading, isLoading } = useLoading();

  // Get club name
  const clubName = getGymName();

  // Dev login function for quick testing
  const handleDevLogin = async (userType) => {
    const credentials = {
      admin: { email: 'admin@momentumtest.com', password: 'password405' },
      staff: { email: 'staff@momentumtest.com', password: 'password405' },
      member: { email: 'alex.johnson@testgym.com', password: 'password405' }
    };

    const { email: devEmail, password: devPassword } = credentials[userType];

    await withLoading(async () => {
      try {
        console.log(`🔧 Dev login as ${userType}:`, devEmail);
        const { user } = await login(devEmail, devPassword);

        if (!user) {
          setLoginError(`Dev ${userType} account not found.`);
          return;
        }

        const normalizedRole = normalizeRole(user.role || 'member');
        const defaultRoute = getDefaultRoute(normalizedRole);

        showToast.success(`Dev Login Success!`, `Logged in as ${userType}`);
        navigate(defaultRoute);

      } catch (error) {
        console.error(`Dev ${userType} login error:`, error);
        setLoginError(`Dev ${userType} login failed: ${error.message}`);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔄 Login form submitted with:', { email, hasPassword: !!password });

    // Clear previous errors
    setFormErrors({});
    setLoginError('');    // Basic validation
    const errors = {};
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    await withLoading(async () => {
      try {
        console.log('🔑 Starting login process...');
        const { user } = await login(email, password);

        if (!user) {
          setLoginError("Account not found. Please check your credentials or create an account.");
          return;
        }

        console.log('🎯 Login successful, user ID:', user.id);
        console.log('🔍 DEBUG: User role (raw):', user?.role);

        const normalizedRole = normalizeRole(user.role || 'member');
        console.log('🔍 DEBUG: Normalized role:', normalizedRole);

        const defaultRoute = getDefaultRoute(normalizedRole);
        console.log('🔍 DEBUG: Default route for role:', defaultRoute);

        showToast.success("Welcome back!", "Successfully logged in!");

        console.log(`🎯 Navigating ${normalizedRole} user to: ${defaultRoute}`);
        navigate(defaultRoute);

      } catch (error) {
        console.error('Login error:', error);

        // Set user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          setLoginError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setLoginError('Please check your email and verify your account before logging in.');
        } else if (error.message.includes('Too many requests')) {
          setLoginError('Too many login attempts. Please wait a few minutes before trying again.');
        } else if (error.message.includes('Database error')) {
          setLoginError('Service temporarily unavailable. Please try again in a few minutes.');
        } else {
          setLoginError('Login failed. Please try again or contact support if the problem persists.');
        }
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-sm w-full"
      >
        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-white/20 relative overflow-hidden">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            {/* Club Logo at Top */}
            <div className="text-center mb-5">
              {!clubLogoError ? (
                <img
                  src="/assets/NordicFitness.png"
                  alt="Club Logo"
                  className="h-16 mx-auto mb-4 object-contain drop-shadow-lg"
                  onError={() => setClubLogoError(true)}
                />
              ) : (
                <div className="h-16 w-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <span className="text-white font-bold text-2xl">{clubName.charAt(0)}</span>
                </div>
              )}

              {/* Club Name */}
              <h1 className="text-xl font-semibold text-gray-800 mb-2">
                Welcome to {clubName}
              </h1>
              <p className="text-gray-500">
                Sign in to your account
              </p>
            </div>

            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error Message */}
              {loginError && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {loginError}
                </div>
              )}

              <div className="space-y-5">
                {/* Email Field */}
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-semibold">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (loginError) setLoginError('');
                      if (formErrors.email) {
                        setFormErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    className={`mt-2 h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${formErrors.email ? 'border-red-500' : ''}`}
                    placeholder="Enter your email"
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <Label htmlFor="password" className="text-gray-700 font-semibold">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    className={`mt-2 h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${formErrors.password ? 'border-red-500' : ''}`}
                    placeholder="Enter your password"
                  />
                  {formErrors.password && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>
                  )}

                  {/* Forgot Password Link */}
                  <div className="mt-3 text-right">
                    <button
                      type="button"
                      className="text-sm text-indigo-600 hover:text-indigo-500 hover:underline transition-colors font-medium"
                      onClick={() => setShowPasswordReset(true)}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading()}
              >
                {isLoading() ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Create Account Button */}
              <Button
                variant="outline"
                className="w-full h-11 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-medium rounded-xl transition-all duration-200"
                type="button"
                onClick={() => navigate('/signup')}
              >
                Create Account
              </Button>
            </form>



            {/* Dev Login Buttons - Show in development and for testing */}
            {(process.env.NODE_ENV === 'development' ||
              window.location.hostname.includes('momentumapp') ||
              window.location.hostname.includes('pages.dev') ||
              new URLSearchParams(window.location.search).has('dev')) && (
              <div className="mt-8 pt-6 border-t border-gray-200/50">
                <div className="text-center mb-4">
                  <p className="text-sm font-medium text-gray-600 mb-4">🔧 Development Quick Login</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDevLogin('admin')}
                      disabled={isLoading()}
                      className="h-10 bg-red-50/80 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 rounded-xl transition-all duration-200 font-medium"
                    >
                      {isLoading() ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <>
                          🛡️ Admin
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDevLogin('member')}
                      disabled={isLoading()}
                      className="h-10 bg-blue-50/80 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 rounded-xl transition-all duration-200 font-medium"
                    >
                      {isLoading() ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <>
                          👤 Member
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Quick login for testing purposes
                  </p>
                </div>
              </div>
            )}

            {/* Powered by Momentum Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200/50">
              <div className="flex items-center justify-center space-x-2 text-gray-400">
                <span className="text-sm font-medium">Powered by</span>
                {!momentumLogoError ? (
                  <img
                    src="/assets/momentum-logo.svg"
                    alt="Momentum Logo"
                    className="h-6 object-contain opacity-80"
                    onError={() => setMomentumLogoError(true)}
                  />
                ) : (
                  <div className="h-6 w-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Password Reset Modal */}
      <PasswordResetModal
        isOpen={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
      />
    </div>
  );
};

export default Login;
