
import React from 'react';
import ClassCard from './ClassCard.jsx';
import { CalendarCheck, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/shared/components/LoadingStates';

const MyBookingsTab = ({ memberAttendance, allClasses, onCancel, onDetails, isCancelling }) => {
  
  if (!memberAttendance || !allClasses) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner text="Loading your bookings..." /></div>;
  }

  const bookedClassesDetails = memberAttendance
    .filter(att => att.status === 'Booked')
    .map(att => {
      const classDetail = allClasses.find(cls => cls.id === att.class_id);
      return classDetail ? { ...classDetail, attendanceId: att.id, bookingDate: att.check_in_time } : null;
    })
    .filter(Boolean) 
    .sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate));

  if (bookedClassesDetails.length === 0) {
    return <div className="text-center py-10 text-muted-foreground"><CalendarCheck className="mx-auto h-10 w-10 mb-2" />You have no active bookings.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
      {bookedClassesDetails.map(cls => (
        <ClassCard 
          key={cls.id} 
          cls={cls} 
          isBooked={true}
          spotsLeft={cls.max_capacity - (cls.booked_count || 0)}
          attendanceStatus="Booked"
          onBook={() => {}} 
          onCancel={onCancel}
          onDetails={onDetails}
          isProcessing={isCancelling === cls.id}
        />
      ))}
    </div>
  );
};

export default MyBookingsTab;


