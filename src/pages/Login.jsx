import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { getGymName, getGymLogo } from '@/helpers/gymBranding.js';

// ⭐ NEW: Use centralized utilities
import { getDefaultRoute } from '@/utils/roleUtils.js';
import { normalizeRole } from '@/utils/roleUtils.js';
import { validateForm, validationRules } from '@/utils/validation.js';
import { showToast } from '@/utils/toastUtils.js';
import { useLoading } from '@/hooks/useLoading.js';
import PasswordResetModal from '@/components/PasswordResetModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gymLogoError, setGymLogoError] = useState(false);
  const [momentumLogoError, setMomentumLogoError] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [loginError, setLoginError] = useState(''); // Add state for login error message
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // ⭐ NEW: Use centralized hooks
  const { withLoading, isLoading } = useLoading();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setFormErrors({});
    setLoginError('');

    // Validation
    const formData = { email, password };
    const validation = validateForm(formData, validationRules.auth);

    if (!validation.isValid) {
      setFormErrors(validation.errors);
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

        const normalizedRole = normalizeRole(user.role || 'staff');
        console.log('🔍 DEBUG: Normalized role:', normalizedRole);

        const defaultRoute = getDefaultRoute(normalizedRole);
        console.log('🔍 DEBUG: Default route for role:', defaultRoute);

        showToast.success("Welcome back!", "Successfully logged in!");

        // ⭐ FIXED: Use the getDefaultRoute() function properly
        console.log(`🎯 Navigating ${normalizedRole} user to: ${defaultRoute}`);
        navigate(defaultRoute);

      } catch (error) {
        console.error('Login error:', error);

        // Set in-card error message based on error type
        if (error.message.includes('Invalid login credentials')) {
          setLoginError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setLoginError('Please check your email and verify your account before logging in.');
        } else if (error.message.includes('Too many requests')) {
          setLoginError('Too many login attempts. Please wait a few minutes before trying again.');
        } else {
          setLoginError('Login failed. Please try again or contact support if the problem persists.');
        }
      }
    });
  };

  // Get gym branding data
  const gymLogo = getGymLogo();
  const gymName = getGymName();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-xl w-full max-w-md flex flex-col"
      >
        {/* Gym Logo */}
        <div className="text-center mb-1.5">
          {gymLogo ? (
            <img
              src={gymLogo}
              alt={`${gymName} Logo`}
              className="h-12 w-auto mx-auto mb-2 object-contain"
              onLoad={() => console.log('Gym logo loaded')}
              onError={() => setGymLogoError(true)}
            />
          ) : (
            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
              <span className="text-white font-bold text-xl">
                {gymName.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to {gymName}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-grow">
          {/* Display login error message */}
          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{loginError}</p>
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                // Clear login error when user starts typing
                if (loginError) setLoginError('');
              }}
              placeholder="you@example.com"
              className={formErrors.email ? 'border-red-500' : ''}
            />
            {formErrors.email && (
              <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                // Clear login error when user starts typing
                if (loginError) setLoginError('');
              }}
              placeholder="Your password"
              className={formErrors.password ? 'border-red-500' : ''}
            />
            {formErrors.password && (
              <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>
            )}

            {/* Moved forgot password link below password field */}
            <div className="mt-2 text-right">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setShowPasswordReset(true)}
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading()}>
            {isLoading() ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="-mt-6">
            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={() => navigate('/signup')}
            >
              Create Account
            </Button>
          </div>
        </form>

        {/* Footer: Powered by Momentum */}
        <div className="mt-auto pt-8 text-center flex flex-col items-center justify-center border-t border-gray-200">
          <span className="text-xs text-black mb-1">Powered by</span>
          {!momentumLogoError ? (
            <img
              src={`${import.meta.env.BASE_URL}assets/momentum-logo.png`}
              alt="Momentum"
              className="h-8"
              style={{ maxHeight: '32px', objectFit: 'contain' }}
              onLoad={() => console.log('Momentum logo loaded successfully')}
              onError={() => {
                console.log("Momentum logo failed to load from:", `${import.meta.env.BASE_URL}assets/momentum-logo.png`);
                setMomentumLogoError(true);
              }}
            />
          ) : (
            <div className="h-8 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">M</span>
            </div>
          )}
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