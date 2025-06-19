
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Users, ListChecks } from 'lucide-react';
import EmptyState from '@/components/EmptyState.jsx';

const InstructorDashboardPage = () => {
  // Placeholder data - replace with actual data fetching logic
  const instructorName = "Jane Doe"; // Example: Fetch logged-in instructor's name
  const upcomingClasses = [
    // { id: 1, name: "Morning Yoga", time: "Today, 9:00 AM", attendees: 15, capacity: 20 },
    // { id: 2, name: "HIIT Blast", time: "Today, 5:00 PM", attendees: 18, capacity: 20 },
    // { id: 3, name: "Pilates Core", time: "Tomorrow, 10:00 AM", attendees: 10, capacity: 15 },
  ];
  const overallScheduleView = true; // Toggle for different views

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Instructor Dashboard {overallScheduleView ? "(Overall View)" : `- ${instructorName}`}
        </h1>
        <p className="text-muted-foreground mt-1">
          {overallScheduleView ? "View all scheduled classes and instructor assignments." : "Manage your upcoming classes and attendance."}
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5 text-primary" />
            Upcoming Classes
          </CardTitle>
          <CardDescription>
            {overallScheduleView ? "Overview of all classes." : "Your classes for today and tomorrow."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingClasses.length > 0 ? (
            <ul className="space-y-4">
              {upcomingClasses.map((cls) => (
                <li key={cls.id} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">{cls.name}</h3>
                    <span className="text-sm text-muted-foreground">{cls.time}</span>
                  </div>
                  {overallScheduleView && <p className="text-sm text-muted-foreground">Instructor: {cls.instructorName || "Not Assigned"}</p>}
                  <div className="flex items-center text-sm mt-2">
                    <Users className="mr-1 h-4 w-4 text-primary" />
                    <span>{cls.attendees} / {cls.capacity} booked</span>
                  </div>
                  {!overallScheduleView && (
                    <div className="mt-3 flex gap-2">
                       <Button size="sm" variant="outline"><ListChecks className="mr-1 h-4 w-4"/> Mark Attendance</Button>
                       <Button size="sm" variant="ghost">View Attendees</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState 
              icon={<CalendarDays className="h-12 w-12 text-muted-foreground" />}
              title="No Upcoming Classes"
              description={overallScheduleView ? "There are no classes scheduled in the near future." : "You have no classes scheduled for today or tomorrow."}
            />
          )}
           <p className="text-center text-muted-foreground mt-6 p-4 border-t">
            Instructor Dashboard is currently under development. More features coming soon!
          </p>
        </CardContent>
      </Card>
      
      {/* Placeholder for overall schedule view if different */}
      {overallScheduleView && (
         <Card className="shadow-lg mt-6">
            <CardHeader>
                <CardTitle>Full Facility Schedule</CardTitle>
                <CardDescription>Grid view of all classes by room and time (Future Implementation)</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-8">Full schedule grid view will be available here.</p>
            </CardContent>
         </Card>
      )}

    </motion.div>
  );
};

export default InstructorDashboardPage;


