
import React from 'react';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';

const AttendanceHistoryTab = ({ memberAttendance, allClasses }) => {
  const history = memberAttendance
      .filter(att => att.status !== 'Booked' && att.status !== 'Cancelled') 
      .sort((a,b) => new Date(b.date) - new Date(a.date)); 

  if (history.length === 0) {
    return <div className="text-center py-10 text-muted-foreground"><Check className="mx-auto h-10 w-10 mb-2" />No attendance history yet.</div>;
  }
  return (
      <div className="space-y-3 pt-4">
          {history.map(att => {
              const classDetails = allClasses.find(c => c.id === att.classId);
              return (
                  <Card key={att.id} className="p-4 flex justify-between items-center shadow-sm">
                      <div>
                          <p className="font-semibold">{att.className}</p>
                          <p className="text-sm text-muted-foreground">
                              {new Date(att.date).toLocaleDateString()} - Trainer: {classDetails?.trainer || 'N/A'}
                          </p>
                      </div>
                      <span className={`text-sm font-medium px-3 py-1 rounded-full
                          ${att.status === 'Present' ? 'bg-green-100 text-green-700' :
                            att.status === 'Absent' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'}`}>
                          {att.status}
                      </span>
                  </Card>
              );
          })}
      </div>
  );
};

export default AttendanceHistoryTab;



