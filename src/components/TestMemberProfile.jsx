import React from 'react';
import { useParams } from 'react-router-dom';
import { logger } from '@/utils/logger';

const TestMemberProfile = () => {
  const { id } = useParams();
  
  logger.info('🧪 TEST COMPONENT: TestMemberProfile loaded');
  logger.info('📋 Member ID from params:', id);
  logger.info('🌐 Current URL:', window.location.href);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Member Profile</h1>
      <p>Member ID: {id}</p>
      <p>This is a test component to verify routing is working.</p>
      <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
        ✅ If you can see this, the routing to /staff-portal/member/:id is working correctly.
      </div>
    </div>
  );
};

export default TestMemberProfile;
