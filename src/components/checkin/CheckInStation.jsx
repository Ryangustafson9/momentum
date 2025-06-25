import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Scan, 
  User, 
  Clock, 
  Settings, 
  Wifi, 
  WifiOff,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import QRCodeScanner from './QRCodeScanner';
import ManualCheckIn from './ManualCheckIn';
import CheckInService from '@/services/checkinService';

/**
 * Check-In Station Interface
 * Tablet-optimized interface for gym entrance check-in stations
 */
const CheckInStation = ({
  locationId = null,
  locationName = 'Main Location',
  stationId = 'station-1',
  staffMemberId = null,
  className = ''
}) => {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('scanner');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stationStats, setStationStats] = useState({
    todayCheckIns: 0,
    successfulScans: 0,
    failedAttempts: 0,
    lastCheckIn: null
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Device info for tracking
  const deviceInfo = {
    station_id: stationId,
    device_type: 'check_in_station',
    user_agent: navigator.userAgent,
    screen_resolution: `${screen.width}x${screen.height}`,
    timestamp: new Date().toISOString()
  };

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load initial data
    loadStationStats();
    loadRecentActivity();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      loadStationStats();
      loadRecentActivity();
    }, 30000); // Refresh every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [locationId]);

  const loadStationStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await CheckInService.getRecentCheckIns(locationId, 100);
      
      if (result.data) {
        const todayCheckIns = result.data.filter(
          checkin => checkin.check_in_time.startsWith(today)
        );
        
        const successfulScans = todayCheckIns.filter(
          checkin => checkin.validation_status === 'valid'
        ).length;
        
        const failedAttempts = todayCheckIns.filter(
          checkin => checkin.validation_status !== 'valid'
        ).length;

        setStationStats({
          todayCheckIns: todayCheckIns.length,
          successfulScans,
          failedAttempts,
          lastCheckIn: todayCheckIns[0] || null
        });
      }
    } catch (error) {
      console.error('Error loading station stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const result = await CheckInService.getRecentCheckIns(locationId, 5);
      if (result.data) {
        setRecentActivity(result.data);
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const handleCheckInSuccess = (result) => {
    // Update stats
    setStationStats(prev => ({
      ...prev,
      todayCheckIns: prev.todayCheckIns + 1,
      successfulScans: prev.successfulScans + 1,
      lastCheckIn: result.checkinRecord
    }));

    // Add to recent activity
    setRecentActivity(prev => [result.checkinRecord, ...prev.slice(0, 4)]);

    // Show success feedback
    toast({
      title: "Check-In Successful",
      description: `Welcome ${result.member.first_name}!`,
      variant: "default"
    });
  };

  const handleCheckInFailed = (result) => {
    // Update stats
    setStationStats(prev => ({
      ...prev,
      failedAttempts: prev.failedAttempts + 1
    }));

    // Show error feedback
    toast({
      title: "Check-In Failed",
      description: result.message || "Please contact staff for assistance",
      variant: "destructive"
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOnline) {
    return (
      <div className={`min-h-screen bg-red-50 flex items-center justify-center ${className}`}>
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <WifiOff className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-700 mb-2">Connection Lost</h2>
            <p className="text-red-600 mb-4">
              Check-in station is offline. Please check your internet connection.
            </p>
            <Badge variant="destructive">Offline Mode</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Momentum Gym</h1>
              <p className="text-gray-600">Check-In Station</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-green-500" />
                <Badge variant="outline">Online</Badge>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>{new Date().toLocaleDateString()}</p>
                <p>{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">{stationStats.todayCheckIns}</p>
              <p className="text-sm text-gray-600">Today's Check-Ins</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Scan className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-blue-600">{stationStats.successfulScans}</p>
              <p className="text-sm text-gray-600">Successful Scans</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <p className="text-2xl font-bold text-orange-600">{stationStats.failedAttempts}</p>
              <p className="text-sm text-gray-600">Failed Attempts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <p className="text-lg font-bold text-purple-600">
                {stationStats.lastCheckIn ? formatTime(stationStats.lastCheckIn.check_in_time) : '--:--'}
              </p>
              <p className="text-sm text-gray-600">Last Check-In</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Check-In Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* QR Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  QR Code Scanner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QRCodeScanner
                  onCheckInSuccess={handleCheckInSuccess}
                  onCheckInFailed={handleCheckInFailed}
                  locationId={locationId}
                  locationName={locationName}
                  staffMemberId={staffMemberId}
                  deviceInfo={deviceInfo}
                />
              </CardContent>
            </Card>

            {/* Manual Check-In - Always Visible */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Manual Check-In
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ManualCheckIn
                  onCheckInSuccess={handleCheckInSuccess}
                  onCheckInFailed={handleCheckInFailed}
                  locationId={locationId}
                  locationName={locationName}
                  staffMemberId={staffMemberId}
                  deviceInfo={deviceInfo}
                />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Sidebar */}
          <div className="space-y-6">
            {/* Recent Check-Ins */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">
                            {activity.profile?.first_name} {activity.profile?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(activity.check_in_time)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={activity.validation_status === 'valid' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {activity.validation_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Station Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Station Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Station ID:</span>
                  <span className="font-mono">{stationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span>{locationId || 'Default'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Sync:</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInStation;
