import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  QrCode, 
  Camera, 
  CameraOff, 
  Scan,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { CheckInService } from '@/services/checkinService';

const QRBarcodeScanner = ({ 
  onCheckInSuccess, 
  onCheckInFailed, 
  locationId, 
  staffMemberId,
  deviceInfo = {}
}) => {
  const { toast } = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [cameraError, setCameraError] = useState(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        
        // Start scanning loop
        startScanningLoop();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Unable to access camera. Please check permissions.');
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions and try again.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const startScanningLoop = () => {
    if (!isScanning) return;

    const scanFrame = () => {
      if (!videoRef.current || !canvasRef.current || !isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data for processing
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Here you would integrate with a QR/barcode scanning library
        // For now, we'll simulate scanning with a manual input fallback
        // In a real implementation, you'd use libraries like:
        // - @zxing/library for QR codes
        // - quagga2 for barcodes
        // - jsQR for QR codes
      }

      // Continue scanning
      if (isScanning) {
        requestAnimationFrame(scanFrame);
      }
    };

    requestAnimationFrame(scanFrame);
  };

  const handleManualInput = async (code) => {
    if (!code || isProcessing) return;

    setIsProcessing(true);
    
    try {
      // Try to check in using the scanned/entered code
      const result = await CheckInService.checkInByAccessCard(code, {
        locationId,
        staffMemberId,
        method: 'qr_scan',
        deviceInfo: {
          ...deviceInfo,
          scanner_type: 'web_camera',
          timestamp: new Date().toISOString()
        }
      });

      const scanRecord = {
        id: Date.now(),
        code,
        timestamp: new Date().toISOString(),
        success: result.success,
        message: result.message || (result.success ? 'Check-in successful' : 'Check-in failed')
      };

      setLastScanResult(scanRecord);
      setScanHistory(prev => [scanRecord, ...prev.slice(0, 4)]); // Keep last 5 scans

      if (result.success) {
        toast({
          title: "Check-In Successful",
          description: `Welcome ${result.member?.first_name || 'Member'}!`,
          variant: "default"
        });
        onCheckInSuccess?.(result);
      } else {
        toast({
          title: "Check-In Failed",
          description: result.message || "Invalid access card or member not found",
          variant: "destructive"
        });
        onCheckInFailed?.(result);
      }

    } catch (error) {
      console.error('Error processing scan:', error);
      const errorRecord = {
        id: Date.now(),
        code,
        timestamp: new Date().toISOString(),
        success: false,
        message: 'Error processing scan'
      };
      
      setLastScanResult(errorRecord);
      setScanHistory(prev => [errorRecord, ...prev.slice(0, 4)]);
      
      toast({
        title: "Scan Error",
        description: "Error processing scan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Scanner Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code / Barcode Scanner
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Scan member access cards or QR codes for quick check-in
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Controls */}
          <div className="flex gap-2">
            {!isScanning ? (
              <Button onClick={startCamera} className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Start Camera
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="outline" className="flex items-center gap-2">
                <CameraOff className="h-4 w-4" />
                Stop Camera
              </Button>
            )}
          </div>

          {/* Camera Error */}
          {cameraError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{cameraError}</p>
            </div>
          )}

          {/* Camera View */}
          {isScanning && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-w-md mx-auto rounded-lg border"
                style={{ maxHeight: '300px' }}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-primary border-dashed rounded-lg w-48 h-48 flex items-center justify-center">
                  <Scan className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
              
              {isProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="bg-white p-4 rounded-lg flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Input Fallback */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">Manual Entry:</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter access card number or QR code"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualInput(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <Button
                size="sm"
                onClick={(e) => {
                  const input = e.target.parentElement.querySelector('input');
                  handleManualInput(input.value);
                  input.value = '';
                }}
              >
                Check In
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Scan Result */}
      {lastScanResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Last Scan Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {lastScanResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">{lastScanResult.code}</span>
              </div>
              <div className="text-right">
                <Badge variant={lastScanResult.success ? 'default' : 'destructive'}>
                  {lastScanResult.success ? 'Success' : 'Failed'}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(lastScanResult.timestamp)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{lastScanResult.message}</p>
          </CardContent>
        </Card>
      )}

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
                    {scan.success ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-xs font-mono">{scan.code}</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatTime(scan.timestamp)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QRBarcodeScanner;
