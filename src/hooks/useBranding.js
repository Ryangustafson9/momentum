import { useState, useEffect } from 'react';
import { brandingService } from '@/services/brandingService';

/**
 * React hook for accessing gym branding data (name, logo, etc.)
 * Automatically loads and caches branding data from the database
 */
export const useBranding = () => {
  const [branding, setBranding] = useState({
    clubName: 'Momentum Fitness',
    logoUrl: '',
    avatarUrl: '',
    // Legacy support
    club_name: 'Momentum Fitness',
    logo_url: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBranding = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await brandingService.getBranding();
      setBranding(data);
    } catch (err) {
      console.warn('Failed to load branding data:', err);
      setError(err);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranding();
  }, []);

  const updateBranding = async (updates) => {
    try {
      await brandingService.saveBranding(updates);
      await loadBranding(); // Refresh data
      return true;
    } catch (err) {
      console.error('Failed to update branding:', err);
      setError(err);
      return false;
    }
  };

  const updateClubName = async (clubName) => {
    try {
      await brandingService.updateClubName(clubName);
      await loadBranding(); // Refresh data
      return true;
    } catch (err) {
      console.error('Failed to update club name:', err);
      setError(err);
      return false;
    }
  };

  return {
    branding,
    loading,
    error,
    refresh: loadBranding,
    updateBranding,
    updateClubName,
    // Convenience getters
    clubName: branding.clubName,
    logoUrl: branding.logoUrl,
    avatarUrl: branding.avatarUrl
  };
};

export default useBranding;
