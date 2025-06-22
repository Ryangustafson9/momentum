
import React, { useState, useMemo } from 'react';
import { format, addMonths, addYears } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarDays, DollarSign, Plus, Minus } from 'lucide-react';

const BillingSchedulePreview = ({ membershipStartDate, billingType, price, memberName }) => {
  const [monthsToShow, setMonthsToShow] = useState(6);

  const schedule = useMemo(() => {
    if (!membershipStartDate || !billingType || price === undefined) {
      return [];
    }

    const startDate = new Date(membershipStartDate);
    const items = [];
    const limit = billingType === 'Annual' ? Math.max(1, Math.floor(monthsToShow / 12) +1) : monthsToShow;


    for (let i = 0; i < limit; i++) {
      let paymentDate;
      if (billingType === 'Monthly') {
        paymentDate = addMonths(startDate, i);
      } else if (billingType === 'Annual') {
        paymentDate = addYears(startDate, i);
      } else {
        return []; 
      }
      items.push({
        date: format(paymentDate, 'PPP'), // 'MMM d, yyyy'
        amount: price,
      });
    }
    return items;
  }, [membershipStartDate, billingType, price, monthsToShow]);

  if (!membershipStartDate || !billingType || price === undefined) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary" /> Future Billing Schedule</CardTitle>
          <CardDescription>Select a valid membership to see the schedule.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No billing schedule to display.</p>
        </CardContent>
      </Card>
    );
  }
  
  const handleMonthsChange = (increment) => {
      const newMonths = monthsToShow + increment;
      if (billingType === 'Annual') {
          setMonthsToShow(Math.max(12, Math.min(60, newMonths))); // Min 1 year, Max 5 years
      } else {
          setMonthsToShow(Math.max(1, Math.min(24, newMonths))); // Min 1 month, Max 24 months
      }
  };


  return (
    <Card className="mt-6 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary" /> Future Billing Schedule</CardTitle>
                <CardDescription>Estimated upcoming payments for {memberName}.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => handleMonthsChange(billingType === 'Annual' ? -12 : -1)} disabled={monthsToShow <= (billingType === 'Annual' ? 12 : 1)}>
                    <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm w-10 text-center">{billingType === 'Annual' ? `${monthsToShow/12}Y` : `${monthsToShow}M`}</span>
                <Button variant="outline" size="icon" onClick={() => handleMonthsChange(billingType === 'Annual' ? 12 : 1)} disabled={monthsToShow >= (billingType === 'Annual' ? 60: 24)}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {schedule.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                Displaying next {billingType === 'Annual' ? `${monthsToShow/12} year(s)` : `${monthsToShow} month(s)`} of billing. Based on current plan and start date.
              </TableCaption>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No billing schedule to display for this configuration.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default BillingSchedulePreview;



