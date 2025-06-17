// 🧪 SCHEDULING TEST PANEL - Test Phase 1 implementation
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Wrench, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTrainers, useRooms, useEquipment, useClassSchedule } from '@/hooks/useScheduling';

const SchedulingTestPanel = () => {
  const { data: trainers = [], isLoading: trainersLoading, error: trainersError } = useTrainers();
  const { data: rooms = [], isLoading: roomsLoading, error: roomsError } = useRooms();
  const { data: equipment = [], isLoading: equipmentLoading, error: equipmentError } = useEquipment();
  const { data: schedule = [], isLoading: scheduleLoading, error: scheduleError } = useClassSchedule();

  const TestSection = ({ title, icon: Icon, data, loading, error, color = "blue" }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Icon className={`w-5 h-5 mr-2 text-${color}-600`} />
          {title}
          {loading && <Badge variant="outline" className="ml-2">Loading...</Badge>}
          {error && <Badge variant="destructive" className="ml-2">Error</Badge>}
          {!loading && !error && <Badge variant="outline" className={`ml-2 text-green-600`}>✓ {data.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading {title.toLowerCase()}...</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error.message}</span>
          </div>
        )}
        
        {!loading && !error && (
          <div className="space-y-2">
            {data.length > 0 ? (
              <div className="grid gap-2">
                {data.slice(0, 3).map((item, index) => (
                  <div key={item.id || index} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="font-medium">
                      {item.name || `${item.first_name} ${item.last_name}` || 'Unnamed'}
                    </div>
                    {item.specialties && (
                      <div className="text-xs text-gray-600">
                        Specialties: {item.specialties.join(', ')}
                      </div>
                    )}
                    {item.room_type && (
                      <div className="text-xs text-gray-600">
                        Type: {item.room_type} • Capacity: {item.capacity}
                      </div>
                    )}
                    {item.equipment_type && (
                      <div className="text-xs text-gray-600">
                        Type: {item.equipment_type} • Qty: {item.quantity_available}/{item.quantity_total}
                      </div>
                    )}
                    {item.start_time && (
                      <div className="text-xs text-gray-600">
                        {new Date(item.start_time).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
                {data.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{data.length - 3} more items
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No {title.toLowerCase()} found
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const overallStatus = {
    trainers: !trainersLoading && !trainersError,
    rooms: !roomsLoading && !roomsError,
    equipment: !equipmentLoading && !equipmentError,
    schedule: !scheduleLoading && !scheduleError
  };

  const allSystemsOperational = Object.values(overallStatus).every(status => status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scheduling System Test Panel</h2>
          <p className="text-gray-600">Phase 1: Database Schema & Services Testing</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {allSystemsOperational ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-4 h-4 mr-1" />
              All Systems Operational
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertTriangle className="w-4 h-4 mr-1" />
              System Issues Detected
            </Badge>
          )}
        </div>
      </div>

      {/* Test Results Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <TestSection
          title="Trainers"
          icon={Users}
          data={trainers}
          loading={trainersLoading}
          error={trainersError}
          color="blue"
        />
        
        <TestSection
          title="Rooms"
          icon={MapPin}
          data={rooms}
          loading={roomsLoading}
          error={roomsError}
          color="green"
        />
        
        <TestSection
          title="Equipment"
          icon={Wrench}
          data={equipment}
          loading={equipmentLoading}
          error={equipmentError}
          color="purple"
        />
        
        <TestSection
          title="Schedule"
          icon={Calendar}
          data={schedule}
          loading={scheduleLoading}
          error={scheduleError}
          color="orange"
        />
      </div>

      {/* System Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 1 Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Database Schema</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Trainers Table</span>
                  <Badge variant={overallStatus.trainers ? "default" : "destructive"}>
                    {overallStatus.trainers ? "✓ Connected" : "✗ Error"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Rooms Table</span>
                  <Badge variant={overallStatus.rooms ? "default" : "destructive"}>
                    {overallStatus.rooms ? "✓ Connected" : "✗ Error"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Equipment Table</span>
                  <Badge variant={overallStatus.equipment ? "default" : "destructive"}>
                    {overallStatus.equipment ? "✓ Connected" : "✗ Error"}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Services & Hooks</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Scheduling Service</span>
                  <Badge variant="default">✓ Implemented</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>React Query Hooks</span>
                  <Badge variant="default">✓ Implemented</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Enhanced Class Schedule</span>
                  <Badge variant={overallStatus.schedule ? "default" : "destructive"}>
                    {overallStatus.schedule ? "✓ Connected" : "✗ Error"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div>• Phase 2: Core Resource Management Components</div>
              <div>• Phase 3: Advanced Scheduling Features</div>
              <div>• Phase 4: Conflict Detection & Resolution</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulingTestPanel;
