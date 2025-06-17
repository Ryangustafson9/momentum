/**
 * 📱 MOBILE TEST PAGE
 * Test page to verify mobile responsiveness and PWA features
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Wifi, 
  Download,
  TouchIcon,
  Zap,
  Eye
} from 'lucide-react';
import { useBreakpoint, useMobile, useOrientation } from '@/hooks/useResponsive';
import { usePWA } from '@/hooks/usePWA';
import TouchFriendlyButton from '@/components/mobile/TouchFriendlyButton';

const MobileTest = () => {
  const breakpointInfo = useBreakpoint();
  const mobileInfo = useMobile();
  const orientationInfo = useOrientation();
  const pwaInfo = usePWA();
  const [testCount, setTestCount] = useState(0);

  const handleTouchTest = () => {
    setTestCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 safe-area-inset-top safe-area-inset-bottom">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📱 Mobile Test Page
          </h1>
          <p className="text-gray-600">
            Testing responsive design and PWA features
          </p>
        </motion.div>

        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Screen Size</h3>
                <div className="space-y-1">
                  <Badge variant="outline">
                    {breakpointInfo.width}px × {window.innerHeight}px
                  </Badge>
                  <Badge variant={breakpointInfo.isMobile ? 'default' : 'secondary'}>
                    {breakpointInfo.breakpoint.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Device Type</h3>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={mobileInfo.isMobile ? 'default' : 'outline'}>
                    📱 Mobile: {mobileInfo.isMobile ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={mobileInfo.isTablet ? 'default' : 'outline'}>
                    📟 Tablet: {mobileInfo.isTablet ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={mobileInfo.touchDevice ? 'default' : 'outline'}>
                    👆 Touch: {mobileInfo.touchDevice ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Orientation</h3>
                <Badge variant="outline" className="flex items-center gap-1">
                  {orientationInfo.isPortrait ? (
                    <Smartphone className="h-3 w-3" />
                  ) : (
                    <Monitor className="h-3 w-3" />
                  )}
                  {orientationInfo.orientation}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PWA Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              PWA Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Installation</h3>
                <div className="space-y-1">
                  <Badge variant={pwaInfo.isInstallable ? 'default' : 'outline'}>
                    Installable: {pwaInfo.isInstallable ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={pwaInfo.isInstalled ? 'default' : 'outline'}>
                    Installed: {pwaInfo.isInstalled ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Connection</h3>
                <Badge variant={pwaInfo.isOnline ? 'default' : 'destructive'} className="flex items-center gap-1 w-fit">
                  <Wifi className="h-3 w-3" />
                  {pwaInfo.isOnline ? 'Online' : 'Offline'}
                </Badge>
                {pwaInfo.updateAvailable && (
                  <Badge variant="secondary">Update Available</Badge>
                )}
              </div>
            </div>

            {pwaInfo.isInstallable && (
              <div className="pt-2">
                <TouchFriendlyButton
                  onClick={pwaInfo.installPWA}
                  className="w-full md:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </TouchFriendlyButton>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Touch Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TouchIcon className="h-5 w-5" />
              Touch Interaction Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Test touch-friendly buttons with haptic feedback and visual effects.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <TouchFriendlyButton
                variant="default"
                onClick={handleTouchTest}
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Primary ({testCount})
              </TouchFriendlyButton>

              <TouchFriendlyButton
                variant="secondary"
                onClick={handleTouchTest}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Secondary
              </TouchFriendlyButton>

              <TouchFriendlyButton
                variant="outline"
                onClick={handleTouchTest}
                className="w-full"
              >
                Outline
              </TouchFriendlyButton>

              <TouchFriendlyButton
                variant="destructive"
                onClick={handleTouchTest}
                className="w-full"
              >
                Destructive
              </TouchFriendlyButton>
            </div>

            <div className="text-center pt-4">
              <Badge variant="outline">
                Touch Count: {testCount}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Responsive Grid Test */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Grid Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gradient-to-br from-purple-100 to-pink-100 p-4 rounded-lg text-center"
                >
                  <div className="text-2xl mb-2">📱</div>
                  <div className="text-sm font-medium">Card {i + 1}</div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safe Area Test */}
        <Card className="safe-area-inset-bottom">
          <CardHeader>
            <CardTitle>Safe Area Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This card respects safe areas on devices with notches or home indicators.
            </p>
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-sm">
                Content should not be hidden behind device UI elements.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileTest;
