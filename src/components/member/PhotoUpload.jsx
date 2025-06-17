/**
 * 📸 MEMBER PHOTO UPLOAD COMPONENT
 * Profile photo upload with image cropping and optimization
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Check, Crop, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

const PhotoUpload = ({ 
  currentPhotoUrl = null,
  memberId,
  memberName = '',
  onPhotoUpdate,
  className = ''
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Get member initials for fallback
  const getInitials = useCallback(() => {
    return memberName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'M';
  }, [memberName]);

  // Validate file
  const validateFile = (file) => {
    const maxSize = env.UPLOAD.MAX_FILE_SIZE; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, GIF, or WebP image.',
        variant: 'destructive',
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `Please upload an image smaller than ${Math.round(maxSize / 1024 / 1024)}MB.`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // Compress and resize image
  const compressImage = (file, maxWidth = 400, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        // Set canvas size
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Upload to Supabase Storage
  const uploadToStorage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${memberId}-${Date.now()}.${fileExt}`;
    const filePath = `member-photos/${fileName}`;

    try {
      // Compress image first
      const compressedFile = await compressImage(file);
      
      const { data, error } = await supabase.storage
        .from('member-assets')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('member-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Update member profile with new photo URL
  const updateMemberProfile = async (photoUrl) => {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: photoUrl })
      .eq('id', memberId);

    if (error) throw error;
  };

  // Handle file selection
  const handleFileSelect = async (file) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Show preview
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      setUploadProgress(25);

      // Upload to storage
      const photoUrl = await uploadToStorage(file);
      setUploadProgress(75);

      // Update profile
      await updateMemberProfile(photoUrl);
      setUploadProgress(100);

      // Notify parent component
      onPhotoUpdate?.(photoUrl);

      toast({
        title: 'Photo uploaded successfully',
        description: 'Your profile photo has been updated.',
      });

      // Clean up
      setTimeout(() => {
        setPreviewUrl(null);
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);

    } catch (error) {
      console.error('Photo upload failed:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload photo. Please try again.',
        variant: 'destructive',
      });
      setIsUploading(false);
      setUploadProgress(0);
      setPreviewUrl(null);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file input change
  const handleInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Photo Display */}
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
              <AvatarImage 
                src={previewUrl || currentPhotoUrl} 
                alt={memberName}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            {/* Upload Progress Overlay */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"
                >
                  <div className="text-center text-white">
                    <div className="text-sm font-medium mb-1">
                      {uploadProgress < 100 ? 'Uploading...' : 'Complete!'}
                    </div>
                    <Progress value={uploadProgress} className="w-16 h-1" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Camera Icon */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors',
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400',
              isUploading && 'opacity-50 pointer-events-none'
            )}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop your photo here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:underline font-medium"
                disabled={isUploading}
              >
                browse files
              </button>
            </p>
            <p className="text-xs text-gray-500">
              JPEG, PNG, GIF, or WebP up to {Math.round(env.UPLOAD.MAX_FILE_SIZE / 1024 / 1024)}MB
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Photo
            </Button>
            
            {currentPhotoUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Remove photo functionality
                  updateMemberProfile(null);
                  onPhotoUpdate?.(null);
                  toast({
                    title: 'Photo removed',
                    description: 'Your profile photo has been removed.',
                  });
                }}
                disabled={isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PhotoUpload;
