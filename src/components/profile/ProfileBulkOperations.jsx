import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Users, Trash2, Edit, Mail, Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import ProfileService from '@/services/profileService';

/**
 * Bulk operations component for managing multiple profiles
 */
const ProfileBulkOperations = ({
  profiles = [],
  selectedProfiles = [],
  onSelectionChange,
  onProfilesUpdated,
  className = ''
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [bulkUpdateData, setBulkUpdateData] = useState({});

  const selectedCount = selectedProfiles.length;
  const allSelected = profiles.length > 0 && selectedProfiles.length === profiles.length;
  const someSelected = selectedProfiles.length > 0 && selectedProfiles.length < profiles.length;

  const operations = [
    {
      id: 'update_status',
      label: 'Update Status',
      icon: Edit,
      description: 'Change status for selected profiles',
      requiresData: true,
      dangerous: false
    },
    {
      id: 'update_role',
      label: 'Update Role',
      icon: Users,
      description: 'Change role for selected profiles',
      requiresData: true,
      dangerous: false
    },
    {
      id: 'send_email',
      label: 'Send Email',
      icon: Mail,
      description: 'Send email to selected profiles',
      requiresData: true,
      dangerous: false
    },
    {
      id: 'export',
      label: 'Export Data',
      icon: Download,
      description: 'Export selected profiles to CSV',
      requiresData: false,
      dangerous: false
    },
    {
      id: 'delete',
      label: 'Delete Profiles',
      icon: Trash2,
      description: 'Permanently delete selected profiles',
      requiresData: false,
      dangerous: true
    }
  ];

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(profiles.map(p => p.id));
    }
  };

  const handleOperationClick = (operation) => {
    setCurrentOperation(operation);
    
    if (operation.requiresData) {
      // Show data input for operations that need additional data
      setBulkUpdateData({});
    } else {
      // Show confirmation dialog for operations that don't need data
      setShowConfirmDialog(true);
    }
  };

  const executeOperation = async () => {
    if (!currentOperation || selectedCount === 0) return;

    setIsLoading(true);
    try {
      switch (currentOperation.id) {
        case 'update_status':
          await handleBulkStatusUpdate();
          break;
        case 'update_role':
          await handleBulkRoleUpdate();
          break;
        case 'export':
          await handleExport();
          break;
        case 'delete':
          await handleBulkDelete();
          break;
        case 'send_email':
          await handleSendEmail();
          break;
        default:
          throw new Error('Unknown operation');
      }

      toast({
        title: "Operation Completed",
        description: `Successfully processed ${selectedCount} profiles.`
      });

      onProfilesUpdated?.();
      onSelectionChange([]);
    } catch (error) {
      console.error('Bulk operation error:', error);
      toast({
        title: "Operation Failed",
        description: error.message || "Failed to complete bulk operation.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setCurrentOperation(null);
      setBulkUpdateData({});
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkUpdateData.status) {
      throw new Error('Please select a status');
    }

    const updates = selectedProfiles.map(id => ({
      id,
      data: { status: bulkUpdateData.status }
    }));

    const result = await ProfileService.bulkUpdateProfiles(updates);
    if (result.error) throw result.error;
  };

  const handleBulkRoleUpdate = async () => {
    if (!bulkUpdateData.role) {
      throw new Error('Please select a role');
    }

    const updates = selectedProfiles.map(id => ({
      id,
      data: { role: bulkUpdateData.role }
    }));

    const result = await ProfileService.bulkUpdateProfiles(updates);
    if (result.error) throw result.error;
  };

  const handleBulkDelete = async () => {
    for (const profileId of selectedProfiles) {
      const result = await ProfileService.deleteProfile(profileId, { hardDelete: false });
      if (result.error) throw result.error;
    }
  };

  const handleExport = async () => {
    const selectedProfileData = profiles.filter(p => selectedProfiles.includes(p.id));
    
    // Create CSV content
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Role', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...selectedProfileData.map(profile => [
        profile.id,
        profile.first_name || '',
        profile.last_name || '',
        profile.email || '',
        profile.phone || '',
        profile.role || '',
        profile.status || '',
        profile.created_at || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profiles-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    // This would integrate with your email service
    toast({
      title: "Feature Coming Soon",
      description: "Bulk email functionality will be available soon.",
      variant: "info"
    });
  };

  const renderOperationDialog = () => {
    if (!currentOperation) return null;

    if (currentOperation.requiresData) {
      return (
        <Dialog open={!!currentOperation} onOpenChange={() => setCurrentOperation(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentOperation.label}</DialogTitle>
              <DialogDescription>
                Configure the {currentOperation.label.toLowerCase()} operation for {selectedCount} selected profiles.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {currentOperation.id === 'update_status' && (
                <div>
                  <label className="text-sm font-medium">New Status</label>
                  <Select onValueChange={(value) => setBulkUpdateData({ status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {currentOperation.id === 'update_role' && (
                <div>
                  <label className="text-sm font-medium">New Role</label>
                  <Select onValueChange={(value) => setBulkUpdateData({ role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCurrentOperation(null)}>
                Cancel
              </Button>
              <Button onClick={executeOperation} disabled={isLoading}>
                {isLoading ? 'Processing...' : `Update ${selectedCount} Profiles`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentOperation.dangerous && <AlertTriangle className="h-5 w-5 text-destructive" />}
              Confirm {currentOperation.label}
            </DialogTitle>
            <DialogDescription>
              {currentOperation.description} for {selectedCount} selected profiles.
              {currentOperation.dangerous && " This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant={currentOperation.dangerous ? "destructive" : "default"}
              onClick={executeOperation} 
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : `Confirm ${currentOperation.label}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (profiles.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Operations
          </div>
          <Badge variant="outline">
            {selectedCount} of {profiles.length} selected
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Selection controls */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm">
            {allSelected ? 'Deselect All' : someSelected ? 'Select All' : 'Select All'}
          </span>
        </div>

        {/* Operations */}
        {selectedCount > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {operations.map((operation) => {
              const Icon = operation.icon;
              return (
                <Button
                  key={operation.id}
                  variant={operation.dangerous ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => handleOperationClick(operation)}
                  disabled={isLoading}
                  className="justify-start gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {operation.label}
                </Button>
              );
            })}
          </div>
        )}

        {selectedCount === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Select profiles to enable bulk operations
          </p>
        )}
      </CardContent>

      {renderOperationDialog()}
    </Card>
  );
};

export default ProfileBulkOperations;
