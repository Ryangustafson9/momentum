import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionsService } from '@/services/permissionsService';
import { supabase } from '@/lib/supabaseClient';
import { 
  Shield, 
  Users, 
  UserPlus, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';

// Permission categories for organization
const PERMISSION_CATEGORIES = {
  'Member Management': [
    { id: 'view_members', label: 'View Members', description: 'View member profiles and information' },
    { id: 'edit_members', label: 'Edit Members', description: 'Modify member profiles and details' },
    { id: 'add_members', label: 'Add Members', description: 'Create new member accounts' },
    { id: 'delete_members', label: 'Delete Members', description: 'Remove members from the system' },
    { id: 'manage_memberships', label: 'Manage Memberships', description: 'Handle membership plans and subscriptions' },
  ],
  'Staff Management': [
    { id: 'view_staff', label: 'View Staff', description: 'View staff profiles and information' },
    { id: 'manage_staff', label: 'Manage Staff', description: 'Add, edit, and remove staff members' },
    { id: 'assign_roles', label: 'Assign Roles', description: 'Assign and modify staff roles' },
  ],
  'Class Management': [
    { id: 'view_classes', label: 'View Classes', description: 'View class schedules and information' },
    { id: 'manage_classes', label: 'Manage Classes', description: 'Create, edit, and delete classes' },
    { id: 'manage_schedule', label: 'Manage Schedule', description: 'Modify class schedules and timing' },
  ],
  'Billing & Payments': [
    { id: 'view_billing', label: 'View Billing', description: 'View billing information and history' },
    { id: 'manage_billing', label: 'Manage Billing', description: 'Process payments and handle billing' },
    { id: 'process_payments', label: 'Process Payments', description: 'Handle payment processing' },
  ],
  'Reports & Analytics': [
    { id: 'view_reports', label: 'View Reports', description: 'Access reports and analytics' },
    { id: 'export_data', label: 'Export Data', description: 'Export data and generate reports' },
  ],
  'System Administration': [
    { id: 'manage_settings', label: 'Manage Settings', description: 'Modify system-wide settings' },
    { id: 'system_admin', label: 'System Admin', description: 'Full system administration access' },
  ]
};

/**
 * 🔐 Comprehensive Staff Permissions Management
 * 
 * This component consolidates:
 * 1. Staff Role Management (create/edit roles)
 * 2. Permission Matrix (assign permissions to roles)
 * 3. User Role Assignment (assign roles to users)
 */
const StaffPermissionsManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  // Form state
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: {}
  });

  // Assignment state
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRoleForAssignment, setSelectedRoleForAssignment] = useState('');

  // Fetch data
  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      const fetchedRoles = await PermissionsService.getAllStaffRoles();
      setRoles(fetchedRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: "Failed to load staff roles",
        variant: "destructive"
      });
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          staff_role_id,
          staff_roles (
            id,
            name,
            permissions
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setUsersLoading(false);
    }
  };

  // Role management functions
  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      description: '',
      permissions: {}
    });
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name || '',
      description: role.description || '',
      permissions: role.permissions || {}
    });
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const roleData = {
        ...roleForm,
        ...(editingRole && { id: editingRole.id })
      };

      const { data, error } = await supabase
        .from('staff_roles')
        .upsert(roleData)
        .select()
        .single();

      if (error) throw error;

      await fetchRoles();
      setEditingRole(null);
      setRoleForm({ name: '', description: '', permissions: {} });

      toast({
        title: "Success",
        description: `Staff role ${editingRole ? 'updated' : 'created'} successfully`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving role:', error);
      toast({
        title: "Error",
        description: "Failed to save staff role",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('staff_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      await fetchRoles();
      toast({
        title: "Success",
        description: "Staff role deleted successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete staff role",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Assignment functions
  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleForAssignment) {
      toast({
        title: "Validation Error",
        description: "Please select both a user and a role",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await PermissionsService.assignStaffRole(selectedUser, selectedRoleForAssignment);
      
      await fetchUsers();
      setSelectedUser('');
      setSelectedRoleForAssignment('');
      
      toast({
        title: "Success",
        description: "Staff role assigned successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign staff role",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (userId) => {
    try {
      setLoading(true);
      await PermissionsService.removeStaffRole(userId);
      
      await fetchUsers();
      
      toast({
        title: "Success",
        description: "Staff role removed successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Failed to remove staff role",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Permission utilities
  const getPermissionCount = (permissions) => {
    if (!permissions) return 0;
    if (typeof permissions === 'object') {
      return Object.values(permissions).filter(Boolean).length;
    }
    return 0;
  };

  const handlePermissionChange = (permissionId, checked) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionId]: checked
      }
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Staff Permissions Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Manage Roles
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Assign Roles
              </TabsTrigger>
              <TabsTrigger value="matrix" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permission Matrix
              </TabsTrigger>
            </TabsList>

            {/* Role Management Tab */}
            <TabsContent value="roles" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Staff Roles</h3>
                <Button onClick={handleCreateRole}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </div>

              {/* Role Form */}
              {(editingRole !== null || roleForm.name) && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {editingRole ? 'Edit Role' : 'Create New Role'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="roleName">Role Name</Label>
                        <Input
                          id="roleName"
                          value={roleForm.name}
                          onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Front Desk Staff"
                        />
                      </div>
                      <div>
                        <Label htmlFor="roleDescription">Description</Label>
                        <Input
                          id="roleDescription"
                          value={roleForm.description}
                          onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description of this role"
                        />
                      </div>
                    </div>

                    {/* Permissions */}
                    <div>
                      <Label>Permissions</Label>
                      <div className="mt-2 space-y-4">
                        {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                          <div key={category} className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">{category}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {permissions.map(permission => (
                                <div key={permission.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={permission.id}
                                    checked={roleForm.permissions[permission.id] || false}
                                    onCheckedChange={(checked) => handlePermissionChange(permission.id, checked)}
                                  />
                                  <Label htmlFor={permission.id} className="text-sm">
                                    {permission.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSaveRole} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Role'}
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setEditingRole(null);
                        setRoleForm({ name: '', description: '', permissions: {} });
                      }}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Roles List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rolesLoading ? (
                  <div className="col-span-full flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  roles.map(role => (
                    <Card key={role.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{role.name}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteRole(role.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                        <Badge variant="outline">
                          {getPermissionCount(role.permissions)} permissions
                        </Badge>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Role Assignment Tab */}
            <TabsContent value="assignments" className="space-y-6">
              {/* Assignment Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Assign Staff Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>User</Label>
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user..." />
                        </SelectTrigger>
                        <SelectContent>
                          {usersLoading ? (
                            <SelectItem value="" disabled>Loading users...</SelectItem>
                          ) : (
                            users.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.first_name} {user.last_name} ({user.email})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Staff Role</Label>
                      <Select value={selectedRoleForAssignment} onValueChange={setSelectedRoleForAssignment}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role..." />
                        </SelectTrigger>
                        <SelectContent>
                          {rolesLoading ? (
                            <SelectItem value="" disabled>Loading roles...</SelectItem>
                          ) : (
                            roles.map(role => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name} ({getPermissionCount(role.permissions)} permissions)
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button 
                        onClick={handleAssignRole}
                        disabled={loading || !selectedUser || !selectedRoleForAssignment}
                        className="w-full"
                      >
                        {loading ? "Assigning..." : "Assign Role"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Current Staff Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {users
                        .filter(user => user.staff_role_id)
                        .map(user => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="font-medium">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                              </div>
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                {user.staff_roles?.name || 'Unknown Role'}
                              </Badge>
                              <Badge variant="outline">
                                {getPermissionCount(user.staff_roles?.permissions)} permissions
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveRole(user.id)}
                              disabled={loading}
                            >
                              Remove Role
                            </Button>
                          </motion.div>
                        ))}
                      
                      {users.filter(user => user.staff_role_id).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Shield className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <p>No staff role assignments yet.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Permission Matrix Tab */}
            <TabsContent value="matrix" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Permission Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left p-2 border-b">Permission</th>
                          {roles.map(role => (
                            <th key={role.id} className="text-center p-2 border-b">
                              {role.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                          <React.Fragment key={category}>
                            <tr>
                              <td colSpan={roles.length + 1} className="font-semibold p-2 bg-gray-50">
                                {category}
                              </td>
                            </tr>
                            {permissions.map(permission => (
                              <tr key={permission.id}>
                                <td className="p-2 border-b">
                                  <div>
                                    <div className="font-medium">{permission.label}</div>
                                    <div className="text-sm text-gray-600">{permission.description}</div>
                                  </div>
                                </td>
                                {roles.map(role => (
                                  <td key={role.id} className="text-center p-2 border-b">
                                    {role.permissions?.[permission.id] ? (
                                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                                    ) : (
                                      <X className="h-5 w-5 text-gray-300 mx-auto" />
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffPermissionsManagement;
