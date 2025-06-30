import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, MapPin, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useClubContext } from '@/hooks/useClubContext.jsx';
import { useToast } from '@/hooks/use-toast';

const ClubSwitcher = () => {
  const { 
    currentClub, 
    availableClubs, 
    isLoading, 
    switchClub, 
    canAccessMultipleClubs 
  } = useClubContext();
  const { toast } = useToast();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleClubSwitch = async (clubId) => {
    if (clubId === currentClub?.id) return;

    setIsSwitching(true);
    try {
      const newClub = await switchClub(clubId);
      
      toast({
        title: "Club Switched",
        description: `Now viewing data for ${newClub.name}`,
        variant: "default",
      });

      // Refresh the page to ensure all components load with new club context
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error switching clubs:', error);
      toast({
        title: "Switch Failed",
        description: "Failed to switch clubs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm text-gray-600">Loading club access...</span>
        </CardContent>
      </Card>
    );
  }

  if (!canAccessMultipleClubs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4" />
            Current Club
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentClub ? (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">{currentClub.name}</div>
                <div className="text-xs text-gray-500">Single club access</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">No club access configured</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4" />
          Club Switcher
        </CardTitle>
        <CardDescription>
          Switch between clubs you have access to
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Club Display */}
        {currentClub && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-blue-900">{currentClub.name}</div>
                  <div className="text-xs text-blue-600">Currently active</div>
                </div>
              </div>
              <Badge variant="default" className="bg-blue-600">
                Active
              </Badge>
            </div>
          </div>
        )}

        {/* Club Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Switch to Club:</label>
          <Select 
            value={currentClub?.id || ''} 
            onValueChange={handleClubSwitch}
            disabled={isSwitching}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a club..." />
            </SelectTrigger>
            <SelectContent>
              {availableClubs.map((club) => (
                <SelectItem key={club.id} value={club.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    {club.name}
                    {club.id === currentClub?.id && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Club Access Summary */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Total accessible clubs:</span>
            <Badge variant="outline" className="text-xs">
              {availableClubs.length}
            </Badge>
          </div>
        </div>

        {/* Switching Status */}
        {isSwitching && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
            <Loader2 className="h-4 w-4 animate-spin" />
            Switching clubs...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubSwitcher;
