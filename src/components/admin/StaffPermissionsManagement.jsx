import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getAvailablePermissions } from '@/lib/services/permissionService';
import { supabase } from '@/lib/supabaseClient';
import { 
  Shield, 
  Save, 
  CheckCircle,
  AlertCircle,
  Briefcase,
  Settings 
} from 'lucide-react';
import { motion } from 'framer-motion';

// Get permission categories from the comprehensive permission service
const PERMISSION_CATEGORIES = (() => {
  const permissions = getAvailablePermissions();
  const formatted = {};

  Object.entries(permissions).forEach(([category, perms]) => {
    formatted[category] = perms.map(perm => ({
      id: perm.key,
      label: perm.name,
      description: perm.description
    }));
  });

  return formatted;
})();

/**
 * 🔐 Staff Plans Permission Management
 * 
 * This component allows admins to:
 * 1. View all existing staff plans (from membership_types where category='Staff')
 * 2. Toggle permissions for each staff plan
 * 3. Save permission changes
 */
const StaffPermissionsManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  // State management
  const [staffPlans, setStaffPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch staff plans from membership_types
  const fetchStaffPlans = async () => {
    try {
      setLoading(true);
      
      const { data: plans, error } = await supabase
        .from('membership_types')
        .select('*')
        .eq('category', 'Staff')
        .order('name');

      if (error) throw error;

      
      // Initialize permissions if they don't exist
      const plansWithPermissions = plans.map(plan => ({
        ...plan,
        permissions: plan.permissions || {}
      }));

      setStaffPlans(plansWithPermissions);
      
      // Auto-select the first plan if available
      if (plansWithPermissions.length > 0) {
        setSelectedPlan(plansWithPermissions[0]);
      }
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to load staff plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchStaffPlans();
  }, []);

  // Add keyboard shortcut for saving (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 's' && selectedPlan && !saving) {
        event.preventDefault();
        saveStaffPlanPermissions();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedPlan, saving]);
  // Toggle all permissions in a category
  const toggleCategoryPermissions = (categoryName, enabled) => {
    if (!selectedPlan) return;
    
    const categoryPermissions = PERMISSION_CATEGORIES[categoryName];
    const updates = {};
    
    categoryPermissions.forEach(permission => {
      updates[permission.id] = enabled;
    });
    
    setSelectedPlan(currentPlan => ({
      ...currentPlan,
      permissions: {
        ...currentPlan.permissions,
        ...updates
      }
    }));
    
    // Also update the plan in the staffPlans array
    setStaffPlans(currentPlans => 
      currentPlans.map(plan => 
        plan.id === selectedPlan.id 
          ? {
              ...plan,
              permissions: {
                ...plan.permissions,
                ...updates
              }
            }
          : plan
      )
    );
  };

  // Check if all permissions in a category are enabled
  const areCategoryPermissionsEnabled = (categoryName) => {
    if (!selectedPlan) return false;
    const categoryPermissions = PERMISSION_CATEGORIES[categoryName];
    return categoryPermissions.every(permission => 
      selectedPlan.permissions[permission.id] || false
    );
  };

  // Toggle a permission for the selected staff plan
  const togglePermission = (permissionKey, enabled) => {
    if (!selectedPlan) return;
    
    setSelectedPlan(currentPlan => ({
      ...currentPlan,
      permissions: {
        ...currentPlan.permissions,
        [permissionKey]: enabled
      }
    }));
    
    // Also update the plan in the staffPlans array
    setStaffPlans(currentPlans => 
      currentPlans.map(plan => 
        plan.id === selectedPlan.id 
          ? {
              ...plan,
              permissions: {
                ...plan.permissions,
                [permissionKey]: enabled
              }
            }
          : plan
      )
    );
  };  // Save permissions for the selected staff plan
  const saveStaffPlanPermissions = async () => {
    if (!selectedPlan) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('membership_types')
        .update({ 
          permissions: selectedPlan.permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPlan.id);

      if (error) throw error;

      // Update the local state to reflect the saved changes
      setStaffPlans(currentPlans => 
        currentPlans.map(plan => 
          plan.id === selectedPlan.id 
            ? { ...plan, permissions: selectedPlan.permissions }
            : plan
        )
      );

      const permissionCount = getPermissionCount(selectedPlan.permissions);
      
      toast({
        title: "✅ Permissions Saved",
        description: `${permissionCount} permissions updated for ${selectedPlan.name}`,
        variant: "default"
      });

    } catch (error) {
      
      toast({
        title: "❌ Save Failed",
        description: "Failed to save permissions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Get permission count for a plan
  const getPermissionCount = (permissions) => {
    if (!permissions || typeof permissions !== 'object') return 0;
    return Object.values(permissions).filter(Boolean).length;
  };  // Render permission checkbox
  const PermissionCheckbox = ({ permission }) => {
    if (!selectedPlan) return null;
    
    const isChecked = selectedPlan.permissions[permission.id] || false;
    
    return (
      <div className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
        isChecked 
          ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' 
          : 'border-gray-200 hover:bg-gray-50'
      }`}>
        <Checkbox
          id={`${selectedPlan.id}-${permission.id}`}
          checked={isChecked}
          onCheckedChange={(checked) => togglePermission(permission.id, checked)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <label 
            htmlFor={`${selectedPlan.id}-${permission.id}`}
            className={`text-sm font-medium cursor-pointer transition-colors ${
              isChecked ? 'text-blue-900' : 'text-gray-900'
            }`}
          >
            {permission.label}
          </label>
          <p className={`text-xs mt-1 transition-colors ${
            isChecked ? 'text-blue-700' : 'text-gray-500'
          }`}>
            {permission.description}
          </p>
        </div>
        {isChecked && (
          <CheckCircle className="h-4 w-4 text-blue-600 mt-1" />
        )}
      </div>
    );
  };
  // Render staff plan list item
  const StaffPlanListItem = ({ plan }) => {
    const isSelected = selectedPlan?.id === plan.id;
    const permissionCount = getPermissionCount(plan.permissions);
    const totalPermissions = Object.values(PERMISSION_CATEGORIES).flat().length;
    
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200' 
            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25 hover:shadow-sm'
        }`}
        onClick={() => setSelectedPlan(plan)}
      >
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className={`h-4 w-4 transition-colors ${
            isSelected ? 'text-blue-600' : 'text-gray-500'
          }`} />
          <h3 className={`font-medium transition-colors ${
            isSelected ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {plan.name}
          </h3>
        </div>
        
        {plan.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{plan.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <Badge 
            variant={isSelected ? "default" : "secondary"} 
            className="text-xs"
          >
            {permissionCount} / {totalPermissions} permissions
          </Badge>
          
          {isSelected && (
            <div className="flex items-center gap-1 text-blue-600">
              <CheckCircle className="h-3 w-3" />
              <span className="text-xs font-medium">Selected</span>
            </div>
          )}
        </div>
        
        {/* Progress bar for permissions */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isSelected ? 'bg-blue-600' : 'bg-gray-400'
              }`}
              style={{ 
                width: `${totalPermissions > 0 ? (permissionCount / totalPermissions) * 100 : 0}%` 
              }}
            />
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff plans...</p>
        </div>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-6"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          Staff Plans & Permissions
        </h1>
        <p className="text-gray-600 mt-2">
          Manage permissions for each staff plan. Select a plan on the left to view and edit its permissions.
        </p>
      </div>

      {staffPlans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Plans Found</h3>
            <p className="text-gray-600">
              No staff plans were found in the system. Staff plans are membership types with category 'Staff'.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
          {/* Left Panel - Staff Plans List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Staff Plans ({staffPlans.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto">
                <div className="space-y-3">
                  {staffPlans.map(plan => (
                    <StaffPlanListItem key={plan.id} plan={plan} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Selected Plan Permissions */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      {selectedPlan ? `${selectedPlan.name} Permissions` : 'Select a Staff Plan'}
                    </CardTitle>
                    {selectedPlan && (
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-sm text-gray-600">{selectedPlan.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {getPermissionCount(selectedPlan.permissions)} / {Object.values(PERMISSION_CATEGORIES).flat().length} enabled
                        </Badge>
                      </div>
                    )}
                  </div>                  {selectedPlan && (
                    <Button 
                      onClick={saveStaffPlanPermissions}
                      disabled={saving}
                      className="flex items-center gap-2"
                      title="Save permissions (Ctrl+S)"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Permissions'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto">
                {selectedPlan ? (                  <div className="space-y-6">
                    {Object.entries(PERMISSION_CATEGORIES).map(([categoryName, permissions]) => {
                      const allEnabled = areCategoryPermissionsEnabled(categoryName);
                      const enabledCount = permissions.filter(p => 
                        selectedPlan.permissions[p.id] || false
                      ).length;
                      
                      return (
                        <div key={categoryName} className="space-y-3">
                          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                                {categoryName.replace(/_/g, ' ')}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {enabledCount} / {permissions.length}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCategoryPermissions(categoryName, !allEnabled)}
                              className="text-xs h-6 px-2"
                            >
                              {allEnabled ? 'Deselect All' : 'Select All'}
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {permissions.map(permission => (
                              <PermissionCheckbox key={permission.id} permission={permission} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Staff Plan</h3>
                      <p className="text-gray-600">
                        Choose a staff plan from the left panel to view and edit its permissions.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Help Info */}
      {staffPlans.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">How Staff Plan Permissions Work</h4>              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Each staff plan represents a role type (e.g., Front Desk, Trainer, Manager)</li>
                <li>• Select a plan from the left to view and modify its permissions</li>
                <li>• Toggle permissions individually or use "Select All" for entire categories</li>
                <li>• Click "Save Permissions" or press Ctrl+S to apply changes</li>
                <li>• Staff members assigned to these plans inherit the permissions automatically</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StaffPermissionsManagement;

