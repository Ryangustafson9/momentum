import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast.js';
import { brandingService } from '@/services/brandingService.js';
import {
  Upload,
  X,
  Image as ImageIcon,
  Info,
  CheckCircle,
  AlertCircle,
  Eye,
  RotateCcw
} from 'lucide-react';

// Image upload specifications
const IMAGE_SPECS = {
  loginLogo: {
    title: "Login Page Logo",
    description: "Displayed prominently on the login page",
    dimensions: "Recommended: 300x100px",
    formats: "PNG, SVG, JPG",
    maxSize: "2MB",
    aspectRatio: "3:1 (landscape)",
    usage: "Login page header"
  },
  navbarLogo: {
    title: "Navigation Bar Logo",
    description: "Compact logo for the top navigation bar",
    dimensions: "Recommended: 120x40px",
    formats: "PNG, SVG, JPG",
    maxSize: "1MB",
    aspectRatio: "3:1 (landscape)",
    usage: "Top navigation bar"
  },
  emailLogo: {
    title: "Email Template Logo",
    description: "Logo used in automated emails and communications",
    dimensions: "Recommended: 200x80px",
    formats: "PNG, JPG",
    maxSize: "1MB",
    aspectRatio: "2.5:1 (landscape)",
    usage: "Email headers and communications"
  },
  favicon: {
    title: "Favicon & App Icon",
    description: "Small icon for browser tabs and mobile app",
    dimensions: "Recommended: 64x64px",
    formats: "PNG, ICO",
    maxSize: "500KB",
    aspectRatio: "1:1 (square)",
    usage: "Browser tab, mobile app icon"
  }
};

const BrandingSettingsTab = ({ initialLogo, initialAvatar, onSave }) => {
  const { toast } = useToast();
  const fileInputRefs = useRef({});

  // State for each image type
  const [images, setImages] = useState({
    loginLogo: { url: initialLogo || '', file: null, uploading: false },
    navbarLogo: { url: initialAvatar || '', file: null, uploading: false },
    emailLogo: { url: '', file: null, uploading: false },
    favicon: { url: '', file: null, uploading: false }
  });

  const [dragStates, setDragStates] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const branding = await brandingService.getBranding();
        if (branding?.logo_url || branding?.avatar_url) {
          setImages(prev => ({
            ...prev,
            loginLogo: { ...prev.loginLogo, url: branding.logo_url || '' },
            navbarLogo: { ...prev.navbarLogo, url: branding.avatar_url || '' }
          }));
        }
      } catch (e) {}
    })();
  }, []);

  // File validation function
  const validateFile = (file, imageType) => {
    const spec = IMAGE_SPECS[imageType];
    const errors = [];

    // Check file size
    const maxSizeBytes = parseFloat(spec.maxSize) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      errors.push(`File size must be less than ${spec.maxSize}`);
    }

    // Check file type
    const allowedTypes = spec.formats.toLowerCase().split(', ').map(format => {
      switch(format) {
        case 'png': return 'image/png';
        case 'jpg': case 'jpeg': return 'image/jpeg';
        case 'svg': return 'image/svg+xml';
        case 'ico': return 'image/x-icon';
        default: return `image/${format}`;
      }
    });

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File must be one of: ${spec.formats}`);
    }

    return errors;
  };

  // Handle file selection
  const handleFileSelect = async (file, imageType) => {
    const errors = validateFile(file, imageType);

    if (errors.length > 0) {
      setValidationErrors(prev => ({ ...prev, [imageType]: errors }));
      toast({
        title: "Invalid File",
        description: errors.join('. '),
        variant: "destructive",
      });
      return;
    }

    // Clear any previous errors
    setValidationErrors(prev => ({ ...prev, [imageType]: [] }));

    // Update state with file and preview
    const previewUrl = URL.createObjectURL(file);
    setImages(prev => ({
      ...prev,
      [imageType]: {
        ...prev[imageType],
        file,
        url: previewUrl,
        uploading: false
      }
    }));
  };

  // Handle drag and drop
  const handleDragOver = (e, imageType) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [imageType]: true }));
  };

  const handleDragLeave = (e, imageType) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [imageType]: false }));
  };

  const handleDrop = (e, imageType) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [imageType]: false }));

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0], imageType);
    }
  };

  // Remove image
  const handleRemoveImage = (imageType) => {
    setImages(prev => ({
      ...prev,
      [imageType]: {
        ...prev[imageType],
        file: null,
        url: '',
        uploading: false
      }
    }));
    setValidationErrors(prev => ({ ...prev, [imageType]: [] }));
  };

  const handleSave = async () => {
    const hasChanges = Object.values(images).some(img => img.file);

    if (!hasChanges) {
      toast({
        title: 'No Changes',
        description: 'No new images to upload.',
        variant: 'default',
      });
      return;
    }

    try {
      let uploadedCount = 0;

      // Update uploading states
      const imagesToUpload = Object.entries(images).filter(([_, img]) => img.file);

      for (const [imageType] of imagesToUpload) {
        setImages(prev => ({
          ...prev,
          [imageType]: { ...prev[imageType], uploading: true }
        }));
      }

      let logoUrl = images.loginLogo.url;
      let avatarUrl = images.navbarLogo.url;

      // Upload login logo
      if (images.loginLogo.file) {
        logoUrl = await brandingService.uploadImage(images.loginLogo.file, 'login-logo');
        uploadedCount++;
      }

      // Upload navbar logo
      if (images.navbarLogo.file) {
        avatarUrl = await brandingService.uploadImage(images.navbarLogo.file, 'navbar-logo');
        uploadedCount++;
      }

      // Upload email logo (future enhancement)
      if (images.emailLogo.file) {
        await brandingService.uploadImage(images.emailLogo.file, 'email-logo');
        uploadedCount++;
      }

      // Upload favicon (future enhancement)
      if (images.favicon.file) {
        await brandingService.uploadImage(images.favicon.file, 'favicon');
        uploadedCount++;
      }

      // Save to database
      await brandingService.saveBranding({ logoUrl, avatarUrl });

      // Update state with final URLs and clear files
      setImages(prev => ({
        loginLogo: { url: logoUrl, file: null, uploading: false },
        navbarLogo: { url: avatarUrl, file: null, uploading: false },
        emailLogo: { ...prev.emailLogo, file: null, uploading: false },
        favicon: { ...prev.favicon, file: null, uploading: false }
      }));

      toast({
        title: 'Branding Updated',
        description: `Successfully uploaded ${uploadedCount} image${uploadedCount !== 1 ? 's' : ''}.`,
        className: 'bg-green-500 text-white',
      });

      if (onSave) onSave({ logo: logoUrl, avatar: avatarUrl });

    } catch (error) {
      // Reset uploading states on error
      setImages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = { ...updated[key], uploading: false };
        });
        return updated;
      });

      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to update branding.',
        variant: 'destructive',
      });
    }
  };

  // Image upload component
  const ImageUploadSection = ({ imageType, spec, image }) => {
    const isDragging = dragStates[imageType];
    const hasError = validationErrors[imageType]?.length > 0;
    const hasImage = image.url && !image.file;
    const hasNewFile = image.file;
    const isUploading = image.uploading;

    return (
      <Card className={`transition-all duration-200 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${hasError ? 'border-red-300' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {spec.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {spec.description}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {spec.usage}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Specifications */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Info className="h-3 w-3 text-blue-500" />
              <span className="text-gray-600">Size: {spec.dimensions}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-gray-600">Format: {spec.formats}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-orange-500" />
              <span className="text-gray-600">Max: {spec.maxSize}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-purple-500" />
              <span className="text-gray-600">Ratio: {spec.aspectRatio}</span>
            </div>
          </div>

          {/* Current Image Preview */}
          {(hasImage || hasNewFile) && (
            <div className="relative">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                <img
                  src={image.url}
                  alt={`${spec.title} Preview`}
                  className={`h-16 object-contain bg-white border rounded shadow-sm ${
                    imageType === 'navbarLogo' || imageType === 'favicon' ? 'w-16' : 'max-w-32'
                  }`}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {hasNewFile ? 'New Upload' : 'Current Image'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {hasNewFile ? `Ready to upload` : 'Currently active'}
                  </p>
                  {isUploading && (
                    <div className="mt-2">
                      <Progress value={75} className="h-1" />
                      <p className="text-xs text-blue-600 mt-1">Uploading...</p>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveImage(imageType)}
                  disabled={isUploading}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : hasError
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => handleDragOver(e, imageType)}
            onDragLeave={(e) => handleDragLeave(e, imageType)}
            onDrop={(e) => handleDrop(e, imageType)}
          >
            <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="text-sm font-medium mb-1">
              {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-gray-500 mb-3">
              {spec.formats} • Max {spec.maxSize} • {spec.dimensions}
            </p>

            <input
              ref={el => fileInputRefs.current[imageType] = el}
              type="file"
              accept={spec.formats.toLowerCase().split(', ').map(f => `image/${f === 'jpg' ? 'jpeg' : f}`).join(',')}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleFileSelect(file, imageType);
              }}
              className="hidden"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRefs.current[imageType]?.click()}
              disabled={isUploading}
            >
              Choose File
            </Button>
          </div>

          {/* Validation Errors */}
          {hasError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium text-sm">Upload Error</span>
              </div>
              <ul className="mt-1 text-sm text-red-600">
                {validationErrors[imageType].map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const hasAnyChanges = Object.values(images).some(img => img.file);
  const isAnyUploading = Object.values(images).some(img => img.uploading);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-none bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-xl">Club Branding Management</CardTitle>
          <CardDescription className="text-base">
            Upload and manage your club's visual identity across the platform. Each image type has specific requirements for optimal display.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Image Upload Sections */}
      <div className="grid gap-6">
        <ImageUploadSection
          imageType="loginLogo"
          spec={IMAGE_SPECS.loginLogo}
          image={images.loginLogo}
        />

        <ImageUploadSection
          imageType="navbarLogo"
          spec={IMAGE_SPECS.navbarLogo}
          image={images.navbarLogo}
        />

        <ImageUploadSection
          imageType="emailLogo"
          spec={IMAGE_SPECS.emailLogo}
          image={images.emailLogo}
        />

        <ImageUploadSection
          imageType="favicon"
          spec={IMAGE_SPECS.favicon}
          image={images.favicon}
        />
      </div>

      {/* Save Button */}
      <Card className="shadow-lg border-none">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ready to save changes?</p>
              <p className="text-sm text-gray-600">
                {hasAnyChanges
                  ? `${Object.values(images).filter(img => img.file).length} image(s) ready to upload`
                  : 'No changes to save'
                }
              </p>
            </div>
            <div className="flex gap-3">
              {hasAnyChanges && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setImages(prev => {
                      const reset = { ...prev };
                      Object.keys(reset).forEach(key => {
                        if (reset[key].file) {
                          reset[key] = { ...reset[key], file: null, url: reset[key].url.startsWith('blob:') ? '' : reset[key].url };
                        }
                      });
                      return reset;
                    });
                    setValidationErrors({});
                  }}
                  disabled={isAnyUploading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Changes
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={!hasAnyChanges || isAnyUploading}
                className="bg-primary hover:bg-primary/90"
              >
                {isAnyUploading ? 'Uploading...' : 'Save Branding'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandingSettingsTab;
