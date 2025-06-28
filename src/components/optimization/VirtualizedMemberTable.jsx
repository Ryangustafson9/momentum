import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';

// Helper functions
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

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

// Table header component
const TableHeader = () => (
  <div className="flex items-center bg-gray-50 border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
    <div className="flex-1 min-w-0 pr-4">Name</div>
    <div className="w-48 pr-4">Email</div>
    <div className="w-24 pr-4">Status</div>
    <div className="w-24 pr-4">Role</div>
    <div className="w-32 pr-4">Join Date</div>
    <div className="w-20">Actions</div>
  </div>
);

// Individual table row component
const TableRow = React.memo(({ index, style, data }) => {
  const { members, onViewMember, onEditMember, onDeleteMember, canAccess } = data;
  const member = members[index];

  if (!member) {
    return (
      <div style={style} className="flex items-center px-4 py-3 border-b border-gray-100">
        <div className="animate-pulse flex items-center w-full">
          <div className="flex-1 min-w-0 pr-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="w-48 pr-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="w-24 pr-4">
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="w-24 pr-4">
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="w-32 pr-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="w-20">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={style} 
      className="flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
    >
      {/* Name */}
      <div className="flex-1 min-w-0 pr-4">
        <div className="font-medium text-gray-900 truncate">
          {getMemberDisplayName(member)}
        </div>
        {member.system_member_id && (
          <div className="text-xs text-gray-500">
            ID: {member.system_member_id}
          </div>
        )}
      </div>

      {/* Email */}
      <div className="w-48 pr-4">
        <div className="text-sm text-gray-600 truncate">
          {member.email || 'No email'}
        </div>
      </div>

      {/* Status */}
      <div className="w-24 pr-4">
        <Badge className={getStatusColor(member.status)}>
          {member.status || 'Unknown'}
        </Badge>
      </div>

      {/* Role */}
      <div className="w-24 pr-4">
        <Badge variant="outline" className="text-xs">
          {member.role || 'Member'}
        </Badge>
      </div>

      {/* Join Date */}
      <div className="w-32 pr-4">
        <div className="text-sm text-gray-600">
          {formatDate(member.join_date || member.created_at)}
        </div>
      </div>

      {/* Actions */}
      <div className="w-20">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewMember?.(member)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {canAccess?.('members:write') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
    </div>
  );
});

TableRow.displayName = 'TableRow';

// Main virtualized member table component
const VirtualizedMemberTable = ({
  members = [],
  height = 600,
  itemHeight = 60,
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
      <div className="border rounded-lg overflow-hidden">
        <TableHeader />
        <div className="space-y-0">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex items-center px-4 py-3 border-b border-gray-100 animate-pulse">
              <div className="flex-1 min-w-0 pr-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="w-48 pr-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="w-24 pr-4">
                <div className="h-6 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="w-24 pr-4">
                <div className="h-6 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="w-32 pr-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="w-20">
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (members.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <TableHeader />
        <div className="p-8 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <TableHeader />
      <List
        height={height - 50} // Subtract header height
        itemCount={members.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={5} // Render 5 extra items for smooth scrolling
      >
        {TableRow}
      </List>
    </div>
  );
};

export default VirtualizedMemberTable;
