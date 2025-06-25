import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Camera, Shield, Calendar, Phone, Mail, MapPin, FileText } from 'lucide-react';
import ProfileForm from './ProfileForm';
import { supabase } from '@/lib/supabaseClient';

/**
 * Enhanced profile modal with tabbed interface and photo upload
 */
const ProfileModal = ({
  isOpen,
  onClose,
  profileData = null,
  userRole = 'member',
  mode = 'edit', // 'edit', 'create', 'view'
  onSave,
  onDelete,
  showTabs = true,
  title,
  description
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const isEditable = mode === 'edit' || mode === 'create';
  const modalTitle = title || (mode === 'create' ? 'Create New Profile' : mode === 'edit' ? 'Edit Profile' : 'View Profile');
  const modalDescription = description || (mode === 'create' ? 'Enter the details for the new profile.' : mode === 'edit' ? 'Update the profile information.' : 'View profile details.');

  // Initialize image preview
  useEffect(() => {
    if (profileData?.profile_picture_url) {
      setImagePreview(profileData.profile_picture_url);
    }
  }, [profileData]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid image file.",
          variant: "destructive"
        });
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async (userId) => {
    if (!profileImage) return null;

    try {
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, profileImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile image. Profile will be saved without image.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleFormSubmit = async (formData, validation) => {
    setIsLoading(true);
    try {
      let finalFormData = { ...formData };

      // Upload profile image if provided
      if (profileImage && (mode === 'create' || mode === 'edit')) {
        const imageUrl = await uploadProfileImage(profileData?.id || 'temp');
        if (imageUrl) {
          finalFormData.profile_picture_url = imageUrl;
        }
      }

      await onSave?.(finalFormData, validation);
      
      toast({
        title: mode === 'create' ? "Profile Created" : "Profile Updated",
        description: mode === 'create' ? "New profile has been created successfully." : "Profile has been updated successfully."
      });

      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!profileData?.id) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete this profile? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      await onDelete?.(profileData.id);
      toast({
        title: "Profile Deleted",
        description: "Profile has been deleted successfully."
      });
      onClose();
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const ProfileImageSection = () => (
    <div className="flex flex-col items-center space-y-4 p-6 border-b">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={imagePreview} alt="Profile" />
          <AvatarFallback className="text-lg">
            {getInitials(profileData?.first_name, profileData?.last_name)}
          </AvatarFallback>
        </Avatar>
        
        {isEditable && (
          <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
            <Camera className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div className="text-center">
        <h3 className="font-semibold text-lg">
          {profileData?.first_name && profileData?.last_name 
            ? `${profileData.first_name} ${profileData.last_name}`
            : 'New Profile'
          }
        </h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          <Badge variant="outline" className="capitalize">
            {userRole}
          </Badge>
          {profileData?.status && (
            <Badge variant={profileData.status === 'active' ? 'default' : 'secondary'}>
              {profileData.status}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  if (!showTabs) {
    // Simple modal without tabs
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>{modalDescription}</DialogDescription>
          </DialogHeader>

          {mode !== 'create' && <ProfileImageSection />}

          <ProfileForm
            initialData={profileData || {}}
            userRole={userRole}
            onSubmit={handleFormSubmit}
            onCancel={onClose}
            isLoading={isLoading}
            showSections={false}
            submitButtonText={mode === 'create' ? 'Create Profile' : 'Save Changes'}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Full tabbed modal
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {mode !== 'create' && <ProfileImageSection />}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4">
              <TabsContent value="profile" className="mt-0">
                <ProfileForm
                  initialData={profileData || {}}
                  userRole={userRole}
                  onSubmit={handleFormSubmit}
                  onCancel={onClose}
                  isLoading={isLoading}
                  showSections={true}
                  submitButtonText={mode === 'create' ? 'Create Profile' : 'Save Changes'}
                />
              </TabsContent>

              <TabsContent value="contact" className="mt-0">
                <div className="text-center py-8 text-muted-foreground">
                  Contact management features coming soon...
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <div className="text-center py-8 text-muted-foreground">
                  Notes and activity log coming soon...
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Delete button for edit mode */}
          {mode === 'edit' && onDelete && (
            <div className="border-t p-4">
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isLoading}
                className="w-full"
              >
                Delete Profile
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
