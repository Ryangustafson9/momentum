import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Edit3, Trash2, Crown, Heart, Baby, User, Shield,
  CreditCard, Share, UserPlus, AlertTriangle, CheckCircle, XCircle,
  DollarSign, Link, Unlink, Settings, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const FamilyManagementDialog = ({ memberData, isOpen, onClose, onUpdate }) => {
  const { toast } = useToast();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newMemberForm, setNewMemberForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relationship: '',
    relationshipType: 'shared', // 'shared' or 'sponsored'
    canCheckInOthers: false,
    canViewBilling: false,
    canManageFamily: false,
    emergencyContactPriority: 0,
    notes: ''
  });

  // Relationship options with icons
  const relationshipOptions = [
    { value: 'spouse', label: 'Spouse/Partner', icon: Heart },
    { value: 'child', label: 'Child', icon: Baby },
    { value: 'parent', label: 'Parent', icon: Shield },
    { value: 'sibling', label: 'Sibling', icon: User },
    { value: 'other', label: 'Other Family', icon: Users }
  ];

  // Fetch family members
  useEffect(() => {
    if (isOpen && memberData?.id) {
      fetchFamilyMembers();
    }
  }, [isOpen, memberData?.id]);

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          *,
          family_member:profiles!family_member_id(*),
          shared_membership:memberships!shared_membership_id(
            *,
            membership_type:membership_types!current_membership_type_id(*)
          ),
          sponsored_membership:memberships!sponsored_membership_id(
            *,
            membership_type:membership_types!current_membership_type_id(*)
          )
        `)
        .eq('primary_member_id', memberData.id)
        .eq('status', 'active');

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
      toast({
        title: "Error",
        description: "Failed to load family members.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFamilyMember = async () => {
    try {
      setAddingMember(true);

      // First, find or create the family member profile
      let familyMemberProfile;
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', newMemberForm.email)
        .single();

      if (existingProfile) {
        familyMemberProfile = existingProfile;
      } else {
        // Create new profile
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            first_name: newMemberForm.firstName,
            last_name: newMemberForm.lastName,
            email: newMemberForm.email,
            phone: newMemberForm.phone,
            role: 'member',
            status: 'active'
          })
          .select()
          .single();

        if (profileError) throw profileError;
        familyMemberProfile = newProfile;
      }

      // Create family member relationship
      const familyMemberData = {
        primary_member_id: memberData.id,
        family_member_id: familyMemberProfile.id,
        relationship: newMemberForm.relationship,
        relationship_type: newMemberForm.relationshipType,
        can_check_in_others: newMemberForm.canCheckInOthers,
        can_view_billing: newMemberForm.canViewBilling,
        can_manage_family: newMemberForm.canManageFamily,
        emergency_contact_priority: newMemberForm.emergencyContactPriority,
        notes: newMemberForm.notes,
        status: 'active'
      };

      const { error: relationError } = await supabase
        .from('family_members')
        .insert(familyMemberData);

      if (relationError) throw relationError;

      toast({
        title: "Family Member Added",
        description: `${newMemberForm.firstName} has been added to the family.`,
      });

      // Reset form and refresh
      setNewMemberForm({
        firstName: '', lastName: '', email: '', phone: '', relationship: '',
        relationshipType: 'shared', canCheckInOthers: false, canViewBilling: false,
        canManageFamily: false, emergencyContactPriority: 0, notes: ''
      });
      setShowAddForm(false);
      fetchFamilyMembers();
      if (onUpdate) onUpdate();

    } catch (error) {
      console.error('Error adding family member:', error);
      toast({
        title: "Error",
        description: "Failed to add family member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveFamilyMember = async (familyMemberId, memberName) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .update({ status: 'inactive' })
        .eq('id', familyMemberId);

      if (error) throw error;

      toast({
        title: "Family Member Removed",
        description: `${memberName} has been removed from the family.`,
      });

      fetchFamilyMembers();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error removing family member:', error);
      toast({
        title: "Error",
        description: "Failed to remove family member.",
        variant: "destructive",
      });
    }
  };

  const getRelationshipIcon = (relationship) => {
    const option = relationshipOptions.find(opt => opt.value === relationship);
    return option ? option.icon : User;
  };

  const getRelationshipTypeInfo = (relationshipType, sharedMembership, sponsoredMembership) => {
    if (relationshipType === 'shared') {
      return {
        type: 'Shared Membership',
        description: 'Shares the same membership plan',
        icon: Share,
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        membership: sharedMembership
      };
    } else {
      return {
        type: 'Sponsored Membership',
        description: 'Has their own membership paid by primary member',
        icon: CreditCard,
        color: 'bg-green-50 text-green-700 border-green-200',
        membership: sponsoredMembership
      };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Family Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage family relationships and membership arrangements
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
          disabled={showAddForm}
        >
          <Plus className="h-4 w-4" />
          Add Family Member
        </Button>
      </div>

      {/* Add Family Member Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add New Family Member
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newMemberForm.firstName}
                      onChange={(e) => setNewMemberForm(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newMemberForm.lastName}
                      onChange={(e) => setNewMemberForm(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMemberForm.email}
                      onChange={(e) => setNewMemberForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newMemberForm.phone}
                      onChange={(e) => setNewMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="relationship">Relationship</Label>
                    <Select
                      value={newMemberForm.relationship}
                      onValueChange={(value) => setNewMemberForm(prev => ({ ...prev, relationship: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="relationshipType">Membership Type</Label>
                    <Select
                      value={newMemberForm.relationshipType}
                      onValueChange={(value) => setNewMemberForm(prev => ({ ...prev, relationshipType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shared">
                          <div className="flex items-center gap-2">
                            <Share className="h-4 w-4" />
                            Shared Membership
                          </div>
                        </SelectItem>
                        <SelectItem value="sponsored">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Sponsored Membership
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddFamilyMember}
                    disabled={addingMember || !newMemberForm.firstName || !newMemberForm.lastName || !newMemberForm.relationship}
                  >
                    {addingMember ? 'Adding...' : 'Add Family Member'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Family Members List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading family members...</p>
          </div>
        ) : familyMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Family Members</p>
            <p className="text-sm">Add family members to manage relationships and memberships.</p>
          </div>
        ) : (
          familyMembers.map((member) => {
            const RelationshipIcon = getRelationshipIcon(member.relationship);
            const typeInfo = getRelationshipTypeInfo(
              member.relationship_type,
              member.shared_membership,
              member.sponsored_membership
            );
            const TypeIcon = typeInfo.icon;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <RelationshipIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">
                          {member.family_member?.first_name} {member.family_member?.last_name}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {relationshipOptions.find(opt => opt.value === member.relationship)?.label || member.relationship}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {member.family_member?.email}
                      </p>
                      
                      {/* Membership Type Badge */}
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border ${typeInfo.color}`}>
                        <TypeIcon className="h-3 w-3" />
                        {typeInfo.type}
                      </div>
                      
                      {/* Membership Details */}
                      {typeInfo.membership && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-medium">Membership:</span> {typeInfo.membership.membership_type?.name}
                        </div>
                      )}
                      
                      {/* Permissions */}
                      {(member.can_check_in_others || member.can_view_billing || member.can_manage_family) && (
                        <div className="mt-2 flex gap-1">
                          {member.can_check_in_others && (
                            <Badge variant="secondary" className="text-xs">Check-in Access</Badge>
                          )}
                          {member.can_view_billing && (
                            <Badge variant="secondary" className="text-xs">Billing Access</Badge>
                          )}
                          {member.can_manage_family && (
                            <Badge variant="secondary" className="text-xs">Family Management</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingMember(member)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFamilyMember(member.id, `${member.family_member?.first_name} ${member.family_member?.last_name}`)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FamilyManagementDialog;
