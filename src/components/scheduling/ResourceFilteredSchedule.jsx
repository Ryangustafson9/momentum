// 🎯 RESOURCE-FILTERED SCHEDULE VIEWS - Comprehensive schedule viewing by trainer/room
import { useState, useMemo } from 'react';
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  Filter,
  User,
  Building,
  Star,
  Award,
  Plus,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useTrainers, 
  useRooms, 
  useClassSchedule 
} from '@/hooks/useScheduling';

const FILTER_TYPES = {
  ALL: 'all',
  TRAINER: 'trainer',
  ROOM: 'room'
};

const TimeSlot = ({ hour, classes, selectedResource, filterType, onQuickSchedule }) => {
  const timeString = `${hour.toString().padStart(2, '0')}:00`;
  const classesInSlot = classes.filter(cls => {
    const classHour = new Date(cls.start_time).getHours();
    return classHour === hour;
  });

  // Check for availability gaps
  const hasAvailabilityGap = classesInSlot.length === 0;
  const isPartiallyBooked = classesInSlot.length > 0 && classesInSlot.some(cls => {
    const startMinutes = new Date(cls.start_time).getMinutes();
    const endMinutes = new Date(cls.end_time).getMinutes();
    const duration = (new Date(cls.end_time) - new Date(cls.start_time)) / (1000 * 60);
    return startMinutes > 0 || endMinutes < 60 || duration < 60;
  });

  return (
    <div className="border-b border-gray-100 min-h-[80px] flex items-start py-2">
      <div className="w-20 text-sm text-gray-500 font-medium pt-2">
        {timeString}
      </div>
      <div className="flex-1 pl-4">
        {classesInSlot.length > 0 ? (
          <div className="space-y-2">
            {classesInSlot.map((cls) => {
              const startTime = new Date(cls.start_time);
              const endTime = new Date(cls.end_time);
              const duration = (endTime - startTime) / (1000 * 60); // minutes
              const enrollmentPercentage = cls.capacity > 0 ? (cls.enrolled || 0) / cls.capacity * 100 : 0;

              return (
                <div
                  key={cls.id}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{cls.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {cls.difficulty}
                        </Badge>
                        {enrollmentPercentage >= 90 && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            Nearly Full
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                            {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <span className="text-xs ml-1">({duration}min)</span>
                          </span>
                        </div>
                        {filterType !== FILTER_TYPES.TRAINER && cls.trainer && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{cls.trainer.first_name} {cls.trainer.last_name}</span>
                          </div>
                        )}
                        {filterType !== FILTER_TYPES.ROOM && cls.room && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{cls.room.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center space-x-1 text-sm mb-1">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className={enrollmentPercentage >= 90 ? "text-red-600 font-medium" : ""}>
                          {cls.enrolled || 0}/{cls.capacity}
                        </span>
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            enrollmentPercentage >= 90 ? 'bg-red-500' :
                            enrollmentPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(enrollmentPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-between py-4">
            <div className="text-gray-400 text-sm italic">Available for scheduling</div>
            {filterType !== FILTER_TYPES.ALL && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => onQuickSchedule && onQuickSchedule(hour)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Schedule Class
              </Button>
            )}
          </div>
        )}

        {/* Show partial availability indicator */}
        {isPartiallyBooked && (
          <div className="mt-2 text-xs text-amber-600 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Partial availability in this hour
          </div>
        )}
      </div>
    </div>
  );
};

const ResourceHeader = ({ resource, filterType, stats }) => {
  if (filterType === FILTER_TYPES.ALL) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Complete Schedule Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.todayClasses}</div>
              <div className="text-sm text-gray-600">Today's Classes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.totalEnrollment}</div>
              <div className="text-sm text-gray-600">Total Enrollment</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.utilizationRate}%</div>
              <div className="text-sm text-gray-600">Capacity Utilization</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{stats.timeUtilization}%</div>
              <div className="text-sm text-gray-600">Time Utilization</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filterType === FILTER_TYPES.TRAINER && resource) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            {resource.first_name} {resource.last_name}'s Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Trainer Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{resource.experience_years} years experience</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-blue-500" />
                  <span>${resource.hourly_rate}/hour</span>
                </div>
                {resource.specialties && resource.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {resource.specialties.slice(0, 3).map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {resource.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{resource.specialties.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Today's Stats</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Classes Today:</span>
                  <span className="font-medium">{stats.todayClasses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Daily:</span>
                  <span className="font-medium">{resource.max_classes_per_day || 8}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Availability:</span>
                  <Badge className={stats.todayClasses < (resource.max_classes_per_day || 8) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {stats.todayClasses < (resource.max_classes_per_day || 8) ? "Available" : "At Capacity"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Utilization:</span>
                  <span className="font-medium">{stats.utilizationRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filterType === FILTER_TYPES.ROOM && resource) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            {resource.name} Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Room Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Capacity: {resource.capacity} people</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span>Type: {resource.room_type}</span>
                </div>
                {resource.area_sqft && (
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-purple-500" />
                    <span>{resource.area_sqft} sq ft</span>
                  </div>
                )}
                {resource.features && resource.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {resource.features.slice(0, 3).map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {resource.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{resource.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Today's Stats</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Classes Today:</span>
                  <span className="font-medium">{stats.todayClasses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Utilization:</span>
                  <span className="font-medium">{Math.round((stats.todayClasses / 12) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge className={resource.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {resource.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Capacity Usage:</span>
                  <span className="font-medium">{stats.utilizationRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

const ResourceFilteredSchedule = ({ organizationId = 'default-org-id' }) => {
  const [filterType, setFilterType] = useState(FILTER_TYPES.ALL);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Data hooks
  const { data: trainers = [], isLoading: trainersLoading } = useTrainers(organizationId);
  const { data: rooms = [], isLoading: roomsLoading } = useRooms(organizationId);
  const { data: schedule = [], isLoading: scheduleLoading } = useClassSchedule(organizationId);

  // Filter resources
  const activeTrainers = trainers.filter(t => t.is_active);
  const activeRooms = rooms.filter(r => r.is_active && r.is_bookable);

  // Get selected resource
  const selectedResource = useMemo(() => {
    if (filterType === FILTER_TYPES.TRAINER && selectedResourceId) {
      return activeTrainers.find(t => t.id === selectedResourceId);
    }
    if (filterType === FILTER_TYPES.ROOM && selectedResourceId) {
      return activeRooms.find(r => r.id === selectedResourceId);
    }
    return null;
  }, [filterType, selectedResourceId, activeTrainers, activeRooms]);

  // Filter schedule based on selected resource and date
  const filteredSchedule = useMemo(() => {
    let filtered = schedule.filter(cls => {
      const classDate = new Date(cls.start_time);
      return classDate.toDateString() === selectedDate.toDateString();
    });

    if (filterType === FILTER_TYPES.TRAINER && selectedResourceId) {
      filtered = filtered.filter(cls => cls.trainer_id === selectedResourceId);
    } else if (filterType === FILTER_TYPES.ROOM && selectedResourceId) {
      filtered = filtered.filter(cls => cls.room_id === selectedResourceId);
    }

    return filtered;
  }, [schedule, selectedDate, filterType, selectedResourceId]);

  // Calculate stats
  const stats = useMemo(() => {
    const todayClasses = filteredSchedule.length;
    const totalEnrollment = filteredSchedule.reduce((sum, cls) => sum + (cls.enrolled || 0), 0);
    const totalCapacity = filteredSchedule.reduce((sum, cls) => sum + (cls.capacity || 0), 0);
    const utilizationRate = totalCapacity > 0 ? (totalEnrollment / totalCapacity) * 100 : 0;

    // Calculate time utilization (assuming 12-hour operational day)
    const totalScheduledMinutes = filteredSchedule.reduce((sum, cls) => {
      const duration = (new Date(cls.end_time) - new Date(cls.start_time)) / (1000 * 60);
      return sum + duration;
    }, 0);
    const timeUtilization = (totalScheduledMinutes / (12 * 60)) * 100; // 12 hours = 720 minutes

    return {
      totalClasses: schedule.length,
      activeTrainers: activeTrainers.length,
      activeRooms: activeRooms.length,
      todayClasses,
      totalEnrollment,
      totalCapacity,
      utilizationRate: Math.round(utilizationRate),
      timeUtilization: Math.round(timeUtilization)
    };
  }, [schedule, activeTrainers, activeRooms, filteredSchedule]);

  // Generate time slots (6 AM to 10 PM)
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6);

  const handleFilterTypeChange = (newType) => {
    setFilterType(newType);
    setSelectedResourceId('');
  };

  const handleQuickSchedule = (timeSlot) => {
    // This would integrate with the enhanced class creation dialog
    // Pre-filling the selected resource and time slot
    const defaultStartTime = new Date(selectedDate);
    defaultStartTime.setHours(timeSlot, 0, 0, 0);

    const defaultEndTime = new Date(defaultStartTime);
    defaultEndTime.setHours(timeSlot + 1, 0, 0, 0);

    const prefilledData = {
      start_time: defaultStartTime.toISOString(),
      end_time: defaultEndTime.toISOString(),
      ...(filterType === FILTER_TYPES.TRAINER && selectedResourceId && { trainer_id: selectedResourceId }),
      ...(filterType === FILTER_TYPES.ROOM && selectedResourceId && { room_id: selectedResourceId })
    };

    // This would trigger the enhanced class creation dialog
    console.log('Quick schedule with prefilled data:', prefilledData);
    // TODO: Integrate with class creation dialog
  };

  const isLoading = trainersLoading || roomsLoading || scheduleLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading schedule data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Schedule Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Type
              </label>
              <Select value={filterType} onValueChange={handleFilterTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_TYPES.ALL}>All Resources</SelectItem>
                  <SelectItem value={FILTER_TYPES.TRAINER}>By Trainer</SelectItem>
                  <SelectItem value={FILTER_TYPES.ROOM}>By Room</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === FILTER_TYPES.TRAINER && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Trainer
                </label>
                <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTrainers.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.first_name} {trainer.last_name}
                        {trainer.specialties && trainer.specialties.length > 0 && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({trainer.specialties.slice(0, 2).join(', ')})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filterType === FILTER_TYPES.ROOM && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Room
                </label>
                <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                        <span className="text-xs text-gray-500 ml-2">
                          (Capacity: {room.capacity}, {room.room_type})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Header */}
      <ResourceHeader 
        resource={selectedResource} 
        filterType={filterType} 
        stats={stats} 
      />

      {/* Schedule View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Schedule for {selectedDate.toLocaleDateString()}
            </div>
            <Badge variant="outline">
              {filteredSchedule.length} classes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSchedule.length > 0 ? (
            <div className="space-y-0">
              {timeSlots.map((hour) => (
                <TimeSlot
                  key={hour}
                  hour={hour}
                  classes={filteredSchedule}
                  selectedResource={selectedResource}
                  filterType={filterType}
                  onQuickSchedule={handleQuickSchedule}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Classes Scheduled
              </h3>
              <p className="text-gray-500 mb-4">
                {filterType === FILTER_TYPES.ALL 
                  ? "No classes are scheduled for this date."
                  : `No classes assigned to this ${filterType} for this date.`
                }
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Schedule New Class
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceFilteredSchedule;
