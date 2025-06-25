/**
 * Secure Storage Utilities
 * 
 * Provides encrypted storage for sensitive data and secure session management.
 * Uses Web Crypto API for encryption and implements secure storage patterns.
 */

// Simple encryption utilities using Web Crypto API
class SecureStorage {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12; // 96-bit IV for AES-GCM
  }

  /**
   * Generates a cryptographic key for encryption
   * @returns {Promise<CryptoKey>} Generated key
   */
  async generateKey() {
    return await window.crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derives a key from a password using PBKDF2
   * @param {string} password - Password to derive key from
   * @param {Uint8Array} salt - Salt for key derivation
   * @returns {Promise<CryptoKey>} Derived key
   */
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000, // 100k iterations for security
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts data using AES-GCM
   * @param {string} data - Data to encrypt
   * @param {CryptoKey} key - Encryption key
   * @returns {Promise<{encrypted: ArrayBuffer, iv: Uint8Array}>} Encrypted data and IV
   */
  async encrypt(data, key) {
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(this.ivLength));
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv: iv,
      },
      key,
      encoder.encode(data)
    );

    return { encrypted, iv };
  }

  /**
   * Decrypts data using AES-GCM
   * @param {ArrayBuffer} encryptedData - Encrypted data
   * @param {Uint8Array} iv - Initialization vector
   * @param {CryptoKey} key - Decryption key
   * @returns {Promise<string>} Decrypted data
   */
  async decrypt(encryptedData, iv, key) {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: this.algorithm,
        iv: iv,
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Converts ArrayBuffer to base64 string
   * @param {ArrayBuffer} buffer - Buffer to convert
   * @returns {string} Base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Converts base64 string to ArrayBuffer
   * @param {string} base64 - Base64 string to convert
   * @returns {ArrayBuffer} Converted buffer
   */
  base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Session-based storage with automatic cleanup
class SessionManager {
  constructor() {
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.cleanupInterval = 60 * 60 * 1000; // 1 hour
    this.startCleanupTimer();
  }

  /**
   * Stores data with expiration
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   * @param {number} ttl - Time to live in milliseconds
   */
  setWithExpiry(key, data, ttl = this.sessionTimeout) {
    const item = {
      data: data,
      timestamp: Date.now(),
      ttl: ttl,
    };

    try {
      sessionStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to store session data:', error);
    }
  }

  /**
   * Retrieves data if not expired
   * @param {string} key - Storage key
   * @returns {any|null} Stored data or null if expired/not found
   */
  getWithExpiry(key) {
    try {
      const itemStr = sessionStorage.getItem(key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      const now = Date.now();

      // Check if expired
      if (now - item.timestamp > item.ttl) {
        sessionStorage.removeItem(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to retrieve session data:', error);
      return null;
    }
  }

  /**
   * Removes expired items from sessionStorage
   */
  cleanup() {
    try {
      const keys = Object.keys(sessionStorage);
      const now = Date.now();

      keys.forEach(key => {
        try {
          const itemStr = sessionStorage.getItem(key);
          if (!itemStr) return;

          const item = JSON.parse(itemStr);
          if (item.timestamp && item.ttl && now - item.timestamp > item.ttl) {
            sessionStorage.removeItem(key);
          }
        } catch (error) {
          // Skip invalid items
        }
      });
    } catch (error) {
      console.warn('Session cleanup failed:', error);
    }
  }

  /**
   * Starts automatic cleanup timer
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }
}

// Main secure storage implementation
class SecureStorageManager {
  constructor() {
    this.secureStorage = new SecureStorage();
    this.sessionManager = new SessionManager();
    this.encryptionKey = null;
    this.initPromise = this.initialize();
  }

  /**
   * Initialize encryption key from session or generate new one
   */
  async initialize() {
    try {
      // Try to get existing key from session
      const keyData = this.sessionManager.getWithExpiry('_encryption_key');
      
      if (keyData) {
        // Import existing key
        this.encryptionKey = await window.crypto.subtle.importKey(
          'raw',
          this.secureStorage.base64ToArrayBuffer(keyData),
          { name: this.secureStorage.algorithm, length: this.secureStorage.keyLength },
          true,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new key
        this.encryptionKey = await this.secureStorage.generateKey();
        
        // Export and store key for session
        const exportedKey = await window.crypto.subtle.exportKey('raw', this.encryptionKey);
        const keyBase64 = this.secureStorage.arrayBufferToBase64(exportedKey);
        this.sessionManager.setWithExpiry('_encryption_key', keyBase64);
      }
    } catch (error) {
      console.warn('Failed to initialize secure storage:', error);
      // Fallback to no encryption
      this.encryptionKey = null;
    }
  }

  /**
   * Securely stores sensitive data with encryption
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   * @param {boolean} persistent - Whether to use localStorage (false = sessionStorage)
   */
  async setSecure(key, data, persistent = false) {
    await this.initPromise;

    try {
      const jsonData = JSON.stringify(data);

      if (this.encryptionKey) {
        // Encrypt the data
        const { encrypted, iv } = await this.secureStorage.encrypt(jsonData, this.encryptionKey);
        
        const secureData = {
          encrypted: this.secureStorage.arrayBufferToBase64(encrypted),
          iv: this.secureStorage.arrayBufferToBase64(iv),
          timestamp: Date.now(),
          isEncrypted: true,
        };

        if (persistent) {
          localStorage.setItem(`secure_${key}`, JSON.stringify(secureData));
        } else {
          this.sessionManager.setWithExpiry(`secure_${key}`, secureData);
        }
      } else {
        // Fallback to regular storage if encryption fails
        if (persistent) {
          localStorage.setItem(key, jsonData);
        } else {
          this.sessionManager.setWithExpiry(key, data);
        }
      }
    } catch (error) {
      console.warn('Failed to store secure data:', error);
      throw new Error('Failed to store sensitive data securely');
    }
  }

  /**
   * Retrieves and decrypts sensitive data
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found
   * @param {boolean} persistent - Whether to check localStorage (false = sessionStorage)
   * @returns {Promise<any>} Decrypted data or default value
   */
  async getSecure(key, defaultValue = null, persistent = false) {
    await this.initPromise;

    try {
      let secureData;

      if (persistent) {
        const stored = localStorage.getItem(`secure_${key}`);
        if (!stored) return defaultValue;
        secureData = JSON.parse(stored);
      } else {
        secureData = this.sessionManager.getWithExpiry(`secure_${key}`);
        if (!secureData) return defaultValue;
      }

      if (secureData.isEncrypted && this.encryptionKey) {
        // Decrypt the data
        const encrypted = this.secureStorage.base64ToArrayBuffer(secureData.encrypted);
        const iv = new Uint8Array(this.secureStorage.base64ToArrayBuffer(secureData.iv));
        
        const decrypted = await this.secureStorage.decrypt(encrypted, iv, this.encryptionKey);
        return JSON.parse(decrypted);
      } else {
        // Handle non-encrypted fallback data
        return secureData.data || secureData;
      }
    } catch (error) {
      console.warn('Failed to retrieve secure data:', error);
      return defaultValue;
    }
  }

  /**
   * Removes secure data
   * @param {string} key - Storage key
   * @param {boolean} persistent - Whether to remove from localStorage
   */
  removeSecure(key, persistent = false) {
    try {
      if (persistent) {
        localStorage.removeItem(`secure_${key}`);
      } else {
        sessionStorage.removeItem(`secure_${key}`);
      }
    } catch (error) {
      console.warn('Failed to remove secure data:', error);
    }
  }

  /**
   * Clears all secure storage
   */
  clearSecure() {
    try {
      // Clear encrypted session data
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.startsWith('secure_') || key === '_encryption_key') {
          sessionStorage.removeItem(key);
        }
      });

      // Clear encrypted localStorage data
      const localKeys = Object.keys(localStorage);
      localKeys.forEach(key => {
        if (key.startsWith('secure_')) {
          localStorage.removeItem(key);
        }
      });

      // Reset encryption key
      this.encryptionKey = null;
    } catch (error) {
      console.warn('Failed to clear secure storage:', error);
    }
  }
}

// Create singleton instance
export const secureStorage = new SecureStorageManager();

// Enhanced storage utilities with security
export const enhancedStorage = {
  // Secure storage for sensitive data
  secure: {
    set: async (key, value, persistent = false) => {
      return await secureStorage.setSecure(key, value, persistent);
    },
    get: async (key, defaultValue = null, persistent = false) => {
      return await secureStorage.getSecure(key, defaultValue, persistent);
    },
    remove: (key, persistent = false) => {
      secureStorage.removeSecure(key, persistent);
    },
    clear: () => {
      secureStorage.clearSecure();
    }
  },

  // Regular storage for non-sensitive data (unchanged)
  local: {
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn('localStorage.setItem failed:', error);
      }
    },
    get: (key, defaultValue = null) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.warn('localStorage.getItem failed:', error);
        return defaultValue;
      }
    },
    remove: (key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('localStorage.removeItem failed:', error);
      }
    },
    clear: () => {
      try {
        localStorage.clear();
      } catch (error) {
        console.warn('localStorage.clear failed:', error);
      }
    }
  },

  // Session storage with expiry
  session: {
    set: (key, value, ttl) => {
      secureStorage.sessionManager.setWithExpiry(key, value, ttl);
    },
    get: (key, defaultValue = null) => {
      const result = secureStorage.sessionManager.getWithExpiry(key);
      return result !== null ? result : defaultValue;
    },
    remove: (key) => {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.warn('sessionStorage.removeItem failed:', error);
      }
    },
    clear: () => {
      try {
        sessionStorage.clear();
      } catch (error) {
        console.warn('sessionStorage.clear failed:', error);
      }
    }
  }
};

// Export for backward compatibility
export const storage = enhancedStorage;

export default enhancedStorage;
