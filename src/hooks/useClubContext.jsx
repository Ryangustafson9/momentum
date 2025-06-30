import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

/**
 * Club Context for managing multi-location club isolation
 * Provides current club context and club switching functionality
 */
const ClubContext = createContext();

export const ClubProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentClub, setCurrentClub] = useState(null);
  const [availableClubs, setAvailableClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detect club from URL subdomain
  const detectClubFromURL = () => {
    const hostname = window.location.hostname;
    
    // For development, check for club parameter or default to main
    if (hostname === 'localhost' || hostname.includes('localhost')) {
      const urlParams = new URLSearchParams(window.location.search);
      const clubParam = urlParams.get('club');
      return clubParam || 'main';
    }
    
    // For production, extract from subdomain
    // e.g., liftzone.momentum.pro -> liftzone
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0]; // First part is the club identifier
    }
    
    return 'main'; // Default club
  };

  // Load user's accessible clubs
  const loadAvailableClubs = async () => {
    if (!user?.id) return;

    try {
      setError(null);
      
      // Check if user has cross-club access (admin/regional manager)
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // If admin, get all clubs in organization
      if (userProfile.role === 'admin' || userProfile.role === 'regional_manager') {
        const { data: clubs, error: clubsError } = await supabase
          .from('locations')
          .select('id, name, slug, organization_id')
          .eq('organization_id', userProfile.organization_id)
          .order('name');

        if (clubsError) throw clubsError;
        setAvailableClubs(clubs || []);
      } else {
        // For regular staff, get only assigned clubs
        const { data: staffAccess, error: accessError } = await supabase
          .from('staff_location_access')
          .select(`
            location_id,
            locations (
              id, name, slug, organization_id
            )
          `)
          .eq('user_id', user.id);

        if (accessError) throw accessError;
        
        const clubs = staffAccess?.map(access => access.locations).filter(Boolean) || [];
        setAvailableClubs(clubs);
      }

    } catch (err) {
      console.error('Error loading available clubs:', err);
      setError(err);
      setAvailableClubs([]);
    }
  };

  // Set current club based on URL and user access
  const setCurrentClubFromContext = async () => {
    const clubSlug = detectClubFromURL();
    
    if (availableClubs.length === 0) {
      setCurrentClub(null);
      return;
    }

    // Find club by slug
    let club = availableClubs.find(c => c.slug === clubSlug);
    
    // If not found or no access, use first available club
    if (!club) {
      club = availableClubs[0];
    }

    setCurrentClub(club);

    // Set club context in Supabase for RLS
    if (club) {
      await supabase.rpc('set_current_club_context', { 
        club_id: club.id,
        organization_id: club.organization_id 
      });
    }
  };

  // Switch to a different club (for privileged users)
  const switchClub = async (clubId) => {
    const club = availableClubs.find(c => c.id === clubId);
    if (!club) {
      throw new Error('Club not found or access denied');
    }

    setCurrentClub(club);

    // Update URL if needed (for development, use query param)
    const url = new URL(window.location);
    url.searchParams.set('club', club.slug);
    window.history.replaceState({}, '', url);

    // Set club context in Supabase
    await supabase.rpc('set_current_club_context', { 
      club_id: club.id,
      organization_id: club.organization_id 
    });

    return club;
  };

  // Initialize club context
  useEffect(() => {
    const initializeClubContext = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        await loadAvailableClubs();
      } catch (err) {
        console.error('Error initializing club context:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeClubContext();
  }, [user?.id]);

  // Set current club when available clubs change
  useEffect(() => {
    if (availableClubs.length > 0 && !currentClub) {
      setCurrentClubFromContext();
    }
  }, [availableClubs]);

  const value = {
    currentClub,
    availableClubs,
    isLoading,
    error,
    switchClub,
    canAccessMultipleClubs: availableClubs.length > 1,
    refreshClubs: loadAvailableClubs
  };

  return (
    <ClubContext.Provider value={value}>
      {children}
    </ClubContext.Provider>
  );
};

/**
 * Hook to access club context
 */
export const useClubContext = () => {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error('useClubContext must be used within a ClubProvider');
  }
  return context;
};

/**
 * Lightweight hook for just getting current club ID
 */
export const useCurrentClubId = () => {
  const { currentClub } = useClubContext();
  return currentClub?.id || null;
};

export default useClubContext;
