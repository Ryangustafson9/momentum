import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Shield, 
  Users, 
  Settings, 
  Eye, 
  Edit, 
  Trash2,
  Clock,
  FileText,
  Calculator
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const PayrollPermissionsTab = () => {
  const [permissions, setPermissions] = useState({
    // System-wide payroll settings
    payroll_enabled: false,
    timeclock_payroll_integration: false,
    
    // Pay rate management permissions
    view_all_pay_rates: false,
    manage_pay_rates: false,
    approve_pay_rate_changes: false,
    view_pay_rate_history: false,
    
    // Payroll calculation permissions
    calculate_payroll: false,
    approve_payroll: false,
    export_payroll: false,
    view_payroll_reports: false,
    
    // Staff self-service permissions
    staff_view_own_rate: true,
    staff_view_own_payroll: true,
    staff_view_timeclock_earnings: true,
    
    // Advanced features
    bulk_rate_updates: false,
    payroll_templates: false,
    overtime_calculations: true,
    holiday_pay_calculations: false
  });

  const [staffRoles, setStaffRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadSystemPermissions(),
        loadStaffRoles()
      ]);
    } catch (error) {
      console.error('Error loading payroll permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1);

      if (error) throw error;

      if (data?.[0]) {
        setPermissions(prev => ({
          ...prev,
          payroll_enabled: data[0].payroll_enabled || false,
          timeclock_payroll_integration: data[0].timeclock_payroll_integration || false,
          overtime_calculations: data[0].overtime_calculations !== false,
          holiday_pay_calculations: data[0].holiday_pay_calculations || false
        }));
      }
    } catch (error) {
      console.error('Error loading system permissions:', error);
    }
  };

  const loadStaffRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_types')
        .select('id, name, permissions, category')
        .eq('category', 'Staff')
        .order('name');

      if (error) throw error;
      setStaffRoles(data || []);
    } catch (error) {
      console.error('Error loading staff roles:', error);
    }
  };

  const handleSystemPermissionChange = async (key, value) => {
    try {
      setPermissions(prev => ({ ...prev, [key]: value }));

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1,
          [key]: value,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Permission Updated",
        description: `${getPermissionLabel(key)} has been ${value ? 'enabled' : 'disabled'}.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating system permission:', error);
      toast({
        title: "Error",
        description: "Failed to update permission.",
        variant: "destructive"
      });
      // Revert the change
      setPermissions(prev => ({ ...prev, [key]: !value }));
    }
  };

  const handleRolePermissionChange = async (roleId, permissionKey, value) => {
    try {
      const role = staffRoles.find(r => r.id === roleId);
      if (!role) return;

      const updatedPermissions = {
        ...role.permissions,
        [permissionKey]: value
      };

      const { error } = await supabase
        .from('membership_types')
        .update({
          permissions: updatedPermissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId);

      if (error) throw error;

      // Update local state
      setStaffRoles(prev => prev.map(r => 
        r.id === roleId 
          ? { ...r, permissions: updatedPermissions }
          : r
      ));

      toast({
        title: "Role Permission Updated",
        description: `${getPermissionLabel(permissionKey)} updated for ${role.name}.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating role permission:', error);
      toast({
        title: "Error",
        description: "Failed to update role permission.",
        variant: "destructive"
      });
    }
  };

  const getPermissionLabel = (key) => {
    const labels = {
      payroll_enabled: 'Payroll System',
      timeclock_payroll_integration: 'Timeclock Integration',
      view_all_pay_rates: 'View All Pay Rates',
      manage_pay_rates: 'Manage Pay Rates',
      approve_pay_rate_changes: 'Approve Rate Changes',
      view_pay_rate_history: 'View Rate History',
      calculate_payroll: 'Calculate Payroll',
      approve_payroll: 'Approve Payroll',
      export_payroll: 'Export Payroll',
      view_payroll_reports: 'View Payroll Reports',
      staff_view_own_rate: 'Staff View Own Rate',
      staff_view_own_payroll: 'Staff View Own Payroll',
      staff_view_timeclock_earnings: 'Staff View Timeclock Earnings',
      bulk_rate_updates: 'Bulk Rate Updates',
      payroll_templates: 'Payroll Templates',
      overtime_calculations: 'Overtime Calculations',
      holiday_pay_calculations: 'Holiday Pay Calculations'
    };
    return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPermissionDescription = (key) => {
    const descriptions = {
      payroll_enabled: 'Enable the payroll management system',
      timeclock_payroll_integration: 'Integrate timeclock data with payroll calculations',
      view_all_pay_rates: 'View pay rates for all staff members',
      manage_pay_rates: 'Create, edit, and delete staff pay rates',
      approve_pay_rate_changes: 'Approve pay rate changes before they take effect',
      view_pay_rate_history: 'View historical pay rate changes',
      calculate_payroll: 'Calculate payroll for pay periods',
      approve_payroll: 'Approve calculated payroll before processing',
      export_payroll: 'Export payroll data to external systems',
      view_payroll_reports: 'Access payroll reports and analytics',
      staff_view_own_rate: 'Allow staff to view their current pay rate',
      staff_view_own_payroll: 'Allow staff to view their payroll history',
      staff_view_timeclock_earnings: 'Show estimated earnings in timeclock interface',
      bulk_rate_updates: 'Update multiple staff pay rates at once',
      payroll_templates: 'Create and use pay rate templates',
      overtime_calculations: 'Automatically calculate overtime pay',
      holiday_pay_calculations: 'Calculate special holiday pay rates'
    };
    return descriptions[key] || '';
  };

  const systemPermissions = [
    {
      category: 'System Settings',
      permissions: [
        'payroll_enabled',
        'timeclock_payroll_integration',
        'overtime_calculations',
        'holiday_pay_calculations'
      ]
    }
  ];

  const rolePermissions = [
    {
      category: 'Pay Rate Management',
      permissions: [
        'view_all_pay_rates',
        'manage_pay_rates',
        'approve_pay_rate_changes',
        'view_pay_rate_history',
        'bulk_rate_updates',
        'payroll_templates'
      ]
    },
    {
      category: 'Payroll Processing',
      permissions: [
        'calculate_payroll',
        'approve_payroll',
        'export_payroll',
        'view_payroll_reports'
      ]
    },
    {
      category: 'Staff Self-Service',
      permissions: [
        'staff_view_own_rate',
        'staff_view_own_payroll',
        'staff_view_timeclock_earnings'
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-8 w-8 animate-pulse" />
          <span className="text-xl">Loading payroll permissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-green-600" />
          Payroll & Pay Rate Permissions
        </h2>
        <p className="text-gray-600 mt-1">
          Configure system-wide payroll settings and role-based permissions
        </p>
      </div>

      {/* System-Wide Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System-Wide Payroll Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {systemPermissions.map((section) => (
            <div key={section.category}>
              <h3 className="font-medium text-gray-900 mb-4">{section.category}</h3>
              <div className="space-y-4">
                {section.permissions.map((permission) => (
                  <div key={permission} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={permission} className="font-medium">
                          {getPermissionLabel(permission)}
                        </Label>
                        {permission === 'payroll_enabled' && permissions[permission] && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {getPermissionDescription(permission)}
                      </p>
                    </div>
                    <Switch
                      id={permission}
                      checked={permissions[permission]}
                      onCheckedChange={(checked) => handleSystemPermissionChange(permission, checked)}
                    />
                  </div>
                ))}
              </div>
              {section.category !== systemPermissions[systemPermissions.length - 1].category && (
                <Separator className="mt-6" />
              )}
            </div>
          ))}

          {!permissions.payroll_enabled && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Enable the payroll system to access pay rate management and payroll processing features.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Role-Based Permissions */}
      {permissions.payroll_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Role-Based Payroll Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {staffRoles.map((role) => (
                <div key={role.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">{role.name}</h3>
                    <Badge variant="outline">{role.category}</Badge>
                  </div>

                  {rolePermissions.map((section) => (
                    <div key={section.category} className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">{section.category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {section.permissions.map((permission) => (
                          <div key={permission} className="flex items-center justify-between">
                            <Label htmlFor={`${role.id}-${permission}`} className="text-sm">
                              {getPermissionLabel(permission)}
                            </Label>
                            <Switch
                              id={`${role.id}-${permission}`}
                              checked={role.permissions?.[permission] || false}
                              onCheckedChange={(checked) => 
                                handleRolePermissionChange(role.id, permission, checked)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {staffRoles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No staff roles found. Create staff roles to configure payroll permissions.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permission Summary */}
      {permissions.payroll_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Permission Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {staffRoles.filter(role => role.permissions?.manage_pay_rates).length}
                </div>
                <div className="text-sm text-gray-600">Roles with Pay Rate Management</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {staffRoles.filter(role => role.permissions?.calculate_payroll).length}
                </div>
                <div className="text-sm text-gray-600">Roles with Payroll Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {staffRoles.filter(role => role.permissions?.staff_view_own_rate).length}
                </div>
                <div className="text-sm text-gray-600">Roles with Self-Service Access</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PayrollPermissionsTab;
