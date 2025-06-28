/**
 * URL Masking Utilities
 * Additional security measures for document URLs
 */

/**
 * Generate a random session token for URL masking
 */
export const generateSessionToken = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Create a masked filename that doesn't reveal sensitive info
 */
export const createMaskedFilename = (originalName, documentId) => {
  const extension = originalName.split('.').pop();
  const timestamp = Date.now();
  return `document_${documentId}_${timestamp}.${extension}`;
};

/**
 * Sanitize URL parameters to remove sensitive information
 */
export const sanitizeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    
    // Remove sensitive query parameters
    const sensitiveParams = ['token', 'key', 'signature', 'expires'];
    sensitiveParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    return urlObj.toString();
  } catch (error) {
    console.warn('Could not sanitize URL:', error);
    return url;
  }
};

/**
 * Check if URL contains sensitive information
 */
export const containsSensitiveInfo = (url) => {
  const sensitivePatterns = [
    /supabase\.co/i,
    /amazonaws\.com/i,
    /storage\.googleapis\.com/i,
    /token=/i,
    /key=/i,
    /signature=/i
  ];
  
  return sensitivePatterns.some(pattern => pattern.test(url));
};

/**
 * Create a safe display URL for logging/debugging
 */
export const createSafeDisplayUrl = (url) => {
  if (!url) return 'No URL';
  
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}/[MASKED]`;
  } catch (error) {
    return '[INVALID URL]';
  }
};

/**
 * Validate that a URL is safe to use
 */
export const isUrlSafe = (url) => {
  try {
    const urlObj = new URL(url);
    
    // Check for allowed protocols
    const allowedProtocols = ['http:', 'https:', 'blob:', 'data:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    // Additional safety checks can be added here
    return true;
  } catch (error) {
    return false;
  }
};

export default {
  generateSessionToken,
  createMaskedFilename,
  sanitizeUrl,
  containsSensitiveInfo,
  createSafeDisplayUrl,
  isUrlSafe
};
