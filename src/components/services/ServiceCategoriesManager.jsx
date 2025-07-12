import React, { useState, Fragment } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Grid, 
  Save, 
  X,
  ChevronRight,
  Folder,
  FolderOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const ServiceCategoriesManager = ({ categories, onCategoriesChange }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
    icon: 'Folder',
    color: '#3B82F6'
  });
  const { toast } = useToast();

  const iconOptions = [
    { value: 'Folder', label: 'Folder' },
    { value: 'Users', label: 'Users' },
    { value: 'Heart', label: 'Heart' },
    { value: 'Dumbbell', label: 'Dumbbell' },
    { value: 'Activity', label: 'Activity' },
    { value: 'Zap', label: 'Zap' },
    { value: 'Star', label: 'Star' },
    { value: 'Target', label: 'Target' }
  ];

  const colorOptions = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Yellow' },
    { value: '#EF4444', label: 'Red' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#06B6D4', label: 'Cyan' },
    { value: '#F97316', label: 'Orange' },
    { value: '#84CC16', label: 'Lime' }
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parent_id: '',
      icon: 'Folder',
      color: '#3B82F6'
    });
    setIsCreating(false);
    setEditingCategory(null);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || '',
      icon: category.icon || 'Folder',
      color: category.color || '#3B82F6'
    });
    setEditingCategory(category.id);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        parent_id: formData.parent_id || null,
        icon: formData.icon,
        color: formData.color,
        updated_at: new Date().toISOString()
      };

      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('service_categories')
          .update(categoryData)
          .eq('id', editingCategory);

        if (error) throw error;

        toast({
          title: "Category Updated",
          description: "Service category has been updated successfully.",
          duration: 3000,
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from('service_categories')
          .insert(categoryData);

        if (error) throw error;

        toast({
          title: "Category Created",
          description: "Service category has been created successfully.",
          duration: 3000,
        });
      }

      resetForm();
      onCategoriesChange();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: "Failed to save category.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Category Deleted",
        description: "Service category has been deleted successfully.",
        duration: 3000,
      });

      onCategoriesChange();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category.",
        variant: "destructive"
      });
    }
  };

  const getParentCategories = () => {
    return categories.filter(cat => !cat.parent_id);
  };

  const getSubCategories = (parentId) => {
    return categories.filter(cat => cat.parent_id === parentId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Grid className="h-6 w-6" />
            Service Categories
          </h2>
          <p className="text-gray-600 mt-1">
            Organize your services into categories
          </p>
        </div>
        
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Category Form */}
      {(isCreating || editingCategory) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Personal Training"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Parent Category</label>
                <Select 
                  value={formData.parent_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parent_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Parent (Top Level)</SelectItem>
                    {getParentCategories().map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Icon</label>
                <Select 
                  value={formData.icon} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        {icon.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.color} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: color.value }}
                            />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div 
                    className="w-10 h-10 rounded border-2 border-gray-300"
                    style={{ backgroundColor: formData.color }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
              <Button variant="outline" onClick={resetForm} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Grid className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories</h3>
                <p className="text-gray-600 mb-4">
                  Create your first service category to organize services.
                </p>
                <Button onClick={handleCreate}>
                  Create Category
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Category Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Type
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Color
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {getParentCategories().map((parentCategory, parentIndex) => (
                      <Fragment key={parentCategory.id}>
                        {/* Parent Category Row */}
                        <tr
                          className={`
                            transition-all duration-200 ease-in-out
                            hover:bg-blue-50 hover:shadow-sm
                            border-b border-gray-100
                            ${parentIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                          `}
                        >
                          <td className="px-6 py-4 border-r border-gray-100">
                            <div className="font-semibold text-gray-900">
                              {parentCategory.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 border-r border-gray-100">
                            <div className="text-sm text-gray-600">
                              {parentCategory.description || '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4 border-r border-gray-100">
                            <Badge variant="outline" className="text-xs">
                              Parent Category
                            </Badge>
                            {getSubCategories(parentCategory.id).length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {getSubCategories(parentCategory.id).length} subcategories
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center border-r border-gray-100">
                            <div className="flex items-center justify-center">
                              <div
                                className="w-6 h-6 rounded-full border-2 border-gray-200"
                                style={{ backgroundColor: parentCategory.color }}
                                title={parentCategory.color}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(parentCategory)}
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(parentCategory.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {/* Sub Categories */}
                        {getSubCategories(parentCategory.id).map((subCategory, subIndex) => (
                          <tr
                            key={subCategory.id}
                            className={`
                              transition-all duration-200 ease-in-out
                              hover:bg-blue-50 hover:shadow-sm
                              border-b border-gray-100
                              ${(parentIndex + subIndex + 1) % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                            `}
                          >
                            <td className="px-6 py-4 border-r border-gray-100">
                              <div className="flex items-center gap-2">
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                <div className="font-medium text-gray-900">
                                  {subCategory.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 border-r border-gray-100">
                              <div className="text-sm text-gray-600">
                                {subCategory.description || '—'}
                              </div>
                            </td>
                            <td className="px-6 py-4 border-r border-gray-100">
                              <Badge variant="secondary" className="text-xs">
                                Subcategory
                              </Badge>
                              <div className="text-xs text-gray-500 mt-1">
                                Parent: {parentCategory.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-100">
                              <div className="flex items-center justify-center">
                                <div
                                  className="w-5 h-5 rounded-full border-2 border-gray-200"
                                  style={{ backgroundColor: subCategory.color }}
                                  title={subCategory.color}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(subCategory)}
                                  className="h-8 w-8 p-0 hover:bg-gray-100"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(subCategory.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    Showing {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
                    ({getParentCategories().length} parent, {categories.length - getParentCategories().length} subcategories)
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Parent</Badge>
                      <span className="text-xs">Top-level categories</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Sub</Badge>
                      <span className="text-xs">Subcategories</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ServiceCategoriesManager;
