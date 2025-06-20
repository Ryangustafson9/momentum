
import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Archive, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const MembersTable = ({ members, onArchiveMember, requestSort, sortConfig, membershipTypes }) => {
  
  const getSortIndicator = (key) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4 inline ml-1" /> : <ChevronDown className="h-4 w-4 inline ml-1" />;
    }
    return null;
  };

  const getMembershipName = (member) => {
    if (Array.isArray(member.assigned_plan_ids) && member.assigned_plan_ids.length > 0) {
        return member.assigned_plan_ids.map(planId => {
            const type = membershipTypes.find(mt => mt.id === planId);
            return type ? type.name : 'Unknown';
        }).join(', ');
    }
    if (member.current_membership_type_id) {
        const type = membershipTypes.find(mt => mt.id === member.current_membership_type_id);
        return type ? type.name : 'N/A';
    }
    return 'N/A';
  };
  
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-slate-800">
          <TableRow>
            <TableHead onClick={() => requestSort('name')} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">Name {getSortIndicator('name')}</TableHead>
            <TableHead onClick={() => requestSort('system_member_id')} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 hidden md:table-cell">Member ID {getSortIndicator('system_member_id')}</TableHead>
            <TableHead onClick={() => requestSort('email')} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 hidden lg:table-cell">Email {getSortIndicator('email')}</TableHead>
            <TableHead onClick={() => requestSort('current_membership_type_id')} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">Membership {getSortIndicator('current_membership_type_id')}</TableHead>
            <TableHead onClick={() => requestSort('status')} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">Status {getSortIndicator('status')}</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length > 0 ? members.map(member => (
            <TableRow key={member.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${member.status === 'Archived' ? 'opacity-60 bg-slate-100 dark:bg-slate-800' : ''}`}>
              <TableCell className="font-medium">
                <Link to={`/staff-portal/member/${member.system_member_id || member.id}`} className="hover:underline text-primary flex items-center">
                  {member.name} <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                </Link>
              </TableCell>
              <TableCell className="hidden md:table-cell">{member.system_member_id}</TableCell>
              <TableCell className="hidden lg:table-cell">{member.email}</TableCell>
              <TableCell>{getMembershipName(member)}</TableCell>
              <TableCell>
                <Badge 
                  variant={
                    member.status === 'Active' ? 'success' : 
                    (member.status === 'Archived' ? 'outline' : 
                    (member.status === 'Suspended' ? 'warning' : 'secondary'))
                  }
                >
                  {member.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Link to={`/staff-portal/member/${member.system_member_id || member.id}`}>
                  <Button variant="ghost" size="icon" title="View Profile">
                    <Eye className="h-4 w-4 text-blue-500" />
                  </Button>
                </Link>
                {member.status !== 'Archived' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Archive Member">
                        <Archive className="h-4 w-4 text-orange-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Archive Member?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Archiving {member.name} will hide them from active lists but preserve their data. Are you sure?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onArchiveMember(member.id)} className="bg-orange-500 hover:bg-orange-600">Archive</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                No members found matching your criteria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default MembersTable;


