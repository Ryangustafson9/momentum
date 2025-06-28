import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Calendar,
  DollarSign,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const BillingScheduleTable = ({ 
  membershipPlan, 
  addOnPlans = [], 
  billingCycle, 
  onScheduleChange 
}) => {
  const [monthsToShow, setMonthsToShow] = useState(6);
  const [billingSchedule, setBillingSchedule] = useState({});
  const [isContracted, setIsContracted] = useState(false);
  const [contractLength, setContractLength] = useState(6);

  // Generate months starting from current month
  const generateMonths = (count) => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < count; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      months.push({
        key: monthKey,
        name: monthName,
        year: year,
        date: date
      });
    }
    
    return months;
  };

  const [months, setMonths] = useState(() => generateMonths(monthsToShow));

  useEffect(() => {
    setMonths(generateMonths(monthsToShow));
  }, [monthsToShow]);

  useEffect(() => {
    // Initialize billing schedule with default values
    const initialSchedule = {};
    months.forEach((month, index) => {
      initialSchedule[month.key] = {
        isCharged: index === 0, // First month is due today by default
        isDueToday: index === 0,
        isContractMonth: isContracted && index < contractLength
      };
    });
    setBillingSchedule(initialSchedule);
  }, [months, isContracted, contractLength]);

  useEffect(() => {
    onScheduleChange?.(billingSchedule);
  }, [billingSchedule, onScheduleChange]);

  const toggleMonthCharged = (monthKey) => {
    setBillingSchedule(prev => ({
      ...prev,
      [monthKey]: {
        ...prev[monthKey],
        isCharged: !prev[monthKey]?.isCharged
      }
    }));
  };

  const toggleDueToday = (monthKey) => {
    setBillingSchedule(prev => ({
      ...prev,
      [monthKey]: {
        ...prev[monthKey],
        isDueToday: !prev[monthKey]?.isDueToday
      }
    }));
  };

  const addMonth = () => {
    setMonthsToShow(prev => prev + 1);
  };

  const removeMonth = () => {
    if (monthsToShow > 3) {
      setMonthsToShow(prev => prev - 1);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculateMemberTotal = (monthKey) => {
    const schedule = billingSchedule[monthKey];
    if (!schedule?.isCharged) return 0;
    
    let total = membershipPlan?.price || 0;
    addOnPlans.forEach(addOn => {
      total += addOn.price || 0;
    });
    
    return total;
  };

  const calculateTotal = () => {
    return months.reduce((total, month) => {
      return total + calculateMemberTotal(month.key);
    }, 0);
  };

  const allMembers = [
    { 
      name: membershipPlan?.name || 'Primary Member', 
      price: membershipPlan?.price || 0,
      isPrimary: true 
    },
    ...addOnPlans.map(addOn => ({ 
      name: addOn.name, 
      price: addOn.price,
      isPrimary: false 
    }))
  ];

  return (
    <div className="space-y-4">
      {/* Contract Configuration */}
      <div className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <Checkbox
          id="contracted"
          checked={isContracted}
          onCheckedChange={setIsContracted}
        />
        <label htmlFor="contracted" className="text-sm font-medium">
          Contracted?
        </label>
        <span className="text-sm text-gray-600">Yes/No</span>
        {isContracted && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm">Length:</span>
            <select 
              value={contractLength}
              onChange={(e) => setContractLength(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              {[3, 6, 12, 24].map(length => (
                <option key={length} value={length}>{length} months</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Billing Schedule Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          {/* Header Row */}
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left text-sm font-medium">
                Contract Period Ends: {isContracted ? `${contractLength} months` : 'N/A'}
              </th>
              {months.map(month => {
                const schedule = billingSchedule[month.key];
                const isContractMonth = isContracted && months.indexOf(month) < contractLength;
                
                return (
                  <th 
                    key={month.key} 
                    className={`border border-gray-300 p-2 text-center text-sm font-medium ${
                      isContractMonth ? 'bg-yellow-100 border-yellow-400' : ''
                    }`}
                  >
                    <div>{month.name}</div>
                    <div className="text-xs text-gray-500">{month.year}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Bill Month Row */}
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2 font-medium bg-gradient-to-r from-orange-400 to-pink-500 text-white">
                Bill Month
              </td>
              {months.map(month => {
                const schedule = billingSchedule[month.key];
                const isContractMonth = isContracted && months.indexOf(month) < contractLength;
                
                return (
                  <td 
                    key={month.key} 
                    className={`border border-gray-300 p-2 text-center ${
                      isContractMonth ? 'border-yellow-400 border-2' : ''
                    }`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMonthCharged(month.key)}
                      className={`w-full h-8 text-xs ${
                        schedule?.isCharged 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                      }`}
                    >
                      {month.name}
                    </Button>
                  </td>
                );
              })}
            </tr>

            {/* Due Today Row */}
            <tr>
              <td className="border border-gray-300 p-2 font-medium">
                Due Today
              </td>
              {months.map(month => {
                const schedule = billingSchedule[month.key];
                const isContractMonth = isContracted && months.indexOf(month) < contractLength;
                
                return (
                  <td 
                    key={month.key} 
                    className={`border border-gray-300 p-2 text-center ${
                      isContractMonth ? 'border-yellow-400 border-2' : ''
                    }`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDueToday(month.key)}
                      className="w-full h-6 text-xs"
                    >
                      {schedule?.isDueToday ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <span className="text-gray-400">Optional</span>
                      )}
                    </Button>
                  </td>
                );
              })}
            </tr>

            {/* Member Rows */}
            {allMembers.map((member, memberIndex) => (
              <tr key={memberIndex}>
                <td className="border border-gray-300 p-2 font-medium">
                  {member.name}
                  {member.isPrimary && (
                    <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>
                  )}
                </td>
                {months.map(month => {
                  const schedule = billingSchedule[month.key];
                  const isContractMonth = isContracted && months.indexOf(month) < contractLength;
                  const amount = schedule?.isCharged ? member.price : 0;
                  
                  return (
                    <td 
                      key={month.key} 
                      className={`border border-gray-300 p-2 text-center ${
                        isContractMonth ? 'border-yellow-400 border-2' : ''
                      }`}
                    >
                      <div className="text-sm">
                        {formatCurrency(amount)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Total Row */}
            <tr className="bg-gray-50 font-semibold">
              <td className="border border-gray-300 p-2">
                Total Billed
              </td>
              {months.map(month => {
                const isContractMonth = isContracted && months.indexOf(month) < contractLength;
                const total = calculateMemberTotal(month.key);
                
                return (
                  <td 
                    key={month.key} 
                    className={`border border-gray-300 p-2 text-center ${
                      isContractMonth ? 'border-yellow-400 border-2' : ''
                    }`}
                  >
                    <div className="text-sm font-semibold">
                      {formatCurrency(total)}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={removeMonth}
            disabled={monthsToShow <= 3}
            className="flex items-center gap-1"
          >
            <Minus className="h-3 w-3" />
            Remove Month
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addMonth}
            className="flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Add Month
          </Button>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600">Total Amount</div>
          <div className="text-lg font-semibold text-gray-900">
            {formatCurrency(calculateTotal())}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-600 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span>Charged Month</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span>Not Charged</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-yellow-400 bg-yellow-100 rounded"></div>
          <span>Contract Period</span>
        </div>
      </div>
    </div>
  );
};

export default BillingScheduleTable;
