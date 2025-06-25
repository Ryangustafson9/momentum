import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { LocationService } from '@/lib/services/locationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  MapPin, 
  Shield, 
  Plus, 
  Trash2, 
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const StaffLocationPermissions = () => {
  const { user } = useAuth();
  const { availableLocations } = useLocationContext();
  const { toast } = useToast();
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [permissionForm, setPermissionForm] = useState({
    locationId: '',
    accessLevel: 'full',
    notes: ''
  });

  useEffect(() => {
    loadStaffPermissions();
  }, []);

  const loadStaffPermissions = async () => {
    try {
      setLoading(true);
      const result = await LocationService.getOrganizationStaffPermissions(user.organization_id);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      setStaffMembers(result.data || []);
    } catch (error) {
      console.error('Error loading staff permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff permissions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedStaff || !permissionForm.locationId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a staff member and location',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await LocationService.grantLocationAccess(
        selectedStaff.id,
        permissionForm.locationId,
        user.id,
        permissionForm.accessLevel,
        permissionForm.notes
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: 'Success',
        description: 'Location access granted successfully'
      });
      setIsDialogOpen(false);
      setPermissionForm({ locationId: '', accessLevel: 'full', notes: '' });
      loadStaffPermissions();
    } catch (error) {
      console.error('Error granting access:', error);
      toast({
        title: 'Error',
        description: 'Failed to grant location access',
        variant: 'destructive'
      });
    }
  };

  const handleRevokeAccess = async (staffId, locationId) => {
    try {
      const result = await LocationService.revokeLocationAccess(
        staffId,
        locationId,
        user.id,
        'Access revoked by admin'
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: 'Success',
        description: 'Location access revoked successfully'
      });
      loadStaffPermissions();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke location access',
        variant: 'destructive'
      });
    }
  };

  const getAccessLevelBadge = (level) => {
    const variants = {
      full: 'default',
      read_only: 'secondary',
      limited: 'outline'
    };

    const labels = {
      full: 'Full Access',
      read_only: 'Read Only',
      limited: 'Limited'
    };

    return (
      <Badge variant={variants[level] || 'outline'}>
        {labels[level] || level}
      </Badge>
    );
  };

  const getLocationName = (locationId) => {
    const location = availableLocations.find(loc => loc.id === locationId);
    return location?.name || 'Unknown Location';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading staff permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff Location Permissions</h2>
          <p className="text-muted-foreground">
            Manage which locations your staff members can access
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Grant Access
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Location Access</DialogTitle>
              <DialogDescription>
                Grant a staff member access to a specific location
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="staff-select">Staff Member</Label>
                <Select 
                  value={selectedStaff?.id || ''} 
                  onValueChange={(value) => {
                    const staff = staffMembers.find(s => s.id === value);
                    setSelectedStaff(staff);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {staff.name || staff.email}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location-select">Location</Label>
                <Select 
                  value={permissionForm.locationId} 
                  onValueChange={(value) => setPermissionForm(prev => ({ ...prev, locationId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {location.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="access-level">Access Level</Label>
                <Select 
                  value={permissionForm.accessLevel} 
                  onValueChange={(value) => setPermissionForm(prev => ({ ...prev, accessLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Access</SelectItem>
                    <SelectItem value="read_only">Read Only</SelectItem>
                    <SelectItem value="limited">Limited Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this permission..."
                  value={permissionForm.notes}
                  onChange={(e) => setPermissionForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGrantAccess}>
                Grant Access
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {staffMembers.map((staff) => (
          <StaffPermissionCard
            key={staff.id}
            staff={staff}
            availableLocations={availableLocations}
            onRevokeAccess={handleRevokeAccess}
            getAccessLevelBadge={getAccessLevelBadge}
            getLocationName={getLocationName}
          />
        ))}
      </div>
    </div>
  );
};

const StaffPermissionCard = ({ 
  staff, 
  availableLocations, 
  onRevokeAccess, 
  getAccessLevelBadge, 
  getLocationName 
}) => {
  const activePermissions = staff.staff_location_access?.filter(p => p.is_active) || [];
  const hasGlobalAccess = staff.location_access_level === 'global';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {staff.name || staff.email}
            {hasGlobalAccess && (
              <Badge variant="secondary">
                <Globe className="h-3 w-3 mr-1" />
                Global Access
              </Badge>
            )}
          </CardTitle>
          <Badge variant="outline">
            {activePermissions.length} location{activePermissions.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {hasGlobalAccess ? (
          <div className="text-center py-4 text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2" />
            <p>This user has global access to all locations</p>
          </div>
        ) : activePermissions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Granted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activePermissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {permission.location?.name || getLocationName(permission.location_id)}
                  </TableCell>
                  <TableCell>
                    {getAccessLevelBadge(permission.access_level)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(permission.granted_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRevokeAccess(staff.id, permission.location_id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>No location access granted</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffLocationPermissions;
