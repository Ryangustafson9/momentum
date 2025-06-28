import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Shield, 
  Users, 
  Settings, 
  Eye,
  EyeOff,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AccountAccess = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [familyMembers, setFamilyMembers] = useState([
    {
      id: 'family-1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      relationship: 'Spouse',
      hasPortalAccess: true,
      permissions: {
        viewBilling: true,
        makePayments: false,
        bookReservations: true,
        registerPrograms: true,
        viewStatement: true
      },
      status: 'active'
    },
    {
      id: 'family-2',
      name: 'Michael Johnson',
      email: 'mike.johnson@email.com',
      relationship: 'Child',
      hasPortalAccess: true,
      permissions: {
        viewBilling: false,
        makePayments: false,
        bookReservations: true,
        registerPrograms: true,
        viewStatement: false
      },
      status: 'active'
    },
    {
      id: 'family-3',
      name: 'Emma Johnson',
      email: 'emma.johnson@email.com',
      relationship: 'Child',
      hasPortalAccess: false,
      permissions: {
        viewBilling: false,
        makePayments: false,
        bookReservations: false,
        registerPrograms: false,
        viewStatement: false
      },
      status: 'inactive'
    }
  ]);

  const handleToggleAccess = (memberId) => {
    setFamilyMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, hasPortalAccess: !member.hasPortalAccess }
        : member
    ));
    
    toast({
      title: "Access Updated",
      description: "Family member portal access has been updated.",
      variant: "default"
    });
  };

  const handlePermissionChange = (memberId, permission) => {
    setFamilyMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { 
            ...member, 
            permissions: {
              ...member.permissions,
              [permission]: !member.permissions[permission]
            }
          }
        : member
    ));
    
    toast({
      title: "Permission Updated",
      description: "Family member permissions have been updated.",
      variant: "default"
    });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRelationshipColor = (relationship) => {
    switch (relationship.toLowerCase()) {
      case 'spouse': return 'bg-blue-100 text-blue-800';
      case 'child': return 'bg-green-100 text-green-800';
      case 'parent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Access</h1>
        <p className="text-muted-foreground">Manage portal access and permissions for your family members</p>
      </div>

      {/* Primary Account Holder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Primary Account Holder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.profile_picture_url} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {getInitials(user?.first_name + ' ' + user?.last_name || 'User')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user?.first_name} {user?.last_name}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <Badge variant="default" className="mt-1">Primary Account</Badge>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Full Access
              </Badge>
              <p className="text-sm text-gray-500 mt-1">All permissions enabled</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Members */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Members
            </CardTitle>
            <Button variant="outline" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Family Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {familyMembers.map((member) => (
              <div key={member.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-600 text-white">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                    <Badge className={getRelationshipColor(member.relationship)}>
                      {member.relationship}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Portal Access</span>
                      <Switch
                        checked={member.hasPortalAccess}
                        onCheckedChange={() => handleToggleAccess(member.id)}
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {member.hasPortalAccess && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Portal Permissions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">View Billing</span>
                        <Switch
                          checked={member.permissions.viewBilling}
                          onCheckedChange={() => handlePermissionChange(member.id, 'viewBilling')}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Make Payments</span>
                        <Switch
                          checked={member.permissions.makePayments}
                          onCheckedChange={() => handlePermissionChange(member.id, 'makePayments')}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Book Reservations</span>
                        <Switch
                          checked={member.permissions.bookReservations}
                          onCheckedChange={() => handlePermissionChange(member.id, 'bookReservations')}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Register Programs</span>
                        <Switch
                          checked={member.permissions.registerPrograms}
                          onCheckedChange={() => handlePermissionChange(member.id, 'registerPrograms')}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">View Statement</span>
                        <Switch
                          checked={member.permissions.viewStatement}
                          onCheckedChange={() => handlePermissionChange(member.id, 'viewStatement')}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!member.hasPortalAccess && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <EyeOff className="h-4 w-4" />
                      <span className="text-sm">Portal access is disabled for this family member</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Require approval for new family member access</p>
              <p className="text-sm text-gray-600">New family members must be approved before gaining portal access</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Email notifications for permission changes</p>
              <p className="text-sm text-gray-600">Get notified when family member permissions are modified</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Two-factor authentication for billing access</p>
              <p className="text-sm text-gray-600">Require 2FA for viewing billing information and making payments</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountAccess;
