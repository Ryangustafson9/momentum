/**
 * Communication Tab Component
 * Displays member's communication history and logs
 */

import { MessageSquare, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemberProfile } from '../MemberProfileContext';

const CommunicationTab = () => {
  const { memberData, isLoading } = useMemberProfile();

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Communication Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-600">Communication history and messaging will be available here.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunicationTab;
