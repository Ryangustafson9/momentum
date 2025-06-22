
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, PlusCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ClassCard = ({ cls, isBooked, spotsLeft, attendanceStatus, onBook, onCancel, onDetails }) => {
  let actionButton;
  if (attendanceStatus === 'Present' || attendanceStatus === 'Absent' || attendanceStatus === 'Late') {
      actionButton = <Button variant="outline" size="sm" disabled className="bg-gray-100 text-gray-500">Attended/Past</Button>;
  } else if (isBooked) {
      actionButton = <Button variant="destructive" size="sm" onClick={() => onCancel(cls)}>Cancel Booking</Button>;
  } else if (spotsLeft <= 0) {
      actionButton = <Button variant="outline" size="sm" disabled>Class Full</Button>;
  } else {
      actionButton = <Button size="sm" onClick={() => onBook(cls)} className="bg-primary hover:bg-primary/80"><PlusCircle className="mr-1 h-4 w-4" /> Book Now</Button>;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col"
    >
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{cls.name}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isBooked ? 'bg-green-100 text-green-700' : spotsLeft <=3 && spotsLeft > 0 ? 'bg-yellow-100 text-yellow-700' : spotsLeft <=0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
            {isBooked ? 'Booked' : spotsLeft <= 0 ? 'Full' : `${spotsLeft} spots left`}
          </span>
        </div>
        <p className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full inline-block mb-2">{cls.category}</p>
        
        <div className="text-sm text-gray-600 space-y-1 mb-3">
          <p className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-gray-400" /> {cls.schedule}</p>
          <p className="flex items-center"><Clock className="h-4 w-4 mr-2 text-gray-400" /> {cls.duration}</p>
          <p className="flex items-center"><Users className="h-4 w-4 mr-2 text-gray-400" /> With {cls.trainer}</p>
        </div>
      </div>
      <div className="bg-gray-50 p-4 flex justify-between items-center">
        <Button variant="link" size="sm" className="text-xs" onClick={() => onDetails(cls)}>
            <Info className="mr-1 h-3 w-3" /> View Details
        </Button>
        {actionButton}
      </div>
    </motion.div>
  );
};

export default ClassCard;



