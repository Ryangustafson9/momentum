/**
 * Custom Fields Section Component
 * Handles custom field display and editing
 * Extracted from the massive MemberProfile component
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Plus, 
  Edit3, 
  Save, 
  X,
  Type,
  ToggleLeft,
  Calendar,
  Hash
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useMemberProfile } from '../MemberProfileContext';

// ==================== HELPER FUNCTIONS ====================

const getFieldIcon = (type) => {
  const icons = {
    text: Type,
    number: Hash,
    date: Calendar,
    boolean: ToggleLeft,
    textarea: Type
  };
  return icons[type] || Type;
};

const formatFieldValue = (value, type) => {
  if (value === null || value === undefined || value === '') {
    return 'Not set';
  }

  switch (type) {
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'date':
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return 'Invalid date';
      }
    default:
      return String(value);
  }
};

// ==================== CUSTOM FIELD ROW ====================

const CustomFieldRow = ({ 
  field, 
  value, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel 
}) => {
  const [editValue, setEditValue] = useState(value || '');
  const Icon = getFieldIcon(field.type);

  const handleSave = () => {
    onSave(field.key, editValue);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    onCancel();
  };

  const renderEditInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className="w-full min-h-[80px]"
            rows={3}
          />
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={editValue === true || editValue === 'true'}
              onCheckedChange={(checked) => setEditValue(checked)}
            />
            <Label className="text-sm">
              {editValue === true || editValue === 'true' ? 'Yes' : 'No'}
            </Label>
          </div>
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className="w-full"
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full"
          />
        );
      
      default:
        return (
          <Input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className="w-full"
          />
        );
    }
  };

  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start gap-3 flex-1">
        <div className="p-2 bg-gray-50 rounded-lg mt-1">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>
          )}
          {isEditing ? (
            <div className="mt-2">
              {renderEditInput()}
            </div>
          ) : (
            <p className="text-sm text-gray-900 mt-1">
              {formatFieldValue(value, field.type)}
            </p>
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

const CustomFieldsSection = () => {
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

  const [editingField, setEditingField] = useState(null);

  const sectionId = 'custom_fields';
  const isEditingSection = isEditing(sectionId);
  const sectionData = getSectionData(sectionId);
  const errors = getSectionErrors(sectionId);

  // Mock custom fields configuration - in real app, this would come from settings
  const customFieldsConfig = [
    {
      key: 'emergency_medical_info',
      label: 'Medical Information',
      type: 'textarea',
      description: 'Any medical conditions or allergies staff should know about',
      required: false
    },
    {
      key: 'preferred_contact_method',
      label: 'Preferred Contact Method',
      type: 'text',
      description: 'How the member prefers to be contacted',
      required: false
    },
    {
      key: 'fitness_goals',
      label: 'Fitness Goals',
      type: 'textarea',
      description: 'Member\'s fitness objectives and goals',
      required: false
    },
    {
      key: 'waiver_signed',
      label: 'Waiver Signed',
      type: 'boolean',
      description: 'Has the member signed the liability waiver?',
      required: true
    }
  ];

  const customFieldsData = memberData?.custom_fields || {};

  const handleEditField = (fieldKey) => {
    setEditingField(fieldKey);
  };

  const handleSaveField = (fieldKey, value) => {
    // Update the custom fields data
    const updatedFields = {
      ...customFieldsData,
      [fieldKey]: value
    };
    
    // Save to member data
    saveSectionData('profile', { custom_fields: updatedFields });
    setEditingField(null);
  };

  const handleCancelField = () => {
    setEditingField(null);
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

  if (customFieldsConfig.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Custom Fields
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Settings className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">
              No custom fields configured. Contact your administrator to set up custom fields.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Custom Fields
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {customFieldsConfig.map((field) => (
            <CustomFieldRow
              key={field.key}
              field={field}
              value={customFieldsData[field.key]}
              isEditing={editingField === field.key}
              onEdit={() => handleEditField(field.key)}
              onSave={handleSaveField}
              onCancel={handleCancelField}
            />
          ))}
        </div>

        {/* Required Fields Notice */}
        {customFieldsConfig.some(field => field.required) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <p className="text-sm text-amber-800">
              <span className="font-medium">Note:</span> Fields marked with * are required.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomFieldsSection;
