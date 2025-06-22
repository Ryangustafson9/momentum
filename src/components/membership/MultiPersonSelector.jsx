import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Minus, User, Heart, Baby } from 'lucide-react';

const MultiPersonSelector = ({ 
  selectedPlan, 
  familyMembers, 
  onFamilyMembersChange,
  maxMembers = 1 
}) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    relationship: 'spouse'
  });

  const canAddMoreMembers = familyMembers.length < maxMembers - 1; // -1 for primary member

  const handleAddMember = () => {
    if (newMember.firstName && newMember.lastName) {
      const member = {
        id: Date.now().toString(),
        ...newMember,
        role: 'dependent'
      };
      
      onFamilyMembersChange([...familyMembers, member]);
      
      // Reset form
      setNewMember({
        firstName: '',
        lastName: '',
        email: '',
        dateOfBirth: '',
        relationship: 'spouse'
      });
      setShowAddMember(false);
    }
  };

  const handleRemoveMember = (memberId) => {
    onFamilyMembersChange(familyMembers.filter(m => m.id !== memberId));
  };

  const getRelationshipIcon = (relationship) => {
    switch (relationship) {
      case 'spouse': return <Heart className="w-4 h-4" />;
      case 'child': return <Baby className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRelationshipColor = (relationship) => {
    switch (relationship) {
      case 'spouse': return 'bg-pink-100 text-pink-800';
      case 'child': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Don't show for individual memberships
  if (maxMembers <= 1) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">
          Family Members
        </h3>
        <p className="text-white/80">
          Add up to {maxMembers - 1} additional {maxMembers === 2 ? 'member' : 'family members'} to your {selectedPlan?.name}
        </p>
      </div>

      {/* Current Family Members */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Family Members ({familyMembers.length + 1}/{maxMembers})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Member (Current User) */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">You (Primary Member)</p>
                <p className="text-sm text-white/70">Account holder & billing contact</p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
          </div>

          {/* Added Family Members */}
          {familyMembers.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                  {getRelationshipIcon(member.relationship)}
                </div>
                <div>
                  <p className="font-medium text-white">
                    {member.firstName} {member.lastName}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge className={getRelationshipColor(member.relationship)}>
                      {member.relationship}
                    </Badge>
                    {member.email && (
                      <span className="text-xs text-white/70">{member.email}</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveMember(member.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}

          {/* Add Member Button/Form */}
          {canAddMoreMembers && (
            <div className="space-y-4">
              {!showAddMember ? (
                <Button
                  variant="outline"
                  onClick={() => setShowAddMember(true)}
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Family Member
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 p-4 bg-white/5 rounded-lg"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-white">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newMember.firstName}
                        onChange={(e) => setNewMember({...newMember, firstName: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-white">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={newMember.lastName}
                        onChange={(e) => setNewMember({...newMember, lastName: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="relationship" className="text-white">Relationship</Label>
                      <Select 
                        value={newMember.relationship} 
                        onValueChange={(value) => setNewMember({...newMember, relationship: value})}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse/Partner</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="dependent">Other Dependent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth" className="text-white">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newMember.dateOfBirth}
                        onChange={(e) => setNewMember({...newMember, dateOfBirth: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-white">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleAddMember}
                      disabled={!newMember.firstName || !newMember.lastName}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Add Member
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddMember(false)}
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {!canAddMoreMembers && familyMembers.length > 0 && (
            <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
              <p className="text-yellow-200 text-sm">
                Maximum family members reached for this membership type
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Family Membership Benefits */}
      {familyMembers.length > 0 && (
        <Card className="bg-white/5 border-white/20">
          <CardContent className="p-4">
            <h4 className="text-white font-medium mb-2">Family Membership Benefits</h4>
            <ul className="text-white/80 text-sm space-y-1">
              <li>• Each member gets their own access card and barcode</li>
              <li>• Shared billing under the primary account</li>
              <li>• Individual workout tracking and progress</li>
              <li>• Family member management from your dashboard</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default MultiPersonSelector;

