/**
 * Document Service
 * Handles member document uploads, management, and retrieval
 */

import { supabase } from '@/lib/supabaseClient';
import DocumentProxyService from './documentProxyService';

export class DocumentService {
  static BUCKET_NAME = 'member-documents';
  static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  static ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png', 
    'image/webp',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  /**
   * Validate file before upload
   */
  static validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('File type not allowed. Please upload PDF, images, or text documents.');
    }

    return true;
  }

  /**
   * Upload document to storage and save metadata
   */
  static async uploadDocument(memberId, staffId, file, options = {}) {
    try {
      console.log('🔍 Uploading document:', { memberId, staffId, fileName: file.name, fileSize: file.size });

      // Validate file
      this.validateFile(file);

      const {
        documentType = 'general',
        description = '',
        isPrivate = false
      } = options;

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${memberId}-${timestamp}.${fileExt}`;
      const filePath = `${memberId}/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ File uploaded to storage:', uploadData.path);

      // Save document metadata to database
      const documentData = {
        member_id: memberId,
        staff_id: staffId,
        file_name: fileName,
        original_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        document_type: documentType,
        description: description || null,
        is_private: isPrivate
      };

      const { data: docData, error: docError } = await supabase
        .from('member_documents')
        .insert([documentData])
        .select(`
          *,
          staff:profiles!staff_id(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (docError) {
        console.error('❌ Database insert error:', docError);
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from(this.BUCKET_NAME)
          .remove([uploadData.path]);
        throw docError;
      }

      console.log('✅ Document metadata saved:', docData.id);

      return {
        ...docData,
        staff: {
          id: docData.staff?.id,
          name: `${docData.staff?.first_name || ''} ${docData.staff?.last_name || ''}`.trim() || 'Unknown Staff',
          email: docData.staff?.email || ''
        }
      };

    } catch (error) {
      console.error('❌ Error uploading document:', error);
      throw new Error('Failed to upload document');
    }
  }

  /**
   * Get all documents for a member
   */
  static async getMemberDocuments(memberId) {
    try {
      console.log('🔍 Getting documents for member:', memberId);

      const { data, error } = await supabase
        .from('member_documents')
        .select(`
          *,
          staff:profiles!staff_id(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching documents:', error);
        throw error;
      }

      console.log('📊 Found documents:', data?.length || 0);

      return (data || []).map(doc => ({
        ...doc,
        staff: {
          id: doc.staff?.id,
          name: `${doc.staff?.first_name || ''} ${doc.staff?.last_name || ''}`.trim() || 'Unknown Staff',
          email: doc.staff?.email || ''
        }
      }));

    } catch (error) {
      console.error('❌ Error getting member documents:', error);
      throw new Error('Failed to get member documents');
    }
  }

  /**
   * Get masked URL for a document (hides Supabase details)
   */
  static async getDocumentUrl(documentId, expiresIn = 3600) {
    try {
      return await DocumentProxyService.getMaskedDocumentUrl(documentId, expiresIn);
    } catch (error) {
      console.error('❌ Error getting document URL:', error);
      throw new Error('Failed to get document URL');
    }
  }

  /**
   * Download document with masked URL
   */
  static async downloadDocument(documentId) {
    try {
      return await DocumentProxyService.downloadDocument(documentId);
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      throw new Error('Failed to download document');
    }
  }

  /**
   * Get text content for text documents
   */
  static async getTextContent(documentId) {
    try {
      return await DocumentProxyService.getTextContent(documentId);
    } catch (error) {
      console.error('❌ Error getting text content:', error);
      throw new Error('Failed to get text content');
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(documentId) {
    try {
      console.log('🗑️ Deleting document:', documentId);

      // First get the document metadata
      const { data: doc, error: docError } = await supabase
        .from('member_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (docError || !doc) {
        throw new Error('Document not found');
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([doc.file_path]);

      if (storageError) {
        console.warn('⚠️ Storage deletion warning:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('member_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.error('❌ Database deletion error:', dbError);
        throw dbError;
      }

      console.log('✅ Document deleted successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  /**
   * Update document metadata
   */
  static async updateDocument(documentId, updates) {
    try {
      const allowedUpdates = ['description', 'document_type', 'is_private'];
      const updateData = {};
      
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updateData[key] = updates[key];
        }
      });

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('member_documents')
        .update(updateData)
        .eq('id', documentId)
        .select(`
          *,
          staff:profiles!staff_id(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error updating document:', error);
        throw error;
      }

      return {
        ...data,
        staff: {
          id: data.staff?.id,
          name: `${data.staff?.first_name || ''} ${data.staff?.last_name || ''}`.trim() || 'Unknown Staff',
          email: data.staff?.email || ''
        }
      };

    } catch (error) {
      console.error('❌ Error updating document:', error);
      throw new Error('Failed to update document');
    }
  }

  /**
   * Get document statistics for a member
   */
  static async getDocumentStats(memberId) {
    try {
      const { data, error } = await supabase
        .from('member_documents')
        .select('id, file_size, document_type')
        .eq('member_id', memberId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        totalSize: data?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0,
        byType: {}
      };

      data?.forEach(doc => {
        const type = doc.document_type || 'general';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });

      return stats;

    } catch (error) {
      console.error('❌ Error getting document stats:', error);
      throw new Error('Failed to get document stats');
    }
  }
}

export default DocumentService;
