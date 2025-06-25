/**
 * 🚀 ADVANCED CACHING STRATEGIES
 * Multi-layer caching system with intelligent invalidation
 */

import { logger } from '@/lib/logger';

// ⭐ PERFORMANCE: Advanced cache implementation
class AdvancedCache {
  constructor(options = {}) {
    this.memoryCache = new Map();
    this.persistentCache = options.persistent ? this.initPersistentCache() : null;
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
    };
    
    // LRU tracking
    this.accessOrder = new Map();
    this.accessCounter = 0;
  }

  // ⭐ PERFORMANCE: Initialize persistent cache (IndexedDB)
  initPersistentCache() {
    if (typeof window === 'undefined' || !window.indexedDB) return null;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MomentumCache', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('expiry', 'expiry', { unique: false });
        }
      };
    });
  }

  // ⭐ PERFORMANCE: Get from cache with LRU tracking
  async get(key) {
    // Check memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem) {
      if (this.isExpired(memoryItem)) {
        this.memoryCache.delete(key);
        this.accessOrder.delete(key);
      } else {
        this.updateAccessOrder(key);
        this.stats.hits++;
        return memoryItem.value;
      }
    }

    // Check persistent cache
    if (this.persistentCache) {
      try {
        const db = await this.persistentCache;
        const transaction = db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        const request = store.get(key);
        
        const result = await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        if (result && !this.isExpired(result)) {
          // Promote to memory cache
          this.setMemoryCache(key, result.value, result.ttl);
          this.stats.hits++;
          return result.value;
        } else if (result) {
          // Remove expired item
          this.deleteFromPersistent(key);
        }
      } catch (error) {
        logger.warn('Persistent cache read error:', error);
      }
    }

    this.stats.misses++;
    return null;
  }

  // ⭐ PERFORMANCE: Set cache with intelligent storage
  async set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    const item = { value, expiry, ttl };

    // Always set in memory cache
    this.setMemoryCache(key, value, ttl);

    // Set in persistent cache for larger items or longer TTL
    if (this.persistentCache && (ttl > 600000 || this.shouldPersist(value))) {
      try {
        const db = await this.persistentCache;
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        
        await new Promise((resolve, reject) => {
          const request = store.put({ key, ...item });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        logger.warn('Persistent cache write error:', error);
      }
    }

    this.stats.sets++;
  }

  // ⭐ PERFORMANCE: Set memory cache with LRU eviction
  setMemoryCache(key, value, ttl) {
    const expiry = Date.now() + ttl;
    
    // Evict if at capacity
    if (this.memoryCache.size >= this.maxSize && !this.memoryCache.has(key)) {
      this.evictLRU();
    }

    this.memoryCache.set(key, { value, expiry, ttl });
    this.updateAccessOrder(key);
  }

  // ⭐ PERFORMANCE: LRU eviction
  evictLRU() {
    if (this.accessOrder.size === 0) return;

    const oldestKey = this.accessOrder.keys().next().value;
    this.memoryCache.delete(oldestKey);
    this.accessOrder.delete(oldestKey);
    this.stats.evictions++;
  }

  // ⭐ PERFORMANCE: Update access order for LRU
  updateAccessOrder(key) {
    if (this.accessOrder.has(key)) {
      this.accessOrder.delete(key);
    }
    this.accessOrder.set(key, ++this.accessCounter);
  }

  // ⭐ PERFORMANCE: Check if item should be persisted
  shouldPersist(value) {
    const size = JSON.stringify(value).length;
    return size > 1024; // Persist items larger than 1KB
  }

  // ⭐ PERFORMANCE: Check if item is expired
  isExpired(item) {
    return Date.now() > item.expiry;
  }

  // ⭐ PERFORMANCE: Delete from cache
  async delete(key) {
    this.memoryCache.delete(key);
    this.accessOrder.delete(key);
    
    if (this.persistentCache) {
      await this.deleteFromPersistent(key);
    }
    
    this.stats.deletes++;
  }

  // ⭐ PERFORMANCE: Delete from persistent cache
  async deleteFromPersistent(key) {
    try {
      const db = await this.persistentCache;
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      await new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.warn('Persistent cache delete error:', error);
    }
  }

  // ⭐ PERFORMANCE: Clear cache with pattern matching
  async clear(pattern = null) {
    if (pattern) {
      const keysToDelete = [];
      
      // Clear memory cache
      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => {
        this.memoryCache.delete(key);
        this.accessOrder.delete(key);
      });

      // Clear persistent cache
      if (this.persistentCache) {
        try {
          const db = await this.persistentCache;
          const transaction = db.transaction(['cache'], 'readwrite');
          const store = transaction.objectStore('cache');
          const request = store.openCursor();
          
          await new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
              const cursor = event.target.result;
              if (cursor) {
                if (cursor.key.includes(pattern)) {
                  cursor.delete();
                }
                cursor.continue();
              } else {
                resolve();
              }
            };
            request.onerror = () => reject(request.error);
          });
        } catch (error) {
          logger.warn('Persistent cache pattern clear error:', error);
        }
      }
    } else {
      // Clear all
      this.memoryCache.clear();
      this.accessOrder.clear();
      
      if (this.persistentCache) {
        try {
          const db = await this.persistentCache;
          const transaction = db.transaction(['cache'], 'readwrite');
          const store = transaction.objectStore('cache');
          await new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        } catch (error) {
          logger.warn('Persistent cache clear error:', error);
        }
      }
    }
  }

  // ⭐ PERFORMANCE: Cleanup expired items
  async cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    // Cleanup memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiry) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.memoryCache.delete(key);
      this.accessOrder.delete(key);
    });

    // Cleanup persistent cache
    if (this.persistentCache) {
      try {
        const db = await this.persistentCache;
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const index = store.index('expiry');
        const request = index.openCursor(IDBKeyRange.upperBound(now));
        
        await new Promise((resolve, reject) => {
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              cursor.delete();
              cursor.continue();
            } else {
              resolve();
            }
          };
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        logger.warn('Persistent cache cleanup error:', error);
      }
    }

    logger.debug(`Cache cleanup: removed ${expiredKeys.length} expired items`);
  }

  // ⭐ PERFORMANCE: Get cache statistics
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      memorySize: this.memoryCache.size,
      maxSize: this.maxSize,
    };
  }
}

// ⭐ PERFORMANCE: Cache instances for different use cases
export const cacheInstances = {
  // Fast, short-term cache for UI data
  ui: new AdvancedCache({
    maxSize: 500,
    defaultTTL: 60000, // 1 minute
    persistent: false,
  }),

  // Medium-term cache for API responses
  api: new AdvancedCache({
    maxSize: 1000,
    defaultTTL: 300000, // 5 minutes
    persistent: true,
  }),

  // Long-term cache for static data
  static: new AdvancedCache({
    maxSize: 200,
    defaultTTL: 3600000, // 1 hour
    persistent: true,
  }),

  // User-specific cache
  user: new AdvancedCache({
    maxSize: 300,
    defaultTTL: 600000, // 10 minutes
    persistent: true,
  }),
};

// ⭐ PERFORMANCE: Cache management utilities
export const cacheManager = {
  // Get from appropriate cache based on data type
  async get(key, type = 'api') {
    const cache = cacheInstances[type];
    if (!cache) throw new Error(`Unknown cache type: ${type}`);
    return cache.get(key);
  },

  // Set in appropriate cache based on data type
  async set(key, value, type = 'api', ttl) {
    const cache = cacheInstances[type];
    if (!cache) throw new Error(`Unknown cache type: ${type}`);
    return cache.set(key, value, ttl);
  },

  // Delete from all caches
  async delete(key) {
    await Promise.all(
      Object.values(cacheInstances).map(cache => cache.delete(key))
    );
  },

  // Clear all caches with pattern
  async clear(pattern = null) {
    await Promise.all(
      Object.values(cacheInstances).map(cache => cache.clear(pattern))
    );
  },

  // Cleanup all caches
  async cleanup() {
    await Promise.all(
      Object.values(cacheInstances).map(cache => cache.cleanup())
    );
  },

  // Get combined statistics
  getStats() {
    const stats = {};
    Object.entries(cacheInstances).forEach(([type, cache]) => {
      stats[type] = cache.getStats();
    });
    return stats;
  },

  // Invalidate cache based on data relationships
  async invalidateRelated(entity, id = null) {
    const patterns = {
      member: ['member_', 'dashboard_', 'profile_'],
      class: ['class_', 'schedule_', 'booking_'],
      booking: ['booking_', 'class_', 'member_'],
      attendance: ['attendance_', 'member_', 'stats_'],
    };

    const entityPatterns = patterns[entity] || [entity];
    
    for (const pattern of entityPatterns) {
      const fullPattern = id ? `${pattern}${id}` : pattern;
      await this.clear(fullPattern);
    }
  },
};

// ⭐ PERFORMANCE: Initialize cache cleanup interval
export const initializeCacheCleanup = () => {
  // Cleanup expired items every 5 minutes
  setInterval(() => {
    cacheManager.cleanup();
  }, 300000);
  // Log cache statistics every 10 minutes in development
  if (import.meta.env.DEV) {
    setInterval(() => {
      const stats = cacheManager.getStats();
      logger.debug('Cache statistics:', stats);
    }, 600000);
  }
};

export default cacheManager;

