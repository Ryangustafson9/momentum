/**
 * Document Proxy Service
 * Masks Supabase URLs and provides secure document access
 */

import { supabase } from '@/lib/supabaseClient';
import { createSafeDisplayUrl, isUrlSafe } from '@/utils/urlMasking';

export class DocumentProxyService {
  static PROXY_CACHE = new Map();
  static CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Generate a masked URL for document access
   */
  static async getMaskedDocumentUrl(documentId, expiresIn = 3600) {
    try {
      // Check cache first
      const cacheKey = `${documentId}-${expiresIn}`;
      const cached = this.PROXY_CACHE.get(cacheKey);
      
      if (cached && cached.expires > Date.now()) {
        return cached.url;
      }

      // Get the actual Supabase URL
      const { data: doc, error: docError } = await supabase
        .from('member_documents')
        .select('file_path, original_name')
        .eq('id', documentId)
        .single();

      if (docError || !doc) {
        throw new Error('Document not found');
      }

      // Get signed URL from Supabase
      const { data, error } = await supabase.storage
        .from('member-documents')
        .createSignedUrl(doc.file_path, expiresIn);

      if (error) {
        throw error;
      }

      console.log('🔒 Creating masked URL for:', createSafeDisplayUrl(data.signedUrl));

      // Create a masked URL using data URI or blob URL
      const maskedUrl = await this.createMaskedUrl(data.signedUrl, doc.original_name);
      
      // Cache the result
      this.PROXY_CACHE.set(cacheKey, {
        url: maskedUrl,
        expires: Date.now() + Math.min(expiresIn * 1000, this.CACHE_DURATION)
      });

      return maskedUrl;

    } catch (error) {
      console.error('❌ Error creating masked document URL:', error);
      throw new Error('Failed to get masked document URL');
    }
  }

  /**
   * Create a masked URL that doesn't expose Supabase details
   */
  static async createMaskedUrl(originalUrl, filename) {
    try {
      // For images and small files, we can create a blob URL
      const response = await fetch(originalUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Validate the created URL
      if (!isUrlSafe(blobUrl)) {
        URL.revokeObjectURL(blobUrl);
        throw new Error('Generated URL failed safety validation');
      }

      // Store the blob URL with metadata for cleanup
      this.storeBlobUrl(blobUrl, filename);

      console.log('✅ Created safe blob URL for document:', blobUrl.substring(0, 20) + '...');

      return blobUrl;

    } catch (error) {
      console.warn('Could not create blob URL, falling back to direct URL:', error);
      // Fallback to original URL if blob creation fails
      return originalUrl;
    }
  }

  /**
   * Store blob URL for cleanup
   */
  static storeBlobUrl(blobUrl, filename) {
    // Store in a cleanup registry
    if (!window.documentBlobUrls) {
      window.documentBlobUrls = new Set();
    }
    
    window.documentBlobUrls.add(blobUrl);
    
    // Auto-cleanup after 1 hour
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      window.documentBlobUrls?.delete(blobUrl);
    }, 60 * 60 * 1000);
  }

  /**
   * Clean up all blob URLs
   */
  static cleanupBlobUrls() {
    if (window.documentBlobUrls) {
      window.documentBlobUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
      window.documentBlobUrls.clear();
    }
  }

  /**
   * Get document for download (creates a clean filename)
   */
  static async getDocumentForDownload(documentId) {
    try {
      // Get document metadata
      const { data: doc, error: docError } = await supabase
        .from('member_documents')
        .select('file_path, original_name, mime_type')
        .eq('id', documentId)
        .single();

      if (docError || !doc) {
        throw new Error('Document not found');
      }

      // Get signed URL
      const { data, error } = await supabase.storage
        .from('member-documents')
        .createSignedUrl(doc.file_path, 300); // 5 minute expiry for downloads

      if (error) {
        throw error;
      }

      // Fetch the file
      const response = await fetch(data.signedUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const blob = await response.blob();
      
      return {
        blob,
        filename: doc.original_name,
        mimeType: doc.mime_type
      };

    } catch (error) {
      console.error('❌ Error getting document for download:', error);
      throw new Error('Failed to get document for download');
    }
  }

  /**
   * Download document with masked URL
   */
  static async downloadDocument(documentId) {
    try {
      const { blob, filename } = await this.getDocumentForDownload(documentId);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      return { success: true };

    } catch (error) {
      console.error('❌ Error downloading document:', error);
      throw new Error('Failed to download document');
    }
  }

  /**
   * Get document content for text files
   */
  static async getTextContent(documentId) {
    try {
      const { data: doc, error: docError } = await supabase
        .from('member_documents')
        .select('file_path, mime_type')
        .eq('id', documentId)
        .single();

      if (docError || !doc) {
        throw new Error('Document not found');
      }

      if (doc.mime_type !== 'text/plain') {
        throw new Error('Document is not a text file');
      }

      // Get signed URL
      const { data, error } = await supabase.storage
        .from('member-documents')
        .createSignedUrl(doc.file_path, 300);

      if (error) {
        throw error;
      }

      // Fetch text content
      const response = await fetch(data.signedUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch text content');
      }

      const text = await response.text();
      return text;

    } catch (error) {
      console.error('❌ Error getting text content:', error);
      throw new Error('Failed to get text content');
    }
  }

  /**
   * Clear cache
   */
  static clearCache() {
    this.PROXY_CACHE.clear();
    this.cleanupBlobUrls();
  }

  /**
   * Get cache stats
   */
  static getCacheStats() {
    return {
      cacheSize: this.PROXY_CACHE.size,
      blobUrls: window.documentBlobUrls?.size || 0
    };
  }
}

export default DocumentProxyService;
