
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Users, User, MapPin, BarChart, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';

const ClassDetailsDialog = ({ classInfo, isOpen, onClose, onBook, onCancelBooking, onJoinWaitlist, memberBookings, memberId }) => {
  const { toast } = useToast();

  if (!classInfo) return null;

  const isBooked = memberBookings?.some(booking => booking.classId === classInfo.id);
  const isFull = (classInfo.booked_count || 0) >= classInfo.max_capacity;
  const isOnWaitlist = dataService.getWaitlistForClass(classInfo.id).some(entry => entry.memberId === memberId);


  const handleBook = () => {
    try {
      onBook(classInfo.id);
    } catch (error) {
      toast({ title: "Booking Failed", description: error.message, variant: "destructive" });
    }
  };
  
  const handleCancelBooking = () => {
    try {
      onCancelBooking(classInfo.id);
    } catch (error) {
      toast({ title: "Cancellation Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleJoinWaitlist = () => {
    try {
      onJoinWaitlist(classInfo.id);
    } catch (error) {
      toast({ title: "Waitlist Error", description: error.message, variant: "destructive" });
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">{classInfo.name}</DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">{classInfo.description || "No description available."}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3 text-sm">
          <div className="flex items-center">
            <User className="mr-2 h-4 w-4 text-primary" />
            <span>Instructor: {classInfo.instructorName || 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <CalendarDays className="mr-2 h-4 w-4 text-primary" />
            <span>Date: {format(new Date(classInfo.startTime), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-primary" />
            <span>Time: {format(new Date(classInfo.startTime), 'p')} - {format(new Date(classInfo.endTime), 'p')}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4 text-primary" />
            <span>Location: {classInfo.location || 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4 text-primary" />
            <span>Spots: {classInfo.booked_count || 0} / {classInfo.max_capacity} booked</span>
          </div>
          <div className="flex items-center">
            <BarChart className="mr-2 h-4 w-4 text-primary" />
            <span>Difficulty: {classInfo.difficulty || 'All Levels'}</span>
          </div>
          {isFull && !isBooked && (
            <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-md">
              <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500 dark:text-yellow-400" />
              <span className="text-yellow-700 dark:text-yellow-300">This class is currently full.</span>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {isBooked ? (
            <Button variant="destructive" onClick={handleCancelBooking}>Cancel Booking</Button>
          ) : isFull ? (
            isOnWaitlist ? (
              <Button disabled variant="outline">Already on Waitlist</Button>
            ) : (
              <Button onClick={handleJoinWaitlist} className="bg-blue-600 hover:bg-blue-700 text-white">Join Waitlist</Button>
            )
          ) : (
            <Button onClick={handleBook} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">Book Class</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClassDetailsDialog;



