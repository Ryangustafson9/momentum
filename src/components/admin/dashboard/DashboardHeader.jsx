import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit3, Plus, Save } from 'lucide-react';

const DashboardHeader = ({ 
  isEditMode, 
  onToggleEditMode, 
  onOpenAddCardDialog 
}) => {
  return (
    <div className="border-b border-border pb-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Staff Dashboard
          </h1>
          <p className="text-muted-foreground text-base">
            Welcome back! Here's what's happening at your gym today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={onToggleEditMode}
            variant={isEditMode ? "destructive" : "default"}
            size="sm"
            className="gap-2"
          >
            {isEditMode ? (
              <>
                <Save className="h-4 w-4" />
                Save Layout
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" />
                Edit Dashboard
              </>
            )}
          </Button>

          {isEditMode && (
            <Button
              onClick={onOpenAddCardDialog}
              variant="secondary"
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Card
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;



