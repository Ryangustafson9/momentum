/**
 * Contact Info Section Component
 * Handles contact information display and editing
 * Extracted from the massive MemberProfile component
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMemberProfile } from '../MemberProfileContext';

// ==================== EDITABLE INFO ROW ====================

const EditableInfoRow = ({ 
  label, 
  value, 
  icon: Icon, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel,
  type = 'text',
  placeholder = '',
  multiline = false
}) => {
  const [editValue, setEditValue] = useState(value || '');

  const handleSave = () => {
    onSave(editValue);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    onCancel();
  };

  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start w-full">
        {/* Label Column - Fixed Width */}
        <div className="w-32 flex-shrink-0 pt-1">
          <Label className="text-sm font-medium text-gray-700">{label}</Label>
        </div>

        {/* Value/Input Column - Flexible Width */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div>
              {multiline ? (
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={placeholder}
                  className="w-full min-h-[80px]"
                  rows={3}
                />
              ) : (
                <Input
                  type={type}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={placeholder}
                  className="w-full h-9"
                />
              )}
            </div>
          ) : (
            <div>
              {multiline ? (
                <p className="text-sm text-gray-900 whitespace-pre-wrap py-1">
                  {value || 'Not provided'}
                </p>
              ) : (
                <p className="text-sm text-gray-900 py-1">
                  {value || 'Not provided'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-4 mt-1">
        {isEditing ? (
          <>
            <Button size="sm" onClick={handleSave} className="h-8 w-8 p-0">
              <Save className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 w-8 p-0">
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onEdit}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const ContactInfoSection = () => {
  const { 
    memberData, 
    isLoading, 
    isEditing, 
    startEditing, 
    cancelEditing, 
    updateSectionData, 
    saveSectionData,
    getSectionData,
    getSectionErrors
  } = useMemberProfile();

  const sectionId = 'contact';
  const isEditingSection = isEditing(sectionId);
  const sectionData = getSectionData(sectionId);
  const errors = getSectionErrors(sectionId);

  const handleEdit = (field) => {
    if (!isEditingSection) {
      startEditing(sectionId, {
        email: memberData?.email || '',
        phone: memberData?.phone || '',
        address: memberData?.address || '',
        city: memberData?.city || '',
        state: memberData?.state || '',
        zip_code: memberData?.zip_code || ''
      });
    }
  };

  const handleSave = (field, value) => {
    updateSectionData(sectionId, { [field]: value });
    // Auto-save individual fields
    saveSectionData(sectionId, { [field]: value });
  };

  const handleCancel = () => {
    cancelEditing(sectionId);
  };

  // Format full address for display
  const formatAddress = () => {
    const parts = [
      memberData?.address,
      memberData?.city,
      memberData?.state,
      memberData?.zip_code
    ].filter(Boolean);
    
    if (parts.length === 0) return 'Not provided';
    
    // Format as: "123 Main St, City, State 12345"
    const address = memberData?.address;
    const cityStateZip = [memberData?.city, memberData?.state, memberData?.zip_code]
      .filter(Boolean)
      .join(', ');
    
    return [address, cityStateZip].filter(Boolean).join('\n');
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Contact Information
          </CardTitle>
          {isEditingSection && (
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => saveSectionData(sectionId, sectionData)}
                disabled={Object.keys(errors).length > 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Save All
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          
          {/* Email */}
          <EditableInfoRow
            label="Email Address"
            value={memberData?.email}
            isEditing={isEditingSection}
            onEdit={() => handleEdit('email')}
            onSave={(value) => handleSave('email', value)}
            onCancel={handleCancel}
            type="email"
            placeholder="Enter email address"
          />

          {/* Phone */}
          <EditableInfoRow
            label="Phone Number"
            value={memberData?.phone}
            isEditing={isEditingSection}
            onEdit={() => handleEdit('phone')}
            onSave={(value) => handleSave('phone', value)}
            onCancel={handleCancel}
            type="tel"
            placeholder="Enter phone number"
          />

          {/* Address */}
          <EditableInfoRow
            label="Street Address"
            value={memberData?.address}
            isEditing={isEditingSection}
            onEdit={() => handleEdit('address')}
            onSave={(value) => handleSave('address', value)}
            onCancel={handleCancel}
            placeholder="Enter street address"
          />

          {/* City */}
          <EditableInfoRow
            label="City"
            value={memberData?.city}
            isEditing={isEditingSection}
            onEdit={() => handleEdit('city')}
            onSave={(value) => handleSave('city', value)}
            onCancel={handleCancel}
            placeholder="Enter city"
          />

          {/* State */}
          <EditableInfoRow
            label="State"
            value={memberData?.state}
            isEditing={isEditingSection}
            onEdit={() => handleEdit('state')}
            onSave={(value) => handleSave('state', value)}
            onCancel={handleCancel}
            placeholder="Enter state"
          />

          {/* ZIP Code */}
          <EditableInfoRow
            label="ZIP Code"
            value={memberData?.zip_code}
            isEditing={isEditingSection}
            onEdit={() => handleEdit('zip_code')}
            onSave={(value) => handleSave('zip_code', value)}
            onCancel={handleCancel}
            placeholder="Enter ZIP code"
          />
        </div>

        {/* Validation Errors */}
        {Object.keys(errors).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-800 font-medium mb-1">Please fix the following errors:</p>
            <ul className="text-sm text-red-700 list-disc list-inside">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactInfoSection;
