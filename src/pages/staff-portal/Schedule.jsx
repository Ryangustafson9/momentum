
// 🎯 STAFF SCHEDULE PAGE - Modern weekly class schedule for Momentum gym
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Users,
  Filter,
  Plus,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useTrainers,
  useRooms,
  useClassSchedule,
  useScheduleConflicts
} from '@/hooks/useScheduling';
import StaffPageHeader from '@/components/staff/StaffPageHeader';
import StaffPageContainer from '@/components/staff/StaffPageContainer';

// Time slots for the schedule (5 AM to 10 PM)
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 5;
  return {
    hour,
    display: hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`,
    value: `${hour.toString().padStart(2, '0')}:00`
  };
});

// Days of the week
const DAYS_OF_WEEK = [
  { short: 'Mon', full: 'Monday', value: 1 },
  { short: 'Tue', full: 'Tuesday', value: 2 },
  { short: 'Wed', full: 'Wednesday', value: 3 },
  { short: 'Thu', full: 'Thursday', value: 4 },
  { short: 'Fri', full: 'Friday', value: 5 },
  { short: 'Sat', full: 'Saturday', value: 6 },
  { short: 'Sun', full: 'Sunday', value: 0 }
];

// Class type colors
const CLASS_COLORS = {
  'Yoga': { bg: 'bg-purple-500', text: 'text-white', hover: 'hover:bg-purple-600' },
  'Strength': { bg: 'bg-indigo-500', text: 'text-white', hover: 'hover:bg-indigo-600' },
  'HIIT': { bg: 'bg-pink-500', text: 'text-white', hover: 'hover:bg-pink-600' },
  'Cardio': { bg: 'bg-blue-500', text: 'text-white', hover: 'hover:bg-blue-600' },
  'Pilates': { bg: 'bg-purple-400', text: 'text-white', hover: 'hover:bg-purple-500' },
  'CrossFit': { bg: 'bg-red-500', text: 'text-white', hover: 'hover:bg-red-600' },
  'Spin': { bg: 'bg-orange-500', text: 'text-white', hover: 'hover:bg-orange-600' },
  'Boxing': { bg: 'bg-gray-700', text: 'text-white', hover: 'hover:bg-gray-800' },
  'default': { bg: 'bg-gray-500', text: 'text-white', hover: 'hover:bg-gray-600' }
};

// Helper function to get current time line position
const getCurrentTimePosition = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (currentHour < 5 || currentHour > 21) return null;

  const timeSlotIndex = currentHour - 5;
  const minutePercentage = currentMinute / 60;
  return (timeSlotIndex + minutePercentage) * 80; // 80px per hour slot
};

// Helper function to get week dates
const getWeekDates = (currentDate) => {
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  startOfWeek.setDate(diff);

  return DAYS_OF_WEEK.map((_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    return date;
  });
};

// Class Block Component
const ClassBlock = ({ classData, onClick }) => {
  const startTime = new Date(classData.start_time);
  const endTime = new Date(classData.end_time);
  const duration = (endTime - startTime) / (1000 * 60 * 60); // Duration in hours
  const startHour = startTime.getHours() + startTime.getMinutes() / 60;
  const topPosition = (startHour - 5) * 80; // 80px per hour
  const height = duration * 80; // 80px per hour

  const colors = CLASS_COLORS[classData.class_type] || CLASS_COLORS.default;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, zIndex: 10 }}
            className={`absolute left-1 right-1 rounded-lg shadow-md cursor-pointer transition-all duration-200 ${colors.bg} ${colors.text} ${colors.hover}`}
            style={{
              top: `${topPosition}px`,
              height: `${Math.max(height, 40)}px`, // Minimum height of 40px
              zIndex: 5
            }}
            onClick={() => onClick(classData)}
          >
            <div className="p-2 h-full flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-sm leading-tight">{classData.name}</h4>
                <p className="text-xs opacity-90">{classData.instructor_name}</p>
              </div>
              <div className="flex items-center justify-between text-xs opacity-90">
                <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {classData.enrolled || 0}/{classData.capacity || 0}
                </span>
              </div>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <h4 className="font-semibold">{classData.name}</h4>
            <p className="text-sm">Instructor: {classData.instructor_name}</p>
            <p className="text-sm">Room: {classData.room_name}</p>
            <p className="text-sm">Time: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-sm">Capacity: {classData.enrolled || 0}/{classData.capacity || 0}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const SchedulePage = ({ organizationId = 'default-org-id' }) => {
  // State management
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState(null);
  const [filterInstructor, setFilterInstructor] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Data hooks
  const { data: trainers = [], isLoading: trainersLoading } = useTrainers(organizationId);
  const { data: rooms = [], isLoading: roomsLoading } = useRooms(organizationId);
  const { data: schedule = [], isLoading: scheduleLoading } = useClassSchedule(organizationId);

  // Calculate week dates
  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);

  // Filter and organize schedule data
  const filteredSchedule = useMemo(() => {
    return schedule.filter(cls => {
      const classDate = new Date(cls.start_time);
      const isInCurrentWeek = weekDates.some(date =>
        date.toDateString() === classDate.toDateString()
      );

      const matchesInstructor = !filterInstructor ||
        cls.instructor_name?.toLowerCase().includes(filterInstructor.toLowerCase());

      const matchesRoom = !filterRoom ||
        cls.room_name?.toLowerCase().includes(filterRoom.toLowerCase());

      return isInCurrentWeek && matchesInstructor && matchesRoom;
    });
  }, [schedule, weekDates, filterInstructor, filterRoom]);

  // Organize classes by day
  const classesByDay = useMemo(() => {
    const organized = {};
    weekDates.forEach((date, index) => {
      organized[index] = filteredSchedule.filter(cls => {
        const classDate = new Date(cls.start_time);
        return classDate.toDateString() === date.toDateString();
      });
    });
    return organized;
  }, [filteredSchedule, weekDates]);

  // Navigation functions
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  // Handle class click
  const handleClassClick = (classData) => {
    setSelectedClass(classData);
  };

  // Handle responsive design
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isLoading = trainersLoading || roomsLoading || scheduleLoading;
  return (
    <StaffPageContainer>
      <StaffPageHeader
        title="Weekly Schedule"
        subtitle={`${weekDates[0]?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${weekDates[6]?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
        actions={
          <div className="flex items-center space-x-4">
            {/* Week Navigation */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Select value={filterInstructor} onValueChange={setFilterInstructor}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Instructors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Instructors</SelectItem>
                  {trainers.map(trainer => (
                    <SelectItem key={trainer.id} value={trainer.first_name + ' ' + trainer.last_name}>
                      {trainer.first_name} {trainer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterRoom} onValueChange={setFilterRoom}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Rooms</SelectItem>
                  {rooms.map(room => (
                    <SelectItem key={room.id} value={room.name}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Class Button */}
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </div>
        }
      />

      {/* Main Schedule Grid */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading schedule...</p>
            </div>
          </div>
        ) : isMobile ? (
          // Mobile View - Day by Day
          <div className="px-6 py-4 space-y-6">
            {weekDates.map((date, dayIndex) => (
              <Card key={dayIndex} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-indigo-900">
                        {DAYS_OF_WEEK[dayIndex].full}
                      </h3>
                      <p className="text-sm text-indigo-600">
                        {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                      {classesByDay[dayIndex]?.length || 0} classes
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {classesByDay[dayIndex]?.length > 0 ? (
                    <div className="space-y-3">
                      {classesByDay[dayIndex].map(cls => (
                        <div
                          key={cls.id}
                          className="p-3 rounded-lg border border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors"
                          onClick={() => handleClassClick(cls)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{cls.name}</h4>
                              <p className="text-sm text-gray-600">{cls.instructor_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-indigo-600">
                                {new Date(cls.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-xs text-gray-500">{cls.room_name}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No classes scheduled</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (

          // Desktop View - Weekly Grid
          <div className="overflow-auto">
            <div className="min-w-[1000px]">
              {/* Days Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <div className="grid grid-cols-8 gap-0">
                  {/* Time column header */}
                  <div className="p-4 border-r border-gray-200 bg-gray-50">
                    <div className="flex items-center text-sm font-medium text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      Time
                    </div>
                  </div>

                  {/* Day headers */}
                  {DAYS_OF_WEEK.map((day, index) => {
                    const date = weekDates[index];
                    const isToday = date?.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={day.value}
                        className={`p-4 border-r border-gray-200 text-center ${
                          isToday ? 'bg-gradient-to-r from-indigo-50 to-purple-50' : 'bg-gray-50'
                        }`}
                      >
                        <div className={`font-semibold ${isToday ? 'text-indigo-900' : 'text-gray-900'}`}>
                          {day.short}
                        </div>
                        <div className={`text-sm ${isToday ? 'text-indigo-600' : 'text-gray-600'}`}>
                          {date?.getDate()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {classesByDay[index]?.length || 0} classes
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Schedule Grid */}
              <div className="relative">
                {/* Current Time Line */}
                {(() => {
                  const timePosition = getCurrentTimePosition();
                  const isToday = weekDates.some(date =>
                    date?.toDateString() === new Date().toDateString()
                  );

                  return timePosition && isToday ? (
                    <div
                      className="absolute left-0 right-0 z-15 border-t-2 border-red-500"
                      style={{ top: `${timePosition + 60}px` }} // +60 for header height
                    >
                      <div className="absolute -left-2 -top-1 w-4 h-2 bg-red-500 rounded-full"></div>
                    </div>
                  ) : null;
                })()}

                {/* Time slots and classes */}
                <div className="grid grid-cols-8 gap-0">
                  {/* Time column */}
                  <div className="border-r border-gray-200">
                    {TIME_SLOTS.map((timeSlot, index) => (
                      <div
                        key={timeSlot.value}
                        className="h-20 border-b border-gray-100 p-2 text-xs text-gray-600 bg-gray-50"
                      >
                        {timeSlot.display}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {DAYS_OF_WEEK.map((day, dayIndex) => {
                    const isToday = weekDates[dayIndex]?.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={day.value}
                        className={`relative border-r border-gray-200 ${
                          isToday ? 'bg-gradient-to-b from-indigo-50/30 to-purple-50/30' : ''
                        }`}
                      >
                        {/* Time slot grid */}
                        {TIME_SLOTS.map((timeSlot, timeIndex) => (
                          <div
                            key={timeSlot.value}
                            className="h-20 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                          />
                        ))}

                        {/* Classes */}
                        {classesByDay[dayIndex]?.map(cls => (
                          <ClassBlock
                            key={cls.id}
                            classData={cls}
                            onClick={handleClassClick}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Class Details Modal/Sidebar */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedClass.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedClass(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium">Instructor</p>
                    <p className="text-gray-600">{selectedClass.instructor_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-gray-600">{selectedClass.room_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-gray-600">
                      {new Date(selectedClass.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                      {new Date(selectedClass.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium">Capacity</p>
                    <p className="text-gray-600">
                      {selectedClass.enrolled || 0} / {selectedClass.capacity || 0} enrolled
                    </p>
                  </div>
                </div>

                {selectedClass.description && (
                  <div>
                    <p className="font-medium mb-2">Description</p>
                    <p className="text-gray-600 text-sm">{selectedClass.description}</p>
                  </div>
                )}
              </div>              <div className="flex space-x-3 mt-6">
                <Button className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  Edit Class
                </Button>
                <Button variant="outline" className="flex-1">
                  View Attendees
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </StaffPageContainer>
  );
};

export default SchedulePage;



