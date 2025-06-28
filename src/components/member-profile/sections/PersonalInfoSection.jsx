/**
 * Personal Info Section Component
 * Handles personal information display and editing
 * Extracted from the massive MemberProfile component
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  Users, 
  Edit3, 
  Save, 
  X,
  Fingerprint
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemberProfile } from '../MemberProfileContext';
import { format, isValid } from 'date-fns';

// ==================== HELPER FUNCTIONS ====================

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'yyyy-MM-dd') : '';
  } catch {
    return '';
  }
};

const formatDisplayDate = (dateString) => {
  if (!dateString) return 'Not provided';
  try {
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid date';
  } catch {
    return 'Invalid date';
  }
};

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
      <div className="flex items-center gap-3 flex-1">
        {Icon && (
          <div className="p-2 bg-gray-50 rounded-lg">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
        )}
        <div className="flex-1">
          <Label className="text-sm font-medium text-gray-700">{label}</Label>
          {isEditing ? (
            <div className="mt-1">
              {type === 'select' && options ? (
                <Select value={editValue} onValueChange={setEditValue}>
                  <SelectTrigger className="w-full">
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
                  className="w-full"
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-900 mt-1">
              {type === 'date' ? formatDisplayDate(value) : (value || 'Not provided')}
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

const PersonalInfoSection = () => {
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

  const sectionId = 'personal';
  const isEditingSection = isEditing(sectionId);
  const sectionData = getSectionData(sectionId);
  const errors = getSectionErrors(sectionId);

  const handleEdit = (field) => {
    if (!isEditingSection) {
      startEditing(sectionId, {
        first_name: memberData?.first_name || '',
        last_name: memberData?.last_name || '',
        date_of_birth: memberData?.date_of_birth || '',
        gender: memberData?.gender || '',
        system_member_id: memberData?.system_member_id || ''
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

  const genderOptions = [
    { value: '', label: 'Prefer not to say' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
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
            <User className="h-5 w-5 text-primary" />
            Personal Information
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
          
          {/* Member ID (Read-only) */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Fingerprint className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700">Member ID</Label>
                <p className="text-sm text-gray-900 mt-1 font-mono">
                  {memberData?.system_member_id || 'Not assigned'}
                </p>
              </div>
            </div>
          </div>

          {/* First Name */}
          <EditableInfoRow
            label="First Name"
            value={memberData?.first_name}
            icon={User}
            isEditing={isEditingSection}
            onEdit={() => handleEdit('first_name')}
            onSave={(value) => handleSave('first_name', value)}
            onCancel={handleCancel}
            placeholder="Enter first name"
          />

          {/* Last Name */}
          <EditableInfoRow
            label="Last Name"
            value={memberData?.last_name}
            icon={User}
            isEditing={isEditingSection}
            onEdit={() => handleEdit('last_name')}
            onSave={(value) => handleSave('last_name', value)}
            onCancel={handleCancel}
            placeholder="Enter last name"
          />

          {/* Date of Birth */}
          <EditableInfoRow
            label="Date of Birth"
            value={memberData?.date_of_birth}
            icon={Calendar}
            isEditing={isEditingSection}
            onEdit={() => handleEdit('date_of_birth')}
            onSave={(value) => handleSave('date_of_birth', value)}
            onCancel={handleCancel}
            type="date"
            placeholder="Select date of birth"
          />

          {/* Gender */}
          <EditableInfoRow
            label="Gender"
            value={memberData?.gender}
            icon={Users}
            isEditing={isEditingSection}
            onEdit={() => handleEdit('gender')}
            onSave={(value) => handleSave('gender', value)}
            onCancel={handleCancel}
            type="select"
            options={genderOptions}
            placeholder="Select gender"
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

export default PersonalInfoSection;
