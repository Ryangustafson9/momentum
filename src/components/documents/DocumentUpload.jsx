/**
 * Document Upload Component
 * Handles file uploads with drag & drop, validation, and progress tracking
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import DocumentService from '@/services/documentService';

const DOCUMENT_TYPES = [
  { value: 'general', label: 'General Document' },
  { value: 'waiver', label: 'Waiver/Release Form' },
  { value: 'medical', label: 'Medical Information' },
  { value: 'identification', label: 'ID/Verification' },
  { value: 'contract', label: 'Contract/Agreement' },
  { value: 'photo', label: 'Photo/Image' },
  { value: 'other', label: 'Other' }
];

const DocumentUpload = ({ 
  memberId, 
  staffId, 
  onUploadSuccess, 
  onUploadError,
  className = '' 
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    documentType: 'general',
    description: '',
    isPrivate: false
  });

  const fileInputRef = useRef(null);
  const { toast } = useToast();

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

  const validateFiles = (files) => {
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach(file => {
      try {
        DocumentService.validateFile(file);
        validFiles.push(file);
      } catch (error) {
        errors.push(`${file.name}: ${error.message}`);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "File Validation Errors",
        description: errors.join('\n'),
        variant: "destructive"
      });
    }

    return validFiles;
  };

  const handleFileSelect = useCallback((files) => {
    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const results = [];
    const errors = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileId = `file-${i}`;
      
      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: Math.min((prev[fileId] || 0) + 10, 90)
          }));
        }, 200);

        const result = await DocumentService.uploadDocument(
          memberId,
          staffId,
          file,
          {
            documentType: formData.documentType,
            description: formData.description,
            isPrivate: formData.isPrivate
          }
        );

        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        results.push(result);

      } catch (error) {
        console.error('Upload error:', error);
        errors.push({ file: file.name, error: error.message });
        setUploadProgress(prev => ({ ...prev, [fileId]: -1 })); // Error state
      }
    }

    // Show results
    if (results.length > 0) {
      toast({
        title: "Upload Successful",
        description: `${results.length} document(s) uploaded successfully`,
        variant: "default"
      });
      
      onUploadSuccess?.(results);
      
      // Reset form
      setSelectedFiles([]);
      setFormData({
        documentType: 'general',
        description: '',
        isPrivate: false
      });
    }

    if (errors.length > 0) {
      toast({
        title: "Upload Errors",
        description: `${errors.length} file(s) failed to upload`,
        variant: "destructive"
      });
      
      onUploadError?.(errors);
    }

    setIsUploading(false);
    setUploadProgress({});
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop files here, or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-primary hover:underline font-medium"
              disabled={isUploading}
            >
              browse files
            </button>
          </p>
          <p className="text-xs text-gray-500">
            PDF, images, and documents up to 10MB
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.doc,.docx"
            onChange={handleInputChange}
            className="hidden"
            disabled={isUploading}
          />
        </div>

        {/* Selected Files */}
        <AnimatePresence>
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <h4 className="font-medium text-sm">Selected Files ({selectedFiles.length})</h4>
              {selectedFiles.map((file, index) => {
                const fileId = `file-${index}`;
                const progress = uploadProgress[fileId];
                const FileIcon = getFileIcon(file.type);
                
                return (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <FileIcon className="h-5 w-5 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      
                      {progress !== undefined && (
                        <div className="mt-2">
                          {progress === -1 ? (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="text-xs">Upload failed</span>
                            </div>
                          ) : progress === 100 ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-xs">Upload complete</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Progress value={progress} className="h-1" />
                              <span className="text-xs text-gray-500">{progress}%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Options */}
        {selectedFiles.length > 0 && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}
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
              
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="isPrivate"
                  checked={formData.isPrivate}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrivate: checked }))}
                />
                <Label htmlFor="isPrivate" className="text-sm">
                  Private document (staff only)
                </Label>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description for these documents..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            
            <Button
              onClick={uploadFiles}
              disabled={isUploading || selectedFiles.length === 0}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
