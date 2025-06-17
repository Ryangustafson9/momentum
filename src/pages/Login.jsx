// 🚨 DO NOT MODIFY WITHOUT REVIEW - Login flow and layout is stable
import { useState } from 'react';
import { useAuthQuery as useAuth } from '@/hooks/useAuthQuery';
import { getGymName } from '@/helpers/gymBranding';

const Login = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [clubLogoError, setClubLogoError] = useState(false);

  // Get club name
  const clubName = getGymName();

  // Remove automatic logout - it was interfering with login

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('🔄 Login form submitted with:', { email: formData.email, hasPassword: !!formData.password });

    setLoading(true);
    setError('');

    try {
      console.log('🔄 Calling login function...');
      const result = await login(formData.email, formData.password);
      console.log('🔄 Login function returned:', result);

      if (!result || !result.user) {
        throw new Error('Login failed: No user returned');
      }

      const { user } = result;
      console.log('✅ Login successful:', {
        email: user.email,
        role: user.role,
        id: user.id,
        timestamp: new Date().toISOString()
      });

      // Let PublicRoute handle the redirect automatically
      // The auth state change will trigger a re-render and PublicRoute will redirect
      console.log('🎯 Login complete - waiting for auth state change and PublicRoute redirect...');

      // Don't navigate manually - let the auth state change trigger the redirect

    } catch (error) {
      console.error('❌ Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
      setLoading(false); // Set loading false immediately on error
    }
    // Don't set loading false in finally - let the navigation handle it
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Club Logo at Top */}
          <div className="text-center mb-6">
            {!clubLogoError ? (
              <img
                src="/assets/NordicFitness.png"
                alt="Club Logo"
                className="h-16 mx-auto mb-4 object-contain"
                onError={() => setClubLogoError(true)}
              />
            ) : (
              <div className="h-16 w-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white font-bold text-2xl">{clubName.charAt(0)}</span>
              </div>
            )}

            {/* Club Name */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {clubName}
            </h2>
            <p className="text-gray-600">
              Sign in to your account
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Sign up here
              </a>
            </p>
          </div>

          {/* Powered by Momentum Footer - Inside Card */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <span className="text-sm">Powered by</span>
              <img
                src="/assets/momentum-logo.png"
                alt="Momentum Logo"
                className="h-5 object-contain"
                onError={(e) => {
                  // Final fallback to text
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'inline';
                }}
              />
              <span className="text-sm font-medium text-indigo-600" style={{display: 'none'}}>
                Momentum
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;