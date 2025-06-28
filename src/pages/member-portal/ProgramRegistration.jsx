import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Waves, 
  Users, 
  Baby, 
  Calendar, 
  Clock, 
  DollarSign, 
  User,
  CheckCircle,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

const ProgramRegistration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('swim');
  const [registrations, setRegistrations] = useState([]);

  // Program data
  const programs = {
    swim: [
      {
        id: 'swim-beginner',
        name: 'Beginner Swim Lessons',
        description: 'Perfect for those new to swimming. Learn basic strokes and water safety.',
        instructor: 'Sarah Johnson',
        schedule: 'Mondays & Wednesdays, 6:00 PM - 7:00 PM',
        duration: '4 weeks',
        price: 120,
        capacity: 8,
        enrolled: 5,
        startDate: addDays(new Date(), 7),
        level: 'Beginner',
        ageGroup: 'Adults'
      },
      {
        id: 'swim-intermediate',
        name: 'Intermediate Swim Lessons',
        description: 'Improve your technique and learn advanced strokes.',
        instructor: 'Mike Chen',
        schedule: 'Tuesdays & Thursdays, 7:00 PM - 8:00 PM',
        duration: '4 weeks',
        price: 140,
        capacity: 6,
        enrolled: 3,
        startDate: addDays(new Date(), 10),
        level: 'Intermediate',
        ageGroup: 'Adults'
      },
      {
        id: 'swim-kids',
        name: 'Kids Swim Lessons',
        description: 'Fun and safe swimming lessons for children ages 6-12.',
        instructor: 'Lisa Park',
        schedule: 'Saturdays, 10:00 AM - 11:00 AM',
        duration: '6 weeks',
        price: 180,
        capacity: 10,
        enrolled: 7,
        startDate: addDays(new Date(), 5),
        level: 'All Levels',
        ageGroup: 'Kids (6-12)'
      }
    ],
    volleyball: [
      {
        id: 'volleyball-push',
        name: 'Push Volleyball League',
        description: 'Competitive volleyball league for intermediate to advanced players.',
        instructor: 'Coach Rodriguez',
        schedule: 'Thursdays, 8:00 PM - 10:00 PM',
        duration: '8 weeks',
        price: 200,
        capacity: 12,
        enrolled: 9,
        startDate: addDays(new Date(), 14),
        level: 'Intermediate/Advanced',
        ageGroup: 'Adults'
      },
      {
        id: 'volleyball-recreational',
        name: 'Recreational Volleyball',
        description: 'Casual volleyball games for all skill levels. Great for beginners!',
        instructor: 'Team Captains',
        schedule: 'Sundays, 2:00 PM - 4:00 PM',
        duration: 'Ongoing',
        price: 80,
        capacity: 16,
        enrolled: 12,
        startDate: new Date(),
        level: 'All Levels',
        ageGroup: 'Adults'
      }
    ],
    parentsNight: [
      {
        id: 'parents-night-monthly',
        name: 'Parents Night Out - Monthly',
        description: 'Drop off your kids for a fun evening while you enjoy some time off!',
        instructor: 'Childcare Team',
        schedule: 'First Friday of each month, 6:00 PM - 10:00 PM',
        duration: '4 hours',
        price: 45,
        capacity: 20,
        enrolled: 15,
        startDate: addDays(new Date(), 3),
        level: 'All Ages',
        ageGroup: 'Kids (3-12)'
      },
      {
        id: 'parents-night-weekly',
        name: 'Parents Night Out - Weekly',
        description: 'Weekly childcare service with activities, games, and dinner included.',
        instructor: 'Childcare Team',
        schedule: 'Fridays, 6:00 PM - 9:00 PM',
        duration: '3 hours',
        price: 35,
        capacity: 15,
        enrolled: 8,
        startDate: new Date(),
        level: 'All Ages',
        ageGroup: 'Kids (3-12)'
      }
    ]
  };

  const handleRegister = (program) => {
    const newRegistration = {
      id: Date.now(),
      programId: program.id,
      programName: program.name,
      startDate: program.startDate,
      price: program.price,
      status: 'registered'
    };

    setRegistrations(prev => [...prev, newRegistration]);

    toast({
      title: "Registration Successful! 🎉",
      description: `You've been registered for ${program.name}`,
      variant: "default"
    });
  };

  const ProgramCard = ({ program, category }) => {
    const isRegistered = registrations.some(reg => reg.programId === program.id);
    const spotsLeft = program.capacity - program.enrolled;
    
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{program.name}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {program.level}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">${program.price}</p>
              <p className="text-sm text-gray-500">{program.duration}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">{program.description}</p>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span>Instructor: {program.instructor}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{program.schedule}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>Starts: {format(program.startDate, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span>{program.enrolled}/{program.capacity} enrolled</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant={spotsLeft > 3 ? "default" : spotsLeft > 0 ? "secondary" : "destructive"}>
              {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
            </Badge>
            <Badge variant="outline">
              {program.ageGroup}
            </Badge>
          </div>

          <Button 
            className="w-full"
            onClick={() => handleRegister(program)}
            disabled={isRegistered || spotsLeft === 0}
            variant={isRegistered ? "outline" : "default"}
          >
            {isRegistered ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Registered
              </>
            ) : spotsLeft === 0 ? (
              'Program Full'
            ) : (
              'Register Now'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Program Registration</h1>
        <p className="text-muted-foreground">Register for swim lessons, volleyball leagues, and Parents Night Out programs</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="swim" className="flex items-center gap-2">
            <Waves className="h-4 w-4" />
            Swim Lessons
          </TabsTrigger>
          <TabsTrigger value="volleyball" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Push Volleyball
          </TabsTrigger>
          <TabsTrigger value="parentsNight" className="flex items-center gap-2">
            <Baby className="h-4 w-4" />
            Parents Night Out
          </TabsTrigger>
        </TabsList>

        {/* Swim Lessons Tab */}
        <TabsContent value="swim" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.swim.map((program) => (
              <ProgramCard key={program.id} program={program} category="swim" />
            ))}
          </div>
        </TabsContent>

        {/* Volleyball Tab */}
        <TabsContent value="volleyball" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programs.volleyball.map((program) => (
              <ProgramCard key={program.id} program={program} category="volleyball" />
            ))}
          </div>
        </TabsContent>

        {/* Parents Night Out Tab */}
        <TabsContent value="parentsNight" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programs.parentsNight.map((program) => (
              <ProgramCard key={program.id} program={program} category="parentsNight" />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* My Registrations */}
      {registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              My Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {registrations.map((registration) => (
                <div key={registration.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium">{registration.programName}</p>
                    <p className="text-sm text-gray-600">
                      Starts: {format(registration.startDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${registration.price}</p>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {registration.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgramRegistration;
