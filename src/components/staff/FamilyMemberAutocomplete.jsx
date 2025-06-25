import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, User, Mail, Phone, CheckCircle, XCircle,
  Heart, Baby, Shield, Link, DollarSign, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const FamilyMemberAutocomplete = ({ memberData, onMemberAdded, onCancel }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relationship: '',
    linkedByBilling: false,
    linkedByMembership: false
  });

  // Relationship options with icons
  const relationshipOptions = [
    { value: 'spouse', label: 'Spouse/Partner', icon: Heart },
    { value: 'child', label: 'Child', icon: Baby },
    { value: 'parent', label: 'Parent', icon: Shield },
    { value: 'sibling', label: 'Sibling', icon: User },
    { value: 'other', label: 'Other Family', icon: Users }
  ];

  // Search for existing profiles
  useEffect(() => {
    const searchProfiles = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            memberships:memberships!auth_user_id(
              *,
              membership_type:membership_types!current_membership_type_id(name, status)
            )
          `)
          .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .eq('role', 'member')
          .limit(8);

        if (error) throw error;
        
        // Filter out the current member and existing family members
        const filteredResults = data?.filter(profile => {
          return profile.id !== memberData.id;
          // TODO: Also filter out existing family members
        }) || [];

        setSearchResults(filteredResults);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching profiles:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchProfiles, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, memberData.id]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
    setSearchQuery(`${profile.first_name} ${profile.last_name}`);
    setFormData(prev => ({
      ...prev,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      email: profile.email || '',
      phone: profile.phone || ''
    }));
    setShowDropdown(false);
    setIsCreatingNew(false);
  };

  const handleCreateNew = () => {
    setSelectedProfile(null);
    setIsCreatingNew(true);
    setFormData(prev => ({
      ...prev,
      firstName: '',
      lastName: '',
      email: searchQuery.includes('@') ? searchQuery : '',
      phone: ''
    }));
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    if (!formData.relationship) {
      toast({
        title: "Missing Information",
        description: "Please select a relationship type.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Missing Information",
        description: "Please provide first and last name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Use existing profile or create new one
      let familyMemberProfile = selectedProfile;
      
      if (!familyMemberProfile) {
        // Create new profile
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
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
        relationship: formData.relationship,
        relationship_type: formData.linkedByMembership ? 'shared' : 'sponsored',
        billing_responsibility: formData.linkedByBilling ? 'primary' : 'independent',
        status: 'active'
      };

      const { error: relationError } = await supabase
        .from('family_members')
        .insert(familyMemberData);

      if (relationError) throw relationError;

      toast({
        title: "Family Member Added",
        description: `${formData.firstName} has been added to the family.`,
      });

      onMemberAdded();
    } catch (error) {
      console.error('Error adding family member:', error);
      toast({
        title: "Error",
        description: "Failed to add family member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getMembershipStatus = (memberships) => {
    if (!memberships || memberships.length === 0) return 'No Membership';
    const activeMembership = memberships.find(m => m.status === 'active');
    return activeMembership?.membership_type?.name || 'Inactive';
  };

  return (
    <div className="space-y-3 p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <Label htmlFor="memberSearch">Add Family Member</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={searchInputRef}
            id="memberSearch"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email, or type to create new..."
            className="pl-10 pr-4"
            onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-form-type="other"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            >
              {searchResults.length > 0 ? (
                <>
                  {searchResults.map((profile) => (
                    <div
                      key={profile.id}
                      onClick={() => handleProfileSelect(profile)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(profile.first_name, profile.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {profile.first_name} {profile.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getMembershipStatus(profile.memberships)}
                          </Badge>
                        </div>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  ))}
                  <div
                    onClick={handleCreateNew}
                    className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer border-t border-gray-200 bg-blue-50/50"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-blue-700">Create New Member</p>
                      <p className="text-xs text-blue-600">Add "{searchQuery}" as a new family member</p>
                    </div>
                  </div>
                </>
              ) : searchQuery.length >= 2 ? (
                <div
                  onClick={handleCreateNew}
                  className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-blue-700">Create New Member</p>
                    <p className="text-xs text-blue-600">No existing members found. Create new profile.</p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Profile or New Member Form */}
      {(selectedProfile || isCreatingNew) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3 pt-3 border-t border-gray-200"
        >
          {/* Profile Preview */}
          {selectedProfile && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {getInitials(selectedProfile.first_name, selectedProfile.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{selectedProfile.first_name} {selectedProfile.last_name}</p>
                <p className="text-sm text-gray-600">{selectedProfile.email}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {getMembershipStatus(selectedProfile.memberships)}
                </Badge>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          )}

          {/* New Member Form Fields */}
          {isCreatingNew && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          )}

          {/* Relationship and Linking Options */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="relationship">Relationship</Label>
              <Select
                value={formData.relationship}
                onValueChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Linked by Billing</Label>
                  <p className="text-xs text-gray-500">Primary handles billing</p>
                </div>
                <Switch
                  checked={formData.linkedByBilling}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, linkedByBilling: checked }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Linked by Membership</Label>
                  <p className="text-xs text-gray-500">Shares membership plan</p>
                </div>
                <Switch
                  checked={formData.linkedByMembership}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, linkedByMembership: checked }))}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={onCancel} size="sm">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.relationship}
              size="sm"
            >
              {isSubmitting ? 'Adding...' : 'Add Family Member'}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FamilyMemberAutocomplete;
