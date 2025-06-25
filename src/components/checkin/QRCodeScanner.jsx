import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Camera, X, Scan, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import QrScanner from 'qr-scanner';
import CheckInService from '@/services/checkinService';
import QRCodeService from '@/services/qrCodeService';

/**
 * QR Code Scanner Component for Check-ins
 */
const QRCodeScanner = ({
  onCheckInSuccess,
  onCheckInFailed,
  locationId = null,
  locationName = 'Main Location',
  staffMemberId = null,
  deviceInfo = {},
  className = ''
}) => {
  const { toast } = useToast();
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  // Initialize camera and scanner
  useEffect(() => {
    checkCameraAvailability();
    return () => {
      stopScanning();
    };
  }, []);

  const checkCameraAvailability = async () => {
    try {
      const hasCamera = await QrScanner.hasCamera();
      setHasCamera(hasCamera);
      
      if (!hasCamera) {
        toast({
          title: "No Camera Available",
          description: "Camera access is required for QR code scanning.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error checking camera availability:', error);
      setHasCamera(false);
    }
  };

  const startScanning = async () => {
    if (!hasCamera || !videoRef.current) return;

    try {
      setIsScanning(true);
      
      // Create QR scanner instance
      scannerRef.current = new QrScanner(
        videoRef.current,
        handleScanResult,
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment' // Use back camera on mobile
        }
      );

      await scannerRef.current.start();
      
      toast({
        title: "Scanner Active",
        description: "Point camera at QR code to check in",
        variant: "default"
      });

    } catch (error) {
      console.error('Error starting scanner:', error);
      setIsScanning(false);
      
      toast({
        title: "Scanner Error",
        description: "Failed to start camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanResult = async (result) => {
    if (isProcessing) return; // Prevent multiple simultaneous scans

    const qrData = result.data;
    
    // Prevent scanning the same code multiple times quickly
    if (lastScanResult === qrData && Date.now() - (lastScanResult?.timestamp || 0) < 3000) {
      return;
    }

    setIsProcessing(true);
    setLastScanResult({ data: qrData, timestamp: Date.now() });

    try {
      // Validate QR code format first
      const qrValidation = await QRCodeService.decodeQRCodeData(qrData);
      
      if (!qrValidation.valid) {
        handleScanError(qrValidation.reason, qrValidation.message);
        return;
      }

      // Perform check-in
      const checkInResult = await CheckInService.checkInByQRCode(qrData, {
        staffMemberId,
        locationId,
        deviceInfo: {
          ...deviceInfo,
          scan_method: 'camera',
          scanner_type: 'web_qr_scanner'
        }
      });

      if (checkInResult.success) {
        handleCheckInSuccess(checkInResult);
      } else {
        handleCheckInFailure(checkInResult);
      }

    } catch (error) {
      console.error('Error processing QR scan:', error);
      handleScanError('processing_error', 'Error processing QR code scan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckInSuccess = (result) => {
    const member = result.member;
    const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email;

    // Add to scan history
    setScanHistory(prev => [{
      id: result.checkinRecord.id,
      memberName,
      timestamp: new Date(),
      status: 'success',
      method: 'qr_scan'
    }, ...prev.slice(0, 9)]); // Keep last 10 scans

    toast({
      title: "Check-In Successful",
      description: `${memberName} has been checked in successfully`,
      variant: "default"
    });

    onCheckInSuccess?.(result);

    // Brief pause before allowing next scan
    setTimeout(() => {
      setLastScanResult(null);
    }, 2000);
  };

  const handleCheckInFailure = (result) => {
    const errorMessages = {
      'member_not_found': 'Member not found in system',
      'guest_denied': 'Guest access not permitted',
      'already_checked_in': 'Member already checked in today',
      'suspended': 'Member account is suspended',
      'inactive_member': 'Member account is inactive',
      'no_active_membership': 'No active membership found',
      'invalid_qr_code': 'Invalid or expired QR code'
    };

    const message = errorMessages[result.reason] || result.message || 'Check-in failed';

    // Add to scan history
    setScanHistory(prev => [{
      id: Date.now(),
      memberName: 'Unknown',
      timestamp: new Date(),
      status: 'failed',
      reason: result.reason,
      message: message
    }, ...prev.slice(0, 9)]);

    toast({
      title: "Check-In Failed",
      description: message,
      variant: "destructive"
    });

    onCheckInFailed?.(result);

    // Allow immediate retry for failed scans
    setLastScanResult(null);
  };

  const handleScanError = (reason, message) => {
    toast({
      title: "Scan Error",
      description: message,
      variant: "destructive"
    });

    setScanHistory(prev => [{
      id: Date.now(),
      memberName: 'Invalid QR Code',
      timestamp: new Date(),
      status: 'error',
      reason: reason,
      message: message
    }, ...prev.slice(0, 9)]);

    setLastScanResult(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <X className="h-4 w-4 text-orange-500" />;
      default:
        return <Scan className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      success: 'default',
      failed: 'destructive',
      error: 'secondary'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="text-xs">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!hasCamera) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Camera Not Available</h3>
          <p className="text-gray-600 mb-4">
            Camera access is required for QR code scanning. Please check your device permissions.
          </p>
          <Button onClick={checkCameraAvailability} variant="outline">
            Check Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Scanner Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              QR Code Scanner
            </div>
            {isScanning && (
              <Badge variant="outline" className="animate-pulse">
                Scanning...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Preview */}
          <div className="relative">
            <video
              ref={videoRef}
              className={`w-full h-64 bg-gray-100 rounded-lg object-cover ${
                !isScanning ? 'hidden' : ''
              }`}
              playsInline
              muted
            />
            
            {!isScanning && (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">Camera preview will appear here</p>
                </div>
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                  <p>Processing QR Code...</p>
                </div>
              </div>
            )}
          </div>

          {/* Scanner Controls */}
          <div className="flex gap-2">
            {!isScanning ? (
              <Button onClick={startScanning} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Start Scanner
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="outline" className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Stop Scanner
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(scan.status)}
                    <div>
                      <p className="text-sm font-medium">{scan.memberName}</p>
                      <p className="text-xs text-gray-500">
                        {scan.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(scan.status)}
                    {scan.message && (
                      <p className="text-xs text-gray-500 mt-1 max-w-32 truncate">
                        {scan.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QRCodeScanner;
