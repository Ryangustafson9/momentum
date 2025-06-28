import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  DollarSign, 
  Plus, 
  Minus, 
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format, addMonths, startOfMonth } from 'date-fns';

const EnhancedBillingSchedulePreview = ({ 
  membershipData, 
  startDate = new Date().toISOString().split('T')[0],
  onUpdate,
  showControls = true 
}) => {
  const [monthsToShow, setMonthsToShow] = useState(6);
  const [contractMonths, setContractMonths] = useState(12);
  const [isContractEnabled, setIsContractEnabled] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(new Set());
  const [dueToday, setDueToday] = useState(new Set([0])); // First month due by default

  // Calculate billing schedule
  const billingSchedule = useMemo(() => {
    if (!membershipData || membershipData.billing_type === 'N/A') return [];
    
    const schedule = [];
    const start = new Date(startDate);
    const price = parseFloat(membershipData.price) || 0;
    const enrollmentFee = parseFloat(membershipData.signUpFee) || 0;
    
    for (let i = 0; i < monthsToShow; i++) {
      const billDate = addMonths(startOfMonth(start), i);
      const isSelected = selectedMonths.has(i);
      const isDueToday = dueToday.has(i);
      const isContractMonth = isContractEnabled && i < contractMonths;
      
      let amount = 0;
      if (i === 0 && enrollmentFee > 0) {
        amount = price + enrollmentFee;
      } else if (isSelected || i === 0) {
        amount = price;
      }
      
      schedule.push({
        month: i,
        date: billDate,
        amount: amount,
        isSelected: isSelected || i === 0,
        isDueToday: isDueToday,
        isContractMonth: isContractMonth,
        hasEnrollmentFee: i === 0 && enrollmentFee > 0,
        enrollmentFee: i === 0 ? enrollmentFee : 0
      });
    }
    
    return schedule;
  }, [membershipData, startDate, monthsToShow, selectedMonths, dueToday, contractMonths, isContractEnabled]);

  // Calculate totals
  const totals = useMemo(() => {
    const membershipTotal = billingSchedule.reduce((sum, item) => sum + (item.isSelected ? item.amount - item.enrollmentFee : 0), 0);
    const enrollmentTotal = billingSchedule.reduce((sum, item) => sum + item.enrollmentFee, 0);
    const dueNowTotal = billingSchedule.reduce((sum, item) => sum + (item.isDueToday ? item.amount : 0), 0);
    const totalDue = membershipTotal + enrollmentTotal;
    
    return {
      membershipTotal,
      enrollmentTotal,
      dueNowTotal,
      totalDue,
      selectedMonths: billingSchedule.filter(item => item.isSelected).length
    };
  }, [billingSchedule]);

  const toggleMonth = (monthIndex) => {
    if (monthIndex === 0) return; // First month always selected
    
    const newSelected = new Set(selectedMonths);
    if (newSelected.has(monthIndex)) {
      newSelected.delete(monthIndex);
    } else {
      newSelected.add(monthIndex);
    }
    setSelectedMonths(newSelected);
  };

  const toggleDueToday = (monthIndex) => {
    const newDueToday = new Set(dueToday);
    if (newDueToday.has(monthIndex)) {
      newDueToday.delete(monthIndex);
    } else {
      newDueToday.add(monthIndex);
    }
    setDueToday(newDueToday);
  };

  const addMonth = () => setMonthsToShow(prev => Math.min(prev + 1, 24));
  const removeMonth = () => setMonthsToShow(prev => Math.max(prev - 1, 3));

  if (!membershipData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Select a membership plan to preview billing schedule</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      {showControls && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Billing Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Months to Display</Label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={removeMonth}
                    disabled={monthsToShow <= 3}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">{monthsToShow}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addMonth}
                    disabled={monthsToShow >= 24}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="contract" 
                  checked={isContractEnabled}
                  onCheckedChange={setIsContractEnabled}
                />
                <Label htmlFor="contract" className="text-sm">
                  Contract Period
                </Label>
                {isContractEnabled && (
                  <Input
                    type="number"
                    value={contractMonths}
                    onChange={(e) => setContractMonths(parseInt(e.target.value) || 1)}
                    className="w-16 h-8"
                    min="1"
                    max="24"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Schedule Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing Schedule - {membershipData.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Month</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-right p-2">Amount</th>
                  <th className="text-center p-2">Billable</th>
                  <th className="text-center p-2">Due Today</th>
                </tr>
              </thead>
              <tbody>
                {billingSchedule.map((item) => (
                  <tr 
                    key={item.month} 
                    className={`border-b hover:bg-gray-50 ${
                      item.isContractMonth ? 'bg-yellow-50 border-yellow-200' : ''
                    }`}
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {format(item.date, 'MMM yyyy')}
                        </span>
                        {item.isContractMonth && (
                          <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700">
                            Contract
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {format(item.date, 'MMM d, yyyy')}
                    </td>
                    <td className="p-2 text-right font-medium">
                      {item.isSelected ? (
                        <span className="text-green-600">${item.amount.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400">$0.00</span>
                      )}
                      {item.hasEnrollmentFee && (
                        <div className="text-xs text-muted-foreground">
                          (${item.enrollmentFee.toFixed(2)} enrollment)
                        </div>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        variant={item.isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleMonth(item.month)}
                        disabled={item.month === 0}
                        className="h-6 w-16"
                      >
                        {item.isSelected ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <span className="text-xs">Add</span>
                        )}
                      </Button>
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        variant={item.isDueToday ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDueToday(item.month)}
                        disabled={!item.isSelected}
                        className="h-6 w-16"
                      >
                        {item.isDueToday ? (
                          <AlertCircle className="h-3 w-3" />
                        ) : (
                          <span className="text-xs">Later</span>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Billing Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Billing Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">${totals.membershipTotal.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Membership Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${totals.enrollmentTotal.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Enrollment Fee</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">${totals.dueNowTotal.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Due Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">${totals.totalDue.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Total Amount</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{totals.selectedMonths}</span> months selected
              {isContractEnabled && (
                <span className="ml-4">
                  <span className="font-medium">{Math.min(contractMonths, monthsToShow)}</span> month contract
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBillingSchedulePreview;
