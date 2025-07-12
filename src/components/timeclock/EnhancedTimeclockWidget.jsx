import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  DollarSign, 
  Calendar, 
  Coffee, 
  Play, 
  Square, 
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { format, differenceInMinutes, startOfWeek, endOfWeek } from 'date-fns';

const EnhancedTimeclockWidget = () => {
  const { user } = useAuth();
  const [currentEntry, setCurrentEntry] = useState(null);
  const [currentRate, setCurrentRate] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState({
    totalHours: 0,
    regularHours: 0,
    overtimeHours: 0,
    estimatedPay: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadTimeclockData();
      loadCurrentRate();
      loadWeeklyStats();
    }
  }, [user]);

  const loadTimeclockData = async () => {
    try {
      const { data, error } = await supabase
        .from('timeclock_entries')
        .select('*')
        .eq('staff_id', user.id)
        .is('clock_out_time', null)
        .order('clock_in_time', { ascending: false })
        .limit(1);

      if (error) throw error;
      setCurrentEntry(data?.[0] || null);
    } catch (error) {
      console.error('Error loading timeclock data:', error);
    }
  };

  const loadCurrentRate = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_pay_rates')
        .select('*')
        .eq('staff_id', user.id)
        .is('end_date', null)
        .order('effective_date', { ascending: false })
        .limit(1);

      if (error) throw error;
      setCurrentRate(data?.[0] || null);
    } catch (error) {
      console.error('Error loading current rate:', error);
    }
  };

  const loadWeeklyStats = async () => {
    try {
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());

      const { data, error } = await supabase
        .from('timeclock_entries')
        .select('*')
        .eq('staff_id', user.id)
        .gte('clock_in_time', weekStart.toISOString())
        .lte('clock_in_time', weekEnd.toISOString())
        .not('clock_out_time', 'is', null);

      if (error) throw error;

      let totalMinutes = 0;
      let regularMinutes = 0;
      let overtimeMinutes = 0;

      data?.forEach(entry => {
        const clockIn = new Date(entry.clock_in_time);
        const clockOut = new Date(entry.clock_out_time);
        const breakMinutes = entry.break_start_time && entry.break_end_time
          ? differenceInMinutes(new Date(entry.break_end_time), new Date(entry.break_start_time))
          : 0;
        
        const shiftMinutes = differenceInMinutes(clockOut, clockIn) - breakMinutes;
        totalMinutes += shiftMinutes;
      });

      const totalHours = totalMinutes / 60;
      const regularHours = Math.min(totalHours, 40);
      const overtimeHours = Math.max(0, totalHours - 40);

      let estimatedPay = 0;
      if (currentRate) {
        estimatedPay = (regularHours * currentRate.regular_hourly_rate) +
                      (overtimeHours * (currentRate.overtime_hourly_rate || currentRate.regular_hourly_rate * 1.5));
      }

      setWeeklyStats({
        totalHours: totalHours,
        regularHours: regularHours,
        overtimeHours: overtimeHours,
        estimatedPay: estimatedPay
      });
    } catch (error) {
      console.error('Error loading weekly stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('timeclock_entries')
        .insert({
          staff_id: user.id,
          clock_in_time: new Date().toISOString(),
          status: 'clocked_in',
          hourly_rate_snapshot: currentRate?.regular_hourly_rate || null
        });

      if (error) throw error;
      
      await loadTimeclockData();
    } catch (error) {
      console.error('Error clocking in:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentEntry) return;

    try {
      setActionLoading(true);
      
      const clockOutTime = new Date().toISOString();
      const clockInTime = new Date(currentEntry.clock_in_time);
      const breakMinutes = currentEntry.break_start_time && currentEntry.break_end_time
        ? differenceInMinutes(new Date(currentEntry.break_end_time), new Date(currentEntry.break_start_time))
        : 0;
      
      const totalMinutes = differenceInMinutes(new Date(clockOutTime), clockInTime) - breakMinutes;
      const totalHours = totalMinutes / 60;
      
      // Determine if this shift puts them into overtime for the week
      const regularHours = Math.min(totalHours, Math.max(0, 40 - weeklyStats.regularHours));
      const overtimeHours = totalHours - regularHours;

      const { error } = await supabase
        .from('timeclock_entries')
        .update({
          clock_out_time: clockOutTime,
          status: 'clocked_out',
          calculated_regular_hours: regularHours,
          calculated_overtime_hours: overtimeHours,
          calculated_break_hours: breakMinutes / 60,
          is_weekend: [0, 6].includes(new Date().getDay()),
          // is_holiday would be determined by a holiday calendar
        })
        .eq('id', currentEntry.id);

      if (error) throw error;
      
      await Promise.all([
        loadTimeclockData(),
        loadWeeklyStats()
      ]);
    } catch (error) {
      console.error('Error clocking out:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakStart = async () => {
    if (!currentEntry || currentEntry.break_start_time) return;

    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('timeclock_entries')
        .update({
          break_start_time: new Date().toISOString(),
          status: 'on_break'
        })
        .eq('id', currentEntry.id);

      if (error) throw error;
      
      await loadTimeclockData();
    } catch (error) {
      console.error('Error starting break:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    if (!currentEntry || !currentEntry.break_start_time || currentEntry.break_end_time) return;

    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('timeclock_entries')
        .update({
          break_end_time: new Date().toISOString(),
          status: 'clocked_in'
        })
        .eq('id', currentEntry.id);

      if (error) throw error;
      
      await loadTimeclockData();
    } catch (error) {
      console.error('Error ending break:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getCurrentShiftDuration = () => {
    if (!currentEntry) return '0:00';
    
    const now = new Date();
    const clockIn = new Date(currentEntry.clock_in_time);
    const minutes = differenceInMinutes(now, clockIn);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const getBreakDuration = () => {
    if (!currentEntry?.break_start_time) return '0:00';
    
    const breakStart = new Date(currentEntry.break_start_time);
    const breakEnd = currentEntry.break_end_time ? new Date(currentEntry.break_end_time) : new Date();
    const minutes = differenceInMinutes(breakEnd, breakStart);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusColor = () => {
    if (!currentEntry) return 'gray';
    switch (currentEntry.status) {
      case 'clocked_in': return 'green';
      case 'on_break': return 'yellow';
      default: return 'gray';
    }
  };

  const getStatusIcon = () => {
    if (!currentEntry) return Clock;
    switch (currentEntry.status) {
      case 'clocked_in': return CheckCircle;
      case 'on_break': return Coffee;
      default: return Clock;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 animate-pulse" />
            <span>Loading timeclock...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = getStatusIcon();

  return (
    <div className="space-y-4">
      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 text-${getStatusColor()}-600`} />
              Current Status
            </div>
            <Badge variant={getStatusColor() === 'green' ? 'default' : getStatusColor() === 'yellow' ? 'secondary' : 'outline'}>
              {currentEntry ? currentEntry.status.replace('_', ' ').toUpperCase() : 'CLOCKED OUT'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentEntry ? (
            <div className="space-y-4">
              {/* Current Shift Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Clocked In</p>
                  <p className="font-medium">{format(new Date(currentEntry.clock_in_time), 'h:mm a')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Shift Duration</p>
                  <p className="font-medium text-lg">{getCurrentShiftDuration()}</p>
                </div>
              </div>

              {/* Break Info */}
              {currentEntry.break_start_time && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Break Started</p>
                    <p className="font-medium">{format(new Date(currentEntry.break_start_time), 'h:mm a')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Break Duration</p>
                    <p className="font-medium">{getBreakDuration()}</p>
                  </div>
                </div>
              )}

              {/* Current Rate Display */}
              {currentRate && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">Current Rate</span>
                    </div>
                    <span className="font-bold text-green-800">
                      {formatCurrency(currentRate.regular_hourly_rate)}/hr
                    </span>
                  </div>
                  {currentRate.overtime_hourly_rate && (
                    <div className="text-xs text-green-700 mt-1">
                      Overtime: {formatCurrency(currentRate.overtime_hourly_rate)}/hr
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {currentEntry.status === 'clocked_in' && (
                  <>
                    <Button
                      onClick={handleBreakStart}
                      disabled={actionLoading || currentEntry.break_start_time}
                      variant="outline"
                      className="flex-1"
                    >
                      <Coffee className="h-4 w-4 mr-2" />
                      Start Break
                    </Button>
                    <Button
                      onClick={handleClockOut}
                      disabled={actionLoading}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Clock Out
                    </Button>
                  </>
                )}
                
                {currentEntry.status === 'on_break' && (
                  <Button
                    onClick={handleBreakEnd}
                    disabled={actionLoading}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    End Break
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Ready to start your shift?</p>
              </div>
              
              {currentRate && (
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">Your Rate</span>
                  </div>
                  <span className="font-bold text-blue-800">
                    {formatCurrency(currentRate.regular_hourly_rate)}/hr
                  </span>
                </div>
              )}
              
              <Button
                onClick={handleClockIn}
                disabled={actionLoading}
                className="w-full"
                size="lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Clock In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold">{weeklyStats.totalHours.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Pay</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(weeklyStats.estimatedPay)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Regular Hours</p>
              <p className="font-medium">{weeklyStats.regularHours.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Overtime Hours</p>
              <p className="font-medium text-orange-600">{weeklyStats.overtimeHours.toFixed(1)}</p>
            </div>
          </div>

          {weeklyStats.overtimeHours > 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have {weeklyStats.overtimeHours.toFixed(1)} overtime hours this week.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedTimeclockWidget;
