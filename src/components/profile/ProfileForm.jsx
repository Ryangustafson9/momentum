import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, AlertTriangle, CheckCircle, User, Phone, Mail, MapPin, Calendar, Shield } from 'lucide-react';
import ProfileFormField from './ProfileFormField';
import { useFormValidation, profileValidationConfigs } from '@/utils/profileFormValidation';
import { cn } from '@/lib/utils';
import { getUserStatusOptions } from '@/utils/statusUtils';

/**
 * Unified profile form component for creating and editing user profiles
 */
const ProfileForm = ({
  initialData = {},
  userRole = 'member',
  onSubmit,
  onCancel,
  isLoading = false,
  showSections = true,
  className = '',
  submitButtonText = 'Save Profile',
  cancelButtonText = 'Cancel'
}) => {
  const config = profileValidationConfigs[userRole] || profileValidationConfigs.member;
  
  const {
    formData,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    handleFieldChange,
    handleFieldBlur,
    validateAllFields,
    resetForm,
    setFormData
  } = useFormValidation(initialData, config.rules);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize form data when initialData changes
  useEffect(() => {
    setFormData(initialData);
    setHasUnsavedChanges(false);
  }, [initialData, setFormData]);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
    setHasUnsavedChanges(hasChanges);
  }, [formData, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = validateAllFields(config.requiredFields);
    
    if (!validation.isValid) {
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit?.(formData, validation);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Profile form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (!confirmDiscard) return;
    }
    resetForm(initialData);
    onCancel?.();
  };

  const getFieldError = (fieldName) => {
    return touched[fieldName] ? errors[fieldName] : null;
  };

  const getFieldSuccess = (fieldName) => {
    return touched[fieldName] && !errors[fieldName] && formData[fieldName];
  };

  const statusOptions = getUserStatusOptions();

  if (!showSections) {
    // Simple form layout without sections
    return (
      <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfileFormField
            label="First Name"
            name="first_name"
            value={formData.first_name || ''}
            onChange={handleFieldChange}
            onBlur={() => handleFieldBlur('first_name')}
            required={config.requiredFields.includes('first_name')}
            error={getFieldError('first_name')}
            success={getFieldSuccess('first_name')}
          />
          <ProfileFormField
            label="Last Name"
            name="last_name"
            value={formData.last_name || ''}
            onChange={handleFieldChange}
            onBlur={() => handleFieldBlur('last_name')}
            required={config.requiredFields.includes('last_name')}
            error={getFieldError('last_name')}
            success={getFieldSuccess('last_name')}
          />
        </div>

        <ProfileFormField
          label="Email Address"
          name="email"
          type="email"
          value={formData.email || ''}
          onChange={handleFieldChange}
          onBlur={() => handleFieldBlur('email')}
          required={config.requiredFields.includes('email')}
          error={getFieldError('email')}
          success={getFieldSuccess('email')}
        />

        <ProfileFormField
          label="Phone Number"
          name="phone"
          type="tel"
          value={formData.phone || ''}
          onChange={handleFieldChange}
          onBlur={() => handleFieldBlur('phone')}
          required={config.requiredFields.includes('phone')}
          error={getFieldError('phone')}
          success={getFieldSuccess('phone')}
        />

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={handleCancel}>
              {cancelButtonText}
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isLoading || isSubmitting}
            className="relative"
          >
            {(isLoading || isSubmitting) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            )}
            <span className={isLoading || isSubmitting ? 'opacity-0' : ''}>
              {submitButtonText}
            </span>
          </Button>
        </div>
      </form>
    );
  }

  // Full sectioned form layout
  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-800">You have unsaved changes</span>
        </div>
      )}

      {/* Basic Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProfileFormField
              label="First Name"
              name="first_name"
              value={formData.first_name || ''}
              onChange={handleFieldChange}
              onBlur={() => handleFieldBlur('first_name')}
              required={config.requiredFields.includes('first_name')}
              error={getFieldError('first_name')}
              success={getFieldSuccess('first_name')}
            />
            <ProfileFormField
              label="Last Name"
              name="last_name"
              value={formData.last_name || ''}
              onChange={handleFieldChange}
              onBlur={() => handleFieldBlur('last_name')}
              required={config.requiredFields.includes('last_name')}
              error={getFieldError('last_name')}
              success={getFieldSuccess('last_name')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProfileFormField
              label="Date of Birth"
              name="dob"
              type="date"
              value={formData.dob || ''}
              onChange={handleFieldChange}
              onBlur={() => handleFieldBlur('dob')}
              required={config.requiredFields.includes('dob')}
              error={getFieldError('dob')}
              success={getFieldSuccess('dob')}
            />
            <ProfileFormField
              label="Join Date"
              name="join_date"
              type="date"
              value={formData.join_date || ''}
              onChange={handleFieldChange}
              onBlur={() => handleFieldBlur('join_date')}
              required={config.requiredFields.includes('join_date')}
              error={getFieldError('join_date')}
              success={getFieldSuccess('join_date')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfileFormField
            label="Email Address"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleFieldChange}
            onBlur={() => handleFieldBlur('email')}
            required={config.requiredFields.includes('email')}
            error={getFieldError('email')}
            success={getFieldSuccess('email')}
          />

          <ProfileFormField
            label="Phone Number"
            name="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={handleFieldChange}
            onBlur={() => handleFieldBlur('phone')}
            required={config.requiredFields.includes('phone')}
            error={getFieldError('phone')}
            success={getFieldSuccess('phone')}
          />

          <ProfileFormField
            label="Address"
            name="address"
            type="textarea"
            value={formData.address || ''}
            onChange={handleFieldChange}
            onBlur={() => handleFieldBlur('address')}
            required={config.requiredFields.includes('address')}
            error={getFieldError('address')}
            success={getFieldSuccess('address')}
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={handleCancel}>
            {cancelButtonText}
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isLoading || isSubmitting}
          className="relative"
        >
          {(isLoading || isSubmitting) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </div>
          )}
          <span className={isLoading || isSubmitting ? 'opacity-0' : ''}>
            <Save className="h-4 w-4 mr-2" />
            {submitButtonText}
          </span>
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;
