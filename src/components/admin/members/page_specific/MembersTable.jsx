import React from 'react';
import { MoreHorizontal, Eye, Edit, Trash2, CreditCard, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MembersTable = ({
  members,
  selectedMembers,
  isSelectAllChecked,
  onSelectMember,
  onSelectAll,
  onViewMember,
  onEditMember,
  onDeleteMember,
  onAssignMembership,
  onImpersonateMember
}) => {
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'default';
      case 'suspended': return 'destructive';
      case 'cancelled': return 'destructive';
      case 'expired': return 'secondary';
      case 'frozen': return 'secondary';
      case 'guest': return 'outline';
      case 'archived': return 'secondary';
      default: return 'outline';
    }
  };

  const getMembershipStatusBadge = (membershipStatus) => {
    switch (membershipStatus) {
      case 'active': return { variant: 'default', text: 'Active Member' };
      case 'pending': return { variant: 'secondary', text: 'Pending' };
      case 'expired': return { variant: 'destructive', text: 'Expired' };
      case 'cancelled': return { variant: 'destructive', text: 'Cancelled' };
      case 'none': return { variant: 'outline', text: 'No Membership' };
      default: return { variant: 'outline', text: 'Unknown' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isSelectAllChecked}
                onCheckedChange={onSelectAll}
                aria-label="Select all members"
              />
            </TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Membership</TableHead>
            <TableHead>Join Date</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No members found matching your criteria.
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => {
              const membershipBadge = getMembershipStatusBadge(member.membership_status);
              
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedMembers.has(member.id)}
                      onCheckedChange={(checked) => onSelectMember(member.id, checked)}
                      aria-label={`Select ${member.name}`}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">
                        ID: {member.system_member_id || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{member.email}</div>
                      <div className="text-sm text-gray-500">{member.phone || 'No phone'}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(member.status)}>
                      {member.status || 'Unknown'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={membershipBadge.variant} className="text-xs">
                        {membershipBadge.text}
                      </Badge>
                      {member.current_membership?.membership_type?.name && (
                        <div className="text-xs text-gray-500">
                          {member.current_membership.membership_type.name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(member.join_date || member.created_at)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewMember(member)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditMember(member)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Member
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onAssignMembership(member)}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Assign Membership
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onImpersonateMember(member)}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Impersonate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDeleteMember(member)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default MembersTable;
