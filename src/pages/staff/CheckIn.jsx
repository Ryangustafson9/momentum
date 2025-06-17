
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckSquare, Search, UserPlus, CalendarClock, UserCircle, Star } from 'lucide-react';
import { dataService } from '@/services/dataService.js';
import { useToast } from '@/hooks/use-toast.js';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge.jsx';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { supabase } from '@/lib/supabaseClient.js';

const CheckInPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allMembers, setAllMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(null); 
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchRecentCheckInsData = useCallback(async () => {
    try {
      const checkInsData = await dataService.getRecentCheckIns(10);
      setRecentCheckIns(Array.isArray(checkInsData) ? checkInsData : []);
    } catch (error) {
      console.error("Error fetching recent check-ins:", error);
      toast({ title: "Error", description: "Could not load recent check-ins.", variant: "destructive" });
    }
  }, [toast]);

  const fetchAllPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const membersData = await dataService.getMembers();
      await fetchRecentCheckInsData(); 
      
      const validMembersData = Array.isArray(membersData) ? membersData : [];
      setAllMembers(validMembersData);
      
      const initialSlice = validMembersData.slice(0, 5);
      if (initialSlice.length > 0) {
        const membersWithAttendance = await Promise.all(initialSlice.map(async (member) => {
          const memberAttendance = await dataService.getAttendanceRecords({ memberId: member.id });
          return { ...member, isFirstVisit: Array.isArray(memberAttendance) && memberAttendance.length === 0 };
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

    let attendanceChannel = null;
    let membersChannel = null;

    if (supabase) {
      attendanceChannel = supabase
        .channel('public:attendance')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, 
          (payload) => {
            console.log('New attendance record received:', payload);
            fetchRecentCheckInsData();
            if (payload.new && payload.new.member_id) {
              const memberId = payload.new.member_id;
              setFilteredMembers(prev => prev.map(m => 
                m.id === memberId ? { ...m, isFirstVisit: false } : m
              ));
              setAllMembers(prev => prev.map(m => 
                m.id === memberId ? { ...m, isFirstVisit: false } : m
              ));
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
              console.log('Subscribed to attendance channel');
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.error('Attendance channel error or timed out:', err);
          }
        });

      membersChannel = supabase
        .channel('public:members')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'members' },
          (payload) => {
            console.log('Member data changed:', payload);
            fetchAllPageData(); 
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
              console.log('Subscribed to members channel');
          }
           if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.error('Members channel error or timed out:', err);
          }
        });
    } else {
      console.warn("Supabase client not initialized. Real-time features in CheckInPage are disabled.");
    }

    return () => {
      if (supabase && attendanceChannel) {
        supabase.removeChannel(attendanceChannel);
        console.log('Unsubscribed from attendance channel');
      }
      if (supabase && membersChannel) {
        supabase.removeChannel(membersChannel);
        console.log('Unsubscribed from members channel');
      }
    };
  }, [fetchAllPageData, fetchRecentCheckInsData]);

  useEffect(() => {
    const updateFilteredMembers = async () => {
      if (!Array.isArray(allMembers)) {
        setFilteredMembers([]);
        return;
      }

      if (searchTerm) {
        setIsSearching(true);
        const lowerSearchTerm = searchTerm.toLowerCase();
        const filtered = allMembers.filter(member =>
          member.name.toLowerCase().includes(lowerSearchTerm) ||
          (member.system_member_id && String(member.system_member_id).toLowerCase().includes(lowerSearchTerm))
        );

        try {
          const membersWithAttendance = await Promise.all(filtered.slice(0, 10).map(async (member) => {
            const memberAttendance = await dataService.getAttendanceRecords({ memberId: member.id });
            return { ...member, isFirstVisit: Array.isArray(memberAttendance) && memberAttendance.length === 0 };
          }));
          setFilteredMembers(membersWithAttendance);
        } catch (error) {
          console.error("Error fetching attendance for search results:", error);
          toast({ title: "Search Error", description: "Could not fetch full member details for search.", variant: "destructive" });
          setFilteredMembers(filtered.slice(0,10).map(m => ({...m, isFirstVisit: true}))); 
        } finally {
          setIsSearching(false);
        }
      } else {
        setIsSearching(true);
        const initialSlice = allMembers.slice(0, 5);
        if (initialSlice.length > 0) {
            try {
                const membersWithAttendance = await Promise.all(initialSlice.map(async (member) => {
                    const memberAttendance = await dataService.getAttendanceRecords({ memberId: member.id });
                    return { ...member, isFirstVisit: Array.isArray(memberAttendance) && memberAttendance.length === 0 };
                }));
                setFilteredMembers(membersWithAttendance);
            } catch (error) {
                console.error("Error fetching attendance for initial display:", error);
                setFilteredMembers(initialSlice.map(m => ({...m, isFirstVisit: true}))); 
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

  const handleCheckIn = async (member) => {
    setIsCheckingIn(member.id);
    try {
      await dataService.recordCheckIn(member.id, null, member.name); 
      toast({
        title: "Check-In Successful",
        description: `${member.name} has been checked in. ${member.isFirstVisit ? 'This is their first visit!' : ''}`,
        className: "bg-green-500 text-white",
      });
      if (!supabase) { 
        fetchRecentCheckInsData();
        const updatedMember = { ...member, isFirstVisit: false };
        setFilteredMembers(prev => prev.map(m => m.id === member.id ? updatedMember : m));
        setAllMembers(prev => prev.map(m => m.id === member.id ? updatedMember : m));
      }
    } catch (error) {
      console.error("Error during check-in:", error);
      toast({
        title: "Check-In Failed",
        description: `Could not check in ${member.name}. ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsCheckingIn(null);
    }
  };

  if (isLoading && !searchTerm && filteredMembers.length === 0) { 
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="xl" text="Loading Check-In..." />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-4 md:p-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex-grow">
          <h1 className="text-3xl font-bold tracking-tight flex items-center text-slate-800 dark:text-slate-100">
            <CheckSquare className="mr-3 h-8 w-8 text-primary" /> Member Check-In
          </h1>
          <p className="text-muted-foreground mt-1">Search for members to check them in or view recent activity.</p>
        </div>
        <Button 
          onClick={() => navigate('/members')} 
          className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add/Manage Members
        </Button>
      </div>

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
                        {member.name} 
                        <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="ml-2 scale-90">{member.status}</Badge>
                        {member.isFirstVisit && <Badge variant="outline" className="ml-2 scale-90 border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600"><Star className="h-3 w-3 mr-1"/>First Visit!</Badge>}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">ID: {member.system_member_id} | Status: {member.status}</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleCheckIn(member)}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                    disabled={member.status !== 'Active' || isCheckingIn === member.id}
                  >
                    {isCheckingIn === member.id ? <LoadingSpinner size="sm" /> : 'Check In'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
           {!isSearching && searchTerm && filteredMembers.length === 0 && (
             <p className="text-muted-foreground text-sm mt-3 text-center py-4">No members found matching "{searchTerm}".</p>
           )}
           {!searchTerm && !isSearching && filteredMembers.length > 0 && ( 
             <ul className="mt-3 border border-slate-200 dark:border-slate-700 rounded-md max-h-60 overflow-y-auto bg-slate-50 dark:bg-slate-800/50">
              {filteredMembers.map(member => (
                <li key={member.id} className="flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-b border-slate-200 dark:border-slate-700 last:border-b-0 transition-colors">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center">
                        <UserCircle className="h-4 w-4 mr-2 text-muted-foreground dark:text-slate-400"/>
                        {member.name} 
                        <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="ml-2 scale-90">{member.status}</Badge>
                        {member.isFirstVisit && <Badge variant="outline" className="ml-2 scale-90 border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600"><Star className="h-3 w-3 mr-1"/>First Visit!</Badge>}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">ID: {member.system_member_id} | Status: {member.status}</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleCheckIn(member)}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                    disabled={member.status !== 'Active' || isCheckingIn === member.id}
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
                      {checkIn.class_name && checkIn.class_name !== 'General Check-in' && ` for ${checkIn.class_name}`}
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
    </motion.div>
  );
};

export default CheckInPage;


