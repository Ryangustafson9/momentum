/**
 * Profile Tab Component
 * Displays and manages personal information, contact details, and family members
 * Extracted from the massive MemberProfile component
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Users,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMemberProfile } from '../MemberProfileContext';
import PersonalInfoSection from '../sections/PersonalInfoSection';
import ContactInfoSection from '../sections/ContactInfoSection';
import EmergencyContactSection from '../sections/EmergencyContactSection';
import FamilyMembersSection from '../sections/FamilyMembersSection';
import CustomFieldsSection from '../sections/CustomFieldsSection';

// ==================== HELPER FUNCTIONS ====================

const formatDate = (dateString) => {
  if (!dateString) return 'Not provided';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
};

const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    suspended: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };
  return colors[status] || colors.inactive;
};

// ==================== QUICK INFO CARD ====================

const QuickInfoCard = ({ memberData }) => {
  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Member Status */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Status</p>
              <Badge className={`text-xs ${getStatusColor(memberData?.status)}`}>
                {memberData?.status?.charAt(0).toUpperCase() + memberData?.status?.slice(1) || 'Unknown'}
              </Badge>
            </div>
          </div>

          {/* Member Since */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Member Since</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(memberData?.created_at)}
              </p>
            </div>
          </div>

          {/* Family Members */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Family Members</p>
              <p className="text-sm font-medium text-gray-900">
                {memberData?.familyMembers?.length || 0} linked
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================

const ProfileTab = () => {
  const { memberData, isLoading, hasUnsavedChanges } = useMemberProfile();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!memberData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Member Data</h3>
          <p className="text-gray-600">Unable to load member profile information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Quick Info Overview */}
      <QuickInfoCard memberData={memberData} />

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-amber-800">
            <Edit3 className="h-4 w-4" />
            <span className="text-sm font-medium">
              You have unsaved changes. Don't forget to save your edits.
            </span>
          </div>
        </motion.div>
      )}

      {/* Profile Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          <PersonalInfoSection />
          <ContactInfoSection />
          <EmergencyContactSection />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <FamilyMembersSection />
          <CustomFieldsSection />
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileTab;
