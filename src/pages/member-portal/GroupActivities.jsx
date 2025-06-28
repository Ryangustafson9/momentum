import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dumbbell, 
  Users, 
  Eye, 
  Calendar, 
  Clock, 
  MapPin,
  User,
  CheckCircle,
  Star,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, addHours } from 'date-fns';

const GroupActivities = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('fitness');
  const [registrations, setRegistrations] = useState([]);

  // Group activities data
  const activities = {
    fitness: [
      {
        id: 'yoga-morning',
        name: 'Morning Yoga Flow',
        description: 'Start your day with energizing yoga poses and breathing exercises.',
        instructor: 'Emma Wilson',
        schedule: 'Monday, Wednesday, Friday',
        time: '7:00 AM - 8:00 AM',
        location: 'Studio A',
        capacity: 15,
        enrolled: 12,
        nextClass: addDays(new Date(), 1),
        difficulty: 'Beginner',
        type: 'Yoga'
      },
      {
        id: 'hiit-evening',
        name: 'HIIT Blast',
        description: 'High-intensity interval training for maximum calorie burn.',
        instructor: 'Jake Martinez',
        schedule: 'Tuesday, Thursday',
        time: '6:30 PM - 7:30 PM',
        location: 'Main Gym',
        capacity: 20,
        enrolled: 18,
        nextClass: addDays(new Date(), 2),
        difficulty: 'Advanced',
        type: 'HIIT'
      },
      {
        id: 'pilates-core',
        name: 'Core Pilates',
        description: 'Strengthen your core and improve flexibility with Pilates.',
        instructor: 'Sarah Kim',
        schedule: 'Monday, Wednesday, Friday',
        time: '12:00 PM - 1:00 PM',
        location: 'Studio B',
        capacity: 12,
        enrolled: 8,
        nextClass: addHours(new Date(), 2),
        difficulty: 'Intermediate',
        type: 'Pilates'
      },
      {
        id: 'zumba-dance',
        name: 'Zumba Dance Fitness',
        description: 'Dance your way to fitness with high-energy Zumba routines.',
        instructor: 'Maria Rodriguez',
        schedule: 'Saturday',
        time: '10:00 AM - 11:00 AM',
        location: 'Studio A',
        capacity: 25,
        enrolled: 20,
        nextClass: addDays(new Date(), 6),
        difficulty: 'All Levels',
        type: 'Dance'
      }
    ],
    training: [
      {
        id: 'strength-basics',
        name: 'Strength Training Basics',
        description: 'Learn proper form and technique for weight training.',
        instructor: 'Coach Thompson',
        schedule: 'Tuesday, Thursday',
        time: '5:00 PM - 6:00 PM',
        location: 'Weight Room',
        capacity: 8,
        enrolled: 6,
        nextClass: addDays(new Date(), 1),
        difficulty: 'Beginner',
        type: 'Strength'
      },
      {
        id: 'powerlifting-academy',
        name: 'Powerlifting Academy',
        description: 'Advanced powerlifting techniques for serious athletes.',
        instructor: 'Mike Johnson',
        schedule: 'Monday, Wednesday, Friday',
        time: '7:00 PM - 8:30 PM',
        location: 'Powerlifting Area',
        capacity: 6,
        enrolled: 5,
        nextClass: addDays(new Date(), 3),
        difficulty: 'Advanced',
        type: 'Powerlifting'
      },
      {
        id: 'functional-fitness',
        name: 'Functional Fitness',
        description: 'Real-world movement patterns for everyday strength.',
        instructor: 'Lisa Chen',
        schedule: 'Saturday',
        time: '9:00 AM - 10:00 AM',
        location: 'Functional Area',
        capacity: 12,
        enrolled: 9,
        nextClass: addDays(new Date(), 5),
        difficulty: 'Intermediate',
        type: 'Functional'
      }
    ],
    supervised: [
      {
        id: 'senior-fitness',
        name: 'Senior Fitness Program',
        description: 'Low-impact exercises designed for active seniors.',
        instructor: 'Nancy Davis',
        schedule: 'Monday, Wednesday, Friday',
        time: '10:00 AM - 11:00 AM',
        location: 'Studio B',
        capacity: 15,
        enrolled: 11,
        nextClass: addDays(new Date(), 1),
        difficulty: 'Low Impact',
        type: 'Senior'
      },
      {
        id: 'youth-training',
        name: 'Youth Athletic Training',
        description: 'Sports conditioning and fitness for young athletes.',
        instructor: 'Coach Williams',
        schedule: 'Tuesday, Thursday',
        time: '4:00 PM - 5:00 PM',
        location: 'Main Gym',
        capacity: 16,
        enrolled: 14,
        nextClass: addDays(new Date(), 2),
        difficulty: 'Youth',
        type: 'Athletic'
      },
      {
        id: 'rehab-fitness',
        name: 'Rehabilitation Fitness',
        description: 'Supervised exercise for injury recovery and prevention.',
        instructor: 'Dr. Patricia Lee',
        schedule: 'Monday, Wednesday, Friday',
        time: '2:00 PM - 3:00 PM',
        location: 'Rehab Center',
        capacity: 8,
        enrolled: 5,
        nextClass: addDays(new Date(), 1),
        difficulty: 'Therapeutic',
        type: 'Rehabilitation'
      }
    ]
  };

  const handleRegister = (activity) => {
    const newRegistration = {
      id: Date.now(),
      activityId: activity.id,
      activityName: activity.name,
      nextClass: activity.nextClass,
      instructor: activity.instructor,
      status: 'registered'
    };

    setRegistrations(prev => [...prev, newRegistration]);

    toast({
      title: "Registration Successful! 🎉",
      description: `You've been registered for ${activity.name}`,
      variant: "default"
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      case 'all levels': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const ActivityCard = ({ activity }) => {
    const isRegistered = registrations.some(reg => reg.activityId === activity.id);
    const spotsLeft = activity.capacity - activity.enrolled;
    
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{activity.name}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {activity.type}
              </Badge>
            </div>
            <Badge className={getDifficultyColor(activity.difficulty)}>
              {activity.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">{activity.description}</p>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span>Instructor: {activity.instructor}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{activity.schedule}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{activity.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{activity.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span>{activity.enrolled}/{activity.capacity} enrolled</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Next Class:</p>
            <p className="text-sm text-blue-700">
              {format(activity.nextClass, 'EEEE, MMM d')} at {activity.time.split(' - ')[0]}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant={spotsLeft > 3 ? "default" : spotsLeft > 0 ? "secondary" : "destructive"}>
              {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
            </Badge>
          </div>

          <Button 
            className="w-full"
            onClick={() => handleRegister(activity)}
            disabled={isRegistered || spotsLeft === 0}
            variant={isRegistered ? "outline" : "default"}
          >
            {isRegistered ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Registered
              </>
            ) : spotsLeft === 0 ? (
              'Class Full'
            ) : (
              'Join Class'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Group Activities</h1>
        <p className="text-muted-foreground">Join group fitness classes, training academies, and supervised programs</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fitness" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Group Fitness
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Training Academy
          </TabsTrigger>
          <TabsTrigger value="supervised" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Supervised Programs
          </TabsTrigger>
        </TabsList>

        {/* Group Fitness Tab */}
        <TabsContent value="fitness" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.fitness.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </TabsContent>

        {/* Training Academy Tab */}
        <TabsContent value="training" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.training.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </TabsContent>

        {/* Supervised Programs Tab */}
        <TabsContent value="supervised" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.supervised.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
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
              My Group Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {registrations.map((registration) => (
                <div key={registration.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium">{registration.activityName}</p>
                    <p className="text-sm text-gray-600">
                      Instructor: {registration.instructor}
                    </p>
                    <p className="text-sm text-gray-600">
                      Next class: {format(registration.nextClass, 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {registration.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GroupActivities;
