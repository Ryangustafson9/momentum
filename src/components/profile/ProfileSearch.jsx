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
import CreateMemberDialog from '@/components/staff/CreateMemberDialog';

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
  maxResults = 10,
  autoCheckIn = false,
  onAutoCheckIn = null
}) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [createDialogInitialData, setCreateDialogInitialData] = useState({});

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
      // Build search conditions for full name support
      const searchTerms = query.trim().split(/\s+/);
      let searchConditions = [];

      // Single term search (first name, last name, email, phone)
      searchConditions.push(`first_name.ilike.%${query}%`);
      searchConditions.push(`last_name.ilike.%${query}%`);
      searchConditions.push(`email.ilike.%${query}%`);
      searchConditions.push(`phone.ilike.%${query}%`);

      // Multi-term search for full names (e.g., "Tom Jones")
      if (searchTerms.length >= 2) {
        const firstName = searchTerms[0];
        const lastName = searchTerms.slice(1).join(' ');
        searchConditions.push(`and(first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%)`);
        // Also try reverse order
        searchConditions.push(`and(first_name.ilike.%${lastName}%,last_name.ilike.%${firstName}%)`);
      }

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
        .or(searchConditions.join(','))
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

  const handleProfileClick = async (profile) => {
    // If auto check-in is enabled, trigger check-in instead of just selecting
    if (autoCheckIn && onAutoCheckIn) {
      try {
        await onAutoCheckIn(profile);
        toast({
          title: "Check-in Successful",
          description: `${profile.first_name} ${profile.last_name} has been checked in.`,
          variant: "default"
        });
      } catch (error) {
        console.error('Auto check-in failed:', error);
        toast({
          title: "Check-in Failed",
          description: error.message || "Failed to check in member. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      onProfileSelect?.(profile);
    }

    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const parseSearchQueryForNames = (query) => {
    if (!query || typeof query !== 'string') return {};

    const trimmedQuery = query.trim();

    // If it's an email, extract name from email if possible
    if (trimmedQuery.includes('@')) {
      const emailPart = trimmedQuery.split('@')[0];
      const nameParts = emailPart.split(/[._-]/);
      return {
        email: trimmedQuery,
        first_name: nameParts[0] || '',
        last_name: nameParts[1] || ''
      };
    }

    // If it's a phone number, don't try to parse names
    if (/^\+?[\d\s\-\(\)]+$/.test(trimmedQuery)) {
      return { phone: trimmedQuery };
    }

    // Parse as name(s)
    const nameParts = trimmedQuery.split(/\s+/);
    if (nameParts.length === 1) {
      // Single word - could be first or last name
      return { first_name: nameParts[0] };
    } else if (nameParts.length >= 2) {
      // Multiple words - first word is first name, rest is last name
      return {
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ')
      };
    }

    return {};
  };

  const handleCreateNew = () => {
    const initialData = parseSearchQueryForNames(searchQuery);

    if (onCreateNew) {
      onCreateNew(initialData);
    } else {
      setCreateDialogInitialData(initialData);
      setShowCreateDialog(true);
    }
  };

  const handleCreateSuccess = (newProfile) => {
    setShowCreateDialog(false);
    setCreateDialogInitialData({}); // Clear initial data
    if (newProfile) {
      onProfileSelect?.(newProfile);
      toast({
        title: "Member Created",
        description: `${newProfile.first_name} ${newProfile.last_name} has been created successfully.`
      });
    }
  };

  const handleCreateDialogClose = () => {
    setShowCreateDialog(false);
    setCreateDialogInitialData({}); // Clear initial data when dialog is closed
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
    <div className={cn('relative w-full', className)}>
      {/* Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-12 h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          autoComplete="off"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 z-10"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Loading indicator */}
      {isSearching && (
        <div className="absolute top-full left-0 right-0 z-[60] mt-2 w-full">
          <Card className="border border-gray-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-sm text-gray-600">Searching...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Results */}
      {!isSearching && hasSearched && (
        <div className="absolute top-full left-0 right-0 z-[60] mt-2 w-full">
          <Card className="border border-gray-200 shadow-lg max-h-80 overflow-hidden">
            <CardContent className="p-0 max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {searchResults.map((profile) => (
                    <div
                      key={profile.id}
                      onClick={() => handleProfileClick(profile)}
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors border-0"
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={profile.profile_picture_url} />
                          <AvatarFallback className="text-xs">
                            {getInitials(profile.first_name, profile.last_name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {profile.first_name} {profile.last_name}
                            </p>
                            <div className="flex gap-1 flex-shrink-0">
                              <Badge variant="outline" className="text-xs capitalize px-2 py-0.5">
                                {profile.role}
                              </Badge>
                              {profile.status && (
                                <Badge
                                  variant={profile.status === 'active' ? 'default' : 'secondary'}
                                  className="text-xs px-2 py-0.5"
                                >
                                  {profile.status}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            {profile.email && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{profile.email}</span>
                              </div>
                            )}
                            {profile.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{formatPhoneNumber(profile.phone)}</span>
                              </div>
                            )}
                            {profile.system_member_id && (
                              <div className="text-xs text-gray-400">
                                ID: {profile.system_member_id}
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
                  <User className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No profiles found</p>
                  <p className="text-xs text-gray-500 mb-4">
                    No profiles match "{searchQuery}"
                  </p>

                  {showCreateButton && (
                    <Button
                      onClick={handleCreateNew}
                      size="sm"
                      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Member
                    </Button>
                  )}
                </div>
              )}

              {/* Always show create option when searching */}
              {showCreateButton && searchResults.length > 0 && (
                <div className="border-t border-gray-100 p-3 bg-gray-50">
                  <Button
                    onClick={handleCreateNew}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Member
                    {searchQuery && (
                      <span className="text-gray-500 ml-1">
                        "{searchQuery}"
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Member Dialog */}
      <CreateMemberDialog
        isOpen={showCreateDialog}
        onClose={handleCreateDialogClose}
        onSuccess={handleCreateSuccess}
        initialData={createDialogInitialData}
      />
    </div>
  );
};

export default ProfileSearch;
