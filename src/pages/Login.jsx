import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { getGymName, getGymLogo, getGymColors } from '@/helpers/gymBranding.js';

// ⭐ NEW: Use centralized utilities
import { getDefaultRoute } from '@/utils/roleUtils.js';
import { normalizeRole } from '@/utils/roleUtils.js';
import { validateForm, validationRules } from '@/utils/validation.js';
import { showToast } from '@/utils/toastUtils.js';
import { useLoading } from '@/hooks/useLoading.js';
import { useErrorHandler } from '@/hooks/useErrorHandler.js';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gymLogoError, setGymLogoError] = useState(false);
  const [momentumLogoError, setMomentumLogoError] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // ⭐ NEW: Use centralized hooks
  const { withLoading, isLoading } = useLoading();
  const { handleAsyncOperation } = useErrorHandler();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const formData = { email, password };
    const validation = validateForm(formData, validationRules.auth);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      showToast.validationError('Please check your input');
      return;
    }

    setFormErrors({});

    await withLoading(async () => {
      await handleAsyncOperation(async () => {
        console.log('🔑 Starting login process...');
        const { user } = await login(email, password);

        if (!user) {
          showToast.error(
            "Account not found",
            "Please check your credentials or create an account."
          );
          return;
        }

        console.log('🎯 Login successful, user ID:', user.id);
        console.log('🔍 DEBUG: Login response user:', user);
        console.log('🔍 DEBUG: User role (raw):', user?.role);
        console.log('🔍 DEBUG: User status:', user?.status);
        
        // ⭐ VALIDATE: Check the user object thoroughly
        if (!user.role) {
          console.warn('⚠️ User has no role! Defaulting to staff');
          user.role = 'staff';
        }
        
        const normalizedRole = normalizeRole(user.role);
        console.log('🔍 DEBUG: Normalized role:', normalizedRole);
        
        const defaultRoute = getDefaultRoute(normalizedRole);
        console.log('🔍 DEBUG: Default route:', defaultRoute);
        
        // ⭐ WAIT: Give AuthContext time to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showToast.success(
          "Welcome back!",
          "Successfully logged in!"
        );

        // ⭐ FORCE: Navigate to staff dashboard for now
        console.log(`🎯 Navigating ${normalizedRole} user to: ${defaultRoute}`);
        
        if (normalizedRole === 'staff' || normalizedRole === 'admin') {
          navigate('/staff/staffdashboard');
        } else if (normalizedRole === 'member') {
          navigate('/member/memberdashboard');
        } else {
          console.warn('⚠️ Unknown role, redirecting to staff dashboard anyway');
          navigate('/staff/staffdashboard');
        }
        
      }, 'login');
    });
  };

  // ⭐ MOVED: Get gym branding data at component level
  const gymColors = getGymColors();
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

        {/* Welcome Message - ⭐ FIXED: Use dynamic gym name */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to {gymName}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-grow">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={formErrors.email ? 'border-red-500' : ''}
            />
            {/* ⭐ ADDED: Error display */}
            {formErrors.email && (
              <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => showToast.info(
                  "Not implemented",
                  "Password recovery will be added soon."
                )}
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className={formErrors.password ? 'border-red-500' : ''}
            />
            {/* ⭐ ADDED: Error display */}
            {formErrors.password && (
              <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>
            )}
          </div>

          {/* ⭐ FIXED: Use isLoading() function instead of loading variable */}
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
    </div>
  );
};

export default Login;

/*
// Future multi-tenant version:
const getGymLogo = (subdomain) => {
          ) : (
            <div className="h-8 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">M</span>
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
};

export default Login;

/*
// Future multi-tenant version:
const getGymLogo = (subdomain) => {
  const gymConfigs = {
    'viking': 'VikingGymLight.png',
    'powerhouse': 'PowerhouseGym.png',
    // etc...
  };
  return `${import.meta.env.BASE_URL}assets/${gymConfigs[subdomain]}`;
};
*/