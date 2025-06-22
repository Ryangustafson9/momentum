
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, BarChart2, Users, DollarSign, CalendarCheck2, UserCog, Clock, ClipboardCheck, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import MemberSubscriptionsReport from '@/components/reports/MemberSubscriptionsReport';
import FinancialReport from '@/components/reports/FinancialReport';
import MemberAnalyticsReport from '@/components/reports/MemberAnalyticsReport';
import MembershipPlansReport from '@/components/reports/MembershipPlansReport';
import TestDataButton from '@/components/admin/TestDataButton';
import StaffPageHeader from '@/components/staff/StaffPageHeader';
import StaffPageContainer from '@/components/staff/StaffPageContainer';

const ReportCard = ({ title, description, icon, actionText, onAction, navigateTo }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (navigateTo) {
      navigate(navigateTo);
    } else if (onAction) {
      onAction();
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          {React.cloneElement(icon, { className: "h-8 w-8 text-primary" })}
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-end">
        <Button onClick={handleClick} className="w-full mt-auto bg-primary hover:bg-primary/90">
          {actionText || "View Report"}
        </Button>
      </CardContent>
    </Card>
  );
};


const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState(null);

  const handleViewReport = (reportName) => {
    switch (reportName) {
      case 'Member Subscriptions':
        setActiveReport('member-subscriptions');
        break;
      case 'Financial Report':
        setActiveReport('financial');
        break;
      case 'Member Analytics':
        setActiveReport('member-analytics');
        break;
      case 'Membership Plans':
        setActiveReport('membership-plans');
        break;
      default:
        alert(`Viewing ${reportName} report... (Placeholder for detailed view)`);
    }
  };

  const handleBackToReports = () => {
    setActiveReport(null);
  };

  // If viewing a specific report, render it
  if (activeReport) {
    const renderReport = () => {
      switch (activeReport) {
        case 'member-subscriptions':
          return <MemberSubscriptionsReport />;
        case 'financial':
          return <FinancialReport />;
        case 'member-analytics':
          return <MemberAnalyticsReport />;
        case 'membership-plans':
          return <MembershipPlansReport />;
        default:
          return <div>Report not found</div>;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBackToReports} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Button>
        </div>
        {renderReport()}
      </motion.div>
    );
  }
  return (
    <StaffPageContainer>      <StaffPageHeader 
        title="Reports Center"
        description="Access detailed reports for gym operations and performance."
        actions={[
          {
            text: "Test Data",
            variant: "outline",
            onClick: () => {}, // TestDataButton logic would go here
            icon: FileText
          }
        ]}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReportCard
              title="Member Subscriptions"
              description="View active member subscriptions, billing status, and membership details."
              icon={<Users />}
              actionText="View Subscriptions"
              onAction={() => handleViewReport("Member Subscriptions")}
            />
            <ReportCard 
              title="Attendance Logs" 
              description="Track class attendance, no-shows, and trends."
              icon={<ClipboardCheck />}
              actionText="View Attendance Data"
              onAction={() => handleViewReport("Attendance Logs (Detailed records would be here)")}
            />
            <ReportCard 
              title="Check-In History" 
              description="Detailed logs of all member check-ins over selected periods."
              icon={<CalendarCheck2 />}
              onAction={() => handleViewReport("Check-In History")}
            />
            <ReportCard
              title="Financial Report"
              description="Revenue analysis, membership financial performance, and billing metrics."
              icon={<DollarSign />}
              actionText="View Financials"
              onAction={() => handleViewReport("Financial Report")}
            />
            <ReportCard
              title="Member Analytics"
              description="Comprehensive member statistics, trends, and distribution analysis."
              icon={<BarChart2 />}
              actionText="View Analytics"
              onAction={() => handleViewReport("Member Analytics")}
            />
             <ReportCard
              title="Membership Plans"
              description="Overview of all membership plans, usage statistics, and availability."
              icon={<UserCog />}
              actionText="View Plans Overview"
              onAction={() => handleViewReport("Membership Plans")}
            />
          </div>
        </TabsContent>

        <TabsContent value="membership">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportCard
              title="Member Subscriptions"
              description="View active member subscriptions, billing status, and membership details."
              icon={<Users />}
              actionText="View Subscriptions"
              onAction={() => handleViewReport("Member Subscriptions")}
            />
            <ReportCard
              title="Member Analytics"
              description="Comprehensive member statistics, trends, and distribution analysis."
              icon={<BarChart2 />}
              actionText="View Analytics"
              onAction={() => handleViewReport("Member Analytics")}
            />
            <ReportCard
              title="Membership Plans"
              description="Overview of all membership plans, usage statistics, and availability."
              icon={<UserCog />}
              actionText="View Plans Overview"
              onAction={() => handleViewReport("Membership Plans")}
            />
          </div>
        </TabsContent>
        <TabsContent value="financial">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportCard
              title="Financial Report"
              description="Revenue analysis, membership financial performance, and billing metrics."
              icon={<DollarSign />}
              actionText="View Financials"
              onAction={() => handleViewReport("Financial Report")}
            />
            <Card>
              <CardHeader><CardTitle>Additional Financial Reports</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">Coming soon:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Payment History & Overdue Payments</li>
                  <li>Expense Tracking</li>
                  <li>Profit and Loss Statements</li>
                  <li>Sales Tax Reports</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="activity">
          <Card>
            <CardHeader><CardTitle>Activity & Engagement Reports</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p>Detailed activity reports will be available here, including:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>Overall Gym Attendance Trends</li>
                <li>Class-Specific Attendance Records</li>
                <li>Individual Member Attendance History</li>
                <li>No-Show Rates & Analysis</li>
                <li>Trainer Performance & Class Ratings</li>              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StaffPageContainer>
  );
};

export default ReportsPage;



