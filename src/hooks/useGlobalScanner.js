import { useEffect, useRef, useCallback } from 'react';
import { SCANNER_CONFIG } from '@/config/appConfig';

/**
 * Global Scanner Hook
 * 
 * Detects input from keyboard-emulating barcode or QR scanners globally across the app.
 * Listens for short sequences (6-12 characters) and triggers on Enter or similar patterns.
 * 
 * Features:
 * - Non-blocking: Works while user is in POS, forms, or any other interface
 * - Configurable: Adjustable timing and character limits
 * - Debounced: Prevents duplicate scans
 * - Global: Works from anywhere in the app
 */

const useGlobalScanner = (onScan, options = {}) => {
  const {
    minLength = SCANNER_CONFIG.MIN_LENGTH,
    maxLength = SCANNER_CONFIG.MAX_LENGTH,
    timeout = SCANNER_CONFIG.TIMEOUT,
    endCharacters = SCANNER_CONFIG.END_CHARACTERS,
    enabled = true,
    preventDefault = SCANNER_CONFIG.PREVENT_DEFAULT,
    ignoreInputs = SCANNER_CONFIG.IGNORE_INPUTS,
    debugMode = SCANNER_CONFIG.DEBUG_MODE
  } = options;

  const scanBuffer = useRef('');
  const scanTimer = useRef(null);
  const lastScanTime = useRef(0);
  const isScanning = useRef(false);

  const log = useCallback((message, data = null) => {
    if (debugMode) {
      console.log(`[GlobalScanner] ${message}`, data || '');
    }
  }, [debugMode]);

  const resetBuffer = useCallback(() => {
    scanBuffer.current = '';
    isScanning.current = false;
    if (scanTimer.current) {
      clearTimeout(scanTimer.current);
      scanTimer.current = null;
    }
  }, []);

  const processScan = useCallback((scannedCode) => {
    const now = Date.now();
    
    // Prevent duplicate scans within 1 second
    if (now - lastScanTime.current < 1000) {
      log('Duplicate scan prevented', scannedCode);
      return;
    }

    lastScanTime.current = now;
    log('Processing scan', scannedCode);

    if (onScan && typeof onScan === 'function') {
      onScan(scannedCode);
    }
  }, [onScan, log]);

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    const { keyCode, key, target } = event;
    
    // Ignore if user is typing in input fields (unless disabled)
    if (ignoreInputs && target && (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]')
    )) {
      return;
    }

    // Check for end characters (Enter, Tab)
    if (endCharacters.includes(keyCode)) {
      const scannedCode = scanBuffer.current.trim();
      
      if (scannedCode.length >= minLength && scannedCode.length <= maxLength) {
        if (preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }
        
        log('Scan completed', scannedCode);
        processScan(scannedCode);
        resetBuffer();
        return;
      } else {
        log('Invalid scan length', { code: scannedCode, length: scannedCode.length });
        resetBuffer();
        return;
      }
    }

    // Only process printable characters
    if (key && key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
      // Start scanning mode
      if (!isScanning.current) {
        isScanning.current = true;
        log('Scan started');
      }

      // Add character to buffer
      scanBuffer.current += key;
      log('Character added', { char: key, buffer: scanBuffer.current });

      // Reset timer
      if (scanTimer.current) {
        clearTimeout(scanTimer.current);
      }

      // Set timeout to reset buffer if no more characters
      scanTimer.current = setTimeout(() => {
        if (scanBuffer.current.length > 0) {
          log('Scan timeout', scanBuffer.current);
          resetBuffer();
        }
      }, timeout);

      // Check if we've exceeded max length
      if (scanBuffer.current.length > maxLength) {
        log('Max length exceeded', scanBuffer.current);
        resetBuffer();
      }
    } else if (isScanning.current && key && key.length === 1) {
      // Non-alphanumeric character during scan - reset
      log('Invalid character during scan', key);
      resetBuffer();
    }
  }, [
    enabled, 
    ignoreInputs, 
    endCharacters, 
    minLength, 
    maxLength, 
    timeout, 
    preventDefault, 
    processScan, 
    resetBuffer, 
    log
  ]);

  useEffect(() => {
    if (!enabled) return;

    log('Global scanner enabled');
    
    // Add global keydown listener
    document.addEventListener('keydown', handleKeyDown, true);

    // Cleanup function
    return () => {
      log('Global scanner disabled');
      document.removeEventListener('keydown', handleKeyDown, true);
      resetBuffer();
    };
  }, [enabled, handleKeyDown, resetBuffer, log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetBuffer();
    };
  }, [resetBuffer]);

  // Return scanner state and controls
  return {
    isScanning: isScanning.current,
    currentBuffer: scanBuffer.current,
    resetBuffer,
    enabled
  };
};

export default useGlobalScanner;
