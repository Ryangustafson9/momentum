
import React from 'react';
import ClassCard from './ClassCard.jsx';
import { Calendar, Search } from 'lucide-react';
import { LoadingSpinner } from '@/shared/components/LoadingStates';

const AllClassesTabContent = ({ filteredClasses, memberAttendance, onBook, onCancel, onDetails, searchTerm, isBookingOrCancelling }) => {
  const isClassBooked = (classId) => memberAttendance.some(att => att.class_id === classId && att.status !== 'Cancelled');
  const getClassAttendanceStatus = (classId) => {
      const attendanceRecord = memberAttendance.find(att => att.class_id === classId);
      return attendanceRecord ? attendanceRecord.status : null;
  };

  if (!filteredClasses) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner text="Loading classes..." /></div>;
  }
  if (filteredClasses.length === 0 && !searchTerm) {
       return <div className="text-center py-10 text-muted-foreground"><Calendar className="mx-auto h-10 w-10 mb-2" />No classes available at the moment.</div>;
  }
  if (filteredClasses.length === 0 && searchTerm) {
       return <div className="text-center py-10 text-muted-foreground"><Search className="mx-auto h-10 w-10 mb-2" />No classes match your search.</div>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
      {filteredClasses.map(cls => (
        <ClassCard 
          key={cls.id} 
          cls={cls} 
          isBooked={isClassBooked(cls.id)}
          spotsLeft={cls.max_capacity - (cls.booked_count || 0)}
          attendanceStatus={getClassAttendanceStatus(cls.id)}
          onBook={onBook}
          onCancel={onCancel}
          onDetails={onDetails}
          isProcessing={isBookingOrCancelling === cls.id}
        />
      ))}
    </div>
  );
};

export default AllClassesTabContent;


