
import React from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';

const MembersFilterControls = ({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter, 
  membershipTypeFilter, 
  setMembershipTypeFilter, 
  uniqueStatuses, 
  uniqueMembershipDisplayTypes, 
  showArchived, 
  setShowArchived, 
  allMembershipTypes,
  membershipTypes, // Also accept membershipTypes for compatibility
  onSearchTermChange,
  onStatusFilterChange,
  membershipFilter,
  onMembershipFilterChange
}) => {
    // Use whichever prop is provided for membership types
  const membershipTypesData = allMembershipTypes || membershipTypes || [];
  
  // Get current filter values with fallbacks
  const currentStatusFilter = statusFilter || 'all';
  const currentMembershipFilter = membershipTypeFilter || membershipFilter || 'all';
  const currentSearchTerm = searchTerm || '';
  
  const getMembershipTypeName = (typeId) => {
    if (typeId === 'all') return 'All Types';
    if (!membershipTypesData || membershipTypesData.length === 0) return 'Unknown Type';
    const type = membershipTypesData.find(mt => mt && mt.id === typeId);
    return type ? type.name : 'Unknown Type';
  };
  const handleStatusChange = (status) => {
    const setStatus = setStatusFilter || onStatusFilterChange;
    if (setStatus) {
      setStatus(status);
      if (status === 'Archived' && setShowArchived) {
        setShowArchived(true);
      }
    }
  };

  const handleSearchChange = (e) => {
    const setValue = setSearchTerm || onSearchTermChange;
    if (setValue) {
      setValue(e.target.value);
    }
  };

  const handleMembershipFilterChange = (type) => {
    const setFilter = setMembershipTypeFilter || onMembershipFilterChange;
    if (setFilter) {
      setFilter(type);
    }
  };

  return (
  <div className="flex flex-col md:flex-row gap-3 mb-6">
    <div className="relative flex-grow">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />      <Input
        type="text"
        placeholder="Search by name, email, or ID..."
        value={currentSearchTerm}
        onChange={handleSearchChange}
        className="pl-10 w-full bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-primary focus:border-primary"
      />
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto justify-between">          <div className="flex items-center">
            <Filter className="mr-2 h-4 w-4" /> Status: {currentStatusFilter === 'all' ? 'All Statuses' : currentStatusFilter}
          </div>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>      <DropdownMenuContent align="end">
        {(uniqueStatuses || ['all', 'Active', 'Inactive', 'Archived']).map(status => (
          <DropdownMenuCheckboxItem 
            key={status} 
            checked={currentStatusFilter === status} 
            onCheckedChange={() => handleStatusChange(status)}
          >
            {status === 'all' ? 'All Statuses' : status}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
    <DropdownMenu>      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto justify-between">
          <div className="flex items-center">
            <Filter className="mr-2 h-4 w-4" /> Type: {getMembershipTypeName(currentMembershipFilter)}
          </div>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(uniqueMembershipDisplayTypes || membershipTypesData || []).map(type => (
          <DropdownMenuCheckboxItem 
            key={type.id} 
            checked={(membershipTypeFilter || membershipFilter) === type.id} 
            onCheckedChange={() => handleMembershipFilterChange(type.id)}
          >
            {type.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>    <Button 
      variant="outline" 
      onClick={() => {
          if (setShowArchived) {
            const newShowArchived = !showArchived;
            setShowArchived(newShowArchived);
            const setStatus = setStatusFilter || onStatusFilterChange;
            if (newShowArchived && statusFilter !== 'Archived') {
              // If we show archived, and current filter is not 'Archived', 
              // it might be better to switch to 'all' or 'Archived' to avoid confusion
              // For now, just toggling showArchived. User can then select status filter.
            } else if (!newShowArchived && statusFilter === 'Archived' && setStatus) {
              setStatus('Active'); // Default back to active if hiding archived
            }
          }
        }
      }
      className="w-full md:w-auto"
    >
      {showArchived ? 'Hide Archived' : 'Show Archived'}
    </Button>
  </div>
  );
};

export default MembersFilterControls;


