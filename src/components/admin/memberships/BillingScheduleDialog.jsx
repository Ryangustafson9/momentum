import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, DollarSign, Clock, Eye, X } from 'lucide-react';
import { motion } from 'framer-motion';

const BillingScheduleDialog = ({ isOpen, onClose, membershipData }) => {
  // State for billing configuration
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [billOn, setBillOn] = useState('1');
  const [contractCycles, setContractCycles] = useState(12);
  
  // Calculate billing schedule based on membership data
  const billingSchedule = useMemo(() => {
    if (!membershipData || membershipData.billing_type === 'N/A') return [];
    
    const schedule = [];
    const start = new Date(startDate);
    const price = parseFloat(membershipData.price) || 0;
    const enrollmentFee = parseFloat(membershipData.signUpFee) || 0;
    
    // Determine billing frequency
    let cycleLength = 1;
    let cycleUnit = 'month';
    
    if (membershipData.billing_type === 'Recurring') {
      cycleLength = parseInt(membershipData.billingCycleLength) || 1;
      cycleUnit = membershipData.billingCycleUnit?.toLowerCase() || 'months';
    } else if (membershipData.billing_type === 'Paid in Full') {
      // For paid in full, show single payment
      schedule.push({
        date: start,
        amount: price + enrollmentFee,
        type: 'Paid in Full',
        isEnrollment: false,
        cycle: 1
      });
      return schedule;
    }
    
    // Generate recurring schedule
    const cyclesToShow = membershipData.billing_type === 'Paid in Full' ? 1 : contractCycles;
    
    for (let i = 0; i < cyclesToShow; i++) {
      const billDate = new Date(start);
      
      // Calculate billing date based on cycle
      if (cycleUnit.includes('month')) {
        billDate.setMonth(start.getMonth() + (i * cycleLength));
      } else if (cycleUnit.includes('week')) {
        billDate.setDate(start.getDate() + (i * cycleLength * 7));
      } else if (cycleUnit.includes('day')) {
        billDate.setDate(start.getDate() + (i * cycleLength));
      }
      
      // Set billing day of month
      if (cycleUnit.includes('month')) {
        billDate.setDate(parseInt(billOn));
      }
      
      let amount = price;
      let type = 'Membership Fee';
      
      // Add enrollment fee to first payment
      if (i === 0 && enrollmentFee > 0) {
        amount += enrollmentFee;
        type = 'Membership + Enrollment';
      }
      
      schedule.push({
        date: billDate,
        amount: amount,
        type: type,
        isEnrollment: i === 0 && enrollmentFee > 0,
        cycle: i + 1
      });
    }
    
    return schedule;
  }, [membershipData, startDate, billOn, contractCycles]);

  // Calculate totals
  const totals = useMemo(() => {
    const membershipTotal = billingSchedule.reduce((sum, item) => sum + item.amount, 0);
    const enrollmentFee = parseFloat(membershipData?.signUpFee) || 0;
    const todaysDues = billingSchedule.length > 0 ? billingSchedule[0].amount : 0;
    
    return {
      membershipTotal: membershipTotal - enrollmentFee,
      enrollmentFee,
      todaysDues,
      totalDue: membershipTotal
    };
  }, [billingSchedule, membershipData]);

  if (!membershipData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Billing Schedule Preview - {membershipData.name}
          </DialogTitle>
          <DialogDescription>
            Preview the billing schedule and payment structure for this membership plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Configuration */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    {membershipData.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Configuration Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    
                    {membershipData.billing_type === 'Recurring' && (
                      <div>
                        <Label htmlFor="bill-on">Bill On</Label>
                        <Select value={billOn} onValueChange={setBillOn}>
                          <SelectTrigger className="border-blue-200 focus:border-blue-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 28 }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>
                                {i + 1}{i + 1 === 1 ? 'st' : i + 1 === 2 ? 'nd' : i + 1 === 3 ? 'rd' : 'th'} of the month
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Base Fees Table */}
                  <div>
                    <h4 className="font-semibold mb-3">Base Fees</h4>
                    <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                      <div className="grid grid-cols-3 bg-blue-100 text-blue-900 font-medium text-sm">
                        <div className="p-3 border-r border-blue-200">Type</div>
                        <div className="p-3 border-r border-blue-200">Enrollment Fee</div>
                        <div className="p-3">Membership Fee</div>
                      </div>
                      <div className="grid grid-cols-3 text-sm">
                        <div className="p-3 border-r border-gray-200">Base Fees</div>
                        <div className="p-3 border-r border-gray-200">${totals.enrollmentFee.toFixed(2)}</div>
                        <div className="p-3">${(parseFloat(membershipData.price) || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Billing Schedule Grid */}
                  {billingSchedule.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Pricing Schedule</h4>
                      <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-blue-500 text-white text-xs font-medium">
                          <div className="grid grid-cols-6 gap-1 p-2">
                            {billingSchedule.slice(0, 6).map((item, index) => (
                              <div key={index} className="text-center p-1">
                                {item.date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Bill Cycle Row */}
                        <div className="bg-orange-400 text-white text-xs">
                          <div className="grid grid-cols-6 gap-1 p-2">
                            {billingSchedule.slice(0, 6).map((item, index) => (
                              <div key={index} className="text-center p-1 bg-green-500 rounded">
                                <Check className="h-3 w-3 mx-auto" />
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Amount Row */}
                        <div className="bg-gray-50 text-xs">
                          <div className="grid grid-cols-6 gap-1 p-2">
                            {billingSchedule.slice(0, 6).map((item, index) => (
                              <div key={index} className="text-center p-1">
                                ${item.amount.toFixed(2)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Summary */}
            <div>
              <Card className="border-2 border-gray-200 bg-gradient-to-b from-gray-50 to-white">
                <CardHeader className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Pricing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 font-medium">{membershipData.name}</span>
                      <span className="font-bold">${totals.membershipTotal.toFixed(2)}</span>
                    </div>
                    
                    {totals.enrollmentFee > 0 && (
                      <div className="flex justify-between items-center">
                        <span>Enrollment Fee</span>
                        <span>${totals.enrollmentFee.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span>Today's Dues</span>
                      <span>${totals.todaysDues.toFixed(2)}</span>
                    </div>
                    
                    <hr className="border-gray-300" />
                    
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Due Now:</span>
                      <span>${totals.totalDue.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Billing Type:</span>
                        <Badge variant="outline">{membershipData.billing_type}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <Badge variant="secondary">{membershipData.category}</Badge>
                      </div>
                      {membershipData.billing_type === 'Recurring' && (
                        <div className="flex justify-between">
                          <span>Cycle:</span>
                          <span>{membershipData.billingCycleLength} {membershipData.billingCycleUnit}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillingScheduleDialog;

