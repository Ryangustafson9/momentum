import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Check, Filter, X, Tags } from 'lucide-react';
import { MemberTaggingService } from '@/services/memberTaggingService';
import { cn } from '@/lib/utils';

const TagFilter = ({ 
  selectedTags = [], 
  onTagsChange, 
  placeholder = "Filter by tags...",
  className = "",
  maxDisplayTags = 3
}) => {
  const [open, setOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableTags();
  }, []);

  const loadAvailableTags = async () => {
    setLoading(true);
    try {
      const result = await MemberTaggingService.getMemberTags();
      if (result.data) {
        setAvailableTags(result.data);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleTagSelect = (tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    let newSelectedTags;
    
    if (isSelected) {
      newSelectedTags = selectedTags.filter(t => t.id !== tag.id);
    } else {
      newSelectedTags = [...selectedTags, tag];
    }
    
    onTagsChange(newSelectedTags);
  };

  const handleRemoveTag = (tagToRemove) => {
    const newSelectedTags = selectedTags.filter(t => t.id !== tagToRemove.id);
    onTagsChange(newSelectedTags);
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  const displayTags = selectedTags.slice(0, maxDisplayTags);
  const hiddenTagsCount = selectedTags.length - maxDisplayTags;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex items-center gap-1">
          {displayTags.map(tag => (
            <Badge
              key={tag.id}
              style={{ backgroundColor: tag.color }}
              className="text-white text-xs flex items-center gap-1 pr-1"
            >
              {tag.name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag);
                }}
                className="ml-1 hover:bg-black/20 rounded-full p-0.5"
              >
                <X className="h-2 w-2" />
              </button>
            </Badge>
          ))}
          
          {hiddenTagsCount > 0 && (
            <Badge variant="outline" className="text-xs">
              +{hiddenTagsCount} more
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllTags}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Tag Filter Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 border-dashed",
              selectedTags.length > 0 && "border-solid"
            )}
          >
            <Filter className="mr-2 h-3 w-3" />
            {selectedTags.length > 0 ? (
              `${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''}`
            ) : (
              placeholder
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading tags..." : "No tags found."}
              </CommandEmpty>
              <CommandGroup>
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.some(t => t.id === tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleTagSelect(tag)}
                      className="flex items-center gap-2"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="flex-1">{tag.name}</span>
                        {tag.tag_categories && (
                          <span className="text-xs text-muted-foreground">
                            {tag.tag_categories.name}
                          </span>
                        )}
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TagFilter;

