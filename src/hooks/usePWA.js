/**
 * 📱 PWA INSTALLATION HOOK
 * Handle PWA installation, updates, and offline status
 */

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Check if app is installed
  useEffect(() => {
    const checkInstallation = () => {
      // Check if running in standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone ||
                          document.referrer.includes('android-app://');
      
      setIsInstalled(isStandalone);
      logger.info('PWA Installation Status:', { isStandalone });
    };

    checkInstallation();
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      logger.info('PWA: Install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      logger.info('PWA: App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('PWA: Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.info('PWA: Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Service Worker registration and updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      logger.info('PWA: Service Worker registered successfully');

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            logger.info('PWA: Update available');
            setUpdateAvailable(true);
          }
        });
      });

      // Handle controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        logger.info('PWA: New service worker activated');
        window.location.reload();
      });

    } catch (error) {
      logger.error('PWA: Service Worker registration failed:', error);
    }
  };

  // Install the PWA
  const installPWA = useCallback(async () => {
    if (!deferredPrompt) {
      logger.warn('PWA: No install prompt available');
      return false;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      logger.info('PWA: Install prompt result:', outcome);
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('PWA: Installation failed:', error);
      return false;
    }
  }, [deferredPrompt]);

  // Update the app
  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  }, []);

  // Get installation instructions for different platforms
  const getInstallInstructions = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return {
        platform: 'iOS',
        steps: [
          'Tap the Share button in Safari',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install the app'
        ]
      };
    } else if (userAgent.includes('android')) {
      return {
        platform: 'Android',
        steps: [
          'Tap the menu button (⋮) in Chrome',
          'Select "Add to Home screen"',
          'Tap "Add" to install the app'
        ]
      };
    } else {
      return {
        platform: 'Desktop',
        steps: [
          'Look for the install icon in your browser\'s address bar',
          'Click the install button',
          'Follow the prompts to add to your desktop'
        ]
      };
    }
  }, []);

  // Check if device supports PWA features
  const getPWACapabilities = useCallback(() => {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      webShare: 'share' in navigator,
      fullscreen: 'requestFullscreen' in document.documentElement,
      deviceMotion: 'DeviceMotionEvent' in window,
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    };
  }, []);

  return {
    // Installation state
    isInstallable,
    isInstalled,
    installPWA,
    
    // Connection state
    isOnline,
    
    // Updates
    updateAvailable,
    updateApp,
    
    // Utilities
    getInstallInstructions,
    getPWACapabilities,
  };
};

export default usePWA;

