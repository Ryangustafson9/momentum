import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, PlusCircle, User, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { matchesSearchTerm, getSearchRelevanceScore, HIGHLIGHT_COLORS } from '@/utils/searchHighlight.jsx';
import HighlightedText from '@/components/ui/HighlightedText';
import { MemberTaggingService } from '@/services/memberTaggingService';
import { useToast } from '@/hooks/use-toast';
import CreateMemberDialog from '@/components/staff/CreateMemberDialog';

const MemberSearch = ({ allMembers, navigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [memberTags, setMemberTags] = useState({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const { toast } = useToast();
  // Debug logging
  useEffect(() => {
    // Member search data verification for development
  }, [allMembers]);const performSearch = useCallback((term) => {
    if (term.length === 0) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    if (term.length < 2) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (Array.isArray(allMembers) && allMembers.length > 0) {
      const filtered = allMembers        .filter(member => {
          if (!member) return false;

          const name = member.name || member.display_name || member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Unknown Member';
          const email = member.email || '';
          const phone = member.phone || '';
          const role = member.role || '';
          const systemMemberId = member.system_member_id || '';

          // Use enhanced search utilities
          const nameMatch = matchesSearchTerm(name, term);
          const emailMatch = matchesSearchTerm(email, term);
          const phoneMatch = matchesSearchTerm(phone, term);
          const roleMatch = matchesSearchTerm(role, term);
          const idMatch = matchesSearchTerm(String(systemMemberId), term);
               
          return nameMatch || emailMatch || phoneMatch || roleMatch || idMatch;
        })
        .map(member => {
          const displayName = member.name || member.display_name || member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Unknown Member';
          return {
            ...member,
            displayName,
            relevanceScore: Math.max(
              getSearchRelevanceScore(displayName, term),
              getSearchRelevanceScore(member.email || '', term),
              getSearchRelevanceScore(member.phone || '', term),
              getSearchRelevanceScore(member.role || '', term),
              getSearchRelevanceScore(String(member.system_member_id || ''), term)
            )
          };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance
        .slice(0, 8); // Limit to 8 results for better UX

      setSearchResults(filtered);

      // Load tags for the search results
      loadMemberTags(filtered);
    } else {
      setSearchResults([]);
    }
    setIsLoading(false);
  }, [allMembers]);

  // Function to load tags for members
  const loadMemberTags = async (members) => {
    try {
      const tagPromises = members.map(async (member) => {
        const result = await MemberTaggingService.getMemberTags(member.id);
        return {
          memberId: member.id,
          tags: result.data || []
        };
      });

      const tagResults = await Promise.all(tagPromises);
      const tagsMap = {};
      tagResults.forEach(({ memberId, tags }) => {
        tagsMap[memberId] = tags;
      });

      setMemberTags(tagsMap);
    } catch (error) {
      
    }
  };

  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      performSearch(searchTerm);
    }, 300); // 300ms debounce

    // Show dropdown if we have a search term and input is focused
    setShowSearchDropdown(
      document.activeElement === searchRef.current?.querySelector('input') &&
      searchTerm.length >= 2
    );

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, performSearch]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleSelectMember = (member) => {
    // Use system_member_id for the profile route
    const profileId = member.system_member_id || member.id;
    const targetUrl = `/staff-portal/profile/${profileId}`;
    console.log('🔍 MemberSearch: Navigating to:', targetUrl);
    console.log('🔍 Member data:', member);
    navigate(targetUrl);
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  const handleCreateNewMember = () => {
    setShowCreateDialog(true);
    setShowSearchDropdown(false);
  };

  const handleCreateSuccess = (newMember) => {
    toast({
      title: "Member Created",
      description: `${newMember.first_name} ${newMember.last_name} has been successfully created.`,
    });

    // Navigate to the new member's profile
    const profileId = newMember.system_member_id || newMember.id;
    navigate(`/staff-portal/profile/${profileId}`);
    setSearchTerm('');
    setShowCreateDialog(false);
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'member': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div ref={searchRef} className="relative">
      <label htmlFor="memberSearchTopNav" className="sr-only">Search profiles</label>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
      <Input
        id="memberSearchTopNav"
        type="search"
        placeholder="Search profiles..."
        className="pl-8 pr-3 py-2 h-9 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary w-48 md:w-56 lg:w-64 bg-slate-50 dark:bg-slate-700"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setShowSearchDropdown(searchTerm.length >= 2)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        data-form-type="other"
      />
      <AnimatePresence>
        {showSearchDropdown && searchTerm.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-full md:w-96 max-h-80 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
            role="listbox"
          >
            {isLoading && (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                Searching...
              </div>
            )}

            {!isLoading && searchResults.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  Found {searchResults.length} profile{searchResults.length !== 1 ? 's' : ''}
                </div>                {searchResults.map(member => {
                  const displayName = member.displayName || member.name || member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Unknown Member';
                  return (
                    <div
                      key={member.id}
                      role="option"
                      aria-selected="false"
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-50 dark:border-gray-700 transition-colors"
                      onClick={() => handleSelectMember(member)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelectMember(member)}
                      tabIndex={0}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            <HighlightedText
                              text={displayName}
                              searchTerm={searchTerm}
                              highlightClass={HIGHLIGHT_COLORS.MEMBER_SEARCH}
                            />
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {member.system_member_id && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                <User className="inline h-3 w-3 mr-1" />
                                ID: <HighlightedText
                                  text={String(member.system_member_id)}
                                  searchTerm={searchTerm}
                                  highlightClass={HIGHLIGHT_COLORS.MEMBER_SEARCH}
                                />
                              </p>
                            )}
                            {member.email && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                <Mail className="inline h-3 w-3 mr-1" />
                                <HighlightedText
                                  text={member.email}
                                  searchTerm={searchTerm}
                                  highlightClass={HIGHLIGHT_COLORS.MEMBER_SEARCH}
                                />
                              </p>
                            )}
                            {member.phone && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                <Phone className="inline h-3 w-3 mr-1" />
                                <HighlightedText
                                  text={member.phone}
                                  searchTerm={searchTerm}
                                  highlightClass={HIGHLIGHT_COLORS.MEMBER_SEARCH}
                                />
                              </p>
                            )}
                          </div>

                          {/* Member Tags */}
                          {memberTags[member.id] && memberTags[member.id].length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {memberTags[member.id].slice(0, 2).map(tagAssignment => (
                                <Badge
                                  key={tagAssignment.member_tags.id}
                                  style={{
                                    backgroundColor: tagAssignment.member_tags.color,
                                    color: '#fff'
                                  }}
                                  className="text-xs px-1 py-0"
                                >
                                  {tagAssignment.member_tags.name}
                                </Badge>
                              ))}
                              {memberTags[member.id].length > 2 && (
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  +{memberTags[member.id].length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getRoleColor(member.role)}`}
                          >
                            <HighlightedText
                              text={member.role || 'member'}
                              searchTerm={searchTerm}
                              highlightClass={HIGHLIGHT_COLORS.MEMBER_SEARCH}
                            />
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Always show Create New Member option when there's a search term */}
                <div className="border-t border-gray-100 dark:border-gray-700">
                  <div
                    role="button"
                    className="px-4 py-3 text-sm font-medium transition-colors flex items-center text-primary hover:text-primary/80 hover:bg-primary/5 cursor-pointer"
                    onClick={handleCreateNewMember}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateNewMember()}
                    tabIndex={0}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Member
                  </div>
                </div>
              </>
            )}            {!isLoading && searchResults.length === 0 && searchTerm.length >= 2 && (
              <div className="px-4 py-6 text-center">
                <User className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  No profiles found matching "<HighlightedText
                    text={searchTerm}
                    searchTerm={searchTerm}
                    highlightClass={HIGHLIGHT_COLORS.MEMBER_SEARCH}
                  />"
                </p>
                <div
                  role="button"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-primary hover:text-primary/80 cursor-pointer hover:bg-primary/5"
                  onClick={handleCreateNewMember}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateNewMember()}
                  tabIndex={0}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Member
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Member Dialog */}
      <CreateMemberDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default MemberSearch;



