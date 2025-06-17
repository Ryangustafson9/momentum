import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthQuery as useAuth } from '@/hooks/useAuthQuery';
import { getGeneralSettings } from '@/services/dataService';
import { Phone, Mail, CreditCard, Users, ArrowRight, ArrowLeft } from 'lucide-react';

const NonmemberPrompt = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
    NonmemberSignupPrompt: true,
    nonmemberRedirectMessage: 'Please sign up for a membership to access our facilities.',
    clubName: 'Momentum Fitness',
    clubPhone: '(555) 123-4567',
    clubEmail: 'info@momentumfitness.com'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const generalSettings = await getGeneralSettings();
        if (generalSettings) {
          setSettings(prev => ({ ...prev, ...generalSettings }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSignUpOnline = () => {
    navigate('/join-online');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-lg shadow-xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to {settings.clubName}!
          </h1>
          <p className="text-gray-600">
            {settings.nonmemberRedirectMessage}
          </p>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>Logged in as:</strong> {user.email}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Current status:</strong> Not a member
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4 mb-6">
          <button
            onClick={handleSignUpOnline}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <CreditCard className="h-5 w-5" />
            <span>Sign Up for Membership Online</span>
            <ArrowRight className="h-5 w-5" />
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Contact Options */}
          <div className="grid grid-cols-1 gap-3">
            <a
              href={`tel:${settings.clubPhone}`}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Phone className="h-5 w-5" />
              <span>Call Us: {settings.clubPhone}</span>
            </a>

            <a
              href={`mailto:${settings.clubEmail}`}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Mail className="h-5 w-5" />
              <span>Email Us</span>
            </a>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-gray-200 pt-6 space-y-3">
          <button
            onClick={handleBackToLogin}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Login</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full text-gray-500 py-2 px-4 rounded-lg hover:text-gray-700 transition-colors text-sm"
          >
            Logout
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact us at {settings.clubPhone}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default NonmemberPrompt;