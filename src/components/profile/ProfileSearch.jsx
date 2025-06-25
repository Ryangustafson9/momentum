import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, User, Mail, Phone, Calendar, Filter, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import ProfileCreationWizard from './ProfileCreationWizard';

/**
 * Enhanced profile search component with create new functionality
 */
const ProfileSearch = ({
  onProfileSelect,
  onCreateNew,
  placeholder = "Search members by name, email, or phone...",
  showCreateButton = true,
  userRole = 'member',
  className = '',
  maxResults = 10
}) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search function
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          profile_picture_url,
          role,
          status,
          created_at,
          system_member_id
        `)
        .or(`
          first_name.ilike.%${query}%,
          last_name.ilike.%${query}%,
          email.ilike.%${query}%,
          phone.ilike.%${query}%
        `)
        .order('created_at', { ascending: false })
        .limit(maxResults);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search profiles. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  }, [maxResults, toast]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleProfileClick = (profile) => {
    onProfileSelect?.(profile);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      // Parse name from search query if possible
      const nameParts = searchQuery.trim().split(' ');
      const initialData = {
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        email: searchQuery.includes('@') ? searchQuery : ''
      };
      onCreateNew(initialData);
    } else {
      setShowCreateWizard(true);
    }
  };

  const handleWizardComplete = (newProfile) => {
    setShowCreateWizard(false);
    if (newProfile) {
      onProfileSelect?.(newProfile);
      toast({
        title: "Profile Created",
        description: `${newProfile.first_name} ${newProfile.last_name} has been created successfully.`
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Simple phone formatting - can be enhanced
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Loading indicator */}
      {isSearching && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Results */}
      {!isSearching && hasSearched && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card className="max-h-96 overflow-y-auto">
            <CardContent className="p-0">
              {searchResults.length > 0 ? (
                <div className="divide-y">
                  {searchResults.map((profile) => (
                    <div
                      key={profile.id}
                      onClick={() => handleProfileClick(profile)}
                      className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.profile_picture_url} />
                          <AvatarFallback>
                            {getInitials(profile.first_name, profile.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {profile.first_name} {profile.last_name}
                            </p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {profile.role}
                            </Badge>
                            {profile.status && (
                              <Badge 
                                variant={profile.status === 'active' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {profile.status}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            {profile.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{profile.email}</span>
                              </div>
                            )}
                            {profile.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{formatPhoneNumber(profile.phone)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1">No profiles found</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    No profiles match your search criteria
                  </p>
                  
                  {showCreateButton && (
                    <Button onClick={handleCreateNew} size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Profile
                    </Button>
                  )}
                </div>
              )}

              {/* Always show create option when searching */}
              {showCreateButton && searchResults.length > 0 && (
                <div className="border-t p-4 bg-muted/30">
                  <Button 
                    onClick={handleCreateNew} 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Profile
                    {searchQuery && (
                      <span className="text-muted-foreground">
                        ({searchQuery})
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile Creation Wizard */}
      <ProfileCreationWizard
        isOpen={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        onComplete={handleWizardComplete}
        userRole={userRole}
        initialData={{
          first_name: searchQuery.split(' ')[0] || '',
          last_name: searchQuery.split(' ').slice(1).join(' ') || '',
          email: searchQuery.includes('@') ? searchQuery : ''
        }}
      />
    </div>
  );
};

export default ProfileSearch;
