import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Palette, Users, Hash } from 'lucide-react';

const EditTagModal = ({ isOpen, onClose, onSubmit, tag, categories = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    color: '#10B981'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedColors = [
    '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
  ];

  // Update form data when tag changes
  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name || '',
        description: tag.description || '',
        categoryId: tag.category_id || '',
        color: tag.color || '#10B981'
      });
    }
  }, [tag]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        categoryId: formData.categoryId || null,
        color: formData.color
      });
    } catch (error) {
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!tag) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tag</DialogTitle>
          <DialogDescription>
            Update the tag details and settings.
          </DialogDescription>
        </DialogHeader>

        {/* Tag Info */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{tag.usage_count} members tagged</span>
            {tag.is_system_tag && (
              <>
                <span>•</span>
                <Badge variant="outline" className="text-xs">
                  System Tag
                </Badge>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tag Name */}
          <div className="space-y-2">
            <Label htmlFor="editTagName">Tag Name *</Label>
            <Input
              id="editTagName"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., High Value Members"
              required
              disabled={tag.is_system_tag}
            />
            {tag.is_system_tag && (
              <p className="text-xs text-muted-foreground">
                System tag names cannot be changed
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="editTagDescription">Description</Label>
            <Textarea
              id="editTagDescription"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Optional description for this tag..."
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="editTagCategory">Category</Label>
            <select
              id="editTagCategory"
              value={formData.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">No Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Tag Color</Label>
            <div className="flex items-center gap-2 mb-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <Badge 
                style={{ backgroundColor: formData.color, color: '#fff' }}
                className="px-3 py-1"
              >
                {formData.name || 'Preview'}
              </Badge>
            </div>
            
            {/* Predefined Colors */}
            <div className="grid grid-cols-5 gap-2">
              {predefinedColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('color', color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color 
                      ? 'border-foreground scale-110' 
                      : 'border-muted hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center gap-2 mt-2">
              <Label htmlFor="editCustomColor" className="text-sm">Custom:</Label>
              <input
                id="editCustomColor"
                type="color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-12 h-8 rounded border border-input cursor-pointer"
              />
              <Input
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                placeholder="#10B981"
                className="flex-1 text-sm"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Update Tag'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTagModal;

