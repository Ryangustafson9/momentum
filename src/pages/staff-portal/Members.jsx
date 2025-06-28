/**
 * 🚫 DEACTIVATED PAGE - Members.jsx
 * 
 * This page has been temporarily deactivated in favor of:
 * - Basic member search in top navbar
 * - Advanced search modal (planned feature)
 * - Individual member profiles via direct navigation
 * 
 * The page code is preserved for potential future reactivation.
 * To reactivate:
 * 1. Uncomment the route in App.jsx 
 * 2. Uncomment the nav link in adminNavLinks.js
 * 3. Remove this deactivation note
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

// Member Service Functions
const memberService = {
  async getMembers() {
    try {
      const { data, error } = await supabase
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
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to add computed fields
      const processedData = (data || []).map(profile => ({
        ...profile,
        name: profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
        current_membership: profile.memberships?.[0] || null,
        current_membership_type_id: profile.memberships?.[0]?.membership_type?.id || null
      }));

      return processedData;
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
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
  const [members, setMembers] = useState([]);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [currentMember, setCurrentMember] = useState(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignMembershipDialogOpen, setIsAssignMembershipDialogOpen] = useState(false);
  const [isImpersonateDialogOpen, setIsImpersonateDialogOpen] = useState(false);

  const [memberToAssignPlan, setMemberToAssignPlan] = useState(null);
  const [memberToImpersonate, setMemberToImpersonate] = useState(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [membersData, membershipTypesData] = await Promise.all([
        memberService.getMembers(),
        memberService.getMembershipTypes()
      ]);
      
      setMembers(membersData);
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
  }, [toast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

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


