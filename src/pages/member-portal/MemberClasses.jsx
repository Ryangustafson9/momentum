
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClassDetailsDialog from '@/components/member/classes/ClassDetailsDialog.jsx';
import MyBookingsTab from '@/components/member/classes/MyBookingsTab.jsx';
import AllClassesTabContent from '@/components/member/classes/AllClassesTabContent.jsx';
import AttendanceHistoryTab from '@/components/member/classes/AttendanceHistoryTab.jsx';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { useMemberClassesData } from '@/hooks/useMemberClassesData.js';

const MemberClassesPage = () => {
  const {
    allClasses,
    memberAttendance,
    isLoading,
    isProcessing,
    handleBookClass,
    handleCancelBooking,
  } = useMemberClassesData();

  const [filteredClasses, setFilteredClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassForDetails, setSelectedClassForDetails] = useState(null);
  
  useEffect(() => {
    let tempClasses = allClasses;
    if (searchTerm) {
      tempClasses = tempClasses.filter(cls =>
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.description && cls.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cls.instructor_name && cls.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredClasses(tempClasses);
  }, [searchTerm, allClasses]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="xl" text="Loading your classes..." /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-4 md:p-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">My Classes</h1>
        <p className="text-muted-foreground mt-1">Browse, book, and manage your fitness classes.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
        <Input
          type="text"
          placeholder="Search classes by name, description, or instructor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full md:w-2/3 lg:w-1/2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
        />
      </div>

      <Tabs defaultValue="all-classes" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <TabsTrigger value="all-classes" className="data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:shadow-sm">All Classes</TabsTrigger>
          <TabsTrigger value="my-bookings" className="data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:shadow-sm">My Bookings</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:shadow-sm">Attendance History</TabsTrigger>
        </TabsList>
        <TabsContent value="all-classes">
          <AllClassesTabContent 
            filteredClasses={filteredClasses} 
            memberAttendance={memberAttendance}
            onBook={handleBookClass}
            onCancel={handleCancelBooking}
            onDetails={setSelectedClassForDetails}
            searchTerm={searchTerm}
            isBookingOrCancelling={isProcessing}
          />
        </TabsContent>
        <TabsContent value="my-bookings">
          <MyBookingsTab 
            memberAttendance={memberAttendance} 
            allClasses={allClasses} 
            onCancel={handleCancelBooking}
            onDetails={setSelectedClassForDetails}
            isCancelling={isProcessing}
          />
        </TabsContent>
        <TabsContent value="history">
          <AttendanceHistoryTab 
            memberAttendance={memberAttendance} 
            allClasses={allClasses} 
          />
        </TabsContent>
      </Tabs>

      <ClassDetailsDialog 
        classDetails={selectedClassForDetails} 
        isOpen={!!selectedClassForDetails} 
        onClose={() => setSelectedClassForDetails(null)} 
      />
    </motion.div>
  );
};

export default MemberClassesPage;



