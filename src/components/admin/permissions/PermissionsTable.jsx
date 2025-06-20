import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash2,
  AlertTriangle,
  CheckCircle,
  Lock,
  Unlock,
  MoreVertical,
  Copy,
  Download,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const PermissionsTable = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Define all available permissions with categories
  const permissionCategories = {
    'Member Management': [
      { id: 'view_members', label: 'View Members', description: 'View member profiles and information' },
      { id: 'edit_members', label: 'Edit Members', description: 'Modify member profiles and details' },
      { id: 'delete_members', label: 'Delete Members', description: 'Remove members from the system' },
      { id: 'add_members', label: 'Add Members', description: 'Create new member accounts' },
      { id: 'manage_memberships', label: 'Manage Memberships', description: 'Handle membership plans and subscriptions' },
    ],
    'Access Control': [
      { id: 'check_in_members', label: 'Check-in Members', description: 'Process member check-ins and attendance' },
      { id: 'access_admin_panel', label: 'Access Admin Panel', description: 'View and use administrative features' },
      { id: 'manage_staff', label: 'Manage Staff', description: 'Add, edit, and remove staff members' },
      { id: 'view_reports', label: 'View Reports', description: 'Access business reports and analytics' },
    ],
    'Financial': [
      { id: 'manage_payments', label: 'Manage Payments', description: 'Process payments and billing' },
      { id: 'view_financial_reports', label: 'Financial Reports', description: 'Access financial data and reports' },
      { id: 'manage_pricing', label: 'Manage Pricing', description: 'Set and modify membership prices' },
    ],
    'Operations': [
      { id: 'manage_classes', label: 'Manage Classes', description: 'Create and manage class schedules' },
      { id: 'manage_trainers', label: 'Manage Trainers', description: 'Handle trainer assignments and schedules' },
      { id: 'manage_inventory', label: 'Manage Inventory', description: 'Track and manage gym equipment and supplies' },
      { id: 'manage_communications', label: 'Communications', description: 'Send messages and notifications to members' },
    ],
    'System': [
      { id: 'system_settings', label: 'System Settings', description: 'Modify system-wide configurations' },
      { id: 'backup_restore', label: 'Backup & Restore', description: 'Perform system backups and restoration' },
      { id: 'audit_logs', label: 'Audit Logs', description: 'View system audit trails and logs' },
    ]
  };

  // Flatten permissions for easy access
  const allPermissions = Object.values(permissionCategories).flat();

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const fetchRolesAndPermissions = async () => {
    setIsLoading(true);
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('staff_roles')
        .select('*')
        .order('name');

      if (rolesError) throw rolesError;

      setRoles(rolesData || []);
      setPermissions(allPermissions);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: "Failed to load roles and permissions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setEditingPermissions(role.permissions || []);
    setIsEditing(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      const { error } = await supabase
        .from('staff_roles')
        .update({
          permissions: editingPermissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRole.id);

      if (error) throw error;

      // Update local state
      setRoles(prev => prev.map(role => 
        role.id === selectedRole.id 
          ? { ...role, permissions: editingPermissions }
          : role
      ));

      setIsEditing(false);
      setSelectedRole(null);
      
      toast({
        title: "Success",
        description: `Permissions updated for ${selectedRole.name}`,
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Error",
        description: "Failed to save permissions",
        variant: "destructive"
      });
    }
  };

  const togglePermission = (permissionId) => {
    setEditingPermissions(prev => {
      const newPermissions = Array.isArray(prev) ? [...prev] : [];
      const index = newPermissions.indexOf(permissionId);
      
      if (index > -1) {
        newPermissions.splice(index, 1);
      } else {
        newPermissions.push(permissionId);
      }
      
      return newPermissions;
    });
  };

  const hasPermission = (role, permissionId) => {
    const rolePermissions = Array.isArray(role.permissions) ? role.permissions : [];
    return rolePermissions.includes(permissionId);
  };

  const getPermissionCount = (role) => {
    const rolePermissions = Array.isArray(role.permissions) ? role.permissions : [];
    return rolePermissions.length;
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Shield className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p>Loading permissions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Permissions Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage permissions for staff roles across all system functions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
              <TabsTrigger value="details">Detailed View</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              <div className="grid gap-4">
                {filteredRoles.map((role) => (
                  <Card key={role.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {role.name}
                              {['admin', 'manager'].includes(role.id) && (
                                <Badge variant="secondary">System</Badge>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {role.description || 'No description provided'}
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {getPermissionCount(role)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              of {allPermissions.length} permissions
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRole(role)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Permissions
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(permissionCategories).map(([category, categoryPermissions]) => {
                            const hasAnyInCategory = categoryPermissions.some(p => hasPermission(role, p.id));
                            const allInCategory = categoryPermissions.every(p => hasPermission(role, p.id));
                            
                            if (!hasAnyInCategory) return null;
                            
                            return (
                              <Badge 
                                key={category} 
                                variant={allInCategory ? "default" : "outline"}
                                className="text-xs"
                              >
                                {category}
                                {allInCategory && <CheckCircle className="ml-1 h-3 w-3" />}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="matrix" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-64">Permission</TableHead>
                      {filteredRoles.map((role) => (
                        <TableHead key={role.id} className="text-center min-w-24">
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{role.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {getPermissionCount(role)} perms
                            </span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(permissionCategories).map(([category, categoryPermissions]) => (
                      <React.Fragment key={category}>
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={filteredRoles.length + 1} className="font-semibold">
                            {category}
                          </TableCell>
                        </TableRow>
                        {categoryPermissions.map((permission) => (
                          <TableRow key={permission.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{permission.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {permission.description}
                                </div>
                              </div>
                            </TableCell>
                            {filteredRoles.map((role) => (
                              <TableCell key={role.id} className="text-center">
                                {hasPermission(role, permission.id) ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {selectedRole && isEditing ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        Editing Permissions for {selectedRole.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleSavePermissions}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(permissionCategories).map(([category, categoryPermissions]) => (
                      <div key={category}>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          {category}
                        </h3>
                        <div className="grid gap-3 pl-6">
                          {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="flex items-start space-x-3">
                              <Checkbox
                                id={permission.id}
                                checked={editingPermissions.includes(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                                className="mt-1"
                              />
                              <div className="grid gap-1.5 leading-none">
                                <label
                                  htmlFor={permission.id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {permission.label}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Role to Edit</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a role from the overview tab to edit its permissions
                  </p>
                  <Button onClick={() => setActiveTab('overview')}>
                    Go to Overview
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsTable;
