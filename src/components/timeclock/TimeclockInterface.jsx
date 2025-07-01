import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Square, 
  Coffee, 
  MapPin, 
  Calendar,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';

const TimeclockInterface = ({ onStatusChange }) => {
  const [currentStatus, setCurrentStatus] = useState('clocked_out'); // clocked_out, clocked_in, on_break
  const [currentShift, setCurrentShift] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadSystemSettings();
    loadLocations();
    loadCurrentShift();
  }, [user?.id]);

  const loadSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setSystemSettings({
        timeclock_enabled: data?.timeclock_enabled || false,
        timeclock_location_tracking: data?.timeclock_location_tracking !== false,
        timeclock_break_tracking: data?.timeclock_break_tracking !== false
      });
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setLocations(data || []);
      
      // Set default location if only one exists
      if (data?.length === 1) {
        setSelectedLocation(data[0].id);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadCurrentShift = async () => {
    try {
      const { data, error } = await supabase
        .from('timeclock_entries')
        .select('*')
        .eq('staff_id', user?.id)
        .is('clock_out_time', null)
        .order('clock_in_time', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const shift = data[0];
        setCurrentShift(shift);
        
        if (shift.break_start_time && !shift.break_end_time) {
          setCurrentStatus('on_break');
        } else {
          setCurrentStatus('clocked_in');
        }
      } else {
        setCurrentStatus('clocked_out');
        setCurrentShift(null);
      }
    } catch (error) {
      console.error('Error loading current shift:', error);
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        await createTimeclockTable();
      }
    }
  };

  const createTimeclockTable = async () => {
    try {
      const { error } = await supabase.rpc('create_timeclock_table');
      if (error) throw error;
    } catch (error) {
      console.warn('Could not create timeclock table:', error);
    }
  };

  const clockIn = async () => {
    if (!selectedLocation && systemSettings.timeclock_location_tracking) {
      toast({
        title: "Location Required",
        description: "Please select a location to clock in.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('timeclock_entries')
        .insert({
          staff_id: user?.id,
          location_id: systemSettings.timeclock_location_tracking ? selectedLocation : null,
          clock_in_time: new Date().toISOString(),
          status: 'clocked_in'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentShift(data);
      setCurrentStatus('clocked_in');

      toast({
        title: "Clocked In",
        description: `Successfully clocked in at ${format(new Date(), 'h:mm a')}`,
        duration: 3000,
      });

      // Refresh parent stats
      onStatusChange?.();
    } catch (error) {
      console.error('Error clocking in:', error);
      toast({
        title: "Error",
        description: "Failed to clock in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clockOut = async () => {
    if (!currentShift) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('timeclock_entries')
        .update({
          clock_out_time: new Date().toISOString(),
          status: 'clocked_out'
        })
        .eq('id', currentShift.id);

      if (error) throw error;

      setCurrentShift(null);
      setCurrentStatus('clocked_out');

      toast({
        title: "Clocked Out",
        description: `Successfully clocked out at ${format(new Date(), 'h:mm a')}`,
        duration: 3000,
      });

      // Refresh parent stats
      onStatusChange?.();
    } catch (error) {
      console.error('Error clocking out:', error);
      toast({
        title: "Error",
        description: "Failed to clock out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startBreak = async () => {
    if (!currentShift) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('timeclock_entries')
        .update({
          break_start_time: new Date().toISOString(),
          status: 'on_break'
        })
        .eq('id', currentShift.id);

      if (error) throw error;

      setCurrentStatus('on_break');

      toast({
        title: "Break Started",
        description: "You are now on break.",
        duration: 3000,
      });

      // Refresh parent stats
      onStatusChange?.();
    } catch (error) {
      console.error('Error starting break:', error);
      toast({
        title: "Error",
        description: "Failed to start break. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endBreak = async () => {
    if (!currentShift) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('timeclock_entries')
        .update({
          break_end_time: new Date().toISOString(),
          status: 'clocked_in'
        })
        .eq('id', currentShift.id);

      if (error) throw error;

      setCurrentStatus('clocked_in');

      toast({
        title: "Break Ended",
        description: "Welcome back! You are now clocked in.",
        duration: 3000,
      });

      // Refresh parent stats
      onStatusChange?.();
    } catch (error) {
      console.error('Error ending break:', error);
      toast({
        title: "Error",
        description: "Failed to end break. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'clocked_in':
        return <Badge className="bg-green-100 text-green-800">Clocked In</Badge>;
      case 'on_break':
        return <Badge className="bg-yellow-100 text-yellow-800">On Break</Badge>;
      case 'clocked_out':
        return <Badge variant="secondary">Clocked Out</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCurrentShiftDuration = () => {
    if (!currentShift?.clock_in_time) return '0:00';
    
    const start = new Date(currentShift.clock_in_time);
    const now = new Date();
    const minutes = differenceInMinutes(now, start);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}`;
  };

  // Don't render if timeclock is disabled
  if (!systemSettings.timeclock_enabled) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Timeclock Disabled</h3>
            <p className="text-gray-600">
              The timeclock system is currently disabled. Contact your administrator to enable it.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeclock
            </div>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Time Display */}
          <div className="text-center py-4">
            <div className="text-3xl font-mono font-bold text-gray-900">
              {format(new Date(), 'h:mm:ss a')}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </div>
          </div>

          {/* Location Selection */}
          {systemSettings.timeclock_location_tracking && currentStatus === 'clocked_out' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {location.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Current Shift Info */}
          {currentShift && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Shift Duration:</span>
                <span className="font-mono font-bold">{getCurrentShiftDuration()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Clock In Time:</span>
                <span className="text-sm">{format(new Date(currentShift.clock_in_time), 'h:mm a')}</span>
              </div>
              {systemSettings.timeclock_location_tracking && currentShift.location_id && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Location:</span>
                  <span className="text-sm">{locations.find(l => l.id === currentShift.location_id)?.name || 'Unknown'}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {currentStatus === 'clocked_out' && (
              <Button 
                onClick={clockIn} 
                disabled={isLoading || (!selectedLocation && systemSettings.timeclock_location_tracking)}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Clock In
              </Button>
            )}

            {currentStatus === 'clocked_in' && (
              <>
                <Button onClick={clockOut} disabled={isLoading} variant="destructive" className="flex-1">
                  <Square className="h-4 w-4 mr-2" />
                  Clock Out
                </Button>
                {systemSettings.timeclock_break_tracking && (
                  <Button onClick={startBreak} disabled={isLoading} variant="outline">
                    <Coffee className="h-4 w-4 mr-2" />
                    Start Break
                  </Button>
                )}
              </>
            )}

            {currentStatus === 'on_break' && (
              <>
                <Button onClick={endBreak} disabled={isLoading} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  End Break
                </Button>
                <Button onClick={clockOut} disabled={isLoading} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Clock Out
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeclockInterface;
