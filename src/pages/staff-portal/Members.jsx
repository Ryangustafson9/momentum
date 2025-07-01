/**
 * ✅ ENHANCED MEMBERS PAGE - Members.jsx
 *
 * Comprehensive member management interface with:
 * - Advanced search and filtering
 * - Bulk operations (status changes, exports)
 * - Member status management workflow
 * - Quick actions and member creation
 *
 * This is the primary interface for staff to manage all members.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Users, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MembersFilterControls from '@/components/admin/members/page_specific/MembersFilterControls';
import MembersTable from '@/components/admin/members/page_specific/MembersTable';
import MemberFormDialog from '@/components/admin/members/MemberFormDialog';
import DeleteMemberDialog from '@/components/admin/members/DeleteMemberDialog';

import AssignMembershipDialog from '@/components/admin/members/AssignMembershipDialog';
import ImpersonationConfirmationDialog from '@/components/admin/members/ImpersonationConfirmationDialog';

// Enhanced Member Service Functions
const memberService = {
  async getMembers(filters = {}) {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          memberships(
            id,
            status,
            start_date,
            next_payment_date,
            membership_type:membership_types(
              id,
              name,
              category
            )
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,system_member_id.ilike.%${filters.search}%`);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.role && filters.role !== 'all') {
        query = query.eq('role', filters.role);
      }

      if (filters.membershipStatus && filters.membershipStatus !== 'all') {
        // This will need to be handled in post-processing since it's a relationship
      }

      const { data, error, count } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to add computed fields
      let processedData = (data || []).map(profile => ({
        ...profile,
        name: profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
        current_membership: profile.memberships?.[0] || null,
        current_membership_type_id: profile.memberships?.[0]?.membership_type?.id || null,
        membership_status: profile.memberships?.[0]?.status || 'none'
      }));

      // Apply membership status filter if specified
      if (filters.membershipStatus && filters.membershipStatus !== 'all') {
        processedData = processedData.filter(member =>
          member.membership_status === filters.membershipStatus
        );
      }

      return {
        data: processedData,
        count: processedData.length,
        error: null
      };
    } catch (error) {
      console.error('Error fetching members:', error);
      return { data: [], count: 0, error };
    }
  },

  async updateMemberStatus(memberId, newStatus) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating member status:', error);
      return { data: null, error };
    }
  },

  async bulkUpdateStatus(memberIds, newStatus) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', memberIds)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error bulk updating member status:', error);
      return { data: null, error };
    }
  },

  async deleteMember(memberId) {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting member:', error);
      return { error };
    }
  },

  async getMembershipTypes() {
    try {
      const { data, error } = await supabase
        .from('membership_types')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching membership types:', error);
      throw error;
    }
  },

  async archiveMember(memberId) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error archiving member:', error);
      throw error;
    }
  }
};

const MembersPage = () => {
  // Core state
  const [members, setMembers] = useState([]);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [membershipFilter, setMembershipFilter] = useState('all');

  // Selection and bulk operations
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);

  // Dialog state
  const [currentMember, setCurrentMember] = useState(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignMembershipDialogOpen, setIsAssignMembershipDialogOpen] = useState(false);
  const [isImpersonateDialogOpen, setIsImpersonateDialogOpen] = useState(false);
  const [isBulkStatusDialogOpen, setIsBulkStatusDialogOpen] = useState(false);

  // Action state
  const [memberToAssignPlan, setMemberToAssignPlan] = useState(null);
  const [memberToImpersonate, setMemberToImpersonate] = useState(null);
  const [bulkStatusAction, setBulkStatusAction] = useState('');

  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = {
        search: searchTerm,
        status: statusFilter,
        role: roleFilter,
        membershipStatus: membershipFilter
      };

      const [membersResult, membershipTypesData] = await Promise.all([
        memberService.getMembers(filters),
        memberService.getMembershipTypes()
      ]);

      setMembers(membersResult.data || []);
      setTotalCount(membersResult.count || 0);
      setMembershipTypes(membershipTypesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch members: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, roleFilter, membershipFilter, toast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Selection handlers
  const handleSelectMember = (memberId, isSelected) => {
    const newSelected = new Set(selectedMembers);
    if (isSelected) {
      newSelected.add(memberId);
    } else {
      newSelected.delete(memberId);
    }
    setSelectedMembers(newSelected);
    setIsSelectAllChecked(newSelected.size === members.length && members.length > 0);
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedMembers(new Set(members.map(m => m.id)));
    } else {
      setSelectedMembers(new Set());
    }
    setIsSelectAllChecked(isSelected);
  };

  // Bulk operations
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedMembers.size === 0) return;

    try {
      const memberIds = Array.from(selectedMembers);
      await memberService.bulkUpdateStatus(memberIds, newStatus);

      toast({
        title: "Success",
        description: `Updated status for ${memberIds.length} members.`,
        variant: "default",
      });

      setSelectedMembers(new Set());
      setIsSelectAllChecked(false);
      fetchMembers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update member status.",
        variant: "destructive",
      });
    }
  };

  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      member.name?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower) ||
      member.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || (member.status && member.status.toLowerCase() === statusFilter.toLowerCase());
    const matchesMembership = membershipFilter === 'all' || 
                              (membershipFilter === 'none' && !member.current_membership_type_id) ||
                              (member.current_membership_type_id === membershipFilter);
    
    return matchesSearch && matchesStatus && matchesMembership;
  });

  const handleAddMemberClick = () => {
    setCurrentMember(null);
    setIsFormDialogOpen(true);
  };



  const handleEditMember = (member) => {
    setCurrentMember(member);
    setIsFormDialogOpen(true);
  };

  const handleDeleteMember = (member) => {
    setCurrentMember(member);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteMember = async () => {
    if (!currentMember) return;
    try {
      await memberService.archiveMember(currentMember.id);
      toast({ title: "Member Archived", description: `${currentMember.name} has been archived.` });
      fetchMembers();
    } catch (error) {
      console.error("Failed to archive member:", error);
      toast({ title: "Error", description: `Could not archive ${currentMember.name}. ${error.message}`, variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setCurrentMember(null);
    }
  };

  const handleFormSubmitSuccess = () => {
    fetchMembers();
    setIsFormDialogOpen(false);
  };

  const handleNavigateToProfile = (member) => {
    // Use system_member_id for the profile route
    const profileId = member.system_member_id || member.id;
    navigate(`/staff-portal/profile/${profileId}`);
  };

  const handleAssignMembership = (member) => {
    setMemberToAssignPlan(member);
    setIsAssignMembershipDialogOpen(true);
  };
  
  const handleAssignMembershipSuccess = () => {
    fetchMembers();
    setIsAssignMembershipDialogOpen(false);
    setMemberToAssignPlan(null);
  };

  const handleImpersonate = (member) => {
    setMemberToImpersonate(member);
    setIsImpersonateDialogOpen(true);
  };

  const confirmImpersonate = async () => {
    if (!memberToImpersonate) return;
    // Implement impersonation logic here
    setIsImpersonateDialogOpen(false);
    setMemberToImpersonate(null);
  };

  if (isLoading && members.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 bg-background dark:bg-slate-900 min-h-screen">
      {/* Members Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Members
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage gym members and their membership information
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleAddMemberClick}
            variant="outline"
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>

        </div>
      </div>
      <MembersFilterControls
        searchTerm={searchTerm}
        onSearchTermChange={(e) => setSearchTerm(e.target.value)}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        membershipFilter={membershipFilter}
        onMembershipFilterChange={setMembershipFilter}
        membershipTypes={membershipTypes}
      />
      
      {isLoading && members.length > 0 && (
        <div className="text-center py-4 text-muted-foreground">Refreshing member data...</div>
      )}

      <MembersTable
        members={filteredMembers}
        onEditMember={handleEditMember}
        onDeleteMember={handleDeleteMember}
        onAssignMembership={handleAssignMembership}
        onImpersonate={handleImpersonate}
        onNavigateToProfile={handleNavigateToProfile}
      />

      {/* Dialogs */}
      <MemberFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSuccess={handleFormSubmitSuccess}
        memberData={currentMember}
      />

      <DeleteMemberDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteMember}
        memberName={currentMember?.name}
      />

      <AssignMembershipDialog
        isOpen={isAssignMembershipDialogOpen}
        onClose={() => setIsAssignMembershipDialogOpen(false)}
        onSuccess={handleAssignMembershipSuccess}
        member={memberToAssignPlan}
      />      <ImpersonationConfirmationDialog
        isOpen={isImpersonateDialogOpen}
        onClose={() => setIsImpersonateDialogOpen(false)}
        onConfirm={confirmImpersonate}
        member={memberToImpersonate}
      />


    </div>
  );
};

export default MembersPage;


