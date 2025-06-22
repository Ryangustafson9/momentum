import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StaffPermissionsManagement from '@/components/admin/StaffPermissionsManagement';
import SuperAdminLocationManager from '@/components/admin/SuperAdminLocationManager';
import ConfigurationTemplatesManager from '@/components/admin/ConfigurationTemplatesManager';
import BillingConfigurationManager from '@/components/admin/BillingConfigurationManager';
import PaymentProcessorHub from '@/components/admin/PaymentProcessorHub';
import MigrationWorkflowManager from '@/components/admin/MigrationWorkflowManager';
import BillingConfigurationPanel from '@/components/admin/BillingConfigurationPanel';
import { motion } from 'framer-motion';
import { 
  SlidersHorizontal, 
  Shield, 
  Building2, 
  FileText, 
  DollarSign, 
  CreditCard,   
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AdminPanelPage = () => {
  const { user } = useAuth();

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
          </CardTitle>            <CardDescription>
            Advanced administration tools for staff permissions, multi-location management, billing configuration, payment processing, and system migrations.
          </CardDescription>
        </CardHeader>          <CardContent className="p-0">
          <Tabs defaultValue="permissions" className="w-full">
            <TabsList className="grid w-full grid-cols-6 rounded-none border-b dark:border-slate-700">
              <TabsTrigger
                value="permissions"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none text-xs"
              >
                <Shield className="mr-1 h-3 w-3" /> Permissions
              </TabsTrigger>
              <TabsTrigger
                value="locations"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none text-xs"
              >
                <Building2 className="mr-1 h-3 w-3" /> Locations
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none text-xs"
              >
                <FileText className="mr-1 h-3 w-3" /> Templates
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none text-xs"
              >
                <DollarSign className="mr-1 h-3 w-3" /> Billing
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none text-xs"
              >
                <CreditCard className="mr-1 h-3 w-3" /> Payments
              </TabsTrigger>
              <TabsTrigger
                value="migrations"
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none text-xs"
              >
                <ArrowRightLeft className="mr-1 h-3 w-3" /> Migrations
              </TabsTrigger>
            </TabsList>            
            
            <TabsContent value="permissions" className="p-4 md:p-6">
              <StaffPermissionsManagement />
            </TabsContent>

            <TabsContent value="locations" className="p-4 md:p-6">
              <SuperAdminLocationManager organizationId={user?.organization_id} />
            </TabsContent>

            <TabsContent value="templates" className="p-4 md:p-6">
              <ConfigurationTemplatesManager />
            </TabsContent>            <TabsContent value="billing" className="p-4 md:p-6">
              <BillingConfigurationManager />
            </TabsContent>

            <TabsContent value="payments" className="p-4 md:p-6">
              <PaymentProcessorHub />
            </TabsContent>

            <TabsContent value="migrations" className="p-4 md:p-6">
              <MigrationWorkflowManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminPanelPage;

