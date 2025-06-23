import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckSquare, Search, UserPlus, CalendarClock, UserCircle, Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast.js';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge.jsx';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { realtimeCapability } from '@/lib/realtimeCapability';
import { matchesSearchTerm, getSearchRelevanceScore, HIGHLIGHT_COLORS } from '@/utils/searchHighlight.jsx';
import HighlightedText from '@/components/ui/HighlightedText';
import StaffPageHeader from '@/components/staff/StaffPageHeader';
import StaffPageContainer from '@/components/staff/StaffPageContainer';
import { logger } from '@/utils/logger';

const CheckInPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allMembers, setAllMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Listen for realtime capability changes
  useEffect(() => {
    const handleCapabilityChange = (enabled) => {
      setRealtimeEnabled(enabled);
    };

    realtimeCapability.onCapabilityChange(handleCapabilityChange);
    
    // Set initial state
    const capability = realtimeCapability.getCapability();
    if (capability.testCompleted) {
      setRealtimeEnabled(capability.isEnabled);
    }

    return () => {
      realtimeCapability.removeCallback(handleCapabilityChange);
    };
  }, []);

  const fetchRecentCheckInsData = useCallback(async () => {
    try {
      const { data: checkInsData, error } = await supabase
        .from('checkin_history')
        .select(`
          *,
          profile:profiles!checkin_history_profile_id_fkey(
            id,
            first_name,
            last_name,
            email,
            status,
            display_name
          ),
          membership:memberships!checkin_history_member_id_fkey(
            id,
            status as membership_status
          )
        `)
        .order('check_in_time', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Transform the data to match the expected format, handle missing memberships/profiles
      const transformedData = checkInsData?.map(checkIn => {
        let memberName = 'Unknown Member';
        let memberStatus = 'Unknown';

        // Use profile data directly (new structure)
        if (checkIn.profile) {
          memberName = checkIn.profile.display_name ||
                      `${checkIn.profile.first_name || ''} ${checkIn.profile.last_name || ''}`.trim() ||
                      checkIn.profile.email || 'Unknown Member';
          memberStatus = checkIn.profile.status || 'Unknown';
        }
        // Fallback to stored member_name if no profile
        else if (checkIn.member_name) {
          memberName = checkIn.member_name;
        }

        return {
          ...checkIn,
          member_name: memberName,
          member_status: memberStatus
        };
      }) || [];
      setRecentCheckIns(transformedData);
    } catch (error) {
      console.error("Error fetching recent check-ins:", error);
      toast({ title: "Error", description: "Could not load recent check-ins.", variant: "destructive" });
    }
  }, [toast]);

  const fetchAllPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;
      await fetchRecentCheckInsData(); 
        const validMembersData = Array.isArray(membersData) ? membersData : [];
      logger.info('👥 Sample member data:', validMembersData.slice(0, 2)); // Debug log
      setAllMembers(validMembersData);
        const initialSlice = validMembersData.slice(0, 5);
      if (initialSlice.length > 0) {
        const membersWithAttendance = await Promise.all(initialSlice.map(async (member) => {
          const { data: memberAttendance, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('member_id', member.id);

          if (error) {
            console.error('Error fetching attendance for member:', member.id, error);
            const displayName = member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Unknown Member';
            return { ...member, displayName, isFirstVisit: true };
          }

          const displayName = member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Unknown Member';
          return { ...member, displayName, isFirstVisit: Array.isArray(memberAttendance) && memberAttendance.length === 0 };
        }));
        setFilteredMembers(membersWithAttendance);
      } else {
        setFilteredMembers([]);
      }

    } catch (error) {
      console.error("Error fetching initial page data:", error);
      toast({ title: "Error", description: "Could not load check-in page data. Please try again later.", variant: "destructive" });
      setAllMembers([]);
      setFilteredMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchRecentCheckInsData]);
  useEffect(() => {
    fetchAllPageData();

    // Only set up realtime if capability is enabled
    if (!realtimeEnabled) {
      console.info("Realtime disabled, CheckIn page will work in poll-only mode");
      return;
    }

    let attendanceChannel = null;
    let membersChannel = null;

    try {
      if (supabase) {
        attendanceChannel = supabase
          .channel('public:checkin_history')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checkin_history' },
            (payload) => {
              fetchRecentCheckInsData();
              if (payload.new && payload.new.profile_id) {
                const profileId = payload.new.profile_id;
                setFilteredMembers(prev => prev.map(m =>
                  m.id === profileId ? { ...m, isFirstVisit: false } : m
                ));
                setAllMembers(prev => prev.map(m =>
                  m.id === profileId ? { ...m, isFirstVisit: false } : m
                ));
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('Check-in history channel error or timed out:', err);
                realtimeCapability.disable(`CheckIn checkin_history channel error: ${status}`);
            }
          });

        membersChannel = supabase
          .channel('public:profiles')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' },
            () => {
              fetchAllPageData();
            }
          )
          .subscribe((status, err) => {
             if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('Members channel error or timed out:', err);
                realtimeCapability.disable(`CheckIn members channel error: ${status}`);
            }
          });
      } else {
        console.warn("Supabase client not initialized. Real-time features in CheckInPage are disabled.");
      }
    } catch (error) {
      console.error('Error setting up realtime channels in CheckIn:', error);
      realtimeCapability.disable(`CheckIn channel setup error: ${error.message}`);
    }

    return () => {
      if (supabase && attendanceChannel) {
        try {
          supabase.removeChannel(attendanceChannel);
        } catch (error) {
          console.warn('Error removing attendance channel:', error);
        }
      }
      if (supabase && membersChannel) {
        try {
          supabase.removeChannel(membersChannel);
        } catch (error) {
          console.warn('Error removing members channel:', error);
        }  
      }
    };
  }, [fetchAllPageData, fetchRecentCheckInsData, realtimeEnabled]);
  useEffect(() => {
    const updateFilteredMembers = async () => {
      if (!Array.isArray(allMembers)) {
        setFilteredMembers([]);
        return;
      }

      if (searchTerm) {
        setIsSearching(true);
        // Enhanced filtering with multiple field search and relevance scoring
        const filtered = allMembers
          .filter(member => {
            // Construct display name properly
            const displayName = member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Unknown Member';
            
            // Check multiple fields for matches
            const nameMatch = matchesSearchTerm(displayName, searchTerm);
            const emailMatch = matchesSearchTerm(member.email || '', searchTerm);
            const idMatch = matchesSearchTerm(String(member.system_member_id || ''), searchTerm);
            const firstNameMatch = matchesSearchTerm(member.first_name || '', searchTerm);
            const lastNameMatch = matchesSearchTerm(member.last_name || '', searchTerm);
            
            return nameMatch || emailMatch || idMatch || firstNameMatch || lastNameMatch;
          })
          .map(member => {
            // Add constructed display name to member object
            const displayName = member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Unknown Member';
            return {
              ...member,
              displayName,
              relevanceScore: Math.max(
                getSearchRelevanceScore(displayName, searchTerm),
                getSearchRelevanceScore(member.email || '', searchTerm),
                getSearchRelevanceScore(String(member.system_member_id || ''), searchTerm),
                getSearchRelevanceScore(member.first_name || '', searchTerm),
                getSearchRelevanceScore(member.last_name || '', searchTerm)
              )
            };
          })
          .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance
          .slice(0, 10); // Limit to top 10 results

        try {
          const membersWithAttendance = await Promise.all(filtered.map(async (member) => {
            const { data: memberAttendance, error } = await supabase
              .from('checkin_history')
              .select('*')
              .eq('profile_id', member.id);

            if (error) {
              console.error('Error fetching check-in history for member:', member.id, error);
              return { ...member, isFirstVisit: true };
            }

            return { ...member, isFirstVisit: Array.isArray(memberAttendance) && memberAttendance.length === 0 };
          }));
          setFilteredMembers(membersWithAttendance);        } catch (error) {
          console.error("Error fetching attendance for search results:", error);
          toast({ title: "Search Error", description: "Could not fetch full member details for search.", variant: "destructive" });
          setFilteredMembers(filtered.slice(0,10).map(m => {
            const displayName = m.displayName || m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email || 'Unknown Member';
            return {...m, displayName, isFirstVisit: true};
          })); 
        } finally {
          setIsSearching(false);
        }
      } else {
        setIsSearching(true);
        const initialSlice = allMembers.slice(0, 5);
        if (initialSlice.length > 0) {
            try {                const membersWithAttendance = await Promise.all(initialSlice.map(async (member) => {
                    const { data: memberAttendance, error } = await supabase
                      .from('checkin_history')
                      .select('*')
                      .eq('profile_id', member.id);

                    if (error) {
                      console.error('Error fetching check-in history for member:', member.id, error);
                      const displayName = member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Unknown Member';
                      return { ...member, displayName, isFirstVisit: true };
                    }

                    const displayName = member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Unknown Member';
                    return { ...member, displayName, isFirstVisit: Array.isArray(memberAttendance) && memberAttendance.length === 0 };
                }));
                setFilteredMembers(membersWithAttendance);            } catch (error) {
                console.error("Error fetching attendance for initial display:", error);
                setFilteredMembers(initialSlice.map(m => {
                  const displayName = m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email || 'Unknown Member';
                  return {...m, displayName, isFirstVisit: true};
                })); 
            } finally {
                setIsSearching(false);
            }
        } else {
            setFilteredMembers([]);
            setIsSearching(false);
        }
      }
    };

    const debounceSearch = setTimeout(() => {
        updateFilteredMembers();
    }, 300); 

    return () => clearTimeout(debounceSearch);

  }, [searchTerm, allMembers, toast]);

  // Remove method param, default to button for future extensibility but do not store in DB
  const handleCheckIn = async (member) => {
    setIsCheckingIn(member.id);
    const memberStatus = (member.status || '').toLowerCase();
    const memberDisplayName = member.displayName || member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Unknown Member';
    try {
      logger.info(`[Check-In Attempt] Member: ${memberDisplayName} (ID: ${member.id}), Status: ${member.status}, Role: ${member.role}`);

      // Check for non-active status (will be handled by UI logic)
      if (memberStatus !== 'active') {
        logger.warn(`[Check-In] Non-active member attempting check-in: ${memberDisplayName}, Status: ${memberStatus}`);
      }

      // Create check-in data with profile reference and optional membership reference
      let checkinData = {
        check_in_time: new Date().toISOString(),
        status: 'checked_in',
        profile_id: member.id, // Always associate with profile
        member_name: memberDisplayName // Store name for quick reference
      };

      // If user is a member, try to get membership id for the foreign key
      if ((member.role || '').toLowerCase() === 'member') {
        const { data: membershipArray, error: membershipError } = await supabase
          .from('memberships')
          .select('id')
          .eq('auth_user_id', member.id)
          .limit(1);
        if (!membershipError && membershipArray && membershipArray.length > 0) {
          checkinData.member_id = membershipArray[0].id; // Use member_id for foreign key
        }
      }

      // Insert into checkin_history
      const { error } = await supabase
        .from('checkin_history')
        .insert([checkinData]);
      if (error) throw error;

      // Update last_visit timestamp
      const profileUpdates = { last_visit: new Date().toISOString() };
      if ((member.role || '').toLowerCase() === 'nonmember') {
        profileUpdates.role = 'member';
      }
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', member.id);
      if (updateError) logger.error('[Check-In] Failed to update profile:', updateError);

      // Show success toast
      toast({ description: `Checked in ${memberDisplayName}`, variant: "success" });

      // Navigate to member profile or refresh data
      setTimeout(() => {
        navigate(`/staff/members/${member.id}`);
      }, 1000);
    } catch (error) {
      console.error('Error during check-in:', error);
      toast({ title: "Check-in Error", description: "An error occurred during check-in. Please try again.", variant: "destructive" });
    } finally {
      setIsCheckingIn(null);
    }
  };

  return (
    <StaffPageContainer className="space-y-6 p-4 md:p-6">
      <StaffPageHeader 
        title="Member Check-In"
        description="Search for members to check them in or view recent activity."
      />

      <Card className="shadow-xl bg-white/80 dark:bg-slate-800/70 backdrop-blur-sm border-slate-300/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-slate-100">Search Member</CardTitle>
          <CardDescription>Find a member by name or ID to check them in.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-500" />
            <Input
              type="text"
              placeholder="Search by name or Member ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-primary focus:border-primary"
            />
          </div>
          {isSearching && <div className="mt-3 text-center"><LoadingSpinner text="Searching..." /></div>}
          {!isSearching && searchTerm && filteredMembers.length > 0 && (
            <ul className="mt-3 border border-slate-200 dark:border-slate-700 rounded-md max-h-60 overflow-y-auto bg-slate-50 dark:bg-slate-800/50">
              {filteredMembers.map(member => (
                <li key={member.id} className="flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-b border-slate-200 dark:border-slate-700 last:border-b-0 transition-colors">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center">
                      <UserCircle className="h-4 w-4 mr-2 text-muted-foreground dark:text-slate-400"/>
                      <HighlightedText
                        text={member.displayName || member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Unknown Member'}
                        searchTerm={searchTerm}
                        highlightClass={HIGHLIGHT_COLORS.MEMBER_SEARCH}
                      />
                      <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="ml-2 scale-90">{member.status}</Badge>
                      {member.isFirstVisit && <Badge variant="outline" className="ml-2 scale-90 border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600"><Star className="h-3 w-3 mr-1"/>First Visit!</Badge>}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ID: <HighlightedText
                        text={String(member.system_member_id || '')}
                        searchTerm={searchTerm}
                        highlightClass={HIGHLIGHT_COLORS.MEMBER_SEARCH}
                      /> | Status: {member.status}
                      {member.email && (
                        <span> | Email: <HighlightedText
                          text={member.email}
                          searchTerm={searchTerm}
                          highlightClass={HIGHLIGHT_COLORS.MEMBER_SEARCH}
                        /></span>
                      )}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCheckIn(member)}
                    disabled={isCheckingIn === member.id}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                  >
                    {isCheckingIn === member.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Check In'
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {!isSearching && searchTerm && filteredMembers.length === 0 && (
            <p className="text-muted-foreground text-sm mt-3 text-center py-4">
              No members found matching "<HighlightedText
                text={searchTerm}
                searchTerm={searchTerm}
                highlightClass={HIGHLIGHT_COLORS.MEMBER_SEARCH}
              />".
            </p>
          )}
          {!searchTerm && !isSearching && filteredMembers.length > 0 && (
            <ul className="mt-3 border border-slate-200 dark:border-slate-700 rounded-md max-h-60 overflow-y-auto bg-slate-50 dark:bg-slate-800/50">
              {filteredMembers.map(member => (
                <li key={member.id} className="flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-b border-slate-200 dark:border-slate-700 last:border-b-0 transition-colors">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center">
                      <UserCircle className="h-4 w-4 mr-2 text-muted-foreground dark:text-slate-400"/>
                      {member.displayName || member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Unknown Member'}
                      <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="ml-2 scale-90">{member.status}</Badge>
                      {member.isFirstVisit && <Badge variant="outline" className="ml-2 scale-90 border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600"><Star className="h-3 w-3 mr-1"/>First Visit!</Badge>}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">ID: {member.system_member_id} | Status: {member.status}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCheckIn(member)}
                    disabled={isCheckingIn === member.id}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                  >
                    {isCheckingIn === member.id ? <LoadingSpinner size="sm" /> : 'Check In'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-xl bg-white/80 dark:bg-slate-800/70 backdrop-blur-sm border-slate-300/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-slate-100">Recent Check-Ins</CardTitle>
          <CardDescription>Activity log for the last few check-ins.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && recentCheckIns.length === 0 && <div className="text-center py-6"><LoadingSpinner text="Loading recent activity..." /></div>}
          {!isLoading && recentCheckIns.length > 0 ? (
            <ul className="space-y-3">
              {recentCheckIns.map(checkIn => (
                <li key={checkIn.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/60 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/80 transition-colors shadow-sm">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{checkIn.member_name || 'Unknown Member'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Checked in at {format(new Date(checkIn.check_in_time), 'PPpp')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300">{checkIn.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            !isLoading && <div className="text-center py-6">
              <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground dark:text-slate-500 mb-2" />
              <p className="text-muted-foreground dark:text-slate-400">No recent check-ins recorded.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </StaffPageContainer>
  );
};

export default CheckInPage;


