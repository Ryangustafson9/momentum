import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';

// Helper functions
const getMemberInitials = (member) => {
  const firstName = member.first_name || '';
  const lastName = member.last_name || '';
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) return firstName.charAt(0).toUpperCase();
  if (lastName) return lastName.charAt(0).toUpperCase();
  return member.email ? member.email.charAt(0).toUpperCase() : '?';
};

const getMemberDisplayName = (member) => {
  if (member.display_name) return member.display_name;
  const firstName = member.first_name || '';
  const lastName = member.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || member.email || 'Unknown Member';
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'inactive': return 'bg-gray-100 text-gray-800';
    case 'suspended': return 'bg-red-100 text-red-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Individual member row component
const MemberRow = React.memo(({ index, style, data }) => {
  const { members, onViewMember, onEditMember, onDeleteMember, canAccess } = data;
  const member = members[index];

  if (!member) {
    return (
      <div style={style}>
        <Card className="mx-4 my-2">
          <CardContent className="p-4">
            <div className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div style={style}>
      <Card className="mx-4 my-2 hover:shadow-md transition-shadow">
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
                  <Badge className={getStatusColor(member.status)}>
                    {member.status || 'Unknown'}
                  </Badge>
                  {member.role && (
                    <Badge variant="outline" className="text-xs">
                      {member.role}
                    </Badge>
                  )}
                  {member.system_member_id && (
                    <span className="text-xs text-gray-500">
                      ID: {member.system_member_id}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewMember?.(member)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>

              {canAccess?.('members:write') && (
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
                    {canAccess?.('members:delete') && (
                      <DropdownMenuItem
                        onClick={() => onDeleteMember?.(member.id)}
                        className="text-red-600"
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
    </div>
  );
});

MemberRow.displayName = 'MemberRow';

// Main virtualized member list component
const VirtualizedMemberList = ({
  members = [],
  height = 600,
  itemHeight = 120,
  onViewMember,
  onEditMember,
  onDeleteMember,
  canAccess,
  loading = false,
  emptyMessage = "No members found matching your criteria."
}) => {
  // Memoize the data object to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    members,
    onViewMember,
    onEditMember,
    onDeleteMember,
    canAccess
  }), [members, onViewMember, onEditMember, onDeleteMember, canAccess]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <List
        height={height}
        itemCount={members.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={5} // Render 5 extra items for smooth scrolling
      >
        {MemberRow}
      </List>
    </div>
  );
};

export default VirtualizedMemberList;
