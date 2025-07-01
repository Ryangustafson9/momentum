import React from 'react';
import { Clock, BarChart3, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TimeclockInterface from '@/components/timeclock/TimeclockInterface';
import TimesheetView from '@/components/timeclock/TimesheetView';
import { useTimesheetStats } from '@/hooks/useTimesheetStats';

const TimeclockPage = () => {
  const {
    todayHours,
    todayBreakTime,
    todayStatus,
    weeklyHours,
    weeklyDays,
    weeklyOvertime,
    getCurrentShiftDuration,
    refreshStats
  } = useTimesheetStats();

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-600" />
            Timeclock
          </h1>
          <p className="text-gray-600 mt-1">
            Track your work hours and manage your schedule
          </p>
        </div>
      </div>

      {/* Timeclock Tabs */}
      <Tabs defaultValue="clock" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="clock" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Clock In/Out</span>
            <span className="sm:hidden">Clock</span>
          </TabsTrigger>
          <TabsTrigger value="timesheet" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">My Timesheet</span>
            <span className="sm:hidden">Timesheet</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
            <span className="sm:hidden">Reports</span>
          </TabsTrigger>
        </TabsList>

        {/* Clock In/Out Tab */}
        <TabsContent value="clock" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Timeclock Interface */}
            <div className="lg:col-span-2">
              <TimeclockInterface onStatusChange={refreshStats} />
            </div>

            {/* Quick Stats Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today's Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hours Worked:</span>
                    <span className="font-mono font-semibold">{todayHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Break Time:</span>
                    <span className="font-mono font-semibold">{todayBreakTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`text-sm font-medium ${
                      todayStatus === 'Clocked In' ? 'text-green-600' :
                      todayStatus === 'On Break' ? 'text-yellow-600' :
                      'text-gray-500'
                    }`}>
                      {todayStatus}
                    </span>
                  </div>
                  {todayStatus === 'Clocked In' && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Shift:</span>
                      <span className="font-mono font-semibold text-blue-600">
                        {getCurrentShiftDuration()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">This Week</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Hours:</span>
                    <span className="font-mono font-semibold">{weeklyHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Days Worked:</span>
                    <span className="font-mono font-semibold">{weeklyDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overtime:</span>
                    <span className={`font-mono font-semibold ${
                      weeklyOvertime !== '0:00' ? 'text-orange-600' : ''
                    }`}>
                      {weeklyOvertime}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Timesheet Tab */}
        <TabsContent value="timesheet" className="space-y-6 mt-6">
          <TimesheetView />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Reports Coming Soon</h3>
                <p className="text-gray-600">
                  View detailed time tracking reports and analytics here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeclockPage;
