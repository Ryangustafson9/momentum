/**
 * Realtime Capability Detection
 * Detects and manages realtime transport capabilities
 */

import { logger } from '@/lib/logger';

class RealtimeCapabilityManager {
  constructor() {
    this.isEnabled = true;
    this.lastError = null;
    this.testCompleted = false;
    this.callbacks = [];
  }

  /**
   * Test if realtime transport is working
   */
  async testRealtimeCapability(supabaseClient) {
    if (this.testCompleted) {
      return this.isEnabled;
    }

    logger.info('🔍 Testing realtime transport capability...');

    try {
      // Create a test channel to check if transport works
      const testChannel = supabaseClient.channel('capability-test', {
        config: { broadcast: { self: true } }
      });

      // Set up a promise to test subscription
      const testPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Transport test timeout'));
        }, 5000);

        testChannel.subscribe((status) => {
          clearTimeout(timeout);
          
          if (status === 'SUBSCRIBED') {
            logger.info('✅ Realtime transport is working');
            resolve(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            logger.warn('⚠️ Realtime transport failed:', status);
            reject(new Error(`Transport failed with status: ${status}`));
          }
        });
      });

      await testPromise;
      
      // Clean up test channel
      testChannel.unsubscribe();
      supabaseClient.removeChannel(testChannel);
      
      this.isEnabled = true;
      this.testCompleted = true;
      logger.info('✅ Realtime capability test passed');
      
    } catch (error) {
      this.isEnabled = false;
      this.lastError = error;
      this.testCompleted = true;
      
      logger.warn('❌ Realtime capability test failed:', error.message);
      logger.info('🔄 Disabling realtime features, app will work in polling mode');
    }

    // Notify all callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(this.isEnabled);
      } catch (error) {
        logger.error('Error in realtime capability callback:', error);
      }
    });

    return this.isEnabled;
  }

  /**
   * Get current capability status
   */
  getCapability() {
    return {
      isEnabled: this.isEnabled,
      testCompleted: this.testCompleted,
      lastError: this.lastError
    };
  }

  /**
   * Disable realtime features
   */
  disable(reason) {
    this.isEnabled = false;
    this.lastError = new Error(reason);
    logger.info('🔄 Realtime features disabled:', reason);
    
    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(false);
      } catch (error) {
        logger.error('Error in realtime capability callback:', error);
      }
    });
  }

  /**
   * Add callback for capability changes
   */
  onCapabilityChange(callback) {
    this.callbacks.push(callback);
    
    // If test is completed, call immediately
    if (this.testCompleted) {
      callback(this.isEnabled);
    }
  }

  /**
   * Remove callback
   */
  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }
}

// Create singleton instance
export const realtimeCapability = new RealtimeCapabilityManager();

/**
 * Hook for using realtime capability in components
 */
export const useRealtimeCapability = () => {
  return realtimeCapability.getCapability();
};
