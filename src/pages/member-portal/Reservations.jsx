import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

const Reservations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('book');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [myReservations, setMyReservations] = useState([]);

  // Mock data for courts and time slots
  const courts = [
    { id: 'racquet1', name: 'Racquetball Court 1', type: 'racquetball' },
    { id: 'racquet2', name: 'Racquetball Court 2', type: 'racquetball' },
    { id: 'tennis1', name: 'Tennis Court 1', type: 'tennis' },
    { id: 'tennis2', name: 'Tennis Court 2', type: 'tennis' },
    { id: 'pickle1', name: 'Pickleball Court 1', type: 'pickleball' },
    { id: 'pickle2', name: 'Pickleball Court 2', type: 'pickleball' },
  ];

  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
  ];

  // Mock existing reservations
  useEffect(() => {
    setMyReservations([
      {
        id: 1,
        court: 'Tennis Court 1',
        date: new Date(),
        time: '2:00 PM',
        duration: '1 hour',
        type: 'tennis',
        status: 'confirmed'
      },
      {
        id: 2,
        court: 'Racquetball Court 1',
        date: addDays(new Date(), 2),
        time: '6:00 PM',
        duration: '1 hour',
        type: 'racquetball',
        status: 'confirmed'
      }
    ]);
  }, []);

  const handleBookReservation = () => {
    if (!selectedCourt || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a court and time slot.",
        variant: "destructive"
      });
      return;
    }

    const newReservation = {
      id: Date.now(),
      court: courts.find(c => c.id === selectedCourt)?.name,
      date: selectedDate,
      time: selectedTime,
      duration: '1 hour',
      type: courts.find(c => c.id === selectedCourt)?.type,
      status: 'confirmed'
    };

    setMyReservations(prev => [...prev, newReservation]);
    setSelectedCourt('');
    setSelectedTime('');

    toast({
      title: "Reservation Confirmed! 🎾",
      description: `${newReservation.court} booked for ${format(selectedDate, 'MMM d')} at ${selectedTime}`,
      variant: "default"
    });
  };

  const handleCancelReservation = (id) => {
    setMyReservations(prev => prev.filter(res => res.id !== id));
    toast({
      title: "Reservation Cancelled",
      description: "Your reservation has been cancelled successfully.",
      variant: "default"
    });
  };

  const getCourtTypeColor = (type) => {
    switch (type) {
      case 'tennis': return 'bg-green-100 text-green-800';
      case 'racquetball': return 'bg-blue-100 text-blue-800';
      case 'pickleball': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Court Reservations</h1>
        <p className="text-muted-foreground">Book and manage your racquetball, tennis, and pickleball court reservations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="book">Book New Reservation</TabsTrigger>
          <TabsTrigger value="manage">My Reservations</TabsTrigger>
        </TabsList>

        {/* Book New Reservation Tab */}
        <TabsContent value="book" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Book a Court
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Date</label>
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(7)].map((_, i) => {
                    const date = addDays(new Date(), i);
                    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    return (
                      <Button
                        key={i}
                        variant={isSelected ? "default" : "outline"}
                        className="flex flex-col h-16"
                        onClick={() => setSelectedDate(date)}
                      >
                        <span className="text-xs">{format(date, 'EEE')}</span>
                        <span className="text-lg font-bold">{format(date, 'd')}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Court Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Court</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {courts.map((court) => (
                    <Button
                      key={court.id}
                      variant={selectedCourt === court.id ? "default" : "outline"}
                      className="h-20 flex flex-col justify-center"
                      onClick={() => setSelectedCourt(court.id)}
                    >
                      <span className="font-medium">{court.name}</span>
                      <Badge variant="secondary" className={`mt-1 ${getCourtTypeColor(court.type)}`}>
                        {court.type}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Time</label>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Book Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleBookReservation}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Reservation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Reservations Tab */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                My Reservations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myReservations.length > 0 ? (
                <div className="space-y-4">
                  {myReservations.map((reservation) => (
                    <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{reservation.court}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(reservation.date, 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {reservation.time} ({reservation.duration})
                            </span>
                          </div>
                        </div>
                        <Badge className={getCourtTypeColor(reservation.type)}>
                          {reservation.type}
                        </Badge>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          {reservation.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCancelReservation(reservation.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reservations</h3>
                  <p className="text-gray-500 mb-4">You haven't made any court reservations yet</p>
                  <Button onClick={() => setActiveTab('book')}>
                    Book Your First Court
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reservations;
