
import React from 'react';
import { formatDistanceToNowStrict } from 'date-fns';

const RecentActivityList = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No recent activity.</p>;
  }
  return (
    <ul className="space-y-3 max-h-96 overflow-y-auto">
      {activities.map(activity => (
        <li key={activity.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{activity.memberName || activity.member_name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {activity.status || 'Checked In'} {activity.className && activity.className !== 'General Check-in' ? `for ${activity.className}` : (activity.class_name && activity.class_name !== 'General Check-in' ? `for ${activity.class_name}` : 'general check-in')}
            </p>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {formatDistanceToNowStrict(new Date(activity.timestamp || activity.check_in_time || activity.date), { addSuffix: true })}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default RecentActivityList;



