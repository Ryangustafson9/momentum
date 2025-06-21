/**
 * 🏢 Club Settings Route Guard
 * Protects routes based on club operational settings
 */

import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isOnlineJoiningAllowed, clubSettingsUtils } from '@/services/clubSettingsService';
import { AuthLoader } from '@/components/FullPageLoader.jsx';
import { getGymName } from '@/utils/gymBranding';

/**
 * Route guard that checks club settings before allowing access
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if access is allowed
 * @param {string} props.settingKey - Which setting to check ('joining', 'upgrades', 'addons', 'family')
 * @param {string} props.redirectTo - Where to redirect if access is denied (default: '/dashboard')
 * @param {boolean} props.showContactInfo - Whether to show contact info on redirect page
 */
const ClubSettingsRoute = ({ 
  children, 
  settingKey = 'joining', 
  redirectTo = '/dashboard',
  showContactInfo = true 
}) => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkSettings = async () => {
      try {
        setLoading(true);
        
        let allowed = false;
        switch (settingKey) {
          case 'joining':
            allowed = await isOnlineJoiningAllowed();
            break;
          case 'upgrades':
            // Add other setting checks as needed
            allowed = true; // Placeholder
            break;
          case 'addons':
            allowed = true; // Placeholder
            break;
          case 'family':
            allowed = true; // Placeholder
            break;
          default:
            allowed = true;
        }
        
        setIsAllowed(allowed);
      } catch (error) {
        console.error('Failed to check club settings:', error);
        // Default to allowing access if settings can't be loaded
        setIsAllowed(true);
      } finally {
        setLoading(false);
      }
    };

    checkSettings();
  }, [settingKey]);

  // Show loading while checking settings
  if (loading) {
    return <AuthLoader message="Checking availability..." />;
  }

  // If access is denied, redirect with state
  if (!isAllowed) {
    console.log(`🚫 Club setting '${settingKey}' is disabled, redirecting to ${redirectTo}`);
    
    // Pass information about why access was denied
    const state = {
      from: location,
      reason: 'feature_disabled',
      settingKey,
      message: clubSettingsUtils.getDisabledFeatureMessage(settingKey),
      contactInfo: showContactInfo ? clubSettingsUtils.getContactInfo() : null
    };
    
    return <Navigate to={redirectTo} state={state} replace />;
  }

  // Access allowed, render children
  return children;
};

/**
 * Specific route guard for join-online routes
 */
export const JoinOnlineRoute = ({ children }) => (
  <ClubSettingsRoute 
    settingKey="joining" 
    redirectTo="/dashboard"
    showContactInfo={true}
  >
    {children}
  </ClubSettingsRoute>
);

/**
 * Hook to check if a specific club feature is enabled
 */
export const useClubFeature = (settingKey) => {
  const [loading, setLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        setLoading(true);
        
        let enabled = false;
        switch (settingKey) {
          case 'joining':
            enabled = await isOnlineJoiningAllowed();
            break;
          // Add other cases as needed
          default:
            enabled = true;
        }
        
        setIsEnabled(enabled);
      } catch (error) {
        console.error('Failed to check club feature:', error);
        setIsEnabled(true); // Default to enabled
      } finally {
        setLoading(false);
      }
    };

    checkFeature();
  }, [settingKey]);

  return { loading, isEnabled };
};

export default ClubSettingsRoute;
