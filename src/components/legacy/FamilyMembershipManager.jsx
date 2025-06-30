import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Crown, 
  User, 
  Mail, 
  Phone,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const FamilyMembershipManager = ({ membershipData, onUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [removingMember, setRemovingMember] = useState(null);
  const [newMemberForm, setNewMemberForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relationship: ''
  });
  const [editMemberForm, setEditMemberForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relationship: ''
  });

  // Membership pricing tiers
  const membershipTiers = {
    individual: { basePrice: 49.99, maxIncluded: 1, additionalPrice: 0 },
    couple: { basePrice: 79.99, maxIncluded: 2, additionalPrice: 0 },
    family: { basePrice: 99.99, maxIncluded: 4, additionalPrice: 12.99 }
  };

  // Calculate current pricing
  const calculatePricing = (memberCount, currentTier) => {
    const tier = membershipTiers[currentTier] || membershipTiers.family;
    const basePrice = tier.basePrice;
    const additionalMembers = Math.max(0, memberCount - tier.maxIncluded);
    const additionalCost = additionalMembers * tier.additionalPrice;
    return {
      basePrice,
      additionalCost,
      totalPrice: basePrice + additionalCost,
      additionalMembers
    };
  };

  // Fetch family members
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('family_members')
          .select(`
            *,
            family_member:profiles!family_member_id(*)
          `)
          .eq('primary_member_id', user.id);

        if (error) throw error;
        setFamilyMembers(data || []);
      } catch (error) {
        
        toast({
          title: "Error",
          description: "Failed to load family members.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyMembers();
  }, [user, toast]);

  const handleAddMember = async () => {
    if (!newMemberForm.firstName || !newMemberForm.lastName || !newMemberForm.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // First, check if this person is already a family member
      const { data: existingFamilyMember } = await supabase
        .from('family_members')
        .select('*')
        .eq('primary_member_id', user.id)
        .eq('family_member_id', (
          await supabase
            .from('profiles')
            .select('id')
            .eq('email', newMemberForm.email)
            .single()
        )?.data?.id)
        .single();

      if (existingFamilyMember) {
        toast({
          title: "Already Family Member",
          description: "This person is already part of your family membership.",
          variant: "destructive",
        });
        return;
      }

      // Find or create the user profile
      let familyMemberProfile;
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', newMemberForm.email)
        .single();

      if (existingProfile) {
        // Use existing profile
        familyMemberProfile = existingProfile;

        // Update existing profile to ensure they have member role
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role: 'member',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id);

        if (updateError) {
          
        }

        
      } else {
        // Create new profile for family member with correct member role
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            email: newMemberForm.email,
            first_name: newMemberForm.firstName,
            last_name: newMemberForm.lastName,
            name: `${newMemberForm.firstName} ${newMemberForm.lastName}`,
            phone: newMemberForm.phone,
            role: 'member', // Use 'member' role instead of 'family_member'
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (profileError) throw profileError;
        familyMemberProfile = newProfile;
        
      }

      // Add family member relationship
      const { error: relationError } = await supabase
        .from('family_members')
        .insert({
          primary_member_id: user.id,
          family_member_id: familyMemberProfile.id,
          relationship: newMemberForm.relationship,
          created_at: new Date().toISOString()
        });

      if (relationError) throw relationError;

      // Refresh family members list
      const { data: updatedMembers } = await supabase
        .from('family_members')
        .select(`
          *,
          family_member:profiles!family_member_id(*)
        `)
        .eq('primary_member_id', user.id);

      setFamilyMembers(updatedMembers || []);
      setNewMemberForm({ firstName: '', lastName: '', email: '', phone: '', relationship: '' });
      setAddingMember(false);

      toast({
        title: "Family Member Added",
        description: `${newMemberForm.firstName} has been added to your family membership.`,
      });

      // Notify parent component of update
      if (onUpdate) onUpdate();

    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to add family member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove family member
  const removeFamilyMember = async (familyMemberId, memberName) => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', familyMemberId)
        .eq('primary_member_id', user.id);

      if (error) throw error;

      // Update local state
      setFamilyMembers(prev => prev.filter(member => member.id !== familyMemberId));
      setRemovingMember(null);

      toast({
        title: "Family Member Removed",
        description: `${memberName} has been removed from your family membership.`,
      });

      // Notify parent component of update
      if (onUpdate) onUpdate();

    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to remove family member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Edit family member
  const editFamilyMember = async () => {
    if (!user?.id || !editingMember) return;

    try {
      setLoading(true);

      // Update the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: editMemberForm.firstName,
          last_name: editMemberForm.lastName,
          phone: editMemberForm.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingMember.family_member_id);

      if (profileError) throw profileError;

      // Update the family member relationship
      const { error: familyError } = await supabase
        .from('family_members')
        .update({
          relationship: editMemberForm.relationship,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingMember.id);

      if (familyError) throw familyError;

      // Refresh family members list
      const { data: updatedMembers } = await supabase
        .from('family_members')
        .select(`
          *,
          family_member:profiles!family_member_id(*)
        `)
        .eq('primary_member_id', user.id);

      setFamilyMembers(updatedMembers || []);
      setEditingMember(null);
      setEditMemberForm({ firstName: '', lastName: '', email: '', phone: '', relationship: '' });

      toast({
        title: "Family Member Updated",
        description: `${editMemberForm.firstName}'s information has been updated.`,
      });

      // Notify parent component of update
      if (onUpdate) onUpdate();

    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to update family member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const totalMembers = 1 + familyMembers.length; // Primary + family members
  const currentTier = membershipData?.membership_type?.member_type || 'family';
  const pricing = calculatePricing(totalMembers, currentTier);

  if (loading && familyMembers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading family members...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Family Membership Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Pricing Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Current Membership Pricing
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Members:</span>
              <span className="font-medium ml-2">{totalMembers}</span>
            </div>
            <div>
              <span className="text-gray-600">Base Price:</span>
              <span className="font-medium ml-2">${pricing.basePrice}/month</span>
            </div>
            {pricing.additionalMembers > 0 && (
              <>
                <div>
                  <span className="text-gray-600">Additional Members:</span>
                  <span className="font-medium ml-2">{pricing.additionalMembers}</span>
                </div>
                <div>
                  <span className="text-gray-600">Additional Cost:</span>
                  <span className="font-medium ml-2">${pricing.additionalCost}/month</span>
                </div>
              </>
            )}
            <div className="col-span-2 pt-2 border-t">
              <span className="text-gray-600">Total Monthly Cost:</span>
              <span className="font-bold text-lg ml-2">${pricing.totalPrice}/month</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Primary Member */}
        <div>
          <h4 className="font-semibold mb-3">Primary Member</h4>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Crown className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-grow">
              <p className="font-medium">{user?.first_name} {user?.last_name}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            <Badge className="bg-green-100 text-green-800">Primary</Badge>
          </div>
        </div>

        {/* Family Members */}
        {familyMembers.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Family Members</h4>
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium">
                      {member.family_member?.first_name} {member.family_member?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{member.family_member?.email}</p>
                    {member.family_member?.phone && (
                      <p className="text-sm text-gray-500">{member.family_member?.phone}</p>
                    )}
                    {member.relationship && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {member.relationship}
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingMember(member);
                        setEditMemberForm({
                          firstName: member.family_member?.first_name || '',
                          lastName: member.family_member?.last_name || '',
                          email: member.family_member?.email || '',
                          phone: member.family_member?.phone || '',
                          relationship: member.relationship || ''
                        });
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRemovingMember(member)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Add Family Member */}
        <div>
          {!addingMember ? (
            <Button
              onClick={() => setAddingMember(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Family Member
            </Button>
          ) : (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-semibold">Add New Family Member</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newMemberForm.firstName}
                    onChange={(e) => setNewMemberForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newMemberForm.lastName}
                    onChange={(e) => setNewMemberForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newMemberForm.phone}
                    onChange={(e) => setNewMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
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
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button onClick={handleAddMember} disabled={loading}>
                  {loading ? 'Adding...' : 'Add Member'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddingMember(false);
                    setNewMemberForm({ firstName: '', lastName: '', email: '', phone: '', relationship: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>

              {pricing.additionalMembers >= 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Pricing Update</p>
                    <p className="text-yellow-700">
                      Adding this member will {pricing.additionalMembers > 0 ? `increase your monthly cost by $${membershipTiers[currentTier]?.additionalPrice || 12.99}` : 'not change your current pricing'}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit Member Modal */}
        {editingMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold mb-4">Edit Family Member</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editFirstName">First Name *</Label>
                    <Input
                      id="editFirstName"
                      value={editMemberForm.firstName}
                      onChange={(e) => setEditMemberForm(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="First Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editLastName">Last Name *</Label>
                    <Input
                      id="editLastName"
                      value={editMemberForm.lastName}
                      onChange={(e) => setEditMemberForm(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="editEmail">Email Address</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editMemberForm.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editPhone">Phone Number</Label>
                    <Input
                      id="editPhone"
                      value={editMemberForm.phone}
                      onChange={(e) => setEditMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editRelationship">Relationship</Label>
                    <Select
                      value={editMemberForm.relationship}
                      onValueChange={(value) => setEditMemberForm(prev => ({ ...prev, relationship: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button onClick={editFamilyMember} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Member'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingMember(null);
                    setEditMemberForm({ firstName: '', lastName: '', email: '', phone: '', relationship: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Remove Member Confirmation Modal */}
        {removingMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold mb-4 text-red-600">Remove Family Member</h3>

              <p className="text-gray-600 mb-6">
                Are you sure you want to remove <strong>{removingMember.family_member?.first_name} {removingMember.family_member?.last_name}</strong> from your family membership? This action cannot be undone.
              </p>

              <div className="bg-yellow-50 p-3 rounded-lg mb-6">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Important</p>
                    <p className="text-yellow-700">
                      Removing this member may reduce your monthly cost if they were an additional member.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="destructive"
                  onClick={() => removeFamilyMember(removingMember.id, removingMember.family_member?.first_name)}
                  disabled={loading}
                >
                  {loading ? 'Removing...' : 'Remove Member'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRemovingMember(null)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FamilyMembershipManager;

