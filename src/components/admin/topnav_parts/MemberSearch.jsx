
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

const MemberSearch = ({ allMembers, navigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchTerm.length > 0 && Array.isArray(allMembers)) {
      const filtered = allMembers.filter(member => {
        if (!member) return false;

        const name = member.name || member.full_name || '';
        const email = member.email || '';
        const systemId = member.systemMemberId || member.system_member_id || '';

        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               email.toLowerCase().includes(searchTerm.toLowerCase()) ||
               String(systemId).toLowerCase().includes(searchTerm.toLowerCase());
      });
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
    setShowSearchDropdown(document.activeElement === searchRef.current?.querySelector('input') && searchTerm.length > 0);
  }, [searchTerm, allMembers]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectMember = (memberId) => {
    navigate(`/member/${memberId}`);
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  const handleCreateNewMember = () => {
    navigate(`/member/new?name=${encodeURIComponent(searchTerm)}`);
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  return (
    <div ref={searchRef} className="relative">
      <label htmlFor="memberSearchTopNav" className="sr-only">Search members</label>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
      <Input
        id="memberSearchTopNav"
        type="search"
        placeholder="Search members..."
        className="pl-8 pr-3 py-2 h-9 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary w-40 md:w-48 lg:w-56 bg-slate-50 dark:bg-slate-700"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setShowSearchDropdown(true)}
      />
      <AnimatePresence>
      {showSearchDropdown && searchTerm.length > 0 && (
          <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-1 w-full md:w-80 max-h-72 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50"
              role="listbox"
          >
          {searchResults.length > 0 && searchResults.map(member => (
              <div
                  key={member.id}
                  role="option"
                  aria-selected="false"
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-sm"
                  onClick={() => handleSelectMember(member.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectMember(member.id)}
                  tabIndex={0}
              >
                  <p className="font-medium">{member.name || member.full_name || member.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.email || member.systemMemberId || member.system_member_id}</p>
              </div>
          ))}
          {searchResults.length === 0 && (
               <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400" role="option" aria-live="polite">
                  No members found matching "{searchTerm}".
              </div>
          )}
          <div 
              role="option"
              aria-selected="false"
              className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-sm flex items-center text-primary"
              onClick={handleCreateNewMember}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNewMember()}
              tabIndex={0}
          >
              <PlusCircle className="mr-2 h-4 w-4"/> Create New Member {searchTerm && `"${searchTerm}"`}
          </div>
          </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default MemberSearch;


