/**
 * Member Profile Container
 * Main orchestrator component that replaces the massive MemberProfile.jsx
 * Handles routing, data loading, and component composition
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MemberProfileProvider, useMemberProfile } from './MemberProfileContext';
import MemberProfileHeader from './MemberProfileHeader';
import MemberProfileTabs from './MemberProfileTabs';

// ==================== ERROR BOUNDARY ====================

const ErrorFallback = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <Card className="w-full max-w-md">
      <CardContent className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to Load Member Profile
        </h2>
        <p className="text-gray-600 mb-4">
          {error || 'An unexpected error occurred while loading the member profile.'}
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

// ==================== LOADING STATE ====================

const LoadingState = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
      <p className="text-gray-600">Loading member profile...</p>
    </div>
  </div>
);

// ==================== MAIN CONTENT COMPONENT ====================

const MemberProfileContent = () => {
  const { 
    memberData, 
    isLoading, 
    error, 
    loadMemberData,
    hasUnsavedChanges 
  } = useMemberProfile();

  const navigate = useNavigate();

  // Load data on mount
  useEffect(() => {
    loadMemberData();
  }, [loadMemberData]);

  // Handle browser back/refresh with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Loading state
  if (isLoading && !memberData) {
    return <LoadingState />;
  }

  // Error state
  if (error && !memberData) {
    return <ErrorFallback error={error} onRetry={loadMemberData} />;
  }

  // No member found
  if (!memberData && !isLoading) {
    return (
      <ErrorFallback 
        error="Member not found" 
        onRetry={() => navigate('/staff-portal/members')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-2 sm:px-4 py-6 space-y-6"
      >
        {/* Member Profile Header */}
        <MemberProfileHeader />

        {/* Member Profile Tabs */}
        <MemberProfileTabs />

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    You have unsaved changes
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// ==================== CONTAINER WITH PROVIDER ====================

const MemberProfileContainer = () => {
  const { id: systemMemberId } = useParams();
  const navigate = useNavigate();

  // Validate member ID
  if (!systemMemberId) {
    return (
      <ErrorFallback 
        error="No member ID provided" 
        onRetry={() => navigate('/staff-portal/members')} 
      />
    );
  }

  return (
    <MemberProfileProvider memberId={systemMemberId}>
      <MemberProfileContent />
    </MemberProfileProvider>
  );
};

export default MemberProfileContainer;
