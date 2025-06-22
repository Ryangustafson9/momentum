
import React from 'react';
import { Label } from '@/components/ui/label';

const SettingsCardItem = ({ label, children, description }) => (
  <div className="flex flex-col space-y-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:py-4 border-b last:border-b-0">
    <div className="sm:w-2/5">
      <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</Label>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
    </div>
    <div className="w-full sm:w-3/5 sm:max-w-md">{children}</div>
  </div>
);

export default SettingsCardItem;



