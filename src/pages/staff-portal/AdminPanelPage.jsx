import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AdminPanelSettingsTab from '@/components/admin/settings/tabs/AdminPanelSettingsTab';
import StaffPermissionsManagement from '@/components/admin/StaffPermissionsManagement';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Shield } from 'lucide-react';

const AdminPanelPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-2 sm:px-4 py-6"
    >
      <Card className="bg-card shadow-xl rounded-lg">
        <CardHeader className="border-b dark:border-slate-700">
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <SlidersHorizontal className="mr-3 h-6 w-6" /> Admin Panel
          </CardTitle>
          <CardDescription>
            Manage system-wide configurations and staff permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="adminSettings" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border-b dark:border-slate-700">
              <TabsTrigger
                value="adminSettings"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" /> General Settings
              </TabsTrigger>
              <TabsTrigger
                value="permissions"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <Shield className="mr-2 h-4 w-4" /> Staff Permissions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="adminSettings" className="p-4 md:p-6">
              <AdminPanelSettingsTab />
            </TabsContent>
            
            <TabsContent value="permissions" className="p-4 md:p-6">
              <StaffPermissionsManagement />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminPanelPage;
