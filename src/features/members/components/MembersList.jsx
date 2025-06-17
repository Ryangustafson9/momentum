import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMembers, useDeleteMember } from '@/shared/hooks/useMembers';
import { QueryErrorBoundary } from '@/shared/components/ErrorBoundary';
import { ListLoading } from '@/shared/components/LoadingStates';
import { useAuth } from '@/shared/hooks/useAuth';

const MembersList = ({ onCreateMember, onEditMember, onViewMember }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  const { canAccess } = useAuth();
  const deleteMemberMutation = useDeleteMember();

  // Build filters object
  const filters = useMemo(() => {
    const filterObj = {};
    
    if (statusFilter !== 'all') {
      filterObj.status = statusFilter;
    }
    
    if (roleFilter !== 'all') {
      filterObj.role = roleFilter;
    }
    
    if (searchTerm.trim()) {
      filterObj.search = searchTerm.trim();
    }
    
    return filterObj;
  }, [searchTerm, statusFilter, roleFilter]);

  const { data: members = [], isLoading, error } = useMembers(filters);

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await deleteMemberMutation.mutateAsync(memberId);
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'staff':
        return 'default';
      case 'member':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getMemberInitials = (member) => {
    const firstName = member.first_name || '';
    const lastName = member.last_name || '';
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'M';
  };

  const getMemberDisplayName = (member) => {
    const firstName = member.first_name || '';
    const lastName = member.last_name || '';
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return firstName || lastName || member.email?.split('@')[0] || 'Unknown';
  };

  if (isLoading) {
    return <ListLoading items={5} showAvatar={true} />;
  }

  return (
    <QueryErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Members</h2>
            <p className="text-gray-600">Manage gym members and their information</p>
          </div>
          {canAccess('members', 'write') && (
            <Button onClick={onCreateMember}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <div className="grid gap-4">
          {members.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No members found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            members.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>{getMemberInitials(member)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getMemberDisplayName(member)}
                        </h3>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={getStatusBadgeVariant(member.status)}>
                            {member.status}
                          </Badge>
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewMember?.(member)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canAccess('members', 'write') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditMember?.(member)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {canAccess('members', 'delete') && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteMember(member.id)}
                                className="text-red-600"
                                disabled={deleteMemberMutation.isPending}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </QueryErrorBoundary>
  );
};

export default MembersList;
