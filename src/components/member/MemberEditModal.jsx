import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import ProfileModal from '@/components/profile/ProfileModal';

/**
 * Enhanced modal for editing member profile information using the new ProfileModal component
 */
const MemberEditModal = ({
  isOpen,
  onClose,
  member,
  onMemberUpdated
}) => {
  const { toast } = useToast();

  const handleSave = async (formData, validation) => {
    if (!member) return;

    try {
      const { data: updatedMember, error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', member.id)
        .select()
        .single();

      if (error) throw error;

      onMemberUpdated?.(updatedMember);
    } catch (error) {
      console.error('Error updating member profile:', error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  };

  return (
    <ProfileModal
      isOpen={isOpen}
      onClose={onClose}
      profileData={member}
      userRole="member"
      mode="edit"
      onSave={handleSave}
      showTabs={false}
      title="Edit Member Profile"
      description="Update the member's information and settings."
    />
  );
};

export default MemberEditModal;

