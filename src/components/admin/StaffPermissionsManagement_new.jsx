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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch staff plans from membership_types
  const fetchStaffPlans = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching staff plans...');
      
      const { data: plans, error } = await supabase
        .from('membership_types')
        .select('*')
        .eq('category', 'Staff')
        .order('name');

      if (error) throw error;

      console.log('✅ Staff plans fetched:', plans);
      
      // Initialize permissions if they don't exist
      const plansWithPermissions = plans.map(plan => ({
        ...plan,
        permissions: plan.permissions || {}
      }));

      setStaffPlans(plansWithPermissions);
    } catch (error) {
      console.error('❌ Error fetching staff plans:', error);
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

  // Toggle a permission for a specific staff plan
  const togglePermission = (planId, permissionKey, enabled) => {
    setStaffPlans(currentPlans => 
      currentPlans.map(plan => 
        plan.id === planId 
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
  };

  // Save permissions for a specific staff plan
  const saveStaffPlanPermissions = async (planId) => {
    try {
      setSaving(true);
      const plan = staffPlans.find(p => p.id === planId);
      
      if (!plan) return;

      console.log('💾 Saving permissions for plan:', plan.name, plan.permissions);

      const { error } = await supabase
        .from('membership_types')
        .update({ 
          permissions: plan.permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Permissions saved for ${plan.name}`,
        variant: "default"
      });

    } catch (error) {
      console.error('❌ Error saving permissions:', error);
      toast({
        title: "Error",
        description: "Failed to save permissions",
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
  };

  // Render permission checkbox
  const PermissionCheckbox = ({ permission, planId, currentPermissions }) => {
    const isChecked = currentPermissions[permission.id] || false;
    
    return (
      <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
        <Checkbox
          id={`${planId}-${permission.id}`}
          checked={isChecked}
          onCheckedChange={(checked) => togglePermission(planId, permission.id, checked)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <label 
            htmlFor={`${planId}-${permission.id}`}
            className="text-sm font-medium text-gray-900 cursor-pointer"
          >
            {permission.label}
          </label>
          <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
        </div>
      </div>
    );
  };

  // Render staff plan card
  const StaffPlanCard = ({ plan }) => {
    const permissionCount = getPermissionCount(plan.permissions);
    const totalPermissions = Object.values(PERMISSION_CATEGORIES).flat().length;

    return (
      <Card key={plan.id} className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                {plan.name}
                <Badge variant="secondary">Staff Plan</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                {permissionCount} / {totalPermissions} permissions
              </Badge>
              <div>
                <Button 
                  size="sm" 
                  onClick={() => saveStaffPlanPermissions(plan.id)}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Permissions'}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
              <div key={category}>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {category}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {permissions.map(permission => (
                    <PermissionCheckbox
                      key={permission.id}
                      permission={permission}
                      planId={plan.id}
                      currentPermissions={plan.permissions}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
      className="max-w-7xl mx-auto p-6 space-y-6"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          Staff Plans & Permissions
        </h1>
        <p className="text-gray-600 mt-2">
          Manage permissions for each staff plan. Changes are saved individually for each plan.
        </p>
      </div>

      <div className="space-y-6">
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
          staffPlans.map(plan => (
            <StaffPlanCard key={plan.id} plan={plan} />
          ))
        )}
      </div>

      {staffPlans.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">How Staff Plan Permissions Work</h4>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Each staff plan represents a role type (e.g., Front Desk, Trainer, Manager)</li>
                <li>• Toggle permissions on/off for each plan</li>
                <li>• Click "Save Permissions" to apply changes</li>
                <li>• Staff members assigned to these plans inherit the permissions</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StaffPermissionsManagement;
