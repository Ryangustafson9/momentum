import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit3, Trash2, Hash, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MemberTaggingService } from '@/services/memberTaggingService';

const TagCategoryManager = ({ isOpen, onClose, onCategoriesUpdated }) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
  ];

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await MemberTaggingService.getTagCategories();
      if (result.error) {
        throw new Error(result.error.message);
      }
      setCategories(result.data || []);
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to load categories.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      let result;
      if (editingCategory) {
        // Update existing category
        result = await MemberTaggingService.updateTagCategory(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color
        });
      } else {
        // Create new category
        result = await MemberTaggingService.createTagCategory({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color
        });
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: editingCategory ? "Category Updated" : "Category Created",
        description: `Category "${result.data.name}" has been ${editingCategory ? 'updated' : 'created'} successfully.`,
      });

      // Reset form and reload categories
      resetForm();
      loadCategories();
      onCategoriesUpdated?.();
    } catch (error) {
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (category) => {
    if (!confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      return;
    }

    try {
      const result = await MemberTaggingService.deleteTagCategory(category.id);
      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: "Category Deleted",
        description: `Category "${category.name}" has been deleted.`,
      });

      loadCategories();
      onCategoriesUpdated?.();
    } catch (error) {
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6'
    });
    setEditingCategory(null);
    setShowCreateForm(false);
  };

  const CategoryCard = ({ category }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <h3 className="font-medium">{category.name}</h3>
              <Badge variant="outline" className="text-xs">
                {category.member_tags?.length || 0} tags
              </Badge>
            </div>
            
            {category.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {category.description}
              </p>
            )}
            
            {category.member_tags && category.member_tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {category.member_tags.slice(0, 3).map(tag => (
                  <Badge 
                    key={tag.id}
                    style={{ backgroundColor: tag.color }}
                    className="text-white text-xs"
                  >
                    {tag.name}
                  </Badge>
                ))}
                {category.member_tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{category.member_tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(category)}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(category)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Tag Categories</DialogTitle>
          <DialogDescription>
            Organize your tags into categories for better management.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!showCreateForm ? (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Categories ({categories.length})</h3>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3">
                  {categories.map(category => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                  
                  {categories.length === 0 && (
                    <div className="text-center py-8">
                      <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No categories yet</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCreateForm(true)}
                        className="mt-2"
                      >
                        Create First Category
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name *</Label>
                <Input
                  id="categoryName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Membership Types"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryDescription">Description</Label>
                <Textarea
                  id="categoryDescription"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Category Color</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <div 
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: formData.color }}
                  />
                  <span className="text-sm">{formData.name || 'Preview'}</span>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color 
                          ? 'border-foreground scale-110' 
                          : 'border-muted hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Label htmlFor="customCategoryColor" className="text-sm">Custom:</Label>
                  <input
                    id="customCategoryColor"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-8 rounded border border-input cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3B82F6"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!formData.name.trim()}>
                  {editingCategory ? 'Update' : 'Create'} Category
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TagCategoryManager;

