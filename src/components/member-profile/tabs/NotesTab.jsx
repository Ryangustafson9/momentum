/**
 * Notes Tab Component
 * Displays and manages staff notes and member documents
 */

import { FileText, Plus, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMemberProfile } from '../MemberProfileContext';

const NotesTab = () => {
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes & Documents
          </CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-600">Staff notes and document management will be available here.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotesTab;
