/**
 * Emergency Contact Section Component
 * Handles emergency contact information display and editing
 * Extracted from the massive MemberProfile component
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Edit3,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  options = null,
  placeholder = ''
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
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center w-full">
        {/* Label Column - Fixed Width */}
        <div className="w-32 flex-shrink-0">
          <Label className="text-sm font-medium text-gray-700">{label}</Label>
        </div>

        {/* Value/Input Column - Flexible Width */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div>
              {type === 'select' && options ? (
                <Select value={editValue} onValueChange={setEditValue}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <p className="text-sm text-gray-900 py-1">
              {value || 'Not provided'}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-4">
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

const EmergencyContactSection = () => {
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

  const sectionId = 'emergency';
  const isEditingSection = isEditing(sectionId);
  const sectionData = getSectionData(sectionId);
  const errors = getSectionErrors(sectionId);

  const handleEdit = (field) => {
    if (!isEditingSection) {
      startEditing(sectionId, {
        emergency_contact_name: memberData?.emergency_contact_name || '',
        emergency_contact_phone: memberData?.emergency_contact_phone || '',
        emergency_contact_relationship: memberData?.emergency_contact_relationship || ''
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

  const relationshipOptions = [
    { value: '', label: 'Select relationship' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'partner', label: 'Partner' },
    { value: 'parent', label: 'Parent' },
    { value: 'child', label: 'Child' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'friend', label: 'Friend' },
    { value: 'other', label: 'Other' }
  ];

  // Check if emergency contact is complete
  const hasEmergencyContact = memberData?.emergency_contact_name && memberData?.emergency_contact_phone;

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
            <Heart className="h-5 w-5 text-primary" />
            Emergency Contact
            {!hasEmergencyContact && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
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
        {!hasEmergencyContact && (
          <p className="text-sm text-amber-600 mt-1">
            Emergency contact information is recommended for all members.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          
          {/* Emergency Contact Name */}
          <EditableInfoRow
            label="Contact Name"
            value={memberData?.emergency_contact_name}
            isEditing={isEditingSection}
            onEdit={() => handleEdit('emergency_contact_name')}
            onSave={(value) => handleSave('emergency_contact_name', value)}
            onCancel={handleCancel}
            placeholder="Enter emergency contact name"
          />

          {/* Emergency Contact Phone */}
          <EditableInfoRow
            label="Contact Phone"
            value={memberData?.emergency_contact_phone}
            isEditing={isEditingSection}
            onEdit={() => handleEdit('emergency_contact_phone')}
            onSave={(value) => handleSave('emergency_contact_phone', value)}
            onCancel={handleCancel}
            type="tel"
            placeholder="Enter emergency contact phone"
          />

          {/* Emergency Contact Relationship */}
          <EditableInfoRow
            label="Relationship"
            value={memberData?.emergency_contact_relationship}
            isEditing={isEditingSection}
            onEdit={() => handleEdit('emergency_contact_relationship')}
            onSave={(value) => handleSave('emergency_contact_relationship', value)}
            onCancel={handleCancel}
            type="select"
            options={relationshipOptions}
            placeholder="Select relationship"
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

        {/* Emergency Contact Complete Status */}
        {hasEmergencyContact && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center gap-2 text-green-800">
              <Heart className="h-4 w-4" />
              <span className="text-sm font-medium">
                Emergency contact information is complete
              </span>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmergencyContactSection;
