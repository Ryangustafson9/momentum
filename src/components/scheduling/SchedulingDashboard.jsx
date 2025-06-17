// 🚀 SCHEDULING DASHBOARD - Comprehensive resource management interface
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TrainerManagement from './TrainerManagement.jsx';
import RoomManagement from './RoomManagement.jsx';

import { 
  useTrainers, 
  useRooms, 
  useEquipment, 
  useClassSchedule,
  useScheduleConflicts 
} from '@/hooks/useScheduling';

const QuickStatsCard = ({ title, value, change, icon: Icon, color = "blue" }) => {
  const isPositive = change > 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center mt-1 text-sm ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`w-4 h-4 mr-1 ${!isPositive ? 'rotate-180' : ''}`} />
                {Math.abs(change)}% vs last week
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ConflictAlert = ({ conflicts }) => {
  if (!conflicts || conflicts.length === 0) return null;

  const criticalConflicts = conflicts.filter(c => c.severity === 'critical' || c.severity === 'high');

  return (
    <Alert className={`border-${criticalConflicts.length > 0 ? 'red' : 'yellow'}-200 bg-${criticalConflicts.length > 0 ? 'red' : 'yellow'}-50`}>
      <AlertTriangle className={`h-4 w-4 text-${criticalConflicts.length > 0 ? 'red' : 'yellow'}-600`} />
      <AlertDescription className={`text-${criticalConflicts.length > 0 ? 'red' : 'yellow'}-800`}>
        <div className="font-medium mb-1">
          {conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''} detected
        </div>
        <div className="text-sm">
          {criticalConflicts.length > 0 && (
            <div>{criticalConflicts.length} critical conflicts require immediate attention</div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {/* Navigate to conflicts view */}}
          >
            View Details
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

const UpcomingSchedule = ({ schedule }) => {
  const today = new Date();
  const todayClasses = schedule.filter(classItem => {
    const classDate = new Date(classItem.start_time);
    return classDate.toDateString() === today.toDateString();
  }).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Today's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todayClasses.length > 0 ? (
          <div className="space-y-3">
            {todayClasses.map((classItem) => (
              <div key={classItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{classItem.name}</div>
                  <div className="text-sm text-gray-600">
                    {classItem.trainer ? `${classItem.trainer.first_name} ${classItem.trainer.last_name}` : 'No trainer assigned'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {classItem.room?.name || 'No room assigned'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {new Date(classItem.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {classItem.enrolled || 0}/{classItem.capacity} enrolled
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No classes scheduled for today</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ResourceUtilization = ({ trainers, rooms, equipment }) => {
  const activeTrainers = trainers.filter(t => t.is_active).length;
  const totalTrainers = trainers.length;
  const activeRooms = rooms.filter(r => r.is_active).length;
  const totalRooms = rooms.length;
  const workingEquipment = equipment.filter(e => e.status === 'active').length;
  const totalEquipment = equipment.length;

  const utilizationData = [
    {
      name: 'Trainers',
      active: activeTrainers,
      total: totalTrainers,
      percentage: totalTrainers > 0 ? Math.round((activeTrainers / totalTrainers) * 100) : 0,
      color: 'blue'
    },
    {
      name: 'Rooms',
      active: activeRooms,
      total: totalRooms,
      percentage: totalRooms > 0 ? Math.round((activeRooms / totalRooms) * 100) : 0,
      color: 'green'
    },
    {
      name: 'Equipment',
      active: workingEquipment,
      total: totalEquipment,
      percentage: totalEquipment > 0 ? Math.round((workingEquipment / totalEquipment) * 100) : 0,
      color: 'purple'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Resource Utilization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {utilizationData.map((resource) => (
            <div key={resource.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{resource.name}</span>
                <span className="text-gray-600">{resource.active}/{resource.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-${resource.color}-500 h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${resource.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{resource.percentage}% operational</span>
                {resource.percentage < 80 && (
                  <Badge variant="outline" className="text-yellow-600">
                    Needs attention
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const SchedulingDashboard = ({ organizationId = 'default-org-id' }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Data hooks
  const { data: trainers = [], isLoading: trainersLoading } = useTrainers(organizationId);
  const { data: rooms = [], isLoading: roomsLoading } = useRooms(organizationId);
  const { data: equipment = [], isLoading: equipmentLoading } = useEquipment(organizationId);
  const { data: schedule = [], isLoading: scheduleLoading } = useClassSchedule(organizationId);
  const { data: conflicts = [], isLoading: conflictsLoading } = useScheduleConflicts(organizationId);

  // Calculate stats
  const stats = {
    activeTrainers: trainers.filter(t => t.is_active).length,
    totalRooms: rooms.length,
    todayClasses: schedule.filter(c => {
      const classDate = new Date(c.start_time);
      const today = new Date();
      return classDate.toDateString() === today.toDateString();
    }).length,
    conflicts: conflicts.length
  };

  const isLoading = trainersLoading || roomsLoading || equipmentLoading || scheduleLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scheduling & Resource Management</h2>
          <p className="text-gray-600">Manage trainers, rooms, equipment, and class schedules</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Phase 3 Active
          </Badge>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Conflict Alerts */}
      <ConflictAlert conflicts={conflicts} />

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <QuickStatsCard
          title="Active Trainers"
          value={stats.activeTrainers}
          change={5.2}
          icon={Users}
          color="blue"
        />
        <QuickStatsCard
          title="Available Rooms"
          value={stats.totalRooms}
          change={0}
          icon={MapPin}
          color="green"
        />
        <QuickStatsCard
          title="Today's Classes"
          value={stats.todayClasses}
          change={12.5}
          icon={Calendar}
          color="purple"
        />
        <QuickStatsCard
          title="Schedule Conflicts"
          value={stats.conflicts}
          change={-25}
          icon={AlertTriangle}
          color={stats.conflicts > 0 ? "red" : "green"}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trainers">Trainers</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <UpcomingSchedule schedule={schedule} />
            <ResourceUtilization 
              trainers={trainers} 
              rooms={rooms} 
              equipment={equipment} 
            />
          </div>
        </TabsContent>

        {/* Trainers Tab */}
        <TabsContent value="trainers">
          <TrainerManagement organizationId={organizationId} />
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms">
          <RoomManagement organizationId={organizationId} />
        </TabsContent>


      </Tabs>

      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50"
        >
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Loading scheduling data...</span>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default SchedulingDashboard;
