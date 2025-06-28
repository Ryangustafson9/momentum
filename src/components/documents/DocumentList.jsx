/**
 * Document List Component
 * Displays member documents with download, edit, and delete functionality
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Image,
  File,
  Download,
  Edit,
  Trash2,
  Eye,
  Lock,
  Calendar,
  User,
  MoreVertical,
  Loader2,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DocumentService from '@/services/documentService';
import DocumentProxyService from '@/services/documentProxyService';

const DOCUMENT_TYPES = [
  { value: 'general', label: 'General Document' },
  { value: 'waiver', label: 'Waiver/Release Form' },
  { value: 'medical', label: 'Medical Information' },
  { value: 'identification', label: 'ID/Verification' },
  { value: 'contract', label: 'Contract/Agreement' },
  { value: 'photo', label: 'Photo/Image' },
  { value: 'other', label: 'Other' }
];

const DocumentList = ({ 
  memberId, 
  onDocumentUpdate,
  refreshTrigger = 0,
  className = '' 
}) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDoc, setEditingDoc] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [viewingUrl, setViewingUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [editForm, setEditForm] = useState({
    description: '',
    document_type: 'general',
    is_private: false
  });

  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [memberId, refreshTrigger]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      DocumentProxyService.cleanupBlobUrls();
    };
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await DocumentService.getMemberDocuments(memberId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType === 'application/pdf') return FileText;
    return File;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDocumentTypeLabel = (type) => {
    const docType = DOCUMENT_TYPES.find(t => t.value === type);
    return docType ? docType.label : type;
  };

  const getDocumentTypeBadge = (type) => {
    const colors = {
      waiver: 'bg-blue-100 text-blue-800',
      medical: 'bg-red-100 text-red-800',
      identification: 'bg-green-100 text-green-800',
      contract: 'bg-purple-100 text-purple-800',
      photo: 'bg-yellow-100 text-yellow-800',
      general: 'bg-gray-100 text-gray-800',
      other: 'bg-gray-100 text-gray-800'
    };
    
    return colors[type] || colors.general;
  };

  const canViewInBrowser = (mimeType) => {
    const viewableTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'text/plain'
    ];
    return viewableTypes.includes(mimeType);
  };

  const canViewInDialog = (mimeType) => {
    const dialogViewableTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'text/plain'
    ];
    return dialogViewableTypes.includes(mimeType);
  };

  const handleView = async (document) => {
    // For PDFs, automatically open in new tab
    if (document.mime_type === 'application/pdf') {
      try {
        const url = await DocumentService.getDocumentUrl(document.id);
        window.open(url, '_blank');
      } catch (error) {
        console.error('Error opening PDF:', error);
        toast({
          title: "Error",
          description: "Failed to open PDF document",
          variant: "destructive"
        });
      }
    } else {
      // For other viewable types, load content and open in dialog
      try {
        const url = await DocumentService.getDocumentUrl(document.id);
        setViewingUrl(url);
        setViewingDoc(document);

        // If it's a text file, fetch the content
        if (document.mime_type === 'text/plain') {
          try {
            const text = await DocumentService.getTextContent(document.id);
            setTextContent(text);
          } catch (error) {
            console.warn('Could not fetch text content:', error);
            setTextContent(null);
          }
        }
      } catch (error) {
        console.error('Error loading document:', error);
        toast({
          title: "Error",
          description: "Failed to load document for viewing",
          variant: "destructive"
        });
      }
    }
  };

  const handleDownload = async (document) => {
    try {
      setDownloadingId(document.id);
      await DocumentService.downloadDocument(document.id);

      toast({
        title: "Download Started",
        description: "Document download has started",
        variant: "default"
      });

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download document",
        variant: "destructive"
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEdit = (document) => {
    setEditingDoc(document);
    setEditForm({
      description: document.description || '',
      document_type: document.document_type,
      is_private: document.is_private
    });
  };

  const handleSaveEdit = async () => {
    try {
      const updatedDoc = await DocumentService.updateDocument(editingDoc.id, editForm);
      
      setDocuments(prev => 
        prev.map(doc => doc.id === editingDoc.id ? updatedDoc : doc)
      );
      
      setEditingDoc(null);
      onDocumentUpdate?.();
      
      toast({
        title: "Document Updated",
        description: "Document information has been updated",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update document",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (documentId) => {
    try {
      await DocumentService.deleteDocument(documentId);
      
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setDeleteConfirm(null);
      onDocumentUpdate?.();
      
      toast({
        title: "Document Deleted",
        description: "Document has been permanently deleted",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Member Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Member Documents ({documents.length})</span>
            <Button variant="outline" size="sm" onClick={loadDocuments}>
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {documents.map((document, index) => {
                  const FileIcon = getFileIcon(document.mime_type);
                  
                  return (
                    <motion.div
                      key={document.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className={`${canViewInBrowser(document.mime_type) ? 'cursor-pointer hover:opacity-80' : ''}`}
                             onClick={() => canViewInBrowser(document.mime_type) && handleView(document)}
                             title={canViewInBrowser(document.mime_type) ? 'Click to view' : ''}>
                          <FileIcon className="h-8 w-8 text-gray-500" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {document.original_name}
                          </h4>
                          {document.is_private && (
                            <Lock className="h-3 w-3 text-gray-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-xs ${getDocumentTypeBadge(document.document_type)}`}>
                            {getDocumentTypeLabel(document.document_type)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(document.file_size)}
                          </span>
                        </div>
                        
                        {document.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {document.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(document.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {document.staff.name}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 flex items-center gap-1">
                        {canViewInBrowser(document.mime_type) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(document)}
                            title={document.mime_type === 'application/pdf' ? 'Open PDF in new tab' : 'View document'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canViewInBrowser(document.mime_type) && (
                              <DropdownMenuItem onClick={() => handleView(document)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {document.mime_type === 'application/pdf' ? 'Open in New Tab' : 'View'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDownload(document)}>
                              {downloadingId === document.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4 mr-2" />
                              )}
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(document)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirm(document)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update document information and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-type">Document Type</Label>
              <Select
                value={editForm.document_type}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, document_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a description..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-private"
                checked={editForm.is_private}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_private: checked }))}
              />
              <Label htmlFor="edit-private">Private document (staff only)</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDoc(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirm?.original_name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete(deleteConfirm.id)}
            >
              Delete Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simple Document Viewer Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={() => {
        setViewingDoc(null);
        setViewingUrl(null);
        setTextContent(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingDoc && (
                <>
                  {getFileIcon(viewingDoc.mime_type)({ className: "h-5 w-5" })}
                  {viewingDoc.original_name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {viewingDoc && (
                <>
                  {formatFileSize(viewingDoc.file_size)} • {formatDate(viewingDoc.created_at)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {viewingDoc && viewingUrl && (
              <div className="w-full h-96 border rounded-lg overflow-hidden">
                {viewingDoc.mime_type.startsWith('image/') ? (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <img
                      src={viewingUrl}
                      alt={viewingDoc.original_name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : viewingDoc.mime_type === 'text/plain' && textContent !== null ? (
                  <div className="h-full overflow-auto p-4 bg-white">
                    <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                      {textContent}
                    </pre>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="text-center">
                      <File className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-sm text-gray-600">Loading...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => viewingUrl && window.open(viewingUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              onClick={() => viewingDoc && handleDownload(viewingDoc)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={() => {
              setViewingDoc(null);
              setViewingUrl(null);
              setTextContent(null);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentList;
