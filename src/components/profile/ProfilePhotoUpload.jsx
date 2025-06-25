import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X, Loader2, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

/**
 * Profile photo upload component with drag & drop support
 */
const ProfilePhotoUpload = ({
  currentImageUrl = null,
  profileId,
  profileName = '',
  onImageUploaded,
  onImageRemoved,
  size = 'lg', // 'sm', 'md', 'lg', 'xl'
  allowRemove = true,
  className = ''
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
    xl: 'h-40 w-40'
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const validateFile = (file) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file');
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be smaller than 5MB');
    }

    // Check image dimensions (optional)
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 100 || img.height < 100) {
          reject(new Error('Image must be at least 100x100 pixels'));
        } else {
          resolve(true);
        }
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImage = async (file) => {
    try {
      // Validate file
      await validateFile(file);

      setIsUploading(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onImageUploaded?.(publicUrl);

      toast({
        title: "Photo Updated",
        description: "Profile photo has been updated successfully."
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async () => {
    try {
      setIsUploading(true);

      // Update profile to remove image URL
      const { error } = await supabase
        .from('profiles')
        .update({ 
          profile_picture_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) throw error;

      setPreviewUrl(null);
      onImageRemoved?.();

      toast({
        title: "Photo Removed",
        description: "Profile photo has been removed."
      });

    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (file) => {
    if (file) {
      uploadImage(file);
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    handleFileSelect(file);
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Avatar with upload overlay */}
      <div className="relative">
        <Avatar className={cn(sizeClasses[size], 'border-2 border-muted')}>
          <AvatarImage src={previewUrl} alt={profileName} />
          <AvatarFallback className="text-lg">
            {getInitials(profileName)}
          </AvatarFallback>
        </Avatar>

        {/* Upload overlay */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer',
            dragOver && 'opacity-100 bg-primary/50',
            isUploading && 'opacity-100'
          )}
          onClick={openFileDialog}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>
      </div>

      {/* Upload instructions */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Click or drag to upload a new photo
        </p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or GIF • Max 5MB • Min 100x100px
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openFileDialog}
          disabled={isUploading}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Photo
        </Button>

        {allowRemove && previewUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={removeImage}
            disabled={isUploading}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
            Remove
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag & drop area (alternative layout) */}
      {size === 'xl' && (
        <Card
          className={cn(
            'w-full max-w-sm border-2 border-dashed transition-colors cursor-pointer',
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            isUploading && 'pointer-events-none opacity-50'
          )}
          onClick={openFileDialog}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Drop image here or click to browse</p>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, GIF up to 5MB
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfilePhotoUpload;
