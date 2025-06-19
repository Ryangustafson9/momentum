import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import RoleFormDialog from '@/components/admin/settings/RoleFormDialog';
import UserRolesList from '@/components/admin/settings/UserRolesList';
import UserRolesSettingsTabHeader from '@/components/admin/settings/UserRolesSettingsTabHeader';
import AdminPanelSettingsTab from '@/components/admin/settings/tabs/AdminPanelSettingsTab';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Shield, PlusCircle, ShieldCheck, Loader2 } from 'lucide-react';

// Loading Spinner Component
const LoadingSpinner = ({ size = "default", text = "Loading..." }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8",
    large: "h-12 w-12"
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};

const EmptyRolesState = ({ onAddNewRole, isSubmitting }) => (
  <div className="text-center py-10">
    <ShieldCheck className="mx-auto h-20 w-20 text-slate-300 dark:text-slate-600" />
    <p className="mt-5 text-slate-500 dark:text-slate-400">No staff roles or plans defined yet.</p>
    <Button 
      onClick={onAddNewRole} 
      className="mt-5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground" 
      disabled={isSubmitting}
    >
      <PlusCircle className="mr-2 h-4 w-4" /> Create First Staff Role/Plan
    </Button>
  </div>
);

// Staff Roles Service Functions
const staffRolesService = {
  async getStaffRoles() {
    try {
      const { data, error } = await supabase
        .from('staff_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching staff roles:', error);
      return [];
    }
  },

  async saveStaffRole(roleData) {
    try {
      const { data, error } = await supabase
        .from('staff_roles')
        .upsert(roleData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving staff role:', error);
      throw error;
    }
  },

  async deleteStaffRole(roleId) {
    try {
      const { error } = await supabase
        .from('staff_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting staff role:', error);
      throw error;
    }
  },

  getAllPermissions() {
    return [
      'manage_members',
      'manage_staff',
      'manage_classes',
      'manage_billing',
      'manage_settings',
      'view_reports',
      'check_in_members',
      'manage_inventory',
      'manage_payments',
      'access_admin_panel'
    ];
  }
};

const StaffRolesPermissionsTabContent = () => {
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
      const fetchedRoles = await staffRolesService.getStaffRoles();
      setRoles(Array.isArray(fetchedRoles) ? fetchedRoles : []);
      setAllPermissionsList(staffRolesService.getAllPermissions()); 
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({ 
        title: "Error", 
        description: "Could not fetch staff roles. Please try refreshing.", 
        variant: "destructive" 
      });
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
      const roleId = roleData.id || `${roleData.name.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')}_${Date.now()}`;
      const finalRoleData = { 
        ...roleData, 
        id: roleId, 
        permissions: roleData.permissions || [],
        updated_at: new Date().toISOString()
      };

      if (editingRole) {
        // Update existing role
        await staffRolesService.saveStaffRole(finalRoleData);
        setRoles(prev => prev.map(r => r.id === editingRole.id ? finalRoleData : r));
      } else {
        // Create new role
        finalRoleData.created_at = new Date().toISOString();
        const savedRole = await staffRolesService.saveStaffRole(finalRoleData);
        setRoles(prev => [savedRole, ...prev]);
      }
      
      toast({ 
        title: editingRole ? "Staff Role/Plan Updated" : "Staff Role/Plan Created", 
        description: `Staff Role/Plan "${finalRoleData.name}" has been ${editingRole ? 'updated' : 'created'}.`, 
        className: editingRole ? "bg-blue-500 text-white dark:bg-blue-600" : "bg-green-500 text-white dark:bg-green-600" 
      });
      
      setIsFormOpen(false);
      setEditingRole(null);
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
        toast({ 
          title: "Action Forbidden", 
          description: "Default system staff roles/plans cannot be deleted.", 
          variant: "destructive" 
        });
        return;
    }
    
    setIsSubmitting(true); 
    try {
      await staffRolesService.deleteStaffRole(roleIdToDelete);
      setRoles(prev => prev.filter(r => r.id !== roleIdToDelete));
      
      toast({ 
        title: "Staff Role/Plan Deleted", 
        description: `Staff role/plan "${roleToDelete.name}" has been deleted.`, 
        variant: "destructive" 
      });
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
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="large" text="Loading Staff Roles & Permissions..." />
      </div>
    );
  }

  return (
    <Card className="shadow-xl bg-background/80 dark:bg-slate-800/80 backdrop-blur-sm border-border">
      <UserRolesSettingsTabHeader onAddRole={handleAddNewRole} />
      <CardContent className="space-y-4 pt-5 p-3 sm:p-5">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <LoadingSpinner text="Loading roles..." />
          </div>
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
      <RoleFormDialog
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        editingRole={editingRole}
        setEditingRole={setEditingRole}
        onSave={handleSaveRole}
        allPermissions={allPermissionsList}
        isSubmitting={isSubmitting}
      />
    </Card>
  );
};

const AdminPanelPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-2 sm:px-4 py-6"
    >
      <Card className="bg-card shadow-xl rounded-lg">
        <CardHeader className="border-b dark:border-slate-700">
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <SlidersHorizontal className="mr-3 h-6 w-6" /> Admin Panel
          </CardTitle>
          <CardDescription>
            Manage system-wide configurations and staff permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="adminSettings" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border-b dark:border-slate-700">
              <TabsTrigger 
                value="adminSettings" 
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" /> General Admin Settings
              </TabsTrigger>
              <TabsTrigger 
                value="staffRoles" 
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <Shield className="mr-2 h-4 w-4" /> Staff Roles & Permissions
              </TabsTrigger>
            </TabsList>
            <TabsContent value="adminSettings" className="p-4 md:p-6">
              <AdminPanelSettingsTab />
            </TabsContent>
            <TabsContent value="staffRoles" className="p-4 md:p-6">
              <StaffRolesPermissionsTabContent />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminPanelPage;


