import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit3, Trash2, MoreVertical, GripVertical, Settings, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const fieldTypeOptions = [
  { value: 'text', label: 'Text Input', description: 'Single line text field' },
  { value: 'textarea', label: 'Text Area', description: 'Multi-line text field' },
  { value: 'email', label: 'Email', description: 'Email address with validation' },
  { value: 'phone', label: 'Phone', description: 'Phone number input' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'number', label: 'Number', description: 'Numeric input only' },
  { value: 'select', label: 'Dropdown', description: 'Select from predefined options' },
  { value: 'checkbox', label: 'Checkbox', description: 'True/false checkbox' },
  { value: 'url', label: 'URL', description: 'Website URL with validation' }
];

const getDefaultPlaceholder = (fieldType, fieldLabel = '') => {
  const label = fieldLabel.toLowerCase();

  switch (fieldType) {
    case 'text':
      return `Enter ${label || 'text'}`;
    case 'textarea':
      return `Enter ${label || 'details'}`;
    case 'email':
      return 'Enter email address';
    case 'phone':
      return 'Enter phone number';
    case 'date':
      return 'Select date';
    case 'number':
      return 'Enter number';
    case 'select':
      return `Select ${label || 'option'}`;
    case 'checkbox':
      return `Check to enable ${label || 'option'}`;
    case 'url':
      return 'Enter website URL';
    default:
      return `Enter ${label || 'value'}`;
  }
};

const CustomFieldsSettingsTab = () => {
  const { toast } = useToast();
  const [customFields, setCustomFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    field_key: '',
    type: 'text',
    placeholder: '',
    is_required: false,
    options: []
  });
  const [optionInput, setOptionInput] = useState('');

  useEffect(() => {
    fetchCustomFields();
  }, []);

  const fetchCustomFields = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCustomFields(data || []);
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      toast({
        title: "Error",
        description: "Failed to load custom fields",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveField = async () => {
    try {
      const fieldData = {
        label: formData.label.trim(),
        field_key: formData.field_key.trim() || formData.label.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_'),
        type: formData.type,
        placeholder: formData.placeholder.trim() || null,
        is_required: formData.is_required,
        options: formData.type === 'select' ? formData.options : null,
        order_index: editingField ? editingField.order_index : customFields.length
      };

      if (!fieldData.label) {
        toast({
          title: "Validation Error",
          description: "Field label is required",
          variant: "destructive"
        });
        return;
      }

      // Check for duplicate field names (excluding current field if editing)
      const duplicateField = customFields.find(field =>
        field.label.toLowerCase() === fieldData.label.toLowerCase() &&
        (!editingField || field.id !== editingField.id)
      );

      if (duplicateField) {
        toast({
          title: "Duplicate Field Name",
          description: `A field with the name "${fieldData.label}" already exists. Please choose a different name.`,
          variant: "destructive"
        });
        return;
      }

      if (fieldData.type === 'select' && (!fieldData.options || fieldData.options.length === 0)) {
        toast({
          title: "Validation Error",
          description: "Dropdown fields must have at least one option",
          variant: "destructive"
        });
        return;
      }

      let result;
      if (editingField) {
        result = await supabase
          .from('custom_fields')
          .update(fieldData)
          .eq('id', editingField.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('custom_fields')
          .insert([fieldData])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Custom field ${editingField ? 'updated' : 'created'} successfully`
      });

      setIsDialogOpen(false);
      resetForm();
      fetchCustomFields();
    } catch (error) {
      console.error('Error saving custom field:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingField ? 'update' : 'create'} custom field`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteField = async (fieldId) => {
    try {
      const { error } = await supabase
        .from('custom_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Custom field deleted successfully"
      });

      fetchCustomFields();
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast({
        title: "Error",
        description: "Failed to delete custom field",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (field) => {
    try {
      const { error } = await supabase
        .from('custom_fields')
        .update({ is_active: !field.is_active })
        .eq('id', field.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Custom field ${!field.is_active ? 'activated' : 'deactivated'}`
      });

      fetchCustomFields();
    } catch (error) {
      console.error('Error toggling field status:', error);
      toast({
        title: "Error",
        description: "Failed to update field status",
        variant: "destructive"
      });
    }
  };

  const handleMoveField = async (fieldId, direction) => {
    try {
      const currentIndex = customFields.findIndex(f => f.id === fieldId);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex < 0 || newIndex >= customFields.length) return;

      const updates = [
        { id: customFields[currentIndex].id, order_index: newIndex },
        { id: customFields[newIndex].id, order_index: currentIndex }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('custom_fields')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      fetchCustomFields();
    } catch (error) {
      console.error('Error reordering fields:', error);
      toast({
        title: "Error",
        description: "Failed to reorder fields",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      field_key: '',
      type: 'text',
      placeholder: '',
      is_required: false,
      options: []
    });
    setOptionInput('');
    setEditingField(null);
  };

  const openEditDialog = (field) => {
    setEditingField(field);
    setFormData({
      label: field.label,
      field_key: field.field_key || '',
      type: field.type,
      placeholder: field.placeholder || '',
      is_required: field.is_required,
      options: field.options || []
    });
    setIsDialogOpen(true);
  };

  const addOption = () => {
    if (optionInput.trim() && !formData.options.some(opt => opt.label === optionInput.trim())) {
      const newOption = {
        label: optionInput.trim(),
        value: optionInput.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_')
      };
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, newOption]
      }));
      setOptionInput('');
    }
  };

  const removeOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Custom Fields Management
            </CardTitle>
            <CardDescription>
              Create and manage custom fields that will be displayed on member profiles
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Custom Field
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingField ? 'Edit Custom Field' : 'Create Custom Field'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="label">Field Label *</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g., Emergency Contact"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Field Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, options: [] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="placeholder">Placeholder Text</Label>
                  <Input
                    id="placeholder"
                    value={formData.placeholder}
                    onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                    placeholder={getDefaultPlaceholder(formData.type, formData.label)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank to use auto-generated hint: "{getDefaultPlaceholder(formData.type, formData.label)}"
                  </p>
                </div>

                {formData.type === 'select' && (
                  <div>
                    <Label>Dropdown Options *</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={optionInput}
                          onChange={(e) => setOptionInput(e.target.value)}
                          placeholder="Enter option text"
                          onKeyPress={(e) => e.key === 'Enter' && addOption()}
                        />
                        <Button type="button" onClick={addOption} variant="outline">
                          Add
                        </Button>
                      </div>
                      {formData.options.length > 0 && (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {formData.options.map((option, index) => (
                            <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                              <span>{typeof option === 'string' ? option : option.label}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
                  />
                  <Label htmlFor="is_required">Required field</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveField}>
                  {editingField ? 'Update' : 'Create'} Field
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          {customFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No custom fields configured</p>
              <p className="text-sm">Click "Add Custom Field" to create your first field</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Order</TableHead>
                    <TableHead>Field Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customFields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveField(field.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveField(field.id, 'down')}
                            disabled={index === customFields.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {field.label}
                        {field.placeholder && (
                          <div className="text-xs text-muted-foreground">
                            {field.placeholder}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {fieldTypeOptions.find(opt => opt.value === field.type)?.label}
                        </Badge>
                        {field.type === 'select' && field.options && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {Array.isArray(field.options) ? field.options.length : 0} options
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {field.is_required ? (
                          <Badge variant="destructive">Required</Badge>
                        ) : (
                          <Badge variant="outline">Optional</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleActive(field)}
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                            field.is_active 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          )}
                        >
                          {field.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(field)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteField(field.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Preview</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  This is how the custom fields will appear on member profiles:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customFields.filter(f => f.is_active).map(field => (
                    <div key={field.id} className="space-y-1">
                      <Label className="text-xs">
                        {field.label}
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          placeholder={field.placeholder}
                          disabled
                          className="h-20 text-xs"
                        />
                      ) : field.type === 'select' ? (
                        <Select disabled>
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                          </SelectTrigger>
                        </Select>
                      ) : field.type === 'checkbox' ? (
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" disabled className="rounded" />
                          <span className="text-xs text-muted-foreground">
                            {field.placeholder || `Check to enable ${field.label.toLowerCase()}`}
                          </span>
                        </div>
                      ) : (
                        <Input
                          type={field.type === 'email' ? 'email' :
                                field.type === 'date' ? 'date' :
                                field.type === 'number' ? 'number' :
                                field.type === 'url' ? 'url' : 'text'}
                          placeholder={field.placeholder}
                          disabled
                          className="text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomFieldsSettingsTab;
