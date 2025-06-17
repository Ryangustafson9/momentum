/**
 * 🏋️ PERSONAL TRAINING BOOKING COMPONENT
 * Book personal training sessions with trainers
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Clock,
  User,
  Star,
  MapPin,
  DollarSign,
  Check,
  X,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

const PersonalTrainingBooking = ({ memberId, className = '' }) => {
  const { toast } = useToast();
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  // Mock trainer data (in real app, this would come from database)
  const mockTrainers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah@momentum.com',
      specialties: ['Weight Loss', 'Strength Training', 'HIIT'],
      rating: 4.9,
      experience: '5 years',
      bio: 'Certified personal trainer specializing in functional fitness and weight management.',
      hourlyRate: 75,
      avatar: null,
      availability: {
        monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        tuesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        thursday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        friday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        saturday: ['09:00', '10:00', '11:00'],
        sunday: []
      }
    },
    {
      id: 2,
      name: 'Mike Rodriguez',
      email: 'mike@momentum.com',
      specialties: ['Bodybuilding', 'Powerlifting', 'Sports Performance'],
      rating: 4.8,
      experience: '8 years',
      bio: 'Former competitive athlete with expertise in strength and conditioning.',
      hourlyRate: 85,
      avatar: null,
      availability: {
        monday: ['08:00', '09:00', '16:00', '17:00', '18:00'],
        tuesday: ['08:00', '09:00', '16:00', '17:00', '18:00'],
        wednesday: ['08:00', '09:00', '16:00', '17:00', '18:00'],
        thursday: ['08:00', '09:00', '16:00', '17:00', '18:00'],
        friday: ['08:00', '09:00', '16:00', '17:00', '18:00'],
        saturday: ['08:00', '09:00', '10:00', '11:00'],
        sunday: ['10:00', '11:00', '12:00']
      }
    },
    {
      id: 3,
      name: 'Emma Chen',
      email: 'emma@momentum.com',
      specialties: ['Yoga', 'Pilates', 'Flexibility', 'Rehabilitation'],
      rating: 4.9,
      experience: '6 years',
      bio: 'Holistic fitness approach focusing on mind-body connection and injury prevention.',
      hourlyRate: 70,
      avatar: null,
      availability: {
        monday: ['07:00', '08:00', '12:00', '13:00', '17:00'],
        tuesday: ['07:00', '08:00', '12:00', '13:00', '17:00'],
        wednesday: ['07:00', '08:00', '12:00', '13:00', '17:00'],
        thursday: ['07:00', '08:00', '12:00', '13:00', '17:00'],
        friday: ['07:00', '08:00', '12:00', '13:00', '17:00'],
        saturday: ['08:00', '09:00', '10:00'],
        sunday: ['09:00', '10:00', '11:00', '12:00']
      }
    }
  ];

  useEffect(() => {
    loadData();
  }, [memberId]);

  const loadData = async () => {
    try {
      // In real app, load from database
      setTrainers(mockTrainers);
      
      // Load existing bookings
      const { data: bookingsData, error } = await supabase
        .from('personal_training_bookings')
        .select('*')
        .eq('member_id', memberId)
        .order('session_date', { ascending: true });

      if (error) throw error;
      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter trainers
  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trainer.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSpecialty = specialtyFilter === 'all' || 
                            trainer.specialties.some(s => s.toLowerCase().includes(specialtyFilter.toLowerCase()));
    
    return matchesSearch && matchesSpecialty;
  });

  // Get available time slots for selected trainer
  const getAvailableSlots = (trainer, date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const trainerAvailability = trainer.availability[dayName] || [];
    
    // Filter out already booked slots
    const bookedSlots = bookings
      .filter(b => b.trainer_id === trainer.id && 
                  new Date(b.session_date).toDateString() === date.toDateString())
      .map(b => new Date(b.session_date).toTimeString().slice(0, 5));
    
    return trainerAvailability.filter(slot => !bookedSlots.includes(slot));
  };

  // Book session
  const bookSession = async (trainer, date, time, notes = '') => {
    try {
      const sessionDateTime = new Date(date);
      const [hours, minutes] = time.split(':');
      sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const bookingData = {
        member_id: memberId,
        trainer_id: trainer.id,
        trainer_name: trainer.name,
        session_date: sessionDateTime.toISOString(),
        duration: 60, // 1 hour default
        rate: trainer.hourlyRate,
        status: 'confirmed',
        notes: notes,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('personal_training_bookings')
        .insert([bookingData]);

      if (error) throw error;

      setBookings(prev => [...prev, bookingData]);
      setShowBookingDialog(false);
      setSelectedTrainer(null);

      toast({
        title: 'Session booked successfully',
        description: `Your session with ${trainer.name} is confirmed for ${date.toLocaleDateString()} at ${time}`,
      });

    } catch (error) {
      console.error('Error booking session:', error);
      toast({
        title: 'Booking failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Cancel booking
  const cancelBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('personal_training_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      ));

      toast({
        title: 'Session cancelled',
        description: 'Your training session has been cancelled.',
      });

    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: 'Cancellation failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const specialties = ['Weight Loss', 'Strength Training', 'HIIT', 'Bodybuilding', 'Powerlifting', 'Sports Performance', 'Yoga', 'Pilates', 'Flexibility', 'Rehabilitation'];

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Find a Personal Trainer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search trainers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Label htmlFor="specialty">Specialty</Label>
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All specialties</SelectItem>
                  {specialties.map(specialty => (
                    <SelectItem key={specialty} value={specialty.toLowerCase()}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainers.map((trainer) => (
          <TrainerCard
            key={trainer.id}
            trainer={trainer}
            onBook={() => setSelectedTrainer(trainer)}
          />
        ))}
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Training Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.filter(b => b.status !== 'cancelled').length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No training sessions booked</p>
              <p className="text-sm">Book your first session above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings
                .filter(b => b.status !== 'cancelled')
                .slice(0, 5)
                .map((booking, index) => (
                  <BookingCard
                    key={index}
                    booking={booking}
                    onCancel={() => cancelBooking(booking.id)}
                  />
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      {selectedTrainer && (
        <BookingDialog
          trainer={selectedTrainer}
          isOpen={!!selectedTrainer}
          onClose={() => setSelectedTrainer(null)}
          onBook={bookSession}
          getAvailableSlots={getAvailableSlots}
        />
      )}
    </div>
  );
};

// Trainer Card Component
const TrainerCard = ({ trainer, onBook }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="cursor-pointer hover:border-primary transition-colors h-full">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={trainer.avatar} alt={trainer.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {trainer.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{trainer.name}</h3>
              <div className="flex items-center gap-1 mb-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{trainer.rating}</span>
                <span className="text-sm text-gray-500">• {trainer.experience}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <DollarSign className="h-3 w-3" />
                <span>${trainer.hourlyRate}/hour</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">{trainer.bio}</p>

          <div className="flex flex-wrap gap-1 mb-4">
            {trainer.specialties.slice(0, 3).map((specialty, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {trainer.specialties.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{trainer.specialties.length - 3} more
              </Badge>
            )}
          </div>

          <Button onClick={onBook} className="w-full">
            Book Session
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Booking Card Component
const BookingCard = ({ booking, onCancel }) => {
  const sessionDate = new Date(booking.session_date);
  const isUpcoming = sessionDate > new Date();

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-sm font-medium">
            {sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div className="text-xs text-gray-500">
            {sessionDate.toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
        </div>
        <div>
          <h4 className="font-medium">{booking.trainer_name}</h4>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-3 w-3" />
            <span>{sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>• ${booking.rate}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={isUpcoming ? 'default' : 'secondary'}>
          {booking.status}
        </Badge>
        {isUpcoming && (
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

// Booking Dialog Component
const BookingDialog = ({ trainer, isOpen, onClose, onBook, getAvailableSlots }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');

  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30); // 30 days ahead

  const availableSlots = selectedDate ? getAvailableSlots(trainer, new Date(selectedDate)) : [];

  const handleBook = () => {
    if (!selectedDate || !selectedTime) return;
    onBook(trainer, new Date(selectedDate), selectedTime, notes);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Session with {trainer.name}</DialogTitle>
          <DialogDescription>
            Select your preferred date and time for your training session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime(''); // Reset time when date changes
              }}
              min={today.toISOString().split('T')[0]}
              max={maxDate.toISOString().split('T')[0]}
            />
          </div>

          {selectedDate && (
            <div>
              <Label htmlFor="time">Available Times</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.length === 0 ? (
                    <SelectItem value="" disabled>No available slots</SelectItem>
                  ) : (
                    availableSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>
                        {new Date(`2000-01-01T${slot}`).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any specific goals or requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-600">
              Rate: ${trainer.hourlyRate}/hour
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleBook}
                disabled={!selectedDate || !selectedTime}
              >
                Book Session
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PersonalTrainingBooking;
