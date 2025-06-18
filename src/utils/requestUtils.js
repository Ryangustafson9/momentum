/**
 * Request Utilities
 * 
 * This module provides utilities for handling API requests with timeouts,
 * retries, and error handling to improve application reliability.
 */

import { supabase } from '@/lib/supabaseClient';

// Timeout configurations for different types of operations
export const TIMEOUTS = {
  FAST: 5000,      // 5 seconds - for quick operations like auth checks
  NORMAL: 15000,   // 15 seconds - for standard database operations
  SLOW: 30000,     // 30 seconds - for complex queries
  UPLOAD: 120000,  // 2 minutes - for file uploads
  DOWNLOAD: 60000  // 1 minute - for file downloads
};

/**
 * Creates a timeout promise that rejects after specified milliseconds
 * @param {number} ms - Timeout in milliseconds
 * @param {string} operation - Operation name for error message
 * @returns {Promise} Promise that rejects with timeout error
 */
export function createTimeout(ms, operation = 'Operation') {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timeout after ${ms}ms`));
    }, ms);
  });
}

/**
 * Wraps a promise with a timeout
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeout - Timeout in milliseconds
 * @param {string} operation - Operation name for error message
 * @returns {Promise} Promise that resolves/rejects with timeout
 */
export function withTimeout(promise, timeout = TIMEOUTS.NORMAL, operation = 'Operation') {
  const timeoutPromise = createTimeout(timeout, operation);
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Executes a Supabase query with timeout and error handling
 * @param {Function} queryFn - Function that returns a Supabase query
 * @param {Object} options - Configuration options
 * @returns {Promise} Promise with query result
 */
export async function executeWithTimeout(queryFn, options = {}) {
  const {
    timeout = TIMEOUTS.NORMAL,
    operation = 'Database query',
    retries = 1,
    retryDelay = 1000
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[RequestUtils] 🔄 ${operation} (attempt ${attempt}/${retries})`);
      
      const query = queryFn();
      const result = await withTimeout(query, timeout, operation);
      
      if (result.error) {
        throw new Error(result.error.message || 'Database query failed');
      }
      
      console.log(`[RequestUtils] ✅ ${operation} completed successfully`);
      return result;
      
    } catch (error) {
      lastError = error;
      console.warn(`[RequestUtils] ⚠️ ${operation} failed (attempt ${attempt}/${retries}):`, error.message);
      
      // Don't retry on certain errors
      if (error.message.includes('timeout') && attempt < retries) {
        console.log(`[RequestUtils] 🔄 Retrying ${operation} in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      // If this is the last attempt or a non-retryable error, throw
      if (attempt === retries) {
        throw lastError;
      }
    }
  }
  
  throw lastError;
}

/**
 * Executes a fast database operation (auth checks, simple selects)
 * @param {Function} queryFn - Function that returns a Supabase query
 * @param {string} operation - Operation name for logging
 * @returns {Promise} Promise with query result
 */
export function executeFast(queryFn, operation = 'Fast query') {
  return executeWithTimeout(queryFn, {
    timeout: TIMEOUTS.FAST,
    operation,
    retries: 2,
    retryDelay: 500
  });
}

/**
 * Executes a normal database operation (CRUD operations)
 * @param {Function} queryFn - Function that returns a Supabase query
 * @param {string} operation - Operation name for logging
 * @returns {Promise} Promise with query result
 */
export function executeNormal(queryFn, operation = 'Normal query') {
  return executeWithTimeout(queryFn, {
    timeout: TIMEOUTS.NORMAL,
    operation,
    retries: 3,
    retryDelay: 1000
  });
}

/**
 * Executes a slow database operation (complex queries, reports)
 * @param {Function} queryFn - Function that returns a Supabase query
 * @param {string} operation - Operation name for logging
 * @returns {Promise} Promise with query result
 */
export function executeSlow(queryFn, operation = 'Slow query') {
  return executeWithTimeout(queryFn, {
    timeout: TIMEOUTS.SLOW,
    operation,
    retries: 2,
    retryDelay: 2000
  });
}

/**
 * Executes a file upload operation with extended timeout
 * @param {Function} uploadFn - Function that returns an upload promise
 * @param {string} operation - Operation name for logging
 * @returns {Promise} Promise with upload result
 */
export function executeUpload(uploadFn, operation = 'File upload') {
  return executeWithTimeout(uploadFn, {
    timeout: TIMEOUTS.UPLOAD,
    operation,
    retries: 2,
    retryDelay: 3000
  });
}

/**
 * Checks if an error is a timeout error
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is timeout-related
 */
export function isTimeoutError(error) {
  return error.message.includes('timeout') || 
         error.message.includes('aborted') ||
         error.name === 'AbortError';
}

/**
 * Checks if an error is network-related
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is network-related
 */
export function isNetworkError(error) {
  return error.message.includes('fetch') ||
         error.message.includes('network') ||
         error.message.includes('connection') ||
         isTimeoutError(error);
}

/**
 * Gets user-friendly error message for different error types
 * @param {Error} error - Error to process
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyErrorMessage(error) {
  if (isTimeoutError(error)) {
    return 'The request took too long to complete. Please check your internet connection and try again.';
  }
  
  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  if (error.message.includes('duplicate') || error.message.includes('unique')) {
    return 'This information already exists. Please use different details.';
  }
  
  if (error.message.includes('permission') || error.message.includes('unauthorized')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.message.includes('not found')) {
    return 'The requested information could not be found.';
  }
  
  // Return original message for other errors, but sanitized
  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Enhanced Supabase query wrapper with automatic timeout and error handling
 * @param {Object} table - Supabase table reference
 * @param {string} operation - Operation type (select, insert, update, delete)
 * @param {Object} options - Query options
 * @returns {Promise} Promise with query result
 */
export async function supabaseQuery(table, operation, options = {}) {
  const {
    timeout = TIMEOUTS.NORMAL,
    retries = 2,
    operationName = `${operation} operation`
  } = options;

  return executeWithTimeout(
    () => {
      let query = supabase.from(table);
      
      switch (operation) {
        case 'select':
          query = query.select(options.select || '*');
          if (options.eq) query = query.eq(options.eq.column, options.eq.value);
          if (options.limit) query = query.limit(options.limit);
          if (options.order) query = query.order(options.order.column, options.order.options);
          break;
          
        case 'insert':
          query = query.insert(options.data);
          if (options.select) query = query.select(options.select);
          break;
          
        case 'update':
          query = query.update(options.data);
          if (options.eq) query = query.eq(options.eq.column, options.eq.value);
          if (options.select) query = query.select(options.select);
          break;
          
        case 'delete':
          query = query.delete();
          if (options.eq) query = query.eq(options.eq.column, options.eq.value);
          break;
          
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
      
      return query;
    },
    {
      timeout,
      operation: operationName,
      retries
    }
  );
}

export default {
  TIMEOUTS,
  createTimeout,
  withTimeout,
  executeWithTimeout,
  executeFast,
  executeNormal,
  executeSlow,
  executeUpload,
  isTimeoutError,
  isNetworkError,
  getUserFriendlyErrorMessage,
  supabaseQuery
};
