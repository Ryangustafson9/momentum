
/**
 * 🔧 COMPREHENSIVE ADMIN PANEL SETTINGS TAB
 * Advanced system administration, location management, and configuration tools
 * Integration point for all Phase 1A and 1B functionality
 * Includes SuperAdminDashboard functionality
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { 
  SlidersHorizontal, 
  Shield, 
  Building2, 
  FileText, 
  CreditCard,  ArrowRightLeft, 
  BarChart3, 
  Settings,
  Database,
  Activity,
  Lock,
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabaseClient';

// Import Phase 1B components
import StaffPermissionsManagement from '@/components/admin/StaffPermissionsManagement';
import SuperAdminLocationManager from '@/components/admin/SuperAdminLocationManager';
import ConfigurationTemplatesManager from '@/components/admin/ConfigurationTemplatesManager';
import BillingConfigurationManager from '@/components/billing/BillingConfigurationManager';
import PaymentProcessorHub from '@/components/billing/PaymentProcessorHub';
import MigrationWorkflowManager from '@/components/admin/MigrationWorkflowManager';
import BillingConfigurationPanel from '@/components/billing/BillingConfigurationPanel';
import BillingAnalyticsDashboard from '@/components/billing/BillingAnalyticsDashboard';
import MultiLocationManagementSimple from '@/components/admin/MultiLocationManagementSimple';

// Mock data for super admin overview
const mockSuperAdminData = {
  systemHealth: {
    billingJobsRunning: 2,
    failedJobs: 0,
    systemUptime: 99.9,
    lastBillingRun: '2024-01-15T06:00:00Z'
  },
  organizations: [
    {
      id: 'org-1',
      name: 'Momentum Fitness Center',
      members: 156,
      monthlyRevenue: 45750,
      billingType: 'unified',
      status: 'active'
    },
    {
      id: 'org-2', 
      name: 'Elite Gym Downtown',
      members: 89,
      monthlyRevenue: 28900,
      billingType: 'anniversary',
      status: 'active'
    }
  ],
  recentActivity: [
    {
      id: 1,
      type: 'billing_cycle',
      organization: 'Momentum Fitness Center',
      description: 'Monthly billing cycle completed',
      timestamp: '2024-01-15T06:00:00Z',
      status: 'success'
    },
    {
      id: 2,
      type: 'config_change',
      organization: 'Elite Gym Downtown',
      description: 'Billing configuration updated',
      timestamp: '2024-01-14T14:30:00Z',
      status: 'info'
    },
    {
      id: 3,
      type: 'payment_failure',
      organization: 'Momentum Fitness Center',
      description: '3 payment failures detected',
      timestamp: '2024-01-14T09:15:00Z',
      status: 'warning'
    }
  ]
};

// Helper components for the admin dashboard
const SystemHealthCard = ({ title, value, status, icon: Icon }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-xl font-semibold text-gray-900">{value}</p>
          </div>
          <div className={`p-2 rounded-full ${getStatusColor(status)}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OrganizationCard = ({ org, onSelect }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer"
      onClick={() => onSelect(org)}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-900">{org.name}</h3>
              <p className="text-sm text-gray-600">{org.members} members</p>
            </div>
            <Badge className={org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {org.status}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Monthly Revenue</span>
              <span className="font-medium">${org.monthlyRevenue.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Billing Type</span>
              <Badge variant="outline">
                {org.billingType === 'unified' ? 'Unified' : 'Anniversary'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ActivityFeed = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'billing_cycle': return <Calendar className="w-4 h-4" />;
      case 'config_change': return <Settings className="w-4 h-4" />;
      case 'payment_failure': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className={`p-1 rounded-full ${getActivityColor(activity.status)}`}>
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{activity.description}</p>
            <p className="text-xs text-gray-600">{activity.organization}</p>
            <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const SettingsCardItem = ({ label, description, children }) => (
  <div className="flex items-center justify-between py-3 border-b last:border-b-0">
    <div className="flex-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
    <div className="ml-4">
      {children}
    </div>
  </div>
);

const AdminPanelSettingsTab = () => {
  const { user } = useAuth();
  const [selectedOrganization, setSelectedOrganization] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="bg-card shadow-xl rounded-lg">
        <CardHeader className="border-b dark:border-slate-700">
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <SlidersHorizontal className="mr-3 h-6 w-6" /> Admin Panel
          </CardTitle>
          <CardDescription>
            Advanced system administration, location management, and configuration tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 rounded-none border-b dark:border-slate-700">
              <TabsTrigger
                value="dashboard"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <BarChart3 className="mr-2 h-4 w-4" /> Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="general"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <Settings className="mr-2 h-4 w-4" /> General
              </TabsTrigger>
              <TabsTrigger
                value="permissions"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <Shield className="mr-2 h-4 w-4" /> Permissions
              </TabsTrigger>
              <TabsTrigger
                value="multi-location"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <Building2 className="mr-2 h-4 w-4" /> Multi-Location
              </TabsTrigger>
              <TabsTrigger
                value="locations"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <Building2 className="mr-2 h-4 w-4" /> Locations
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <FileText className="mr-2 h-4 w-4" /> Templates
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <CreditCard className="mr-2 h-4 w-4" /> Billing
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <CreditCard className="mr-2 h-4 w-4" /> Payments
              </TabsTrigger>
              <TabsTrigger
                value="migrations"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" /> Migrations
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="p-4 md:p-6">
              <AdminDashboard 
                selectedOrganization={selectedOrganization} 
                setSelectedOrganization={setSelectedOrganization} 
              />
            </TabsContent>
            
            <TabsContent value="general" className="p-4 md:p-6">
              <GeneralAdminSettings />
            </TabsContent>
            
            <TabsContent value="permissions" className="p-4 md:p-6">
              <StaffPermissionsManagement />
            </TabsContent>

            <TabsContent value="multi-location" className="p-4 md:p-6">
              <MultiLocationManagementSimple />
            </TabsContent>

            <TabsContent value="locations" className="p-4 md:p-6">
              <SuperAdminLocationManager organizationId={user?.organization_id} />
            </TabsContent>            <TabsContent value="templates" className="p-4 md:p-6">
              <ConfigurationTemplatesManager />
            </TabsContent>

            <TabsContent value="billing" className="p-4 md:p-6">
              <BillingConfigurationPanel organizationId={selectedOrganization?.id || 'default-org-id'} />
            </TabsContent>

            <TabsContent value="payments" className="p-4 md:p-6">
              <PaymentProcessorHub />
            </TabsContent>

            <TabsContent value="migrations" className="p-4 md:p-6">
              <MigrationWorkflowManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Admin Dashboard component - integrates SuperAdminDashboard functionality
const AdminDashboard = ({ selectedOrganization, setSelectedOrganization }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* System Health Alert */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          All billing systems are operational. Last billing cycle completed successfully at{' '}
          {new Date(mockSuperAdminData.systemHealth.lastBillingRun).toLocaleString()}.
        </AlertDescription>
      </Alert>

      {/* Main Dashboard Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* System Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* System Health */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <SystemHealthCard
                      title="Billing Jobs Running"
                      value={mockSuperAdminData.systemHealth.billingJobsRunning}
                      status="healthy"
                      icon={Calendar}
                    />
                    <SystemHealthCard
                      title="Failed Jobs"
                      value={mockSuperAdminData.systemHealth.failedJobs}
                      status="healthy"
                      icon={AlertTriangle}
                    />
                    <SystemHealthCard
                      title="System Uptime"
                      value={`${mockSuperAdminData.systemHealth.systemUptime}%`}
                      status="healthy"
                      icon={TrendingUp}
                    />
                    <SystemHealthCard
                      title="Organizations"
                      value={mockSuperAdminData.organizations.length}
                      status="healthy"
                      icon={Users}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Organizations Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Organizations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {mockSuperAdminData.organizations.map((org) => (
                      <OrganizationCard
                        key={org.id}
                        org={org}
                        onSelect={setSelectedOrganization}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Feed */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityFeed activities={mockSuperAdminData.recentActivity} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle>Organization Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Organization Management</h3>
                <p className="text-gray-500 mb-4">
                  Manage multiple gym organizations, their settings, and billing configurations
                </p>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <BillingAnalyticsDashboard organizationId={selectedOrganization?.id || 'default-org-id'} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// General Admin Settings component (simplified version of original AdminPanelSettingsTab)
const GeneralAdminSettings = () => {
  const { toast } = useToast();
  const { isAdmin, user, role } = usePermissions();
  const [settings, setSettings] = useState({
    requireFirstName: true,
    requireLastName: true,
    requireEmail: true,
    requirePhone: false,
    requireDOB: false,
    requireAddress: false,
  });

  const [clubSettings, setClubSettings] = useState({
    allowOnlineJoining: true,
    allowOnlineUpgrades: true,
    allowAddonsOnline: true,
    allowFamilyAdditionsOnline: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('data-requirements');

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data: currentSettings, error } = await supabase
          .from('general_settings')
          .select('*')
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (currentSettings) {
          setSettings({
            requireFirstName: currentSettings.require_first_name ?? true,
            requireLastName: currentSettings.require_last_name ?? true,
            requireEmail: currentSettings.require_email ?? true,
            requirePhone: currentSettings.require_phone ?? false,
            requireDOB: currentSettings.require_dob ?? false,
            requireAddress: currentSettings.require_address ?? false,
          });

          // Load club settings
          setClubSettings({
            allowOnlineJoining: currentSettings.allow_online_joining ?? true,
            allowOnlineUpgrades: currentSettings.allow_online_upgrades ?? true,
            allowAddonsOnline: currentSettings.allow_addons_online ?? true,
            allowFamilyAdditionsOnline: currentSettings.allow_family_additions_online ?? true,
          });
        }
      } catch (error) {
        console.error("Failed to load admin panel settings:", error);
        toast({
          title: "Error",
          description: "Could not load admin panel settings. Using default values.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClubToggle = (key) => {
    setClubSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('general_settings')
        .upsert({
          require_first_name: settings.requireFirstName,
          require_last_name: settings.requireLastName,
          require_email: settings.requireEmail,
          require_phone: settings.requirePhone,
          require_dob: settings.requireDOB,
          require_address: settings.requireAddress,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Admin panel settings have been updated.",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Failed to save admin panel settings:", error);
      toast({
        title: "Error",
        description: "Could not save admin panel settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClubSave = async () => {
    setIsLoading(true);
    try {
      // For now, we'll store in general_settings table with new columns
      // Later we can migrate to a dedicated club_settings table
      const { error } = await supabase
        .from('general_settings')
        .upsert({
          allow_online_joining: clubSettings.allowOnlineJoining,
          allow_online_upgrades: clubSettings.allowOnlineUpgrades,
          allow_addons_online: clubSettings.allowAddonsOnline,
          allow_family_additions_online: clubSettings.allowFamilyAdditionsOnline,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Club Settings Saved",
        description: "Club operational settings have been updated.",
        className: "bg-purple-500 text-white",
      });
    } catch (error) {
      console.error("Failed to save club settings:", error);
      toast({
        title: "Error",
        description: "Could not save club settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has admin access
  if (!isAdmin) {
    return (
      <Card className="shadow-lg border-none">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Access Required</h3>
            <p className="text-gray-600">You need administrator privileges to access this panel.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && typeof settings.requireFirstName === 'undefined') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-3 text-indigo-600" />
            Master Admin Panel
          </h2>
          <p className="text-gray-600 mt-1">Backend settings and administrative controls</p>
        </div>
      </div>

      {/* Admin Panel Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger
            value="data-requirements"
            className="flex items-center space-x-2 data-[state=active]:bg-white"
          >
            <Database className="w-4 h-4" />
            <span>Data Requirements</span>
          </TabsTrigger>
          <TabsTrigger
            value="club-operations"
            className="flex items-center space-x-2 data-[state=active]:bg-white"
          >
            <Settings className="w-4 h-4" />
            <span>Club Operations</span>
          </TabsTrigger>
          <TabsTrigger
            value="system-health"
            className="flex items-center space-x-2 data-[state=active]:bg-white"
          >
            <Activity className="w-4 h-4" />
            <span>System Health</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex items-center space-x-2 data-[state=active]:bg-white"
          >
            <Lock className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Data Requirements Tab */}
        <TabsContent value="data-requirements" className="space-y-4">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-indigo-600" />
                Member Data Requirements
              </CardTitle>
              <CardDescription>
                Configure which member information fields are mandatory throughout the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 pt-6">
              <SettingsCardItem label="Require First Name">
                <Switch
                  checked={settings.requireFirstName}
                  onCheckedChange={() => handleToggle('requireFirstName')}
                  id="requireFirstName"
                />
              </SettingsCardItem>
              <SettingsCardItem label="Require Last Name">
                <Switch
                  checked={settings.requireLastName}
                  onCheckedChange={() => handleToggle('requireLastName')}
                  id="requireLastName"
                />
              </SettingsCardItem>
              <SettingsCardItem label="Require Email">
                <Switch
                  checked={settings.requireEmail}
                  onCheckedChange={() => handleToggle('requireEmail')}
                  id="requireEmail"
                />
              </SettingsCardItem>
              <SettingsCardItem label="Require Phone Number">
                <Switch
                  checked={settings.requirePhone}
                  onCheckedChange={() => handleToggle('requirePhone')}
                  id="requirePhone"
                />
              </SettingsCardItem>
              <SettingsCardItem label="Require Date of Birth">
                <Switch
                  checked={settings.requireDOB}
                  onCheckedChange={() => handleToggle('requireDOB')}
                  id="requireDOB"
                />
              </SettingsCardItem>
              <SettingsCardItem label="Require Address">
                <Switch
                  checked={settings.requireAddress}
                  onCheckedChange={() => handleToggle('requireAddress')}
                  id="requireAddress"
                />
              </SettingsCardItem>
            </CardContent>
            <CardContent className="border-t pt-6 text-right">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? 'Saving...' : 'Save Data Requirements'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Club Operations Tab */}
        <TabsContent value="club-operations" className="space-y-4">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-purple-600" />
                Club Operational Settings
              </CardTitle>
              <CardDescription>
                Configure how your club handles membership sales and online features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 pt-6">
              <SettingsCardItem
                label="Allow Online Membership Joining"
                description="When disabled, new users cannot purchase memberships during signup and are directed to contact staff"
              >
                <Switch
                  checked={clubSettings.allowOnlineJoining}
                  onCheckedChange={() => handleClubToggle('allowOnlineJoining')}
                  id="allowOnlineJoining"
                />
              </SettingsCardItem>
              <SettingsCardItem
                label="Allow Online Membership Upgrades"
                description="Existing members can upgrade their membership plans online"
              >
                <Switch
                  checked={clubSettings.allowOnlineUpgrades}
                  onCheckedChange={() => handleClubToggle('allowOnlineUpgrades')}
                  id="allowOnlineUpgrades"
                />
              </SettingsCardItem>
              <SettingsCardItem
                label="Allow Online Add-on Purchases"
                description="Members can purchase add-on services through the member portal"
              >
                <Switch
                  checked={clubSettings.allowAddonsOnline}
                  onCheckedChange={() => handleClubToggle('allowAddonsOnline')}
                  id="allowAddonsOnline"
                />
              </SettingsCardItem>
              <SettingsCardItem
                label="Allow Online Family Member Additions"
                description="Family membership holders can add family members online"
              >
                <Switch
                  checked={clubSettings.allowFamilyAdditionsOnline}
                  onCheckedChange={() => handleClubToggle('allowFamilyAdditionsOnline')}
                  id="allowFamilyAdditionsOnline"
                />
              </SettingsCardItem>
            </CardContent>
            <CardContent className="border-t pt-6 text-right">
              <Button
                onClick={handleClubSave}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? 'Saving...' : 'Save Club Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system-health" className="space-y-4">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-600" />
                System Health & Monitoring
              </CardTitle>
              <CardDescription>
                Monitor system performance and health metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Database Status</p>
                      <p className="text-2xl font-bold text-green-900">Healthy</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Active Users</p>
                      <p className="text-2xl font-bold text-blue-900">24</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-800">System Load</p>
                      <p className="text-2xl font-bold text-yellow-900">Normal</p>
                    </div>
                    <Activity className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2 text-red-600" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security policies and access controls.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-red-800">Security Notice</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Advanced security settings will be available in future updates.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-center py-8 text-gray-500">
                  <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>Security configuration panel coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanelSettingsTab;

// Export individual components for use in AdminPanelPage
export { AdminDashboard, GeneralAdminSettings };