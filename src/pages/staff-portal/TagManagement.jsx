import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Tags, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  BarChart3, 
  Filter,
  Search,
  Settings,
  Palette,
  Hash,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MemberTaggingService } from '@/services/memberTaggingService';
import CreateTagModal from '@/components/admin/tags/CreateTagModal';
import EditTagModal from '@/components/admin/tags/EditTagModal';
import TagCategoryManager from '@/components/admin/tags/TagCategoryManager';
import TagAnalyticsDashboard from '@/components/admin/tags/TagAnalyticsDashboard';
import BulkTaggingModal from '@/components/admin/tags/BulkTaggingModal';

const TagManagement = () => {
  const { toast } = useToast();
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showBulkTagging, setShowBulkTagging] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);

  // Load initial data
  useEffect(() => {
    loadTagData();
  }, []);

  const loadTagData = async () => {
    setLoading(true);
    try {
      const [tagsResult, categoriesResult] = await Promise.all([
        MemberTaggingService.getMemberTags(),
        MemberTaggingService.getTagCategories()
      ]);

      if (tagsResult.error) {
        throw new Error(tagsResult.error.message);
      }
      if (categoriesResult.error) {
        throw new Error(categoriesResult.error.message);
      }

      setTags(tagsResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to load tag data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter tags based on search and category
  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tag.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tag.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTag = async (tagData) => {
    try {
      const result = await MemberTaggingService.createMemberTag(tagData);
      if (result.error) {
        throw new Error(result.error.message);
      }

      setTags(prev => [result.data, ...prev]);
      setShowCreateModal(false);
      toast({
        title: "Tag Created",
        description: `Tag "${result.data.name}" has been created successfully.`,
      });
    } catch (error) {
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditTag = async (tagData) => {
    try {
      const result = await MemberTaggingService.updateMemberTag(selectedTag.id, tagData);
      if (result.error) {
        throw new Error(result.error.message);
      }

      setTags(prev => prev.map(tag => 
        tag.id === selectedTag.id ? result.data : tag
      ));
      setShowEditModal(false);
      setSelectedTag(null);
      toast({
        title: "Tag Updated",
        description: `Tag "${result.data.name}" has been updated successfully.`,
      });
    } catch (error) {
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTag = async (tag) => {
    if (!confirm(`Are you sure you want to delete the tag "${tag.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await MemberTaggingService.deleteMemberTag(tag.id);
      if (result.error) {
        throw new Error(result.error.message);
      }

      setTags(prev => prev.filter(t => t.id !== tag.id));
      toast({
        title: "Tag Deleted",
        description: `Tag "${tag.name}" has been deleted successfully.`,
      });
    } catch (error) {
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const TagCard = ({ tag }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                style={{ backgroundColor: tag.color, color: '#fff' }}
                className="px-2 py-1"
              >
                {tag.name}
              </Badge>
              {tag.is_system_tag && (
                <Badge variant="outline" className="text-xs">
                  System
                </Badge>
              )}
            </div>
            
            {tag.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {tag.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{tag.usage_count} members</span>
              </div>
              {tag.tag_categories && (
                <div className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  <span>{tag.tag_categories.name}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTag(tag);
                setShowEditModal(true);
              }}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            {!tag.is_system_tag && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTag(tag)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tag Management</h1>
          <p className="text-muted-foreground">
            Organize and manage member tags for better segmentation and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCategoryManager(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Manage Categories
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowBulkTagging(true)}
          >
            <Users className="mr-2 h-4 w-4" />
            Bulk Tagging
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Tag
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tags" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tags">
            <Tags className="mr-2 h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tags" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTags.map(tag => (
              <TagCard key={tag.id} tag={tag} />
            ))}
          </div>

          {filteredTags.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Tags className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tags found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by creating your first tag.'
                  }
                </p>
                {!searchTerm && selectedCategory === 'all' && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Tag
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <TagAnalyticsDashboard />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateTagModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTag}
        categories={categories}
      />

      <EditTagModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTag(null);
        }}
        onSubmit={handleEditTag}
        tag={selectedTag}
        categories={categories}
      />

      <TagCategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onCategoriesUpdated={loadTagData}
      />

      <BulkTaggingModal
        isOpen={showBulkTagging}
        onClose={() => setShowBulkTagging(false)}
        tags={tags}
        onTaggingComplete={loadTagData}
      />
    </motion.div>
  );
};

export default TagManagement;

