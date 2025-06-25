import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Scan, 
  User, 
  Clock, 
  Wifi, 
  WifiOff,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Phone
} from 'lucide-react';
import { CheckInStation } from '@/components/checkin';
import CheckInService from '@/services/checkinService';
import QRCodeService from '@/services/qrCodeService';

/**
 * Check-In Kiosk Page
 * Full-screen kiosk interface for member self-service check-ins
 * Designed for tablets at gym entrances
 */
const CheckInKiosk = () => {
  const { toast } = useToast();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [kioskMode, setKioskMode] = useState('scan'); // 'scan', 'card', 'manual'
  const [accessCardInput, setAccessCardInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [todayStats, setTodayStats] = useState({ total: 0, successful: 0 });

  // Get location and station info from URL params or config
  const urlParams = new URLSearchParams(window.location.search);
  const locationId = urlParams.get('location') || 'default';
  const locationName = urlParams.get('locationName') || 'Main Location';
  const stationId = urlParams.get('station') || 'kiosk-1';

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load today's stats
    loadTodayStats();
    
    // Refresh stats every minute
    const interval = setInterval(loadTodayStats, 60000);

    // Auto-clear access card input after 30 seconds of inactivity
    let clearTimer;
    const resetClearTimer = () => {
      clearTimeout(clearTimer);
      clearTimer = setTimeout(() => {
        setAccessCardInput('');
        setKioskMode('scan');
      }, 30000);
    };

    if (accessCardInput) {
      resetClearTimer();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      clearTimeout(clearTimer);
    };
  }, [accessCardInput]);

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await CheckInService.getRecentCheckIns(locationId, 100);
      
      if (result.data) {
        const todayCheckIns = result.data.filter(
          checkin => checkin.check_in_time.startsWith(today)
        );
        
        const successful = todayCheckIns.filter(
          checkin => checkin.validation_status === 'valid'
        ).length;

        setTodayStats({
          total: todayCheckIns.length,
          successful
        });
      }
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  const handleAccessCardSubmit = async (e) => {
    e.preventDefault();
    if (!accessCardInput.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await CheckInService.checkInByAccessCard(accessCardInput.trim(), {
        locationId,
        deviceInfo: {
          station_id: stationId,
          device_type: 'self_service_kiosk',
          interface_type: 'access_card_input'
        }
      });

      if (result.success) {
        handleCheckInSuccess(result);
      } else {
        handleCheckInFailure(result);
      }
    } catch (error) {
      console.error('Error processing access card:', error);
      toast({
        title: "System Error",
        description: "Please try again or contact staff for assistance.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setAccessCardInput('');
      // Return to scan mode after a delay
      setTimeout(() => setKioskMode('scan'), 3000);
    }
  };

  const handleCheckInSuccess = (result) => {
    const member = result.member;
    const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email;

    setLastCheckIn({
      memberName,
      timestamp: new Date(),
      status: 'success'
    });

    setTodayStats(prev => ({
      total: prev.total + 1,
      successful: prev.successful + 1
    }));

    toast({
      title: "Welcome!",
      description: `${memberName} - Check-in successful. Enjoy your workout!`,
      variant: "default"
    });

    // Auto-clear success message after 5 seconds
    setTimeout(() => {
      setLastCheckIn(null);
      setKioskMode('scan');
    }, 5000);
  };

  const handleCheckInFailure = (result) => {
    const errorMessages = {
      'member_not_found': 'Member not found. Please contact staff.',
      'guest_denied': 'Guest access not permitted. Please contact staff.',
      'already_checked_in': 'You have already checked in today.',
      'suspended': 'Account suspended. Please contact staff.',
      'inactive_member': 'Account inactive. Please contact staff.',
      'no_active_membership': 'No active membership. Please contact staff.',
      'invalid_card': 'Invalid access card. Please contact staff.',
      'expired_card': 'Access card expired. Please contact staff.'
    };

    const message = errorMessages[result.reason] || 'Check-in failed. Please contact staff.';

    setLastCheckIn({
      memberName: 'Check-in Failed',
      timestamp: new Date(),
      status: 'failed',
      message
    });

    toast({
      title: "Check-In Failed",
      description: message,
      variant: "destructive"
    });

    // Auto-clear error message after 5 seconds
    setTimeout(() => {
      setLastCheckIn(null);
      setKioskMode('scan');
    }, 5000);
  };

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <WifiOff className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-red-700 mb-2">System Offline</h2>
            <p className="text-red-600 mb-4">
              Check-in system is currently offline. Please contact staff for assistance.
            </p>
            <Badge variant="destructive" className="text-lg px-4 py-2">
              Offline
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Momentum Gym</h1>
          <p className="text-xl text-gray-600">Please check in to access the facility</p>
          <p className="text-sm text-gray-500 mt-2">
            Location: {locationName}
          </p>
          
          {/* Status Bar */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-green-500" />
              <Badge variant="outline">Online</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <span className="text-sm">{todayStats.successful} successful check-ins today</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <span className="text-sm">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Last Check-In Status */}
        {lastCheckIn && (
          <Card className={`mb-6 ${lastCheckIn.status === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            <CardContent className="p-6 text-center">
              {lastCheckIn.status === 'success' ? (
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
              ) : (
                <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-3" />
              )}
              <h3 className={`text-xl font-bold mb-2 ${lastCheckIn.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {lastCheckIn.status === 'success' ? `Welcome, ${lastCheckIn.memberName}!` : lastCheckIn.memberName}
              </h3>
              <p className={`${lastCheckIn.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {lastCheckIn.status === 'success' ? 'Check-in successful. Enjoy your workout!' : lastCheckIn.message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Check-In Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* QR Code Scanning */}
          <Card className={`cursor-pointer transition-all ${kioskMode === 'scan' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'}`}>
            <CardHeader className="text-center">
              <Scan className="h-16 w-16 mx-auto text-blue-500 mb-4" />
              <CardTitle className="text-xl">Scan QR Code</CardTitle>
              <p className="text-gray-600">Show your QR code from the mobile app</p>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => setKioskMode('scan')} 
                className="w-full text-lg py-6"
                variant={kioskMode === 'scan' ? 'default' : 'outline'}
              >
                Start QR Scanner
              </Button>
            </CardContent>
          </Card>

          {/* Access Card */}
          <Card className={`cursor-pointer transition-all ${kioskMode === 'card' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-lg'}`}>
            <CardHeader className="text-center">
              <CreditCard className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <CardTitle className="text-xl">Access Card</CardTitle>
              <p className="text-gray-600">Enter your access card number</p>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => setKioskMode('card')} 
                className="w-full text-lg py-6"
                variant={kioskMode === 'card' ? 'default' : 'outline'}
              >
                Enter Card Number
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active Interface */}
        {kioskMode === 'scan' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">QR Code Scanner</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckInStation
                locationId={locationId}
                locationName={locationName}
                stationId={stationId}
                staffMemberId={null} // No staff for self-service
              />
            </CardContent>
          </Card>
        )}

        {kioskMode === 'card' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Enter Access Card Number</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAccessCardSubmit} className="space-y-6">
                <div className="text-center">
                  <Input
                    type="text"
                    placeholder="Enter your access card number"
                    value={accessCardInput}
                    onChange={(e) => setAccessCardInput(e.target.value)}
                    className="text-center text-xl py-6 text-2xl tracking-wider"
                    autoFocus
                    disabled={isProcessing}
                  />
                </div>
                
                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setAccessCardInput('');
                      setKioskMode('scan');
                    }}
                    className="flex-1 py-6 text-lg"
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 py-6 text-lg"
                    disabled={!accessCardInput.trim() || isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Check In'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <Phone className="h-8 w-8 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
            <p className="text-gray-600">
              Contact our staff at the front desk or call (555) 123-4567 for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckInKiosk;
