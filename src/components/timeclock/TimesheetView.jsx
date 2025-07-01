import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Edit, 
  Save, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Download,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, differenceInMinutes, parseISO } from 'date-fns';

const TimesheetView = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [locations, setLocations] = useState([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadTimeEntries();
    loadLocations();
  }, [currentWeek, user?.id]);

  const loadTimeEntries = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }); // Sunday

      const { data, error } = await supabase
        .from('timeclock_entries')
        .select(`
          *,
          location:locations(name)
        `)
        .eq('staff_id', user.id)
        .gte('clock_in_time', weekStart.toISOString())
        .lte('clock_in_time', weekEnd.toISOString())
        .order('clock_in_time', { ascending: false });

      if (error) throw error;
      setTimeEntries(data || []);
    } catch (error) {
      console.error('Error loading time entries:', error);
      toast({
        title: "Error",
        description: "Failed to load timesheet entries.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const calculateDuration = (clockIn, clockOut, breakStart, breakEnd) => {
    if (!clockIn) return '0:00';
    
    const start = parseISO(clockIn);
    const end = clockOut ? parseISO(clockOut) : new Date();
    
    let totalMinutes = differenceInMinutes(end, start);
    
    // Subtract break time if applicable
    if (breakStart && breakEnd) {
      const breakMinutes = differenceInMinutes(parseISO(breakEnd), parseISO(breakStart));
      totalMinutes -= breakMinutes;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (entry) => {
    if (!entry.clock_out_time) {
      if (entry.break_start_time && !entry.break_end_time) {
        return <Badge className="bg-yellow-100 text-yellow-800">On Break</Badge>;
      }
      return <Badge className="bg-green-100 text-green-800">Clocked In</Badge>;
    }
    return <Badge variant="secondary">Complete</Badge>;
  };

  const startEdit = (entry) => {
    setEditingEntry(entry.id);
    setEditForm({
      clock_in_time: entry.clock_in_time ? format(parseISO(entry.clock_in_time), "yyyy-MM-dd'T'HH:mm") : '',
      clock_out_time: entry.clock_out_time ? format(parseISO(entry.clock_out_time), "yyyy-MM-dd'T'HH:mm") : '',
      break_start_time: entry.break_start_time ? format(parseISO(entry.break_start_time), "yyyy-MM-dd'T'HH:mm") : '',
      break_end_time: entry.break_end_time ? format(parseISO(entry.break_end_time), "yyyy-MM-dd'T'HH:mm") : '',
      location_id: entry.location_id || '',
      notes: entry.notes || ''
    });
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    try {
      const updateData = {
        clock_in_time: editForm.clock_in_time ? new Date(editForm.clock_in_time).toISOString() : null,
        clock_out_time: editForm.clock_out_time ? new Date(editForm.clock_out_time).toISOString() : null,
        break_start_time: editForm.break_start_time ? new Date(editForm.break_start_time).toISOString() : null,
        break_end_time: editForm.break_end_time ? new Date(editForm.break_end_time).toISOString() : null,
        location_id: editForm.location_id || null,
        notes: editForm.notes || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('timeclock_entries')
        .update(updateData)
        .eq('id', editingEntry);

      if (error) throw error;

      toast({
        title: "Entry Updated",
        description: "Timesheet entry has been updated successfully.",
        duration: 3000,
      });

      setEditingEntry(null);
      setEditForm({});
      loadTimeEntries();
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: "Error",
        description: "Failed to update timesheet entry.",
        variant: "destructive"
      });
    }
  };

  const navigateWeek = (direction) => {
    if (direction === 'prev') {
      setCurrentWeek(subWeeks(currentWeek, 1));
    } else {
      setCurrentWeek(addWeeks(currentWeek, 1));
    }
  };

  const getTotalHours = () => {
    return timeEntries.reduce((total, entry) => {
      const duration = calculateDuration(
        entry.clock_in_time,
        entry.clock_out_time,
        entry.break_start_time,
        entry.break_end_time
      );
      const [hours, minutes] = duration.split(':').map(Number);
      return total + hours + (minutes / 60);
    }, 0).toFixed(2);
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My Timesheet
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Week
            </Button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </h3>
              <p className="text-sm text-gray-600">
                Total Hours: <span className="font-mono font-bold">{getTotalHours()}</span>
              </p>
            </div>
            
            <Button variant="outline" onClick={() => navigateWeek('next')}>
              Next Week
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timesheet Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Clock className="h-8 w-8 mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-gray-600">Loading timesheet...</p>
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Time Entries</h3>
              <p className="text-gray-600">No time entries found for this week.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {format(parseISO(entry.clock_in_time), 'EEE, MMM d')}
                    </TableCell>
                    
                    <TableCell>
                      {editingEntry === entry.id ? (
                        <Input
                          type="datetime-local"
                          value={editForm.clock_in_time}
                          onChange={(e) => setEditForm(prev => ({ ...prev, clock_in_time: e.target.value }))}
                          className="w-40"
                        />
                      ) : (
                        format(parseISO(entry.clock_in_time), 'h:mm a')
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {editingEntry === entry.id ? (
                        <Input
                          type="datetime-local"
                          value={editForm.clock_out_time}
                          onChange={(e) => setEditForm(prev => ({ ...prev, clock_out_time: e.target.value }))}
                          className="w-40"
                        />
                      ) : (
                        entry.clock_out_time ? format(parseISO(entry.clock_out_time), 'h:mm a') : '-'
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {entry.break_start_time && entry.break_end_time ? (
                        <span className="text-sm">
                          {calculateDuration(entry.break_start_time, entry.break_end_time)}
                        </span>
                      ) : entry.break_start_time ? (
                        <Badge variant="outline">In Progress</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    
                    <TableCell className="font-mono">
                      {calculateDuration(
                        entry.clock_in_time,
                        entry.clock_out_time,
                        entry.break_start_time,
                        entry.break_end_time
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {editingEntry === entry.id ? (
                        <Select
                          value={editForm.location_id}
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, location_id: value }))}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        entry.location?.name || '-'
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(entry)}
                    </TableCell>
                    
                    <TableCell>
                      {editingEntry === entry.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => startEdit(entry)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimesheetView;
