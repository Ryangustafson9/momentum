
// 🎯 STAFF SCHEDULE PAGE - Dedicated scheduling interface for staff users
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, MapPin, Settings, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ResourceFilteredSchedule from '@/components/scheduling/ResourceFilteredSchedule.jsx';
import {
  useTrainers,
  useRooms,
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

const SchedulePage = ({ organizationId = 'default-org-id' }) => {
  // Data hooks for quick stats
  const { data: trainers = [], isLoading: trainersLoading } = useTrainers(organizationId);
  const { data: rooms = [], isLoading: roomsLoading } = useRooms(organizationId);
  const { data: schedule = [], isLoading: scheduleLoading } = useClassSchedule(organizationId);
  const { data: conflicts = [], isLoading: conflictsLoading } = useScheduleConflicts(organizationId);

  // Calculate quick stats
  const today = new Date();
  const stats = {
    activeTrainers: trainers.filter(t => t.is_active).length,
    totalRooms: rooms.filter(r => r.is_active).length,
    todayClasses: schedule.filter(c => {
      const classDate = new Date(c.start_time);
      return classDate.toDateString() === today.toDateString();
    }).length,
    conflicts: conflicts.length
  };

  const isLoading = trainersLoading || roomsLoading || scheduleLoading || conflictsLoading;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 px-4 md:px-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Schedule Management</h1>
          <p className="text-gray-600 mt-1">
            View, filter, and manage class schedules by trainer and room resources
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Badge className="bg-green-100 text-green-800">
            <Calendar className="w-4 h-4 mr-1" />
            Resource Filtering Active
          </Badge>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Schedule Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      {!isLoading && (
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
      )}

      {/* Conflict Alert */}
      {conflicts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="font-medium text-red-800">
                {conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''} detected
              </h4>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Review and resolve conflicts to ensure smooth operations.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Resource-Filtered Schedule Interface */}
      <Card className="bg-white shadow-xl border-gray-200 rounded-xl overflow-hidden">
        <CardHeader className="border-b border-gray-200 p-6">
          <CardTitle className="flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-blue-600" />
            Resource-Filtered Schedule Views
          </CardTitle>
          <p className="text-gray-600 mt-1">
            Filter schedule by trainer or room to view resource-specific schedules and utilization
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <ResourceFilteredSchedule organizationId={organizationId} />
        </CardContent>
      </Card>

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
              <span>Loading schedule data...</span>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SchedulePage;


