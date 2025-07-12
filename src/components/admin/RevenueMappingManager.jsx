import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Link,
  AlertTriangle,
  CheckCircle,
  Settings,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  TrendingUp,
  Building,
  CreditCard,
  Users,
  Package,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { RevenueMappingService, REVENUE_SOURCE_TYPES, GL_ACCOUNT_CATEGORIES } from '@/lib/revenueMapping';
import { supabase } from '@/lib/supabaseClient';

const RevenueMappingManager = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [mappingData, setMappingData] = useState({
    memberships: [],
    services: [],
    posItems: [],
    unmappedSources: []
  });
  const [validationResults, setValidationResults] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    loadRevenueMappingData();
  }, []);

  const loadRevenueMappingData = async () => {
    try {
      setIsLoading(true);
      
      // Load validation results
      const validation = await RevenueMappingService.validateRevenueMappings();
      if (validation.success) {
        setValidationResults(validation.data);
      }

      // Load mapping data by type
      const [memberships, services, posItems] = await Promise.all([
        RevenueMappingService.getRevenueMappingsByType('membership'),
        RevenueMappingService.getRevenueMappingsByType('service'),
        RevenueMappingService.getRevenueMappingsByType('pos_item')
      ]);

      setMappingData({
        memberships: memberships.data || [],
        services: services.data || [],
        posItems: posItems.data || [],
        unmappedSources: validation.data?.unmapped_sources || []
      });

    } catch (error) {
      console.error('Error loading revenue mapping data:', error);
      toast({
        title: "Error",
        description: "Failed to load revenue mapping data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoAssignAccounts = async () => {
    try {
      const assignments = await RevenueMappingService.autoAssignGLAccounts();
      if (assignments.success) {
        toast({
          title: "Auto-Assignment Complete",
          description: `Found ${assignments.data.length} suggested account assignments.`,
        });
        // Refresh data
        loadRevenueMappingData();
      }
    } catch (error) {
      console.error('Error auto-assigning accounts:', error);
      toast({
        title: "Error",
        description: "Failed to auto-assign GL accounts.",
        variant: "destructive"
      });
    }
  };

  const getMappingCompletionPercentage = () => {
    if (!validationResults) return 0;
    
    const totalSources = 
      validationResults.membership_types.length + 
      validationResults.services.length;
    
    const mappedSources = 
      validationResults.membership_types.filter(m => m.has_mapping).length +
      validationResults.services.filter(s => s.has_mapping).length;
    
    return totalSources > 0 ? Math.round((mappedSources / totalSources) * 100) : 0;
  };

  const getStatusColor = (hasMapping) => {
    return hasMapping ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading revenue mapping data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Revenue Mapping System</h2>
            </div>
            <p className="text-sm text-gray-600">
              Connect all revenue-generating activities to your Chart of Accounts for proper financial tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleAutoAssignAccounts} variant="outline" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Auto-Assign
            </Button>
            <Button onClick={loadRevenueMappingData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mapping Completion</p>
                <p className="text-2xl font-bold text-blue-600">{getMappingCompletionPercentage()}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600 opacity-60" />
            </div>
            <Progress value={getMappingCompletionPercentage()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unmapped Sources</p>
                <p className="text-2xl font-bold text-red-600">{mappingData.unmappedSources.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Membership Types</p>
                <p className="text-2xl font-bold text-green-600">
                  {validationResults?.membership_types?.filter(m => m.has_mapping).length || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Services Mapped</p>
                <p className="text-2xl font-bold text-purple-600">
                  {validationResults?.services?.filter(s => s.has_mapping).length || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unmapped Sources Alert */}
      {mappingData.unmappedSources.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{mappingData.unmappedSources.length} revenue sources</strong> are not mapped to GL accounts. 
            This may cause issues with financial reporting and transaction processing.
            <Button 
              onClick={handleAutoAssignAccounts} 
              variant="outline" 
              size="sm" 
              className="ml-3 border-red-300 text-red-700 hover:bg-red-100"
            >
              Auto-Assign Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="memberships" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Memberships
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            POS Items
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mapping Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Mapping Status Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Membership Types</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {validationResults?.membership_types?.filter(m => m.has_mapping).length || 0} / {validationResults?.membership_types?.length || 0}
                      </span>
                      <Badge variant="outline" className={getStatusColor(
                        (validationResults?.membership_types?.filter(m => m.has_mapping).length || 0) === (validationResults?.membership_types?.length || 0)
                      )}>
                        {(validationResults?.membership_types?.filter(m => m.has_mapping).length || 0) === (validationResults?.membership_types?.length || 0) ? 'Complete' : 'Incomplete'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Services</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {validationResults?.services?.filter(s => s.has_mapping).length || 0} / {validationResults?.services?.length || 0}
                      </span>
                      <Badge variant="outline" className={getStatusColor(
                        (validationResults?.services?.filter(s => s.has_mapping).length || 0) === (validationResults?.services?.length || 0)
                      )}>
                        {(validationResults?.services?.filter(s => s.has_mapping).length || 0) === (validationResults?.services?.length || 0) ? 'Complete' : 'Incomplete'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button onClick={handleAutoAssignAccounts} className="w-full justify-start">
                    <Zap className="h-4 w-4 mr-2" />
                    Auto-Assign GL Accounts
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Mapping Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Mappings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unmapped Sources List */}
          {mappingData.unmappedSources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Unmapped Revenue Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mappingData.unmappedSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-red-100 text-red-800">
                          {source.type}
                        </Badge>
                        <span className="font-medium text-gray-900">{source.name}</span>
                      </div>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Map Account
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="memberships">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Membership Revenue Mapping
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Mapping
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Membership Types Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Membership Type
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          GL Account
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResults?.membership_types?.map((membership, index) => (
                        <tr
                          key={membership.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                          }`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="font-medium text-gray-900">{membership.name}</span>
                                {membership.description && (
                                  <p className="text-xs text-gray-500 mt-1">{membership.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {membership.category || 'Standard'}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-gray-900">
                              ${membership.price || '0.00'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {membership.has_mapping ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  4110 - Membership Revenue
                                </Badge>
                              </div>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Not Mapped
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <Badge
                              variant="outline"
                              className={membership.has_mapping ?
                                'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {membership.has_mapping ? 'Mapped' : 'Unmapped'}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!membership.has_mapping && (
                                <Button variant="outline" size="sm">
                                  <Link className="h-4 w-4 mr-2" />
                                  Map
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Suggested GL Account Categories */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3">Suggested GL Account Structure</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">4110</Badge>
                        <span className="text-sm text-blue-800">Monthly Membership Revenue</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">4120</Badge>
                        <span className="text-sm text-blue-800">Annual Membership Revenue</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">4130</Badge>
                        <span className="text-sm text-blue-800">Family Membership Revenue</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">4140</Badge>
                        <span className="text-sm text-blue-800">Student Membership Revenue</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">4150</Badge>
                        <span className="text-sm text-blue-800">Corporate Membership Revenue</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Service Revenue Mapping</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Service mapping interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pos">
          <Card>
            <CardHeader>
              <CardTitle>POS Item Revenue Mapping</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">POS item mapping interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Mapping Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Revenue mapping settings will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueMappingManager;
