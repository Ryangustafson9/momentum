
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';

import MembersHeader from '@/components/admin/members/page_specific/MembersHeader.jsx';
import MembersFilterControls from '@/components/admin/members/page_specific/MembersFilterControls.jsx';
import MembersTable from '@/components/admin/members/page_specific/MembersTable.jsx';
import MemberFormDialog from '@/components/admin/members/MemberFormDialog.jsx';
import AssignMembershipDialog from '@/components/admin/members/AssignMembershipDialog.jsx'; 
import LoadingSpinner from '@/components/LoadingSpinner.jsx';
import EmptyState from '@/components/EmptyState.jsx';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { useDebounce } from '@/hooks/useDebounce.js';

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssignMembershipOpen, setIsAssignMembershipOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active'); 
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [showArchived, setShowArchived] = useState(false);

  const { toast } = useToast();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [membersData, typesData] = await Promise.all([
        dataService.getMembers(),
        dataService.getMembershipTypes()
      ]);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setMembershipTypes(Array.isArray(typesData) ? typesData : []);
    } catch (error) {
      toast({ title: "Error", description: `Failed to fetch data: ${error.message}`, variant: "destructive" });
      setMembers([]);
      setMembershipTypes([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const filteredMembers = useMemo(() => {
    let currentMembers = [...members];

    if (!showArchived && statusFilter !== 'Archived') {
      currentMembers = currentMembers.filter(member => member.status !== 'Archived');
    }
    
    if (statusFilter !== 'all' && statusFilter !== 'Archived') {
      currentMembers = currentMembers.filter(member => member.status === statusFilter);
    } else if (statusFilter === 'Archived') {
       currentMembers = members.filter(member => member.status === 'Archived');
    }

    if (debouncedSearchTerm) {
      currentMembers = currentMembers.filter(member =>
        (member.name && member.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (member.email && member.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (member.system_member_id && String(member.system_member_id).includes(debouncedSearchTerm))
      );
    }
    
    if (membershipFilter !== 'all') {
      currentMembers = currentMembers.filter(member => {
        if (Array.isArray(member.assigned_plan_ids)) {
          return member.assigned_plan_ids.includes(membershipFilter);
        }
        return member.current_membership_type_id === membershipFilter;
      });
    }

    if (sortConfig.key) {
      currentMembers.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === 'join_date' || sortConfig.key === 'profile_creation_date') {
          valA = new Date(valA);
          valB = new Date(valB);
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
        } else if (typeof valB === 'string') { // Should be valA too, or handle both types
          valB = valB.toLowerCase();
        }


        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return currentMembers;
  }, [debouncedSearchTerm, statusFilter, members, sortConfig, membershipFilter, showArchived]);


  const handleCreateNewMember = useCallback(() => {
    setSelectedMember(null);
    setIsFormOpen(true);
  }, []);

  const handleEditMember = useCallback((member) => {
    setSelectedMember(member);
    setIsFormOpen(true);
  }, []);

  const handleOpenAssignMembership = useCallback((member) => {
    setSelectedMember(member);
    setIsAssignMembershipOpen(true);
  }, []);

  const handleSaveMember = useCallback(async (memberData, currentEditingMember) => {
    try {
      if (currentEditingMember && currentEditingMember.id) {
        await dataService.updateMember(currentEditingMember.id, memberData);
        toast({ title: "Success", description: "Member updated successfully." });
      } else {
        await dataService.memberService.create(memberData);
        toast({ title: "Success", description: "Member added successfully." });
      }
      fetchInitialData();
      setIsFormOpen(false);
      setSelectedMember(null);
    } catch (error) {
      console.error("Full error details:", error);
      toast({ title: "Error", description: `Failed to save member: ${error.message}`, variant: "destructive" });
    }
  }, [toast, fetchInitialData]);

  const handleAssignMembershipSuccess = useCallback(async (updatedMember) => {
    // Optimistically update the local state or refetch all data
    toast({ title: "Success", description: "Membership assigned successfully." });
    fetchInitialData(); // Re-fetch all data to ensure consistency
    setIsAssignMembershipOpen(false);
    setSelectedMember(null);
  }, [toast, fetchInitialData]);
  
  const handleArchiveMember = useCallback(async (memberId) => {
    try {
      await dataService.archiveMember(memberId);
      toast({ title: "Success", description: "Member archived successfully." });
      fetchInitialData();
    } catch (error) {
      toast({ title: "Error", description: `Failed to archive member: ${error.message}`, variant: "destructive" });
    }
  }, [toast, fetchInitialData]);

  const requestSort = useCallback((key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const uniqueStatuses = useMemo(() => {
    const statuses = ['all', ...new Set(members.map(member => member.status).filter(Boolean))];
    if (!statuses.includes('Archived') && members.some(m => m.status === 'Archived')) {
      statuses.push('Archived');
    }
    return statuses;
  }, [members]);

  const uniqueMembershipDisplayTypes = useMemo(() => [
    { id: 'all', name: 'All Types' },
    ...membershipTypes.map(type => ({ id: type.id, name: type.name }))
  ], [membershipTypes]);

  if (isLoading && members.length === 0) {
    return <LoadingSpinner text="Loading members..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 px-4 md:px-6"
    >
      <MembersHeader 
        onAddNewMember={handleCreateNewMember}
      />

      <MembersFilterControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        membershipTypeFilter={membershipFilter}
        setMembershipTypeFilter={setMembershipFilter}
        uniqueStatuses={uniqueStatuses}
        uniqueMembershipDisplayTypes={uniqueMembershipDisplayTypes}
        showArchived={showArchived}
        setShowArchived={setShowArchived}
        allMembershipTypes={membershipTypes}
      />

      {isLoading && members.length > 0 && <div className="text-center py-4 text-muted-foreground">Updating member list...</div>}
      
      {!isLoading && filteredMembers.length === 0 ? (
         <EmptyState 
            icon={<Users className="h-16 w-16 text-slate-400 dark:text-slate-500" />}
            title="No Members Found" 
            description={debouncedSearchTerm || statusFilter !== 'all' || membershipFilter !== 'all' || showArchived ? "No members match your current filters. Try adjusting your search or filter criteria." : "There are no members in the system yet. Add a new member to get started!"}
            actionButton={
              <Button onClick={handleCreateNewMember} variant="action" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Add New Member
              </Button>
            }
        />
      ) : (
        <MembersTable
          members={filteredMembers}
          onEditMember={handleEditMember}
          onAssignMembership={handleOpenAssignMembership}
          onArchiveMember={handleArchiveMember}
          membershipTypes={membershipTypes}
          sortConfig={sortConfig}
          requestSort={requestSort}
        />
      )}

      {isFormOpen && (
        <MemberFormDialog
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleSaveMember}
          editingMember={selectedMember}
          membershipTypesList={membershipTypes}
        />
      )}

      {isAssignMembershipOpen && selectedMember && (
        <AssignMembershipDialog
          isOpen={isAssignMembershipOpen}
          onOpenChange={(openState) => {
            setIsAssignMembershipOpen(openState);
            if (!openState) setSelectedMember(null);
          }}
          member={selectedMember}
          membershipTypes={membershipTypes}
          onSubmitSuccess={handleAssignMembershipSuccess}
        />
      )}
    </motion.div>
  );
};

export default MembersPage;


