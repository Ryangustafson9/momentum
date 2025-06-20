import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, PlusCircle, User, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const MemberSearch = ({ allMembers, navigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Debug logging
  useEffect(() => {
    console.log('MemberSearch: allMembers prop received:', allMembers?.length || 0, 'members');
    console.log('MemberSearch: Sample data:', allMembers?.slice(0, 2));
  }, [allMembers]);
  const performSearch = useCallback((term) => {
    console.log('🔍 MemberSearch performSearch called with term:', term);
    console.log('📊 allMembers available:', allMembers?.length || 0);
    
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
      console.log('🔎 Searching through members...');
      const filtered = allMembers.filter(member => {
        if (!member) return false;

        const name = member.name || member.display_name || member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim();
        const email = member.email || '';
        const phone = member.phone || '';
        const role = member.role || '';
        const systemMemberId = member.system_member_id || '';

        const searchLower = term.toLowerCase();

        const matches = name.toLowerCase().includes(searchLower) ||
               email.toLowerCase().includes(searchLower) ||
               phone.includes(term) ||
               role.toLowerCase().includes(searchLower) ||
               String(systemMemberId).toLowerCase().includes(searchLower);
               
        return matches;
      }).slice(0, 8); // Limit to 8 results for better UX

      console.log('✅ Search results found:', filtered.length);
      setSearchResults(filtered);
    } else {
      console.log('⚠️ No allMembers data available for search');
      setSearchResults([]);
    }
    setIsLoading(false);
  }, [allMembers]);

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
    navigate(`/staff-portal/member/${profileId}`);
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  const handleCreateNewMember = () => {
    navigate(`/staff-portal/member-registration?name=${encodeURIComponent(searchTerm)}`);
    setSearchTerm('');
    setShowSearchDropdown(false);
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
                </div>
                {searchResults.map(member => {
                  const displayName = member.name || member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email;
                  return (
                    <div
                      key={member.id}
                      role="option"
                      aria-selected="false"
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-b-0 transition-colors"
                      onClick={() => handleSelectMember(member)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelectMember(member)}
                      tabIndex={0}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {displayName}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {member.system_member_id && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                <User className="inline h-3 w-3 mr-1" />
                                ID: {member.system_member_id}
                              </p>
                            )}
                            {member.email && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                <Mail className="inline h-3 w-3 mr-1" />
                                {member.email}
                              </p>
                            )}
                            {member.phone && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                <Phone className="inline h-3 w-3 mr-1" />
                                {member.phone}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`ml-2 text-xs ${getRoleColor(member.role)}`}
                        >
                          {member.role || 'member'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {!isLoading && searchResults.length === 0 && searchTerm.length >= 2 && (
              <div className="px-4 py-6 text-center">
                <User className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  No profiles found matching "{searchTerm}"
                </p>
                <div
                  role="button"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 cursor-pointer"
                  onClick={handleCreateNewMember}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateNewMember()}
                  tabIndex={0}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Member "{searchTerm}"
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemberSearch;


