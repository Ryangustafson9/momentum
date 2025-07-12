import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Edit3, Trash2, Heart, Baby, User, Shield,
  CreditCard, Link, UserPlus, CheckCircle, XCircle, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import FamilyMemberAutocomplete from './FamilyMemberAutocomplete';

const FamilySection = ({ memberData, isEditing, onEdit, onSave, onCancel }) => {
  const { toast } = useToast();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);



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
    if (memberData?.id) {
      fetchFamilyMembers();
    }
  }, [memberData?.id]);

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          *,
          family_member:profiles!family_member_id(*)
        `)
        .eq('primary_member_id', memberData.id);

      if (error) {
        // If table doesn't exist or column doesn't exist, just set empty array
        if (error.code === '42P01' || error.code === '42703') {
          console.warn('Family members table or column not found:', error.message);
          setFamilyMembers([]);
          return;
        }
        throw error;
      }
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
      setFamilyMembers([]); // Set empty array instead of showing error
    } finally {
      setLoading(false);
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

  const getLinkingInfo = (relationshipType, billingResponsibility) => {
    const links = [];
    if (billingResponsibility === 'primary') {
      links.push({ type: 'Billing', icon: DollarSign, color: 'bg-green-50 text-green-700' });
    }
    if (relationshipType === 'shared') {
      links.push({ type: 'Membership', icon: Link, color: 'bg-blue-50 text-blue-700' });
    }
    return links;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900 text-sm">Family Members</h4>
          <p className="text-xs text-gray-500">Connected family members and their relationship types</p>
        </div>
        {isEditing && (
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="flex items-center gap-2"
            disabled={showAddForm}
          >
            <Plus className="h-4 w-4" />
            Add Family Member
          </Button>
        )}
      </div>

      {/* Enhanced Family Member Addition */}
      <AnimatePresence>
        {showAddForm && isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <FamilyMemberAutocomplete
              memberData={memberData}
              onMemberAdded={() => {
                setShowAddForm(false);
                fetchFamilyMembers();
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Family Members List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-xs text-gray-500 mt-2">Loading family members...</p>
          </div>
        ) : familyMembers.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No Family Members</p>
            <p className="text-xs">Add family members to manage relationships.</p>
          </div>
        ) : (
          familyMembers.map((member) => {
            const RelationshipIcon = getRelationshipIcon(member.relationship);
            const linkingInfo = getLinkingInfo(member.relationship_type, member.billing_responsibility);

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-lg p-2 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <RelationshipIcon className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-xs">
                          {member.family_member?.first_name} {member.family_member?.last_name}
                        </h5>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {relationshipOptions.find(opt => opt.value === member.relationship)?.label || member.relationship}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-gray-500 mb-1">
                        {member.family_member?.email}
                      </p>
                      
                      {/* Linking Status */}
                      {linkingInfo.length > 0 && (
                        <div className="flex gap-1">
                          {linkingInfo.map((link, index) => (
                            <div key={index} className={`inline-flex items-center gap-1 px-1 py-0.5 rounded text-[10px] ${link.color}`}>
                              <link.icon className="h-2 w-2" />
                              {link.type}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingMember(member)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFamilyMember(member.id, `${member.family_member?.first_name} ${member.family_member?.last_name}`)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FamilySection;
