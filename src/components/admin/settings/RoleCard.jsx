
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, LockKeyhole } from 'lucide-react';

const RoleCard = ({ role, allPermissionsList, onEditRole, onDeleteRole, isSubmitting }) => {
  const isDefault = ['admin', 'manager', 'front_desk', 'trainer', 'instructor'].includes(role.id);
  const rolePermissions = Array.isArray(role.permissions) ? role.permissions : [];

  return (
    <Card className="bg-slate-50 dark:bg-slate-800/60 shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <CardTitle className="text-lg font-semibold text-primary">{role.name}</CardTitle>
            {isDefault && <Badge variant="outline" className="ml-2 text-xs border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/30">System Default</Badge>}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-primary" onClick={() => onEditRole(role)} disabled={isSubmitting}>
              <Edit2 className="h-4 w-4" />
            </Button>
            {!isDefault && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => onDeleteRole(role.id)} disabled={isSubmitting}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400 pt-1">{role.description}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-300">Permissions ({rolePermissions.length}/{allPermissionsList.length}):</p>
        {rolePermissions.length > 0 ? (
          <div className="max-h-24 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
            {rolePermissions.map(permissionId => {
              const perm = allPermissionsList.find(p => p.id === permissionId);
              return (
                <div key={permissionId} className="flex items-center text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-sm">
                  <LockKeyhole className="h-3 w-3 mr-1.5 text-emerald-500"/>
                  {perm ? perm.label : permissionId}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No specific permissions assigned.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleCard;



