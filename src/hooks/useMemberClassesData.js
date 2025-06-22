
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient.js';
import { realtimeCapability } from '@/lib/realtimeCapability';

export const useMemberClassesData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [allClasses, setAllClasses] = useState([]);
  const [memberAttendance, setMemberAttendance] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);

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

  const fetchPageData = useCallback(async (currentUser) => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [classesResult, attendanceResult] = await Promise.all([
        // Get classes
        supabase
          .from('classes')
          .select(`
            *,
            instructor:profiles!classes_instructor_id_fkey(
              id,
              first_name,
              last_name,
              email
            )
          `)
          .order('start_time', { ascending: true }),

        // Get attendance records
        supabase
          .from('attendance')
          .select('*')
          .eq('member_id', currentUser.id)
          .order('check_in_time', { ascending: false })
      ]);

      if (classesResult.error) throw classesResult.error;
      if (attendanceResult.error) throw attendanceResult.error;

      setAllClasses(Array.isArray(classesResult.data) ? classesResult.data : []);
      setMemberAttendance(Array.isArray(attendanceResult.data) ? attendanceResult.data : []);
    } catch (error) {
      
      toast({ title: "Error", description: "Could not load class information. Please try again.", variant: "destructive" });
      setAllClasses([]);
      setMemberAttendance([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!user || user.role !== 'member') {
      navigate('/login');
      return;
    }
    setLoggedInUser(user);
    fetchPageData(user);
  }, [navigate, fetchPageData]);
    useEffect(() => {
    if (!loggedInUser || !realtimeEnabled) {
      if (!realtimeEnabled) {
        
      }
      return;
    }

    let classesChannel = null;
    let attendanceChannel = null;

    try {
      classesChannel = supabase
        .channel('public:classes:member-classes-hook')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' },
          (payload) => {
            
            fetchPageData(loggedInUser); 
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') 
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            
            realtimeCapability.disable(`useMemberClassesData classes channel error: ${status}`);
          }
        });

      attendanceChannel = supabase
        .channel(`public:attendance:member_id=eq.${loggedInUser.id}:member-classes-hook`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance', filter: `member_id=eq.${loggedInUser.id}` },
          (payload) => {
            
            fetchPageData(loggedInUser); 
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') 
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            
            realtimeCapability.disable(`useMemberClassesData attendance channel error: ${status}`);
          }
        });
    } catch (error) {
      
      realtimeCapability.disable(`useMemberClassesData channel setup error: ${error.message}`);
    }
      
    return () => {
      if (classesChannel) {
        try {
          supabase.removeChannel(classesChannel);
        } catch (error) {
          
        }
      }
      if (attendanceChannel) {
        try {
          supabase.removeChannel(attendanceChannel);
        } catch (error) {
          
        }
      }
      
    };
  }, [loggedInUser, fetchPageData, realtimeEnabled]);

  const handleBookClass = async (classToBook) => {
    if (!loggedInUser) return;
    setIsProcessing(classToBook.id);
    try {
      const { error } = await supabase
        .from('class_bookings')
        .insert([{
          class_id: classToBook.id,
          member_id: loggedInUser.id,
          status: 'confirmed',
          booked_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({ title: "Class Booked!", description: `You've successfully booked ${classToBook.name}.`, className: "bg-green-500 text-white" });
    } catch (error) {
      
      toast({ title: "Booking Failed", description: error.message || "Could not book the class.", variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };
  
  const handleCancelBooking = async (classToCancel) => {
    if (!loggedInUser) return;
    const attendanceRecord = memberAttendance.find(att => att.class_id === classToCancel.id && att.status === 'Booked');
    if (!attendanceRecord) {
        toast({ title: "Not Booked", description: "You are not booked for this class or booking already actioned.", variant: "destructive" });
        return;
    }
    setIsProcessing(classToCancel.id);
    try {
        const { error } = await supabase
          .from('class_bookings')
          .delete()
          .eq('id', attendanceRecord.id)
          .eq('member_id', loggedInUser.id);

        if (error) throw error;

        toast({ title: "Booking Cancelled", description: `Your booking for ${classToCancel.name} has been cancelled.` });
    } catch (error) {
        
        toast({ title: "Cancellation Failed", description: error.message || "Could not cancel booking.", variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  return {
    allClasses,
    memberAttendance,
    loggedInUser,
    isLoading,
    isProcessing,
    handleBookClass,
    handleCancelBooking,
  };
};



