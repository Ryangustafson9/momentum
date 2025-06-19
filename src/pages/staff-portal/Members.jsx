import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Users, UserPlus, Loader2 } from 'lucide-react';
import MembersHeader from '@/components/admin/members/page_specific/MembersHeader';
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
          membership_types(name, category)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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

  const handleNavigateToProfile = (memberId) => {
    navigate(`/member/${memberId}`);
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
    <motion.div
      className="space-y-6 p-4 md:p-6 lg:p-8 bg-background dark:bg-slate-900 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <MembersHeader onAddMemberClick={handleAddMemberClick} />
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
    </motion.div>
  );
};

export default MembersPage;


