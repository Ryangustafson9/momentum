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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Users, 
  Tags, 
  Plus, 
  Minus, 
  Upload,
  Download,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MemberTaggingService } from '@/services/memberTaggingService';

const BulkTaggingModal = ({ isOpen, onClose, tags = [], onTaggingComplete }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [operation, setOperation] = useState('add'); // 'add' or 'remove'

  // Search members
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const result = await MemberTaggingService.searchMembersWithTags({
        searchTerm: searchTerm.trim(),
        page: 1,
        limit: 50
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      setSearchResults(result.data || []);
    } catch (error) {
      
      toast({
        title: "Search Error",
        description: "Failed to search members. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle member selection
  const toggleMemberSelection = (member) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === member.id);
      if (isSelected) {
        return prev.filter(m => m.id !== member.id);
      } else {
        return [...prev, member];
      }
    });
  };

  const selectAllMembers = () => {
    setSelectedMembers(searchResults);
  };

  const clearMemberSelection = () => {
    setSelectedMembers([]);
  };

  // Handle tag selection
  const toggleTagSelection = (tag) => {
    setSelectedTags(prev => {
      const isSelected = prev.some(t => t.id === tag.id);
      if (isSelected) {
        return prev.filter(t => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Process bulk tagging
  const handleBulkTagging = async () => {
    if (selectedMembers.length === 0 || selectedTags.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select both members and tags to proceed.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const memberIds = selectedMembers.map(m => m.id);
      const tagIds = selectedTags.map(t => t.id);

      let result;
      if (operation === 'add') {
        result = await MemberTaggingService.bulkAssignTags(memberIds, tagIds);
      } else {
        result = await MemberTaggingService.bulkRemoveTags(memberIds, tagIds);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: "Bulk Tagging Complete",
        description: `Successfully ${operation === 'add' ? 'added' : 'removed'} ${selectedTags.length} tag(s) ${operation === 'add' ? 'to' : 'from'} ${selectedMembers.length} member(s).`,
      });

      // Reset selections
      setSelectedMembers([]);
      setSelectedTags([]);
      setSearchResults([]);
      setSearchTerm('');
      
      // Notify parent to refresh data
      onTaggingComplete?.();
      onClose();
    } catch (error) {
      
      toast({
        title: "Bulk Tagging Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const MemberCard = ({ member, isSelected, onToggle }) => (
    <div 
      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground'
      }`}
      onClick={() => onToggle(member)}
    >
      <div className="flex items-center gap-3">
        <Checkbox checked={isSelected} readOnly />
        <div className="flex-1">
          <p className="font-medium">
            {member.first_name} {member.last_name}
          </p>
          <p className="text-sm text-muted-foreground">
            {member.email}
          </p>
          {member.member_tag_assignments?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {member.member_tag_assignments.slice(0, 3).map(assignment => (
                <Badge 
                  key={assignment.member_tags.id}
                  style={{ backgroundColor: assignment.member_tags.color }}
                  className="text-xs text-white"
                >
                  {assignment.member_tags.name}
                </Badge>
              ))}
              {member.member_tag_assignments.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{member.member_tag_assignments.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const TagCard = ({ tag, isSelected, onToggle }) => (
    <div 
      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground'
      }`}
      onClick={() => onToggle(tag)}
    >
      <div className="flex items-center gap-3">
        <Checkbox checked={isSelected} readOnly />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge 
              style={{ backgroundColor: tag.color }}
              className="text-white"
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
            <p className="text-sm text-muted-foreground mt-1">
              {tag.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {tag.usage_count} members
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Member Tagging</DialogTitle>
          <DialogDescription>
            Select members and tags to perform bulk tagging operations.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search">
                <Search className="mr-2 h-4 w-4" />
                Find Members
              </TabsTrigger>
              <TabsTrigger value="tags">
                <Tags className="mr-2 h-4 w-4" />
                Select Tags
              </TabsTrigger>
              <TabsTrigger value="review">
                <Users className="mr-2 h-4 w-4" />
                Review & Apply
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                {/* Search Input */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Search members by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-muted-foreground">
                        {searchResults.length} members found
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllMembers}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearMemberSelection}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {searchResults.map(member => (
                        <MemberCard
                          key={member.id}
                          member={member}
                          isSelected={selectedMembers.some(m => m.id === member.id)}
                          onToggle={toggleMemberSelection}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.length === 0 && searchTerm && !isSearching && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No members found</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tags" className="flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Select tags to apply to members
                  </p>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="operation">Operation:</Label>
                    <select
                      id="operation"
                      value={operation}
                      onChange={(e) => setOperation(e.target.value)}
                      className="h-8 px-2 rounded border border-input bg-background text-sm"
                    >
                      <option value="add">Add Tags</option>
                      <option value="remove">Remove Tags</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {tags.map(tag => (
                    <TagCard
                      key={tag.id}
                      tag={tag}
                      isSelected={selectedTags.some(t => t.id === tag.id)}
                      onToggle={toggleTagSelection}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="review" className="flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Selected Members ({selectedMembers.length})</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedMembers.map(member => (
                        <div key={member.id} className="text-sm p-2 bg-muted rounded">
                          {member.first_name} {member.last_name}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Selected Tags ({selectedTags.length})</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedTags.map(tag => (
                        <Badge 
                          key={tag.id}
                          style={{ backgroundColor: tag.color }}
                          className="text-white mr-1 mb-1"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    <strong>Operation:</strong> {operation === 'add' ? 'Add' : 'Remove'} {selectedTags.length} tag(s) {operation === 'add' ? 'to' : 'from'} {selectedMembers.length} member(s)
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleBulkTagging}
            disabled={selectedMembers.length === 0 || selectedTags.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                {operation === 'add' ? <Plus className="mr-2 h-4 w-4" /> : <Minus className="mr-2 h-4 w-4" />}
                {operation === 'add' ? 'Add Tags' : 'Remove Tags'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkTaggingModal;

