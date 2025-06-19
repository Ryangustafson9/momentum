
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Plus, Filter, Download, MoreHorizontal, Edit, Trash2, X, CheckCircle, AlertCircle, Info, Users 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient';
import MemberFormDialog from '@/components/admin/members/MemberFormDialog.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import AssignMembershipDialog from '@/components/admin/members/AssignMembershipDialog.jsx';
import ImpersonationConfirmationDialog from '@/components/admin/members/ImpersonationConfirmationDialog.jsx';
import { useDebounce } from '@/hooks/useDebounce.js';

const MembersPageHeader = ({ onAddMemberClick }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-6 pb-4 border-b border-border">
    <h1 className="text-3xl font-bold tracking-tight text-foreground">Members Management</h1>
    <Button onClick={onAddMemberClick} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-md transition-all duration-300 ease-in-out transform hover:scale-105">
      <Plus className="mr-2 h-5 w-5" />
      Add New Member
    </Button>
  </div>
);

const MembersFilterControls = ({ searchTerm, onSearchTermChange, statusFilter, onStatusFilterChange, membershipFilter, onMembershipFilterChange, membershipTypes }) => (
  <div className="flex flex-col md:flex-row gap-3 mb-6 p-4 bg-card rounded-lg shadow">
    <div className="relative flex-1 min-w-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        placeholder="Search by name, email, or phone..."
        className="pl-10 h-10 w-full"
        value={searchTerm}
        onChange={onSearchTermChange}
      />
    </div>
    <div className="flex flex-col sm:flex-row gap-3">
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-[150px] h-10">
          <SelectValue placeholder="Filter by Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Inactive">Inactive</SelectItem>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Archived">Archived</SelectItem>
        </SelectContent>
      </Select>
      <Select value={membershipFilter} onValueChange={onMembershipFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px] h-10">
          <SelectValue placeholder="Filter by Membership" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Memberships</SelectItem>
          {membershipTypes.map(type => (
            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
          ))}
          <SelectItem value="none">No Active Plan</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" className="h-10 w-10 hidden sm:inline-flex" title="More Filters">
        <Filter className="h-5 w-5" />
      </Button>
      <Button variant="outline" size="icon" className="h-10 w-10 hidden sm:inline-flex" title="Download Members List">
        <Download className="h-5 w-5" />
      </Button>
    </div>
  </div>
);

const MemberStatusBadge = ({ status }) => {
  let variant = "default";
  let icon = <Info className="mr-1 h-3 w-3" />;
  switch (status?.toLowerCase()) {
    case 'active':
      variant = "success";
      icon = <CheckCircle className="mr-1 h-3 w-3" />;
      break;
    case 'inactive':
      variant = "destructive";
      icon = <AlertCircle className="mr-1 h-3 w-3" />;
      break;
    case 'pending':
      variant = "warning";
      break;
    case 'archived':
      variant = "outline";
      break;
  }
  return <Badge variant={variant} className="capitalize text-xs py-1 px-2.5 flex items-center whitespace-nowrap">{icon}{status}</Badge>;
};

const MembersTable = ({ members, onEditMember, onDeleteMember, onAssignMembership, onImpersonate, onNavigateToProfile }) => (
  <div className="rounded-lg border overflow-hidden shadow-sm bg-card">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 dark:bg-slate-800/50">
          <tr className="border-b border-border">
            <th className="h-12 px-4 text-left font-semibold text-muted-foreground">Name</th>
            <th className="h-12 px-4 text-left font-semibold text-muted-foreground">Email</th>
            <th className="h-12 px-4 text-left font-semibold text-muted-foreground hidden md:table-cell">Phone</th>
            <th className="h-12 px-4 text-left font-semibold text-muted-foreground hidden lg:table-cell">Membership</th>
            <th className="h-12 px-4 text-left font-semibold text-muted-foreground">Status</th>
            <th className="h-12 px-4 text-left font-semibold text-muted-foreground hidden lg:table-cell">Join Date</th>
            <th className="h-12 px-4 text-center font-semibold text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {members.length > 0 ? (
            members.map((member) => (
              <motion.tr
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="hover:bg-muted/30 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="p-4 align-middle font-medium text-foreground whitespace-nowrap cursor-pointer hover:text-primary" onClick={() => onNavigateToProfile(member.id)}>{member.name}</td>
                <td className="p-4 align-middle text-muted-foreground whitespace-nowrap">{member.email}</td>
                <td className="p-4 align-middle text-muted-foreground hidden md:table-cell whitespace-nowrap">{member.phone || 'N/A'}</td>
                <td className="p-4 align-middle text-muted-foreground hidden lg:table-cell whitespace-nowrap">{member.current_membership_name || 'N/A'}</td>
                <td className="p-4 align-middle"><MemberStatusBadge status={member.status} /></td>
                <td className="p-4 align-middle text-muted-foreground hidden lg:table-cell whitespace-nowrap">{member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}</td>
                <td className="p-4 align-middle text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 shadow-lg">
                      <DropdownMenuItem onClick={() => onNavigateToProfile(member.id)}>
                        <Info className="mr-2 h-4 w-4" /> View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditMember(member)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Member
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAssignMembership(member)}>
                        <Plus className="mr-2 h-4 w-4" /> Assign Plan
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onImpersonate(member)}>
                        <Users className="mr-2 h-4 w-4" /> Impersonate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDeleteMember(member)} className="text-red-500 hover:!text-red-500 focus:text-red-500 focus:bg-red-500/10">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </motion.tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="h-32 text-center text-muted-foreground italic">
                No members found matching your criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [isAssignMembershipDialogOpen, setIsAssignMembershipDialogOpen] = useState(false);
  const [memberToAssignPlan, setMemberToAssignPlan] = useState(null);
  const [isImpersonateDialogOpen, setIsImpersonateDialogOpen] = useState(false);
  const [memberToImpersonate, setMemberToImpersonate] = useState(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: fetchedMembers, error } = await supabase
        .from('profiles')
        .select(`
          *,
          memberships(
            id,
            current_membership_type_id,
            membership_type:membership_types!current_membership_type_id(
              id,
              name,
              category
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const membersWithPlanNames = fetchedMembers.map(member => {
        const currentMembership = member.memberships?.[0];
        const current_membership_name = currentMembership?.membership_type?.name || 'N/A';
        return {
          ...member,
          current_membership_name,
          current_membership_type_id: currentMembership?.current_membership_type_id
        };
      });

      setMembers(membersWithPlanNames);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      toast({ title: "Error", description: "Could not load members.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchMembershipTypes = useCallback(async () => {
    try {
      const { data: types, error } = await supabase
        .from('membership_types')
        .select('*')
        .order('name');

      if (error) throw error;

      setMembershipTypes(types || []);
    } catch (error) {
      console.error("Failed to fetch membership types:", error);
      toast({ title: "Error", description: "Could not load membership types.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    fetchMembers();
    fetchMembershipTypes();
  }, [fetchMembers, fetchMembershipTypes]);

  const filteredMembers = members.filter(member => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    const matchesSearch = !debouncedSearchTerm ||
                         (member.name && member.name.toLowerCase().includes(searchLower)) ||
                         (member.email && member.email.toLowerCase().includes(searchLower)) ||
                         (member.phone && member.phone.toLowerCase().includes(searchLower));
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
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'archived' })
        .eq('id', currentMember.id);

      if (error) throw error;

      toast({ title: "Member Archived", description: `${currentMember.name} has been archived.` });
      fetchMembers(); // Refresh list
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
    fetchMembers(); // Refresh member list to show updated plan
    setIsAssignMembershipDialogOpen(false);
    setMemberToAssignPlan(null);
  };

  const handleImpersonate = (member) => {
    setMemberToImpersonate(member);
    setIsImpersonateDialogOpen(true);
  };

  const confirmImpersonate = async () => {
    if (!memberToImpersonate) return;
        
    const appElement = document.getElementById('app-container'); 
    if (appElement && appElement._reactRootContainer && appElement._reactRootContainer._internalRoot && appElement._reactRootContainer._internalRoot.current) {
        
        const fiberRoot = appElement._reactRootContainer._internalRoot.current;
        let appInstance = null;
        
        
        let node = fiberRoot.child;
        while(node) {
            if (node.type && node.type.name === 'App') { 
                if (node.stateNode && typeof node.stateNode.startMemberImpersonation === 'function') {
                    appInstance = node.stateNode;
                    break;
                }
            }
            node = node.child || node.sibling; 
        }

        if (appInstance && typeof appInstance.startMemberImpersonation === 'function') {
            appInstance.startMemberImpersonation(memberToImpersonate.id);
        } else {
            console.warn("Impersonation function not found on App component instance. This method of access is fragile.");
            toast({ title: "Impersonation Info", description: `Impersonation for ${memberToImpersonate.name} could not be initiated directly. (Dev Note: Connect to App.jsx context or props).`, variant: "default" });
        }
    } else {
        console.warn("Could not find App root to initiate impersonation. This method of access is fragile.");
        toast({ title: "Impersonation Info", description: `Impersonation for ${memberToImpersonate.name} could not be initiated. (Dev Note: Ensure App component is accessible).`, variant: "default" });
    }


    setIsImpersonateDialogOpen(false);
    setMemberToImpersonate(null);
  };


  if (isLoading && members.length === 0) {
    return <div className="flex justify-center items-center h-64"><Info className="mr-2 h-5 w-5 animate-spin" />Loading members...</div>;
  }

  return (
    <motion.div 
      className="space-y-6 p-4 md:p-6 lg:p-8 bg-background dark:bg-slate-900 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <MembersPageHeader onAddMemberClick={handleAddMemberClick} />
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

      <MemberFormDialog
        isOpen={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        memberData={currentMember}
        onSuccess={handleFormSubmitSuccess}
        membershipTypes={membershipTypes}
      />

      {memberToAssignPlan && (
        <AssignMembershipDialog
          isOpen={isAssignMembershipDialogOpen}
          onOpenChange={setIsAssignMembershipDialogOpen}
          member={memberToAssignPlan}
          membershipTypes={membershipTypes}
          onSuccess={handleAssignMembershipSuccess}
        />
      )}

      {memberToImpersonate && (
        <ImpersonationConfirmationDialog
          isOpen={isImpersonateDialogOpen}
          onOpenChange={setIsImpersonateDialogOpen}
          memberName={memberToImpersonate.name}
          onConfirm={confirmImpersonate}
        />
      )}

      {currentMember && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Archival</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to archive {currentMember.name}? This member will be marked as archived and hidden from most views.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteMember} className="bg-destructive hover:bg-destructive/90">
                Archive Member
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </motion.div>
  );
};

export default MembersPage;


