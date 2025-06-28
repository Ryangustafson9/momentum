/**
 * Personal Information Tab Component
 * Extracted from MemberProfile.jsx for better maintainability
 */

import React, { useState, useCallback } from 'react';
import { User, Mail, Phone, Home, Edit3, Save, X, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast.js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { getInitials } from '@/utils/memberUtils';
import { logger } from '@/utils/logger';

const PersonalInfoTab = ({ 
  profile, 
  isEditing, 
  setIsEditing, 
  onSave,
  customFields = [],
  memberCustomFieldValues = {},
  onCustomFieldChange,
  CustomFieldInlineEdit 
}) => {
  const { toast } = useToast();
  const [localProfile, setLocalProfile] = useState(profile || {});
  const [isSaving, setIsSaving] = useState(false);

  // Handle field changes
  const handleFieldChange = useCallback((field, value) => {
    setLocalProfile(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      await onSave(localProfile);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
        variant: "success"
      });
    } catch (error) {
      logger.error('Error saving profile:', error);
      toast({
        title: "Error", 
        description: "Failed to save profile changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [localProfile, onSave, setIsEditing, toast]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setLocalProfile(profile || {});
    setIsEditing(false);
  }, [profile, setIsEditing]);

  return (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Profile Photo and Basic Info */}
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={localProfile.avatar_url} 
                  alt={`${localProfile.first_name} ${localProfile.last_name}`} 
                />
                <AvatarFallback className="text-lg">
                  {getInitials(`${localProfile.first_name} ${localProfile.last_name}`)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-1" />
                  Change Photo
                </Button>
              )}
            </div>

            {/* Basic Information Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                {isEditing ? (
                  <Input
                    id="first_name"
                    value={localProfile.first_name || ''}
                    onChange={(e) => handleFieldChange('first_name', e.target.value)}
                    placeholder="Enter first name"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{localProfile.first_name || 'Not provided'}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="last_name"
                    value={localProfile.last_name || ''}
                    onChange={(e) => handleFieldChange('last_name', e.target.value)}
                    placeholder="Enter last name"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{localProfile.last_name || 'Not provided'}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={localProfile.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{localProfile.email || 'Not provided'}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={localProfile.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{localProfile.phone || 'Not provided'}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                {isEditing ? (
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={localProfile.date_of_birth || ''}
                    onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">
                    {localProfile.date_of_birth ? 
                      new Date(localProfile.date_of_birth).toLocaleDateString() : 
                      'Not provided'
                    }
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                {isEditing ? (
                  <Select 
                    value={localProfile.gender || ''} 
                    onValueChange={(value) => handleFieldChange('gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-900 py-2">
                    {localProfile.gender ? 
                      localProfile.gender.charAt(0).toUpperCase() + localProfile.gender.slice(1).replace('_', ' ') : 
                      'Not provided'
                    }
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Home className="h-5 w-5" />
              Address Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Street Address */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street_address">Street Address</Label>
                {isEditing ? (
                  <AddressAutocomplete
                    value={localProfile.street_address || ''}
                    onChange={(address) => {
                      handleFieldChange('street_address', address.street_address);
                      if (address.city) handleFieldChange('city', address.city);
                      if (address.state) handleFieldChange('state', address.state);
                      if (address.zip_code) handleFieldChange('zip_code', address.zip_code);
                    }}
                    placeholder="Enter street address"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{localProfile.street_address || 'Not provided'}</p>
                )}
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                {isEditing ? (
                  <Input
                    id="city"
                    value={localProfile.city || ''}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    placeholder="Enter city"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{localProfile.city || 'Not provided'}</p>
                )}
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                {isEditing ? (
                  <Input
                    id="state"
                    value={localProfile.state || ''}
                    onChange={(e) => handleFieldChange('state', e.target.value)}
                    placeholder="Enter state"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{localProfile.state || 'Not provided'}</p>
                )}
              </div>

              {/* Zip Code */}
              <div className="space-y-2">
                <Label htmlFor="zip_code">Zip Code</Label>
                {isEditing ? (
                  <Input
                    id="zip_code"
                    value={localProfile.zip_code || ''}
                    onChange={(e) => handleFieldChange('zip_code', e.target.value)}
                    placeholder="Enter zip code"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{localProfile.zip_code || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Custom Fields Section */}
          {customFields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.map(field => (
                  <CustomFieldInlineEdit
                    key={field.id}
                    field={field}
                    value={memberCustomFieldValues[field.id] || ''}
                    onChange={(value) => onCustomFieldChange(field.id, value)}
                    className="space-y-2"
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalInfoTab;
