import React from 'react';
import { DollarSign, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StaffRates = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-600" />
            Staff Pay Rates
          </h1>
          <p className="text-gray-600 mt-1">
            Manage staff hourly rates and payroll settings
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pay Rate Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Staff Pay Rate Management</p>
            <p>This feature is currently under development.</p>
            <p className="text-sm mt-2">
              Coming soon: Comprehensive pay rate management with historical tracking,
              approval workflows, and payroll integration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffRates;