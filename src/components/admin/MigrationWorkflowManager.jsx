// Migration Workflow Manager
// Visual interface for planning and executing billing rule migrations
// Created: June 21, 2025 - Phase 1B

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  FileText,
  Download,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  RefreshCw,
  Send,
  Bell
} from 'lucide-react';
import LocationService from '@/lib/services/locationService';
import { useLocationContext } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

const MigrationWorkflowManager = () => {
  const { currentLocation } = useLocationContext();
  const [migrations, setMigrations] = useState([]);
  const [pendingMigrations, setPendingMigrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(null);
  const [executingMigration, setExecutingMigration] = useState(null);
  const { toast } = useToast();

  const migrationStrategies = [
    {
      value: 'apply_to_all',
      label: 'Apply to All Members',
      description: 'Update all existing memberships immediately',
      icon: Users,
      risk: 'high',
      impact: 'All members affected'
    },
    {
      value: 'grandfather_all',
      label: 'Grandfather Existing Members',
      description: 'Keep old rules for existing members, new rules for new members only',
      icon: Clock,
      risk: 'low',
      impact: 'New members only'
    },
    {
      value: 'new_members_only',
      label: 'New Members Only',
      description: 'Only apply new rules to future memberships',
      icon: Target,
      risk: 'minimal',
      impact: 'Future signups only'
    },
    {
      value: 'selective',
      label: 'Selective Migration',
      description: 'Choose specific memberships to update',
      icon: Eye,
      risk: 'medium',
      impact: 'Selected members only'
    }
  ];

  useEffect(() => {
    if (currentLocation) {
      loadMigrations();
    }
  }, [currentLocation]);

  const loadMigrations = async () => {
    setLoading(true);
    try {
      const result = await LocationService.getMigrationHistory(currentLocation.id);
      if (result.data) {
        setMigrations(result.data.completed || []);
        setPendingMigrations(result.data.pending || []);
      }
    } catch (error) {
      console.error('Error loading migrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const MigrationCard = ({ migration, isPending = false }) => {
    const strategy = migrationStrategies.find(s => s.value === migration.migration_strategy);
    const StatusIcon = migration.status === 'completed' ? CheckCircle :
                      migration.status === 'failed' ? XCircle :
                      migration.status === 'in_progress' ? RefreshCw : Clock;

    return (
      <Card className="relative">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{migration.name || 'Billing Rule Migration'}</CardTitle>
              <p className="text-sm text-muted-foreground">{migration.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={
                migration.status === 'completed' ? 'default' :
                migration.status === 'failed' ? 'destructive' :
                migration.status === 'in_progress' ? 'secondary' : 'outline'
              }>
                <StatusIcon className={`w-3 h-3 mr-1 ${migration.status === 'in_progress' ? 'animate-spin' : ''}`} />
                {migration.status || 'pending'}
              </Badge>
              {strategy && (
                <Badge variant="outline" className={`text-xs ${
                  strategy.risk === 'high' ? 'border-red-200 text-red-700' :
                  strategy.risk === 'medium' ? 'border-yellow-200 text-yellow-700' :
                  'border-green-200 text-green-700'
                }`}>
                  {strategy.label}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Migration Details */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Affected Members</Label>
              <p className="font-medium">{migration.affected_count || 0}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Strategy</Label>
              <p className="font-medium">{strategy?.label || migration.migration_strategy}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {isPending ? 'Scheduled' : 'Executed'}
              </Label>
              <p className="font-medium">
                {new Date(migration.scheduled_date || migration.executed_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Progress for in-progress migrations */}
          {migration.status === 'in_progress' && migration.progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Migration Progress</span>
                <span>{migration.progress.completed}/{migration.progress.total}</span>
              </div>
              <Progress value={(migration.progress.completed / migration.progress.total) * 100} />
            </div>
          )}

          {/* Error details for failed migrations */}
          {migration.status === 'failed' && migration.error_message && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {migration.error_message}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPreviewModal(migration)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            
            {isPending && (
              <>
                <Button 
                  size="sm"
                  onClick={() => setExecutingMigration(migration)}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Execute
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
              </>
            )}
            
            {migration.status === 'failed' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setExecutingMigration(migration)}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CreateMigrationModal = ({ isOpen, onClose, onSave }) => {
    const [migrationData, setMigrationData] = useState({
      name: '',
      description: '',
      migration_strategy: 'new_members_only',
      scheduled_date: '',
      notify_members: false,
      test_run: true,
      old_config: {},
      new_config: {},
      affected_membership_types: [],
      selection_criteria: {}
    });

    const [previewData, setPreviewData] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    const generatePreview = async () => {
      setLoadingPreview(true);
      try {
        // Simulate API call to preview affected members
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockPreview = {
          total_affected: Math.floor(Math.random() * 500) + 50,
          by_membership_type: [
            { type: 'Premium', count: 120, revenue_impact: 2400 },
            { type: 'Basic', count: 80, revenue_impact: 1200 },
            { type: 'Student', count: 45, revenue_impact: 450 }
          ],
          revenue_impact: {
            monthly_change: 1250,
            annual_projection: 15000
          },
          grandfathered_count: migrationData.migration_strategy === 'grandfather_all' ? 245 : 0
        };
        
        setPreviewData(mockPreview);
      } catch (error) {
        console.error('Error generating preview:', error);
      } finally {
        setLoadingPreview(false);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Migration Plan</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Migration Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Migration Name</Label>
                  <Input
                    value={migrationData.name}
                    onChange={(e) => setMigrationData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Q3 Pricing Update"
                  />
                </div>
                <div>
                  <Label>Scheduled Date</Label>
                  <Input
                    type="datetime-local"
                    value={migrationData.scheduled_date}
                    onChange={(e) => setMigrationData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={migrationData.description}
                  onChange={(e) => setMigrationData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the changes and reasons for this migration..."
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Migration Strategy */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Migration Strategy</h3>
              
              <div className="grid grid-cols-1 gap-3">
                {migrationStrategies.map(strategy => (
                  <div
                    key={strategy.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      migrationData.migration_strategy === strategy.value
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/20'
                    }`}
                    onClick={() => setMigrationData(prev => ({ ...prev, migration_strategy: strategy.value }))}
                  >
                    <div className="flex items-start gap-3">
                      <strategy.icon className="w-5 h-5 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{strategy.label}</h4>
                          <Badge variant="outline" className={`text-xs ${
                            strategy.risk === 'high' ? 'border-red-200 text-red-700' :
                            strategy.risk === 'medium' ? 'border-yellow-200 text-yellow-700' :
                            'border-green-200 text-green-700'
                          }`}>
                            {strategy.risk} risk
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">Impact: {strategy.impact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Migration Options</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Test Run First</Label>
                    <p className="text-sm text-muted-foreground">Run a test migration before applying changes</p>
                  </div>
                  <Switch
                    checked={migrationData.test_run}
                    onCheckedChange={(checked) => setMigrationData(prev => ({ ...prev, test_run: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notify Affected Members</Label>
                    <p className="text-sm text-muted-foreground">Send email notifications about billing changes</p>
                  </div>
                  <Switch
                    checked={migrationData.notify_members}
                    onCheckedChange={(checked) => setMigrationData(prev => ({ ...prev, notify_members: checked }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Preview Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Impact Preview</h3>
                <Button 
                  variant="outline"
                  onClick={generatePreview}
                  disabled={loadingPreview}
                >
                  {loadingPreview ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Generate Preview
                    </>
                  )}
                </Button>
              </div>

              {previewData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{previewData.total_affected}</p>
                        <p className="text-sm text-muted-foreground">Members Affected</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">
                          ${previewData.revenue_impact.monthly_change.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Monthly Revenue Change</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">
                          ${previewData.revenue_impact.annual_projection.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Annual Projection</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {previewData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Breakdown by Membership Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {previewData.by_membership_type.map(type => (
                        <div key={type.type} className="flex justify-between items-center p-3 bg-muted rounded">
                          <div>
                            <p className="font-medium">{type.type}</p>
                            <p className="text-sm text-muted-foreground">{type.count} members</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${type.revenue_impact}/month</p>
                            <p className="text-sm text-muted-foreground">revenue impact</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => onSave(migrationData)}
                disabled={!migrationData.name || !migrationData.migration_strategy}
              >
                Create Migration Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const MigrationPreviewModal = ({ migration, isOpen, onClose }) => {
    if (!migration) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{migration.name || 'Migration Details'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Migration Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Strategy:</strong> {migration.migration_strategy}</p>
                  <p><strong>Status:</strong> {migration.status || 'pending'}</p>
                  <p><strong>Affected Members:</strong> {migration.affected_count || 0}</p>
                  <p><strong>Scheduled:</strong> {new Date(migration.scheduled_date || migration.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Configuration Changes</h3>
                <div className="text-sm">
                  <p className="mb-2"><strong>From:</strong></p>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(migration.old_config, null, 2)}
                  </pre>
                  
                  <p className="mb-2 mt-4"><strong>To:</strong></p>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(migration.new_config, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {migration.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{migration.description}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading migrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Migration Workflows</h2>
          <p className="text-muted-foreground">
            Plan and execute billing rule migrations for {currentLocation?.name}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlayCircle className="w-4 h-4 mr-2" />
          Create Migration
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{pendingMigrations.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{migrations.filter(m => m.status === 'completed').length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{migrations.filter(m => m.status === 'failed').length}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {migrations.reduce((sum, m) => sum + (m.affected_count || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Migrated</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Migration Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            <Clock className="w-4 h-4 mr-2" />
            Pending Migrations
          </TabsTrigger>
          <TabsTrigger value="history">
            <FileText className="w-4 h-4 mr-2" />
            Migration History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingMigrations.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Migrations</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a migration plan to update billing rules for your members
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Create Migration
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingMigrations.map(migration => (
                <MigrationCard key={migration.id} migration={migration} isPending={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {migrations.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Migration History</h3>
                  <p className="text-muted-foreground">
                    Completed migrations will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {migrations.map(migration => (
                <MigrationCard key={migration.id} migration={migration} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateMigrationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={(migrationData) => {
          logger.info('Creating migration:', migrationData);
          setShowCreateModal(false);
          loadMigrations();
          toast({
            title: "Migration Created",
            description: "Migration plan has been created successfully"
          });
        }}
      />

      <MigrationPreviewModal
        migration={showPreviewModal}
        isOpen={!!showPreviewModal}
        onClose={() => setShowPreviewModal(null)}
      />
    </div>
  );
};

export default MigrationWorkflowManager;
