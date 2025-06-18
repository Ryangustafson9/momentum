
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';
import { PlusCircle, Edit, Trash2, ShieldCheck, Users } from 'lucide-react';
import RoleFormDialog from '@/components/admin/settings/RoleFormDialog.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.jsx";

const UserRolesSettingsTabContent = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [allPermissions, setAllPermissions] = useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  const fetchRolesAndPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedRoles = await dataService.getStaffRoles();
      const fetchedPermissions = await dataService.getAllPermissions();
      setRoles(Array.isArray(fetchedRoles) ? fetchedRoles : []);
      setAllPermissions(typeof fetchedPermissions === 'object' && fetchedPermissions !== null ? fetchedPermissions : {});
    } catch (error) {
      console.error("Failed to load roles or permissions:", error);
      toast({
        title: "Error",
        description: "Could not load roles and permissions data. Please try again.",
        variant: "destructive",
      });
      setRoles([]);
      setAllPermissions({});
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, [fetchRolesAndPermissions]);

  const handleAddRole = () => {
    setEditingRole(null);
    setIsDialogOpen(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setIsDialogOpen(true);
  };

  const handleDeleteRoleAttempt = (role) => {
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    setIsLoading(true);
    try {
      await dataService.deleteStaffRole(roleToDelete.id);
      toast({
        title: "Role Deleted",
        description: `Role "${roleToDelete.name}" has been successfully deleted.`,
        className: "bg-green-500 text-white",
      });
      fetchRolesAndPermissions(); 
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error Deleting Role",
        description: error.message || "Could not delete the role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };


  const handleSaveRole = async (roleData) => {
    setIsLoading(true);
    try {
      if (editingRole) {
        await dataService.updateStaffRole(editingRole.id, roleData);
        toast({ title: "Role Updated", description: `Role "${roleData.name}" has been updated.`, className: "bg-green-500 text-white" });
      } else {
        await dataService.addStaffRole({ ...roleData, id: roleData.name.toLowerCase().replace(/\s+/g, '-') });
        toast({ title: "Role Added", description: `Role "${roleData.name}" has been added.`, className: "bg-green-500 text-white" });
      }
      fetchRolesAndPermissions();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving role:", error);
      toast({ title: "Error Saving Role", description: error.message || "Could not save the role.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && roles.length === 0) {
    return <div>Loading user roles...</div>;
  }

  return (
    <>
      <Card className="shadow-lg border-none">
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle>Staff Roles & Permissions</CardTitle>
            <CardDescription>Manage staff roles and their access permissions within the application.</CardDescription>
          </div>
          <Button onClick={handleAddRole} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Role
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {roles.length === 0 && !isLoading && (
            <div className="text-center py-10">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No roles found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new staff role.</p>
            </div>
          )}
          <div className="space-y-4">
            {roles.map((role) => (
              <Card key={role.id} className="bg-slate-50 dark:bg-slate-800/70">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
                    {role.name}
                  </CardTitle>
                  <CardDescription>{role.description || 'No description provided.'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-sm mb-1 text-gray-700 dark:text-gray-300">Permissions:</h4>
                  {Object.keys(role.permissions || {}).length > 0 ? (
                    <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 dark:text-gray-400">
                      {Object.entries(role.permissions).flatMap(([category, perms]) => 
                        Object.entries(perms)
                          .filter(([, enabled]) => enabled)
                          .map(([permKey]) => {
                            const permDisplay = allPermissions[category]?.find(p => p.key === permKey)?.label || permKey;
                            return <li key={`${category}-${permKey}`}>{permDisplay}</li>;
                          })
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">No specific permissions assigned. Role has default access.</p>
                  )}
                </CardContent>
                <CardContent className="border-t pt-4 flex justify-end space-x-2">
                   <Button variant="outline" size="sm" onClick={() => handleEditRole(role)}>
                    <Edit className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button variant="destructiveOutline" size="sm" onClick={() => handleDeleteRoleAttempt(role)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {isDialogOpen && (
        <RoleFormDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSaveRole}
          role={editingRole}
          allPermissions={allPermissions}
          isLoading={isLoading}
        />
      )}

      {isDeleteDialogOpen && roleToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete the role "{roleToDelete.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Deleting this role may affect users currently assigned to it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteRole} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
                {isLoading ? "Deleting..." : "Delete Role"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default UserRolesSettingsTabContent;


