
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, CalendarDays, Users, Search, Filter, Eye, Download, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar'; 
import { format } from 'date-fns';

const initialAttendanceRecords = [
  { id: 1, memberName: 'Alice Wonderland', memberId: 1, className: 'Morning Yoga', classId: 1, date: '2025-05-10', status: 'Present' },
  { id: 2, memberName: 'Bob The Builder', memberId: 2, className: 'HIIT Blast', classId: 2, date: '2025-05-10', status: 'Present' },
  { id: 3, memberName: 'Charlie Brown', memberId: 3, className: 'Morning Yoga', classId: 1, date: '2025-05-10', status: 'Absent' },
  { id: 4, memberName: 'Alice Wonderland', memberId: 1, className: 'Strength Training', classId: 3, date: '2025-05-12', status: 'Present' },
  { id: 5, memberName: 'Diana Prince', memberId: 4, className: 'Zumba Dance', classId: 4, date: '2025-05-12', status: 'Present' },
];

const AttendanceFilterBar = ({ 
  searchTerm, setSearchTerm, 
  selectedClass, setSelectedClass, classes,
  selectedDate, setSelectedDate, 
  selectedStatus, setSelectedStatus,
  clearFilters
}) => {
  return (
    <Card className="shadow-md">
      <CardContent className="p-4 space-y-4 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-4">
        <div className="relative flex-grow min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by member name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="min-w-[180px] h-10 text-sm">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(cls => (
              <SelectItem key={cls.value} value={cls.value}>{cls.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={`min-w-[180px] h-10 text-sm justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {setSelectedDate(date);}}
              initialFocus
            />
          </PopoverContent>
        </Popover>
         <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="min-w-[150px] h-10 text-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Present">Present</SelectItem>
            <SelectItem value="Absent">Absent</SelectItem>
            <SelectItem value="Late">Late</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" onClick={clearFilters} className="h-10 text-sm">
          <Filter className="mr-2 h-4 w-4" /> Clear Filters
        </Button>
      </CardContent>
    </Card>
  );
};

const ManualAttendanceEntryForm = ({ 
  members, classes, 
  manualEntryData, handleManualEntryChange, handleManualEntrySubmit,
  setIsOpen // To close the form from parent
}) => {
  return (
    <form onSubmit={handleManualEntrySubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="space-y-1">
            <Label htmlFor="manualMember">Member</Label>
            <Select name="memberId" value={manualEntryData.memberId} onValueChange={(value) => handleManualEntryChange('memberId', value)}>
                <SelectTrigger id="manualMember"><SelectValue placeholder="Select Member" /></SelectTrigger>
                <SelectContent>{members.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
        </div>
        <div className="space-y-1">
            <Label htmlFor="manualClass">Class</Label>
              <Select name="classId" value={manualEntryData.classId} onValueChange={(value) => handleManualEntryChange('classId', value)}>
                <SelectTrigger id="manualClass"><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
        </div>
        <div className="space-y-1">
            <Label htmlFor="manualDate">Date</Label>
            <Input id="manualDate" type="date" name="date" value={manualEntryData.date} onChange={(e) => handleManualEntryChange('date', e.target.value)} />
        </div>
          <div className="space-y-1">
            <Label htmlFor="manualStatus">Status</Label>
              <Select name="status" value={manualEntryData.status} onValueChange={(value) => handleManualEntryChange('status', value)}>
                <SelectTrigger id="manualStatus"><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Record</Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="w-full">Cancel</Button>
        </div>
    </form>
  );
};

const ManualAttendanceCard = ({ isOpen, setIsOpen, children }) => {
  if (!isOpen) return null;
  return (
    <Card className="shadow-md">
      <CardHeader>
          <CardTitle>Manual Attendance Entry</CardTitle>
          <CardDescription>Add a new attendance record manually.</CardDescription>
      </CardHeader>
      <CardContent>
          {children}
      </CardContent>
    </Card>
  );
};


const AttendanceRow = ({ record, handleStatusChange }) => (
    <motion.tr 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <td className="px-4 py-3 text-sm text-gray-700">{record.memberName}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{record.className}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{new Date(record.date).toLocaleDateString()}</td>
      <td className="px-4 py-3">
        <Select value={record.status} onValueChange={(newStatus) => handleStatusChange(record.id, newStatus)}>
          <SelectTrigger className={`w-[120px] h-9 text-xs ${record.status === 'Present' ? 'bg-green-100 border-green-300 text-green-700' : record.status === 'Absent' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-yellow-100 border-yellow-300 text-yellow-700'}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Present" className="text-green-700">Present</SelectItem>
            <SelectItem value="Absent" className="text-red-700">Absent</SelectItem>
            <SelectItem value="Late" className="text-yellow-700">Late</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 text-center">
        <Button variant="ghost" size="icon" className="hover:bg-gray-200">
          <Eye className="h-4 w-4 text-gray-600" />
        </Button>
      </td>
    </motion.tr>
  );

const AttendanceTableDisplay = ({ records, handleStatusChange }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.length > 0 ? (
            records.map((record) => <AttendanceRow key={record.id} record={record} handleStatusChange={handleStatusChange} />)
          ) : (
            <tr>
              <td colSpan="5" className="px-4 py-10 text-center text-sm text-gray-500">
                <Users className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                No attendance records found for the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};


const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualEntryData, setManualEntryData] = useState({ memberId: '', classId: '', date: format(new Date(), 'yyyy-MM-dd'), status: 'Present' });

  useEffect(() => {
    const storedAttendance = JSON.parse(localStorage.getItem('attendance'));
    if (storedAttendance) {
      setAttendanceRecords(storedAttendance);
    } else {
      setAttendanceRecords(initialAttendanceRecords);
      localStorage.setItem('attendance', JSON.stringify(initialAttendanceRecords));
    }

    const storedClasses = JSON.parse(localStorage.getItem('classes')) || [];
    setClasses(storedClasses.map(c => ({ value: c.id.toString(), label: c.name })));

    const storedMembers = JSON.parse(localStorage.getItem('members')) || [];
    setMembers(storedMembers.map(m => ({ value: m.id.toString(), label: m.name })));
  }, []);

  useEffect(() => {
    let tempRecords = attendanceRecords;
    if (searchTerm) {
      tempRecords = tempRecords.filter(record =>
        record.memberName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedClass !== 'all') {
      tempRecords = tempRecords.filter(record => record.classId.toString() === selectedClass);
    }
    if (selectedDate) {
      tempRecords = tempRecords.filter(record => record.date === format(selectedDate, 'yyyy-MM-dd'));
    }
    if (selectedStatus !== 'all') {
      tempRecords = tempRecords.filter(record => record.status === selectedStatus);
    }
    setFilteredRecords(tempRecords);
  }, [searchTerm, selectedClass, selectedDate, selectedStatus, attendanceRecords]);


  const handleStatusChange = (recordId, newStatus) => {
    const updatedRecords = attendanceRecords.map(record =>
      record.id === recordId ? { ...record, status: newStatus } : record
    );
    setAttendanceRecords(updatedRecords);
    localStorage.setItem('attendance', JSON.stringify(updatedRecords));
    toast({ title: 'Attendance Updated', description: `Status for ${updatedRecords.find(r=>r.id === recordId)?.memberName} changed to ${newStatus}.` });
  };
  
  const handleManualEntryChange = (name, value) => {
    setManualEntryData(prev => ({ ...prev, [name]: value }));
  };

  const handleManualEntrySubmit = (e) => {
    e.preventDefault();
    if (!manualEntryData.memberId || !manualEntryData.classId || !manualEntryData.date || !manualEntryData.status) {
        toast({ title: 'Missing Information', description: 'Please fill all fields for manual entry.', variant: 'destructive' });
        return;
    }
    const member = members.find(m => m.value === manualEntryData.memberId);
    const classInfo = classes.find(c => c.value === manualEntryData.classId);

    const newRecord = {
        id: Date.now(),
        memberName: member ? member.label : 'Unknown Member',
        memberId: parseInt(manualEntryData.memberId),
        className: classInfo ? classInfo.label : 'Unknown Class',
        classId: parseInt(manualEntryData.classId),
        date: manualEntryData.date,
        status: manualEntryData.status,
    };
    const updatedRecords = [...attendanceRecords, newRecord];
    setAttendanceRecords(updatedRecords);
    localStorage.setItem('attendance', JSON.stringify(updatedRecords));
    toast({ title: 'Attendance Recorded', description: `Attendance for ${newRecord.memberName} in ${newRecord.className} recorded.` });
    setIsManualEntryOpen(false);
    setManualEntryData({ memberId: '', classId: '', date: format(new Date(), 'yyyy-MM-dd'), status: 'Present' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedClass('all');
    setSelectedDate(null);
    setSelectedStatus('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance Tracking</h1>
            <p className="text-muted-foreground">Monitor and manage class attendance.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsManualEntryOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Manual Entry
            </Button>
            <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
        </div>
      </div>

      <AttendanceFilterBar 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        selectedClass={selectedClass} setSelectedClass={setSelectedClass} classes={classes}
        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
        selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
        clearFilters={clearFilters}
      />
      
      <ManualAttendanceCard isOpen={isManualEntryOpen} setIsOpen={setIsManualEntryOpen}>
        <ManualAttendanceEntryForm
            members={members} classes={classes}
            manualEntryData={manualEntryData} 
            handleManualEntryChange={handleManualEntryChange} 
            handleManualEntrySubmit={handleManualEntrySubmit}
            setIsOpen={setIsManualEntryOpen}
        />
      </ManualAttendanceCard>

      <AttendanceTableDisplay records={filteredRecords} handleStatusChange={handleStatusChange} />
      
       {filteredRecords.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredRecords.length} of {attendanceRecords.length} records.
        </p>
      )}
    </div>
  );
};

export default Attendance;


