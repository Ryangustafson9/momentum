/**
 * Storage Migration Utility
 * 
 * Handles migration of existing user data from insecure localStorage 
 * to secure encrypted storage for improved security.
 */

import { enhancedStorage } from './secureStorage';

export class StorageMigration {
  constructor() {
    this.migrationVersion = '1.0.0';
    this.migrationKey = 'storage_migration_version';
  }

  /**
   * Checks if migration is needed
   * @returns {boolean} True if migration is needed
   */
  needsMigration() {
    try {
      const currentVersion = localStorage.getItem(this.migrationKey);
      return currentVersion !== this.migrationVersion;
    } catch (error) {
      console.warn('Failed to check migration status:', error);
      return false;
    }
  }

  /**
   * Migrates sensitive data from localStorage to secure storage
   * @returns {Promise<boolean>} Success status
   */
  async migrateSensitiveData() {
    if (!this.needsMigration()) {
      console.log('🔄 Storage migration not needed');
      return true;
    }

    try {
      console.log('🔄 Starting storage migration to secure storage...');

      // List of sensitive keys to migrate
      const sensitiveKeys = [
        'cached_user',
        'user_session',
        'auth_tokens',
        'user_preferences_sensitive'
      ];

      // List of keys with timestamps
      const timestampKeys = [
        'cached_user_timestamp'
      ];

      let migratedCount = 0;

      // Migrate sensitive data
      for (const key of sensitiveKeys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsedData = JSON.parse(data);
            await enhancedStorage.secure.set(key, parsedData);
            localStorage.removeItem(key);
            migratedCount++;
            console.log(`✅ Migrated sensitive data: ${key}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to migrate ${key}:`, error);
        }
      }

      // Migrate timestamp data to session storage
      for (const key of timestampKeys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            enhancedStorage.session.set(key, parseInt(data));
            localStorage.removeItem(key);
            migratedCount++;
            console.log(`✅ Migrated timestamp: ${key}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to migrate ${key}:`, error);
        }
      }

      // Mark migration as complete
      localStorage.setItem(this.migrationKey, this.migrationVersion);

      console.log(`🎉 Storage migration completed successfully! Migrated ${migratedCount} items.`);
      return true;

    } catch (error) {
      console.error('❌ Storage migration failed:', error);
      return false;
    }
  }

  /**
   * Cleans up old insecure data that should no longer be in localStorage
   */
  cleanupInsecureData() {
    try {
      const insecureKeys = [
        'cached_user',
        'cached_user_timestamp',
        'user_session',
        'auth_tokens',
        'user_preferences_sensitive'
      ];

      let cleanedCount = 0;

      insecureKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} insecure localStorage items`);
      }

    } catch (error) {
      console.warn('Failed to cleanup insecure data:', error);
    }
  }

  /**
   * Validates that sensitive data is properly stored
   * @returns {Promise<boolean>} True if validation passes
   */
  async validateMigration() {
    try {
      // Check that cached user is in secure storage
      const secureUser = await enhancedStorage.secure.get('cached_user');
      const userTimestamp = enhancedStorage.session.get('cached_user_timestamp');

      // Check that sensitive data is NOT in localStorage
      const insecureUser = localStorage.getItem('cached_user');

      const isValid = secureUser && userTimestamp && !insecureUser;

      if (isValid) {
        console.log('✅ Storage migration validation passed');
      } else {
        console.warn('⚠️ Storage migration validation failed');
      }

      return isValid;

    } catch (error) {
      console.warn('Failed to validate migration:', error);
      return false;
    }
  }

  /**
   * Performs complete migration process
   * @returns {Promise<boolean>} Success status
   */
  async performMigration() {
    try {
      // Step 1: Migrate sensitive data
      const migrationSuccess = await this.migrateSensitiveData();
      
      if (!migrationSuccess) {
        return false;
      }

      // Step 2: Cleanup old data
      this.cleanupInsecureData();

      // Step 3: Validate migration
      const validationSuccess = await this.validateMigration();

      return validationSuccess;

    } catch (error) {
      console.error('Migration process failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const storageMigration = new StorageMigration();

/**
 * Auto-migration function to be called on app startup
 * @returns {Promise<void>}
 */
export const autoMigrateStorage = async () => {
  try {
    if (storageMigration.needsMigration()) {
      console.log('🔄 Auto-migrating storage for improved security...');
      await storageMigration.performMigration();
    }
  } catch (error) {
    console.warn('Auto-migration failed:', error);
  }
};

export default storageMigration;
