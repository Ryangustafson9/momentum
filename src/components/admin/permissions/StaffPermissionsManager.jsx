/**
 * 🔐 STAFF PERMISSIONS MANAGER
 * Enhanced interface for managing staff permissions linked to staff plans
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Shield, Settings, Save, AlertTriangle, CheckCircle,
  Eye, Edit3, Trash2, Plus, Search, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  getAvailablePermissions,
  getAllStaffRoles,
  updateStaffRolePermissions,
  PERMISSION_CATEGORIES
} from '@/lib/services/permissionService';
import {
  createSampleStaffPlans,
  checkSampleStaffPlansExist
} from '@/lib/services/sampleDataService';

const StaffPermissionsManager = () => {
  const { toast } = useToast();
  const [staffRoles, setStaffRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [availablePermissions, setAvailablePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [creatingSamples, setCreatingSamples] = useState(false);
  const [samplesExist, setSamplesExist] = useState(false);

  // ==================== DATA FETCHING ====================

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roles, availablePerms, samplesCheck] = await Promise.all([
        getAllStaffRoles(),
        getAvailablePermissions(),
        checkSampleStaffPlansExist()
      ]);

      console.log('Fetched roles:', roles);
      console.log('Available permissions:', availablePerms);
      console.log('Samples exist:', samplesCheck);

      setStaffRoles(roles);
      setAvailablePermissions(availablePerms);
      setSamplesExist(samplesCheck.exist);

      if (roles.length > 0 && !selectedRole) {
        setSelectedRole(roles[0]);
        setPermissions(roles[0].permissions || {});
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load staff roles and permissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== SAMPLE DATA CREATION ====================

  const handleCreateSamplePlans = async () => {
    try {
      setCreatingSamples(true);

      const result = await createSampleStaffPlans();

      if (result.created.length > 0) {
        toast({
          title: "Success",
          description: `Created ${result.created.length} sample staff plans with roles`,
        });

        // Refresh data
        await fetchData();
      }

      if (result.errors.length > 0) {
        toast({
          title: "Partial Success",
          description: `Created some plans but encountered ${result.errors.length} errors`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error creating sample plans:', error);
      toast({
        title: "Error",
        description: "Failed to create sample staff plans",
        variant: "destructive"
      });
    } finally {
      setCreatingSamples(false);
    }
  };

  // ==================== HANDLERS ====================

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setPermissions(role.permissions || {});
  };

  const handlePermissionToggle = (permissionKey) => {
    setPermissions(prev => ({
      ...prev,
      [permissionKey]: !prev[permissionKey]
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    
    try {
      setSaving(true);
      await updateStaffRolePermissions(selectedRole.id, permissions);
      
      // Update local state
      setStaffRoles(prev => 
        prev.map(role => 
          role.id === selectedRole.id 
            ? { ...role, permissions }
            : role
        )
      );
      
      toast({
        title: "Success",
        description: `Permissions updated for ${selectedRole.name}`,
        className: "bg-green-500 text-white"
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Error",
        description: "Failed to save permissions",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // ==================== FILTERING ====================

  const getFilteredPermissions = () => {
    let filtered = availablePermissions;
    
    if (selectedCategory !== 'all') {
      filtered = { [selectedCategory]: availablePermissions[selectedCategory] || [] };
    }
    
    if (searchTerm) {
      const searchFiltered = {};
      Object.entries(filtered).forEach(([category, perms]) => {
        const matchingPerms = perms.filter(perm => 
          perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (matchingPerms.length > 0) {
          searchFiltered[category] = matchingPerms;
        }
      });
      filtered = searchFiltered;
    }
    
    return filtered;
  };

  // ==================== RENDER HELPERS ====================

  const renderStaffRolesList = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Staff Plans
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {staffRoles.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Staff Plans Found</h3>
            <p className="text-sm text-gray-600 mb-6">
              Create staff plans to manage their permissions here.
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleCreateSamplePlans}
                disabled={creatingSamples}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {creatingSamples ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating Sample Plans...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Sample Staff Plans
                  </>
                )}
              </Button>              <Button
                onClick={() => window.open('/staff-portal/memberships', '_blank')}
                variant="outline"
                className="w-full text-sm"
              >
                Or Go to Plan Management
              </Button>
            </div>
          </div>
        ) : (
          staffRoles.map((role) => (
            <motion.div
              key={role.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={selectedRole?.id === role.id ? "default" : "outline"}
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => handleRoleSelect(role)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{role.name}</span>
                  <span className="text-xs text-gray-500 mt-1">
                    {role.description || role.staff_plan_description}
                  </span>
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {Object.values(role.permissions || {}).filter(Boolean).length} permissions
                    </Badge>
                    {role.is_staff_plan && (
                      <Badge variant="outline" className="text-xs ml-2">
                        Staff Plan
                      </Badge>
                    )}
                  </div>
                </div>
              </Button>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );

  const renderPermissionCategory = (categoryName, categoryPerms) => {
    const categoryInfo = PERMISSION_CATEGORIES[categoryName];
    
    return (
      <Card key={categoryName} className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <div className={`w-3 h-3 rounded-full bg-${categoryInfo?.color || 'gray'}-500 mr-3`} />
            {categoryName}
            <Badge variant="outline" className="ml-2">
              {categoryPerms.length} permissions
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">{categoryInfo?.description}</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {categoryPerms.map((permission) => (
              <div
                key={permission.key}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={permission.key} className="font-medium cursor-pointer">
                      {permission.name}
                    </Label>
                    <Badge 
                      variant={permission.level === 'high' ? 'destructive' : 
                              permission.level === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {permission.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                </div>
                <Switch
                  id={permission.key}
                  checked={permissions[permission.key] || false}
                  onCheckedChange={() => handlePermissionToggle(permission.key)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ==================== MAIN RENDER ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const filteredPermissions = getFilteredPermissions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Permissions Manager</h2>
          <p className="text-gray-600">Manage permissions for staff plans created in Plan Management</p>
        </div>
        <Button
          onClick={handleSavePermissions}
          disabled={!selectedRole || saving}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Permissions
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Staff Roles List */}
        <div className="lg:col-span-1">
          {renderStaffRolesList()}
        </div>

        {/* Permissions Management */}
        <div className="lg:col-span-3">
          {selectedRole ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Permissions for {selectedRole.name}
                </CardTitle>
                
                {/* Search and Filter */}
                <div className="flex space-x-4 mt-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search permissions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Categories</option>
                    {Object.keys(PERMISSION_CATEGORIES).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(filteredPermissions).map(([categoryName, categoryPerms]) =>
                    renderPermissionCategory(categoryName, categoryPerms)
                  )}
                  
                  {Object.keys(filteredPermissions).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No permissions found matching your search criteria.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a staff plan to manage permissions</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffPermissionsManager;
