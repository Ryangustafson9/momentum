
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import SettingsCardItem from '@/components/admin/settings/SettingsCardItem.jsx';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input.jsx';

const ReportingSettingsTabContent = () => {
  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2 h-5 w-5 text-primary" /> Reporting & Analytics
        </CardTitle>
        <CardDescription>Customize how reports are generated and what analytics are displayed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 pt-6">
        <SettingsCardItem 
          label="Default Report Period"
          description="Set the default time range for reports (e.g., Last 30 days)."
        >
          <Input value="Last 30 days" disabled />
        </SettingsCardItem>
        <SettingsCardItem 
          label="Enable Advanced Analytics"
          description="Show more detailed charts and data visualizations (Feature under development)."
        >
          <Switch checked={false} disabled />
        </SettingsCardItem>
         <div className="text-center py-8">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-4 text-muted-foreground">
            Reporting customization options will appear here.
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">This section is currently for display and future development.</p>
        </div>
      </CardContent>
       <CardContent className="border-t pt-6 text-right">
        <Button disabled className="bg-primary hover:bg-primary/90">
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReportingSettingsTabContent;



