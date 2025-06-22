// 🚀 CLASS BOOKING & SCHEDULING SYSTEM - Competitive parity feature
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  UserPlus,
  UserMinus,
  MapPin,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

// Mock data for classes - in production this would come from React Query hooks
const mockClasses = [
  {
    id: 1,
    name: "Morning Yoga",
    instructor: "Sarah Johnson",
    instructorImage: null,
    startTime: "2024-01-15T09:00:00",
    endTime: "2024-01-15T10:00:00",
    capacity: 20,
    enrolled: 15,
    waitlist: 3,
    location: "Studio A",
    description: "Start your day with energizing yoga flow",
    difficulty: "Beginner",
    category: "Yoga",
    price: 25,
    status: "active"
  },
  {
    id: 2,
    name: "HIIT Training",
    instructor: "Mike Chen",
    instructorImage: null,
    startTime: "2024-01-15T18:00:00",
    endTime: "2024-01-15T19:00:00",
    capacity: 15,
    enrolled: 15,
    waitlist: 5,
    location: "Gym Floor",
    description: "High-intensity interval training for maximum results",
    difficulty: "Advanced",
    category: "Fitness",
    price: 30,
    status: "full"
  },
  {
    id: 3,
    name: "Pilates Core",
    instructor: "Emma Davis",
    instructorImage: null,
    startTime: "2024-01-15T12:00:00",
    endTime: "2024-01-15T13:00:00",
    capacity: 12,
    enrolled: 8,
    waitlist: 0,
    location: "Studio B",
    description: "Strengthen your core with focused pilates movements",
    difficulty: "Intermediate",
    category: "Pilates",
    price: 28,
    status: "active"
  }
];

// Class Card Component
const ClassCard = ({ classData, onBook, onCancel, onJoinWaitlist, userBookingStatus, isStaff }) => {
  const { toast } = useToast();
  
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    if (classData.enrolled >= classData.capacity) {
      return <Badge className="bg-red-100 text-red-800">Full</Badge>;
    } else if (classData.enrolled >= classData.capacity * 0.8) {
      return <Badge className="bg-yellow-100 text-yellow-800">Almost Full</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Available</Badge>;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBooking = () => {
    if (userBookingStatus === 'booked') {
      onCancel(classData.id);
    } else if (classData.enrolled >= classData.capacity) {
      onJoinWaitlist(classData.id);
    } else {
      onBook(classData.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {classData.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {formatTime(classData.startTime)} - {formatTime(classData.endTime)}
                </span>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Instructor */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={classData.instructorImage} />
              <AvatarFallback>
                {classData.instructor.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900">{classData.instructor}</p>
              <p className="text-xs text-gray-500">Instructor</p>
            </div>
          </div>

          {/* Class Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{classData.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                {classData.enrolled}/{classData.capacity} enrolled
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2">
            {classData.description}
          </p>

          {/* Tags */}
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getDifficultyColor(classData.difficulty)}>
              {classData.difficulty}
            </Badge>
            <Badge variant="outline">{classData.category}</Badge>
            <Badge variant="outline">${classData.price}</Badge>
          </div>

          {/* Waitlist Info */}
          {classData.waitlist > 0 && (
            <div className="flex items-center space-x-2 text-sm text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span>{classData.waitlist} on waitlist</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              {userBookingStatus === 'booked' && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Booked
                </Badge>
              )}
              {userBookingStatus === 'waitlisted' && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Waitlisted
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {isStaff && (
                <>
                  <Button variant="ghost" size="sm">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              
              <Button
                onClick={handleBooking}
                variant={userBookingStatus === 'booked' ? 'outline' : 'default'}
                size="sm"
                disabled={userBookingStatus === 'waitlisted'}
              >
                {userBookingStatus === 'booked' ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-1" />
                    Cancel
                  </>
                ) : classData.enrolled >= classData.capacity ? (
                  <>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Join Waitlist
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Book Class
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Add/Edit Class Dialog
const ClassDialog = ({ isOpen, onClose, classData, onSave }) => {
  const [formData, setFormData] = useState({
    name: classData?.name || '',
    instructor: classData?.instructor || '',
    startTime: classData?.startTime || '',
    endTime: classData?.endTime || '',
    capacity: classData?.capacity || 20,
    location: classData?.location || '',
    description: classData?.description || '',
    difficulty: classData?.difficulty || 'Beginner',
    category: classData?.category || '',
    price: classData?.price || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {classData ? 'Edit Class' : 'Add New Class'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Class Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="instructor">Instructor</Label>
            <Input
              id="instructor"
              value={formData.instructor}
              onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {classData ? 'Update Class' : 'Create Class'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main Class Booking System
const ClassBookingSystem = () => {
  const { toast } = useToast();
  const { user, isStaff } = useUnifiedAuth();
  const [classes, setClasses] = useState(mockClasses);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  // Mock user bookings - in production this would come from React Query
  const userBookings = {
    1: 'booked',
    2: 'waitlisted'
  };

  const handleBookClass = (classId) => {
    toast({
      title: "Class Booked",
      description: "You have successfully booked this class!",
    });
  };

  const handleCancelBooking = (classId) => {
    toast({
      title: "Booking Cancelled",
      description: "Your booking has been cancelled.",
    });
  };

  const handleJoinWaitlist = (classId) => {
    toast({
      title: "Added to Waitlist",
      description: "You've been added to the waitlist. We'll notify you if a spot opens up!",
    });
  };

  const handleSaveClass = (classData) => {
    if (editingClass) {
      setClasses(prev => prev.map(c => c.id === editingClass.id ? { ...c, ...classData } : c));
      toast({
        title: "Class Updated",
        description: "Class has been successfully updated.",
      });
    } else {
      const newClass = {
        ...classData,
        id: Date.now(),
        enrolled: 0,
        waitlist: 0,
        status: 'active'
      };
      setClasses(prev => [...prev, newClass]);
      toast({
        title: "Class Created",
        description: "New class has been successfully created.",
      });
    }
    setEditingClass(null);
  };

  const filteredClasses = classes.filter(classItem => {
    const classDate = new Date(classItem.startTime).toISOString().split('T')[0];
    return classDate === selectedDate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Schedule</h2>
          <p className="text-gray-600">Book classes and manage your fitness schedule</p>
        </div>
        
        {isStaff && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Class
          </Button>
        )}
      </div>

      {/* Date Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <Label htmlFor="date">Select Date:</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <Badge variant="outline">
              {filteredClasses.length} classes available
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredClasses.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classData={classItem}
              onBook={handleBookClass}
              onCancel={handleCancelBooking}
              onJoinWaitlist={handleJoinWaitlist}
              userBookingStatus={userBookings[classItem.id]}
              isStaff={isStaff}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Scheduled</h3>
          <p className="text-gray-500">No classes are scheduled for this date.</p>
          {isStaff && (
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Class
            </Button>
          )}
        </div>
      )}

      {/* Add/Edit Class Dialog */}
      <ClassDialog
        isOpen={showAddDialog || !!editingClass}
        onClose={() => {
          setShowAddDialog(false);
          setEditingClass(null);
        }}
        classData={editingClass}
        onSave={handleSaveClass}
      />
    </div>
  );
};

export default ClassBookingSystem;

