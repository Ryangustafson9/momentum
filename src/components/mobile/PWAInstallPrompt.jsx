/**
 * 📱 PWA INSTALL PROMPT COMPONENT
 * Encourage users to install the app for better experience
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone, Monitor, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePWA } from '@/hooks/usePWA';
import { useMobile } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from 'react-error-boundary';

const PWAInstallPromptContent = ({ 
  className = '',
  showAfterDelay = 30000, // Show after 30 seconds
  maxDismissals = 3 // Max times user can dismiss before hiding permanently
}) => {
  const { isInstallable, isInstalled, installPWA, getInstallInstructions } = usePWA();
  const { isMobile } = useMobile();
  const [isVisible, setIsVisible] = useState(false);
  const [dismissCount, setDismissCount] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);

  // Check localStorage for previous dismissals
  useEffect(() => {
    const stored = localStorage.getItem('pwa-install-dismissals');
    const count = stored ? parseInt(stored, 10) : 0;
    setDismissCount(count);
  }, []);

  // Show prompt after delay if conditions are met
  useEffect(() => {
    if (!isInstallable || isInstalled || dismissCount >= maxDismissals) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, showAfterDelay);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, dismissCount, maxDismissals, showAfterDelay]);

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      setIsVisible(false);
    } else {
      // Show manual instructions if automatic install fails
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    const newCount = dismissCount + 1;
    setDismissCount(newCount);
    localStorage.setItem('pwa-install-dismissals', newCount.toString());
    setIsVisible(false);
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
  };

  const instructions = getInstallInstructions();

  // Don't render if not installable, already installed, or dismissed too many times
  if (!isInstallable || isInstalled || dismissCount >= maxDismissals) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className={cn(
            'fixed bottom-4 left-4 right-4 z-50',
            isMobile ? 'bottom-20' : 'bottom-4', // Account for mobile bottom nav
            className
          )}
        >
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 p-2 bg-white/20 rounded-lg">
                  {isMobile ? (
                    <Smartphone className="h-5 w-5" />
                  ) : (
                    <Monitor className="h-5 w-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">Install Momentum App</h3>
                    <Badge variant="secondary" className="text-xs">
                      Free
                    </Badge>
                  </div>
                  
                  <p className="text-xs opacity-90 mb-3">
                    Get faster access, offline support, and a native app experience
                  </p>

                  {/* Benefits */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <div className="flex items-center gap-1 text-xs bg-white/20 rounded-full px-2 py-1">
                      <span>⚡</span>
                      <span>Faster</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs bg-white/20 rounded-full px-2 py-1">
                      <span>📱</span>
                      <span>Native Feel</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs bg-white/20 rounded-full px-2 py-1">
                      <span>🔄</span>
                      <span>Offline Mode</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleInstall}
                      className="text-xs h-8 px-3"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Install
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleShowInstructions}
                      className="text-xs h-8 px-3 text-primary-foreground hover:bg-white/20"
                    >
                      <Share className="h-3 w-3 mr-1" />
                      How?
                    </Button>
                  </div>
                </div>

                {/* Close button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="flex-shrink-0 h-8 w-8 p-0 text-primary-foreground hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Installation Instructions Modal */}
      {showInstructions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowInstructions(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    {instructions.platform === 'iOS' ? (
                      <Smartphone className="h-6 w-6 text-primary" />
                    ) : instructions.platform === 'Android' ? (
                      <Smartphone className="h-6 w-6 text-primary" />
                    ) : (
                      <Monitor className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Install on {instructions.platform}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Follow these steps to install the app:
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {instructions.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowInstructions(false)}
                    className="flex-1"
                  >
                    Got it
                  </Button>
                  <Button
                    onClick={handleInstall}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Try Auto Install
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const PWAInstallPrompt = (props) => {
  return (
    <ErrorBoundary
      fallback={<div className="hidden">PWA prompt error</div>}
      onError={(error) => console.error('PWA Install Prompt Error:', error)}
    >
      <PWAInstallPromptContent {...props} />
    </ErrorBoundary>
  );
};

export default PWAInstallPrompt;
