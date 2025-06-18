
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast.js';
import { apiService, dataService } from '@/services/apiService';
import LoadingSpinner from '@/components/LoadingSpinner';
import RoleFormDialog from '@/components/admin/settings/RoleFormDialog';
import UserRolesList from '@/components/admin/settings/UserRolesList';
import UserRolesSettingsTabHeader from '@/components/admin/settings/UserRolesSettingsTabHeader'; 
import { motion } from 'framer-motion';
import { Users, PlusCircle, ShieldCheck } from 'lucide-react';

const EmptyRolesState = ({ onAddNewRole, isSubmitting }) => (
  <div className="text-center py-10">
    <ShieldCheck className="mx-auto h-20 w-20 text-slate-300 dark:text-slate-600" />
    <p className="mt-5 text-slate-500 dark:text-slate-400">No staff roles or plans defined yet.</p>
    <Button onClick={onAddNewRole} className="mt-5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground" disabled={isSubmitting}>
      <PlusCircle className="mr-2 h-4 w-4" /> Create First Staff Role/Plan
    </Button>
  </div>
);

const StaffRolesPermissionsPage = () => {
  const [roles, setRoles] = useState([]);
  const [allPermissionsList, setAllPermissionsList] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedRoles = await dataService.getStaffRoles();
      setRoles(Array.isArray(fetchedRoles) ? fetchedRoles : []);
      setAllPermissionsList(dataService.getAllPermissions()); 
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({ title: "Error", description: "Could not fetch staff roles. Please try refreshing.", variant: "destructive" });
      setRoles([]); 
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNewRole = () => {
    setEditingRole(null);
    setIsFormOpen(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setIsFormOpen(true);
  };

  const handleSaveRole = async (roleData) => {
    setIsSubmitting(true);
    try {
      let updatedRoles;
      const roleId = roleData.id || roleData.name.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_') + `_${Date.now()}`;
      const finalRoleData = { ...roleData, id: roleId, permissions: roleData.permissions || [] };

      if (editingRole) {
        updatedRoles = roles.map(r => r.id === editingRole.id ? finalRoleData : r);
      } else {
        updatedRoles = [...roles, finalRoleData];
      }
      
      await dataService.saveStaffRoles(updatedRoles);
      
      toast({ 
        title: editingRole ? "Staff Role/Plan Updated" : "Staff Role/Plan Created", 
        description: `Staff Role/Plan "${finalRoleData.name}" has been ${editingRole ? 'updated' : 'created'}.`, 
        className: editingRole ? "bg-blue-500 text-white dark:bg-blue-600" : "bg-green-500 text-white dark:bg-green-600" 
      });
      
      setIsFormOpen(false);
      setEditingRole(null);
      fetchData();
    } catch (error) {
      console.error("Error saving role:", error);
      let errorMessage = "Could not save staff role/plan.";
      if (error.message && error.message.toLowerCase().includes("row level security")) {
        errorMessage = `Failed to save staff role/plan "${roleData.name}". This is likely due to Row Level Security (RLS) policies. Please check permissions in your Supabase dashboard.`;
      } else if (error.message) {
        errorMessage = `Could not save staff role/plan: ${error.message}`;
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteRole = async (roleIdToDelete) => {
    const roleToDelete = roles.find(r => r.id === roleIdToDelete);
    if (!roleToDelete) return;

    const defaultSystemRoles = ['admin', 'manager', 'front_desk', 'trainer', 'instructor'];
    if (defaultSystemRoles.includes(roleIdToDelete)) {
        toast({ title: "Action Forbidden", description: "Default system staff roles/plans cannot be deleted.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true); 
    try {
      const updatedRoles = roles.filter(r => r.id !== roleIdToDelete);
      await dataService.saveStaffRoles(updatedRoles); 
      
      toast({ title: "Staff Role/Plan Deleted", description: `Staff role/plan "${roleToDelete.name}" has been deleted.`, variant: "destructive" });
      fetchData(); 
    } catch (error) {
      console.error("Error deleting role:", error);
      let errorMessage = "Could not delete staff role/plan.";
      if (error.message && error.message.toLowerCase().includes("row level security")) {
        errorMessage = `Failed to delete staff role/plan "${roleToDelete.name}" due to permission issues. Please check Row Level Security policies.`;
      } else if (error.message) {
        errorMessage = `Could not delete staff role/plan: ${error.message}`;
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !isFormOpen) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="large" text="Loading Staff Roles & Permissions..." />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-2 sm:px-4 py-6"
    >
      <Card className="shadow-xl bg-background/80 dark:bg-slate-800/80 backdrop-blur-sm border-border">
        <UserRolesSettingsTabHeader onAddRole={handleAddNewRole} />
        <CardContent className="space-y-4 pt-5 p-3 sm:p-5">
          {isLoading ? (
               <div className="flex justify-center items-center py-10"> <LoadingSpinner text="Loading roles..." /> </div>
          ) : roles.length === 0 ? (
            <EmptyRolesState onAddNewRole={handleAddNewRole} isSubmitting={isSubmitting} />
          ) : (
            <UserRolesList 
              roles={roles} 
              allPermissionsList={allPermissionsList} 
              onEditRole={handleEditRole} 
              onDeleteRole={handleDeleteRole} 
              isSubmitting={isSubmitting} 
            />
          )}
        </CardContent>
      </Card>

      <RoleFormDialog
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        editingRole={editingRole}
        setEditingRole={setEditingRole}
        onSave={handleSaveRole}
        allPermissions={allPermissionsList}
        isSubmitting={isSubmitting}
      />
    </motion.div>
  );
};

export default StaffRolesPermissionsPage;


