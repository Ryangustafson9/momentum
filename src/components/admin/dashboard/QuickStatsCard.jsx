import React from 'react';
import { TrendingUp, Users, Target } from 'lucide-react';

const QuickStatsCard = ({ isEditMode, onRemoveCard, statsData, className = '' }) => {
  return (
    <div className={`bg-card border border-border shadow-sm rounded-xl relative transition-all duration-200 ${className}`}>
      {isEditMode && (
        <button
          onClick={() => onRemoveCard('quickStats')}
          className="absolute top-3 right-3 z-10 bg-destructive text-destructive-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-destructive/90 transition-colors shadow-sm"
        >
          ×
        </button>
      )}
      
      <div className="p-6">
        <div className="flex items-center mb-6">
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Quick Stats</h3>
            <p className="text-sm text-muted-foreground">Key performance metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <Users className="h-5 w-5 text-primary mr-2" />
              <span className="text-2xl font-bold text-foreground">
                {statsData?.newMembersThisMonth || 0}
              </span>
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              New Members This Month
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <Target className="h-5 w-5 text-emerald-600 mr-2" />
              <span className="text-2xl font-bold text-foreground">
                {statsData?.classAttendanceRate || '0%'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              Class Attendance Rate
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-violet-600 mr-2" />
              <span className="text-2xl font-bold text-foreground">
                {statsData?.membershipRenewalRate || '0%'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              Renewal Rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsCard;


