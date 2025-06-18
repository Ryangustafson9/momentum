import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getGymLogo, getGymName, getGymColors } from '@/helpers/gymBranding';
import { supabase } from '@/lib/supabaseClient';
import { calculatePasswordStrength } from '@/utils/formHelpers.js';
import { showToast } from '@/utils/toastUtils.js';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [gymLogoError, setGymLogoError] = useState(false);

  // Check if we have the required tokens
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  useEffect(() => {
    if (!accessToken || !refreshToken) {
      setError('Invalid or expired reset link. Please request a new password reset.');
      return;
    }

    // Set the session with the tokens from the URL
    const setSession = async () => {
      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Session error:', error);
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      } catch (err) {
        console.error('Reset password session error:', err);
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };

    setSession();
  }, [accessToken, refreshToken]);

  const passwordStrength = calculatePasswordStrength(password);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (passwordStrength.score !== 100) {
      setError('Password must meet all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setIsSuccess(true);
      showToast.success('Password Updated', 'Your password has been successfully updated');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error('Password update error:', error);
      setError('Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const gymColors = getGymColors();

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-xl w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Password Updated!</h1>
          <p className="text-gray-600 mb-6">
            Your password has been successfully updated. You will be redirected to the login page shortly.
          </p>
          
          <Button 
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-xl w-full max-w-md"
      >
        {/* Gym Logo */}
        <div className="text-center mb-4">
          {!gymLogoError ? (
            <img
              src={getGymLogo()}
              alt={`${getGymName()} Logo`}
              className="h-20 mx-auto mb-2 object-contain"
              onError={() => setGymLogoError(true)}
            />
          ) : (
            <div className={`h-20 w-20 bg-gradient-to-br ${gymColors.primary} rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg`}>
              <span className="text-white text-3xl font-bold">{gymColors.fallback}</span>
            </div>
          )}
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reset Your Password</h1>
          <p className="text-gray-600 mt-2 text-sm">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter new password"
              className={
                passwordStrength.score > 0 
                  ? passwordStrength.score === 100 
                    ? 'border-green-400/60 focus:border-green-400 bg-green-50/30'
                    : 'border-red-400/60 focus:border-red-400 bg-red-50/30'
                  : ''
              }
            />
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2 space-y-2">
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
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center space-x-1 ${
                    passwordStrength.requirements?.length ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      passwordStrength.requirements?.length ? 'bg-green-400' : 'bg-gray-300'
                    }`} />
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${
                    passwordStrength.requirements?.uppercase ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      passwordStrength.requirements?.uppercase ? 'bg-green-400' : 'bg-gray-300'
                    }`} />
                    <span>Uppercase</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${
                    passwordStrength.requirements?.number ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      passwordStrength.requirements?.number ? 'bg-green-400' : 'bg-gray-300'
                    }`} />
                    <span>Number</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${
                    passwordStrength.requirements?.special ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      passwordStrength.requirements?.special ? 'bg-green-400' : 'bg-gray-300'
                    }`} />
                    <span>Special char</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Confirm new password"
              className={
                confirmPassword 
                  ? passwordsMatch 
                    ? 'border-green-400/60 focus:border-green-400 bg-green-50/30'
                    : 'border-red-400/60 focus:border-red-400 bg-red-50/30'
                  : ''
              }
            />
            
            {confirmPassword && (
              <div className="mt-1 flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  passwordsMatch ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className={`text-xs ${
                  passwordsMatch ? 'text-green-600' : 'text-red-600'
                }`}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            disabled={isLoading || passwordStrength.score !== 100 || !passwordsMatch}
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
