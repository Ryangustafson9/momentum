
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';
import { supabase } from '@/lib/supabaseClient.js';

export const useMemberClassesData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [allClasses, setAllClasses] = useState([]);
  const [memberAttendance, setMemberAttendance] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(null);

  const fetchPageData = useCallback(async (currentUser) => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [classesData, attendanceData] = await Promise.all([
        dataService.getClasses(),
        dataService.getAttendanceRecords({ memberId: currentUser.id })
      ]);
      
      setAllClasses(Array.isArray(classesData) ? classesData : []);
      setMemberAttendance(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (error) {
      console.error("Error fetching member classes page data:", error);
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
    if (!loggedInUser) return;

    const classesChannel = supabase
      .channel('public:classes:member-classes-hook')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' },
        (payload) => {
          console.log('useMemberClassesData: Classes change received!', payload);
          fetchPageData(loggedInUser); 
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') console.log('useMemberClassesData: Subscribed to classes channel');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.error('useMemberClassesData: Classes channel error:', err);
      });

    const attendanceChannel = supabase
      .channel(`public:attendance:member_id=eq.${loggedInUser.id}:member-classes-hook`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance', filter: `member_id=eq.${loggedInUser.id}` },
        (payload) => {
          console.log('useMemberClassesData: Attendance change received for user!', payload);
          fetchPageData(loggedInUser); 
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') console.log(`useMemberClassesData: Subscribed to attendance channel for user ${loggedInUser.id}`);
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.error('useMemberClassesData: Attendance channel error:', err);
      });
      
    return () => {
      supabase.removeChannel(classesChannel);
      supabase.removeChannel(attendanceChannel);
      console.log('useMemberClassesData: Unsubscribed from channels');
    };
  }, [loggedInUser, fetchPageData]);

  const handleBookClass = async (classToBook) => {
    if (!loggedInUser) return;
    setIsProcessing(classToBook.id);
    try {
      await dataService.bookClassForMember(loggedInUser.id, classToBook.id);
      toast({ title: "Class Booked!", description: `You've successfully booked ${classToBook.name}.`, className: "bg-green-500 text-white" });
    } catch (error) {
      console.error("Error booking class:", error);
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
        await dataService.cancelClassBookingForMember(loggedInUser.id, classToCancel.id, attendanceRecord.id);
        toast({ title: "Booking Cancelled", description: `Your booking for ${classToCancel.name} has been cancelled.` });
    } catch (error) {
        console.error("Error cancelling booking:", error);
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


