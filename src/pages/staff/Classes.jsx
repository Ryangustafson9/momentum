import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Search, ChevronDown, Calendar, Users, Clock, Filter, ListFilter, Eye, EyeOff, Briefcase, CheckSquare, XSquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast.js';
import { getClasses, getMembershipTypes, getInstructors, dataService } from '@/services/dataService';
import { useDebounce } from '@/hooks/useDebounce.js';
import {
  useTrainers,
  useRooms,
  useCheckAvailability,
  useCreateClassWithResources
} from '@/hooks/useScheduling';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import EmptyState from '@/components/EmptyState.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Checkbox } from '@/components/ui/checkbox';


const initialClassData = {
  id: null,
  name: '',
  description: '',
  instructor_id: '',
  trainer_id: '',
  room_id: '',
  start_time: '',
  end_time: '',
  max_capacity: '',
  location: '',
  difficulty: 'Intermediate',
  recurring_rule: '',
};

const ClassFormDialog = ({ isOpen, onClose, onSave, classData, instructors }) => {
  const [formData, setFormData] = useState(initialClassData);
  const [isLoading, setIsLoading] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState({
    trainer: null,
    room: null,
    checking: false
  });
  const { toast } = useToast();

  // Fetch trainers and rooms for resource assignment
  const { data: trainers = [] } = useTrainers();
  const { data: rooms = [] } = useRooms();
  const checkAvailabilityMutation = useCheckAvailability();
  const createWithResourcesMutation = useCreateClassWithResources();

  useEffect(() => {
    if (classData) {
      setFormData({
        ...classData,
        start_time: classData.start_time ? format(parseISO(classData.start_time), "yyyy-MM-dd'T'HH:mm") : '',
        end_time: classData.end_time ? format(parseISO(classData.end_time), "yyyy-MM-dd'T'HH:mm") : '',
        instructor_id: classData.instructor_id || '',
        trainer_id: classData.trainer_id || '',
        room_id: classData.room_id || '',
        max_capacity: classData.max_capacity !== null ? String(classData.max_capacity) : '',
      });
    } else {
      setFormData(initialClassData);
    }
  }, [classData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Check availability when trainer, room, or time changes
    if (['trainer_id', 'room_id'].includes(name)) {
      checkResourceAvailability({ ...formData, [name]: value });
    }
  };

  // Check resource availability
  const checkResourceAvailability = async (data) => {
    if (!data.start_time || !data.end_time) return;

    setAvailabilityStatus(prev => ({ ...prev, checking: true }));

    try {
      const promises = [];

      // Check trainer availability
      if (data.trainer_id) {
        promises.push(
          checkAvailabilityMutation.mutateAsync({
            type: 'trainer',
            resourceId: data.trainer_id,
            startTime: data.start_time,
            endTime: data.end_time,
            excludeId: data.id
          }).then(available => ({ type: 'trainer', available }))
        );
      }

      // Check room availability
      if (data.room_id) {
        promises.push(
          checkAvailabilityMutation.mutateAsync({
            type: 'room',
            resourceId: data.room_id,
            startTime: data.start_time,
            endTime: data.end_time,
            excludeId: data.id
          }).then(available => ({ type: 'room', available }))
        );
      }

      const results = await Promise.all(promises);

      const newStatus = { checking: false, trainer: null, room: null };
      results.forEach(result => {
        newStatus[result.type] = result.available;
      });

      setAvailabilityStatus(newStatus);

    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityStatus(prev => ({ ...prev, checking: false }));
    }
  };

  const handleDateChange = (name, date) => {
    const existingTime = formData[name] ? formData[name].split('T')[1] : '00:00';
    const newDateTime = `${format(date, 'yyyy-MM-dd')}T${existingTime}`;
    setFormData(prev => ({ ...prev, [name]: newDateTime }));
  };

  const handleTimeChange = (name, time) => {
    const existingDate = formData[name] ? formData[name].split('T')[0] : format(new Date(), 'yyyy-MM-dd');
    const newDateTime = `${existingDate}T${time}`;
    setFormData(prev => ({ ...prev, [name]: newDateTime }));

    // Check availability when time changes
    checkResourceAvailability({ ...formData, [name]: newDateTime });
  };


  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const submissionData = {
        ...formData,
        max_capacity: parseInt(formData.max_capacity, 10) || 0,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };

      if (new Date(submissionData.end_time) <= new Date(submissionData.start_time)) {
        toast({ title: "Validation Error", description: "End time must be after start time.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Check for conflicts before saving
      if ((formData.trainer_id && availabilityStatus.trainer === false) ||
          (formData.room_id && availabilityStatus.room === false)) {
        toast({
          title: "Scheduling Conflict",
          description: "There are resource conflicts. Please resolve them before saving.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Use enhanced class creation if trainer or room is assigned
      if (formData.trainer_id || formData.room_id) {
        const classData = {
          name: submissionData.name,
          description: submissionData.description,
          trainerId: submissionData.trainer_id || null,
          roomId: submissionData.room_id || null,
          startTime: submissionData.start_time,
          endTime: submissionData.end_time,
          capacity: submissionData.max_capacity,
          difficulty: submissionData.difficulty,
          category: 'fitness', // Default category
          setupTime: 15, // Default setup time
          cleanupTime: 15, // Default cleanup time
          createdBy: 'staff-user' // This should come from auth context
        };

        if (formData.id) {
          // For updates, use the traditional method for now
          await onSave(submissionData);
        } else {
          // For new classes with resources, use enhanced creation
          await createWithResourcesMutation.mutateAsync({
            organizationId: 'default-org-id',
            classData
          });
        }
      } else {
        // Use traditional class creation for classes without resource assignment
        await onSave(submissionData);
      }

      toast({ title: "Success", description: `Class ${formData.id ? 'updated' : 'created'} successfully.` });
      onClose();
    } catch (error) {
      toast({ title: "Error", description: `Failed to ${formData.id ? 'update' : 'create'} class. ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-white dark:bg-slate-900 shadow-2xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formData.id ? 'Edit Class' : 'Create New Class'}</DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Fill in the details for the class. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6 max-h-[70vh] overflow-y-auto px-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Class Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Morning Yoga" className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructor_id" className="text-slate-700 dark:text-slate-300">Instructor</Label>
              <Select name="instructor_id" value={formData.instructor_id} onValueChange={(value) => handleSelectChange('instructor_id', value)}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                  <SelectValue placeholder="Select Instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map(instructor => (
                    <SelectItem key={instructor.id} value={instructor.id}>{instructor.name || `${instructor.first_name} ${instructor.last_name}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Enhanced Resource Assignment Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trainer_id" className="text-slate-700 dark:text-slate-300 flex items-center">
                Assigned Trainer
                {availabilityStatus.checking && (
                  <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
                {availabilityStatus.trainer === false && (
                  <Badge variant="destructive" className="ml-2 text-xs">Conflict</Badge>
                )}
                {availabilityStatus.trainer === true && (
                  <Badge className="ml-2 text-xs bg-green-100 text-green-800">Available</Badge>
                )}
              </Label>
              <Select name="trainer_id" value={formData.trainer_id} onValueChange={(value) => handleSelectChange('trainer_id', value)}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                  <SelectValue placeholder="Select Trainer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No trainer assigned</SelectItem>
                  {trainers.filter(t => t.is_active).map(trainer => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.first_name} {trainer.last_name}
                      {trainer.specialties && trainer.specialties.length > 0 && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({trainer.specialties.slice(0, 2).join(', ')})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room_id" className="text-slate-700 dark:text-slate-300 flex items-center">
                Assigned Room
                {availabilityStatus.checking && (
                  <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
                {availabilityStatus.room === false && (
                  <Badge variant="destructive" className="ml-2 text-xs">Conflict</Badge>
                )}
                {availabilityStatus.room === true && (
                  <Badge className="ml-2 text-xs bg-green-100 text-green-800">Available</Badge>
                )}
              </Label>
              <Select name="room_id" value={formData.room_id} onValueChange={(value) => handleSelectChange('room_id', value)}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                  <SelectValue placeholder="Select Room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No room assigned</SelectItem>
                  {rooms.filter(r => r.is_active && r.is_bookable).map(room => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                      <span className="text-xs text-gray-500 ml-2">
                        (Capacity: {room.capacity}, {room.room_type})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">Description</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Briefly describe the class" className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time_date" className="text-slate-700 dark:text-slate-300">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.start_time ? format(parseISO(formData.start_time.split('T')[0]), 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.start_time ? parseISO(formData.start_time.split('T')[0]) : undefined}
                    onSelect={(date) => handleDateChange('start_time', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time_time" className="text-slate-700 dark:text-slate-300">Start Time</Label>
              <Input 
                id="start_time_time" 
                type="time" 
                value={formData.start_time ? formData.start_time.split('T')[1] : ''} 
                onChange={(e) => handleTimeChange('start_time', e.target.value)} 
                className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end_time_date" className="text-slate-700 dark:text-slate-300">End Date</Label>
               <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.end_time ? format(parseISO(formData.end_time.split('T')[0]), 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.end_time ? parseISO(formData.end_time.split('T')[0]) : undefined}
                    onSelect={(date) => handleDateChange('end_time', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time_time" className="text-slate-700 dark:text-slate-300">End Time</Label>
              <Input 
                id="end_time_time" 
                type="time" 
                value={formData.end_time ? formData.end_time.split('T')[1] : ''} 
                onChange={(e) => handleTimeChange('end_time', e.target.value)} 
                className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Conflict Warning */}
          {((formData.trainer_id && availabilityStatus.trainer === false) ||
            (formData.room_id && availabilityStatus.room === false)) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-800">Scheduling Conflicts Detected</h4>
              </div>
              <div className="mt-2 text-sm text-red-700">
                {formData.trainer_id && availabilityStatus.trainer === false && (
                  <div>• The selected trainer is not available at this time</div>
                )}
                {formData.room_id && availabilityStatus.room === false && (
                  <div>• The selected room is not available at this time</div>
                )}
                <div className="mt-2 font-medium">Please select different resources or change the class time.</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_capacity" className="text-slate-700 dark:text-slate-300">Max Capacity</Label>
              <Input id="max_capacity" name="max_capacity" type="number" value={formData.max_capacity} onChange={handleChange} placeholder="e.g., 20" className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-slate-700 dark:text-slate-300">Location</Label>
              <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Studio A" className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-slate-700 dark:text-slate-300">Difficulty</Label>
              <Select name="difficulty" value={formData.difficulty} onValueChange={(value) => handleSelectChange('difficulty', value)}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                  <SelectValue placeholder="Select Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="All Levels">All Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring_rule" className="text-slate-700 dark:text-slate-300">Recurring Rule (Optional)</Label>
              <Input id="recurring_rule" name="recurring_rule" value={formData.recurring_rule} onChange={handleChange} placeholder="e.g., RRULE:FREQ=WEEKLY;BYDAY=MO" className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700" />
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-4 px-6">
          <Button variant="ghost" onClick={onClose} className="text-slate-700 dark:text-slate-300">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading} variant="action">
            {isLoading ? 'Saving...' : 'Save Class'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DeleteConfirmationDialog = ({ isOpen, onClose, onConfirm, className }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 shadow-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100">Confirm Deletion</DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete the class "<strong>{className}</strong>"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose} className="text-slate-700 dark:text-slate-300">Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete Class</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const initialColumnVisibility = {
  name: true,
  instructor_name: true,
  start_time: true,
  end_time: true,
  booked_vs_capacity: true,
  difficulty: false,
  location: true,
  recurring_rule: false,
  actions: true,
};

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const saved = localStorage.getItem('classesColumnVisibility');
    return saved ? JSON.parse(saved) : initialColumnVisibility;
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { toast } = useToast();

  const fetchClassesAndInstructors = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classesData, instructorsData] = await Promise.all([
        getClasses(),
        getInstructors() 
      ]);
      setClasses(classesData);
      setInstructors(instructorsData.filter(instructor => instructor.role === 'staff')); 
    } catch (error) {
      toast({ title: "Error", description: `Failed to fetch data: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClassesAndInstructors();
  }, [fetchClassesAndInstructors]);

  useEffect(() => {
    localStorage.setItem('classesColumnVisibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const handleCreateNew = () => {
    setSelectedClass(null);
    setIsFormOpen(true);
  };

  const handleEdit = (cls) => {
    setSelectedClass(cls);
    setIsFormOpen(true);
  };

  const handleDelete = (cls) => {
    setClassToDelete(cls);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;
    try {
      await dataService.deleteClass(classToDelete.id);
      toast({ title: "Success", description: `Class "${classToDelete.name}" deleted successfully.` });
      fetchClassesAndInstructors(); 
    } catch (error) {
      toast({ title: "Error", description: `Failed to delete class: ${error.message}`, variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setClassToDelete(null);
    }
  };

  const handleSaveClass = async (classData) => {
    try {
      if (classData.id) {
        await dataService.updateClass(classData.id, classData);
      } else {
        await dataService.addClass(classData);
      }
      fetchClassesAndInstructors();
    } catch (error) {
      // Error handling is done in the ClassFormDialog
      throw error;
    }
  };

  const filteredClasses = classes
    .filter(cls => 
      cls.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (cls.instructor_name && cls.instructor_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    )
    .filter(cls => filterDifficulty === 'all' || cls.difficulty === filterDifficulty);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 px-4 md:px-6"
    >
      <Card className="bg-white dark:bg-slate-900/80 backdrop-blur-sm shadow-xl border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Manage Classes</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">
                Oversee all fitness classes, create new ones, and manage schedules.
              </CardDescription>
            </div>
            <Button onClick={handleCreateNew} variant="action" className="mt-4 md:mt-0">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Class
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:max-w-sm">
              <Input
                type="text"
                placeholder="Search classes or instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="w-full md:w-[180px] bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                  <ListFilter className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                  <SelectValue placeholder="Filter by difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="All Levels">All Levels</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                    <Eye className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" /> Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(initialColumnVisibility).map(([key, value]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      className="capitalize"
                      checked={columnVisibility[key]}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev) => ({ ...prev, [key]: checked }))
                      }
                    >
                      {key.replace(/_/g, ' ')}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isLoading && <LoadingSpinner />}
          {!isLoading && filteredClasses.length === 0 && (
            <EmptyState 
              icon={<Calendar className="h-16 w-16 text-slate-400 dark:text-slate-500" />}
              title="No Classes Found" 
              description={searchTerm || filterDifficulty !== 'all' ? "No classes match your current search or filter. Try adjusting your criteria." : "There are no classes scheduled yet. Create one to get started!"}
              actionButton={
                <Button onClick={handleCreateNew} variant="action">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create First Class
                </Button>
              }
            />
          )}
          {!isLoading && filteredClasses.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow>
                    {columnVisibility.name && <TableHead className="whitespace-nowrap">Class Name</TableHead>}
                    {columnVisibility.instructor_name && <TableHead className="whitespace-nowrap">Instructor</TableHead>}
                    {columnVisibility.start_time && <TableHead className="whitespace-nowrap">Start Time</TableHead>}
                    {columnVisibility.end_time && <TableHead className="whitespace-nowrap">End Time</TableHead>}
                    {columnVisibility.booked_vs_capacity && <TableHead className="text-center whitespace-nowrap">Booked/Capacity</TableHead>}
                    {columnVisibility.difficulty && <TableHead className="whitespace-nowrap">Difficulty</TableHead>}
                    {columnVisibility.location && <TableHead className="whitespace-nowrap">Location</TableHead>}
                    {columnVisibility.recurring_rule && <TableHead className="whitespace-nowrap">Recurring</TableHead>}
                    {columnVisibility.actions && <TableHead className="text-right whitespace-nowrap">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.map((cls) => (
                    <TableRow key={cls.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      {columnVisibility.name && <TableCell className="font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{cls.name}</TableCell>}
                      {columnVisibility.instructor_name && <TableCell className="text-slate-600 dark:text-slate-400 whitespace-nowrap">{cls.instructor_name || 'N/A'}</TableCell>}
                      {columnVisibility.start_time && <TableCell className="text-slate-600 dark:text-slate-400 whitespace-nowrap">{format(parseISO(cls.start_time), 'MMM d, yyyy - h:mm a')}</TableCell>}
                      {columnVisibility.end_time && <TableCell className="text-slate-600 dark:text-slate-400 whitespace-nowrap">{format(parseISO(cls.end_time), 'MMM d, yyyy - h:mm a')}</TableCell>}
                      {columnVisibility.booked_vs_capacity && (
                        <TableCell className="text-center text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          <Users className="inline-block h-4 w-4 mr-1 text-blue-500" />
                          {cls.booked_count || 0} / {cls.max_capacity}
                        </TableCell>
                      )}
                      {columnVisibility.difficulty && <TableCell className="text-slate-600 dark:text-slate-400 whitespace-nowrap">{cls.difficulty}</TableCell>}
                      {columnVisibility.location && <TableCell className="text-slate-600 dark:text-slate-400 whitespace-nowrap">{cls.location}</TableCell>}
                      {columnVisibility.recurring_rule && <TableCell className="text-slate-600 dark:text-slate-400 whitespace-nowrap">{cls.recurring_rule ? 'Yes' : 'No'}</TableCell>}
                      {columnVisibility.actions && (
                        <TableCell className="text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(cls)} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(cls)} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ClassFormDialog 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSaveClass} 
        classData={selectedClass}
        instructors={instructors}
      />
      {classToDelete && (
        <DeleteConfirmationDialog 
          isOpen={isDeleteDialogOpen} 
          onClose={() => setIsDeleteDialogOpen(false)} 
          onConfirm={confirmDelete}
          className={classToDelete?.name}
        />
      )}
    </motion.div>
  );
};

export default Classes;


