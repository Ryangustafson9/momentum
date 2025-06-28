/**
 * Family Members Section Component
 * Handles family member management and display
 * Extracted from the massive MemberProfile component
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2,
  UserPlus,
  Heart,
  Mail,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMemberProfile } from '../MemberProfileContext';

// ==================== HELPER FUNCTIONS ====================

const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

const getRelationshipColor = (relationship) => {
  const colors = {
    spouse: 'bg-pink-100 text-pink-800 border-pink-200',
    partner: 'bg-purple-100 text-purple-800 border-purple-200',
    child: 'bg-blue-100 text-blue-800 border-blue-200',
    parent: 'bg-green-100 text-green-800 border-green-200',
    sibling: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    other: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colors[relationship] || colors.other;
};

// ==================== FAMILY MEMBER CARD ====================

const FamilyMemberCard = ({ member, onEdit, onRemove }) => {
  const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
    >
      <div className="flex items-start gap-3">
        
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.profile_picture_url} alt={fullName} />
          <AvatarFallback className="text-sm bg-primary/10 text-primary">
            {getInitials(member.first_name, member.last_name)}
          </AvatarFallback>
        </Avatar>

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">
              {fullName || 'Unnamed Member'}
            </h4>
            {member.relationship && (
              <Badge className={`text-xs ${getRelationshipColor(member.relationship)}`}>
                {member.relationship}
              </Badge>
            )}
          </div>
          
          {/* Contact Info */}
          <div className="space-y-1">
            {member.email && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Mail className="h-3 w-3" />
                <span className="truncate">{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Phone className="h-3 w-3" />
                <span>{member.phone}</span>
              </div>
            )}
          </div>

          {/* Member ID */}
          {member.system_member_id && (
            <p className="text-xs text-gray-500 mt-1">
              ID: {member.system_member_id}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(member)}
            className="h-8 w-8 p-0"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(member)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ==================== EMPTY STATE ====================

const EmptyState = ({ onAddMember }) => (
  <div className="text-center py-8">
    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">No Family Members</h3>
    <p className="text-gray-600 mb-4">
      Add family members to manage their memberships together.
    </p>
    <Button onClick={onAddMember}>
      <UserPlus className="h-4 w-4 mr-2" />
      Add Family Member
    </Button>
  </div>
);

// ==================== MAIN COMPONENT ====================

const FamilyMembersSection = () => {
  const { memberData, isLoading } = useMemberProfile();
  const [isAddingMember, setIsAddingMember] = useState(false);

  const familyMembers = memberData?.familyMembers || [];

  const handleAddMember = () => {
    setIsAddingMember(true);
    // Family member management dialog not yet implemented
    alert('Family member management coming soon!');
  };

  const handleEditMember = (member) => {
    // Family member editing not yet implemented
    alert(`Edit functionality for ${member?.name || 'family member'} coming soon!`);
  };

  const handleRemoveMember = (member) => {
    // Family member removal not yet implemented
    if (confirm(`Remove ${member?.name || 'family member'} from family? (Feature coming soon)`)) {
      alert('Family member removal functionality coming soon!');
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Family Members
            {familyMembers.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {familyMembers.length}
              </Badge>
            )}
          </CardTitle>
          {familyMembers.length > 0 && (
            <Button size="sm" onClick={handleAddMember}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {familyMembers.length === 0 ? (
          <EmptyState onAddMember={handleAddMember} />
        ) : (
          <div className="space-y-3">
            {familyMembers.map((member, index) => (
              <FamilyMemberCard
                key={member.id || index}
                member={member}
                onEdit={handleEditMember}
                onRemove={handleRemoveMember}
              />
            ))}
            
            {/* Add Another Member Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-2"
            >
              <Button
                variant="outline"
                onClick={handleAddMember}
                className="w-full border-dashed border-2 hover:border-primary hover:bg-primary/5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Family Member
              </Button>
            </motion.div>
          </div>
        )}

        {/* Family Management Info */}
        {familyMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <Heart className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Family Membership Benefits</p>
                <p>Family members can share membership benefits and billing. Manage individual access and permissions for each member.</p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default FamilyMembersSection;
