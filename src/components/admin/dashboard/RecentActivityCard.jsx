import React from 'react';
import { Activity, Clock, User, Calendar } from 'lucide-react';

const RecentActivityCard = ({ activities, isEditMode, onRemoveCard }) => {
  return (
    <div className="bg-card border border-border shadow-sm rounded-xl relative transition-all duration-200">
      {isEditMode && (
        <button
          onClick={() => onRemoveCard('recentActivity')}
          className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
        >
          ×
        </button>
      )}
      
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activities && activities.length > 0 ? (
            activities.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">
                    {activity.message || 'Recent activity'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivityCard;


