import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CurrencyInput from '@/components/ui/currency-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, Calendar, DollarSign, Users, FileText, Plus, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const MembershipSelectionStep = ({ 
  salesData, 
  updateSalesData, 
  updateStepValidation, 
  existingMember 
}) => {
  const [formData, setFormData] = useState(salesData.membershipSelection);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [isContracted, setIsContracted] = useState(false);
  const [contractMonths, setContractMonths] = useState(12);
  const [activeMonths, setActiveMonths] = useState(new Set());
  const [dueToday, setDueToday] = useState(new Set([0])); // First month due today by default
  const [displayMonths, setDisplayMonths] = useState(6); // Show 6 months by default
  const [excludedMembership, setExcludedMembership] = useState(null); // Track excluded current membership

  // Fetch membership types
  useEffect(() => {
    const fetchMembershipTypes = async () => {
      try {
        // First, get all available membership types
        const { data: allTypes, error } = await supabase
          .from('membership_types')
          .select('*')
          .eq('category', 'Membership')
          .eq('available_for_sale', true)
          .order('price');

        if (error) throw error;

        let filteredTypes = allTypes || [];

        // If there's an existing member, exclude their current membership type
        if (existingMember?.id) {
          try {
            const { data: currentMembership } = await supabase
              .from('memberships')
              .select('membership_type_id, membership_types(id, name)')
              .eq('user_id', existingMember.id)
              .eq('status', 'active')
              .maybeSingle();

            if (currentMembership?.membership_type_id) {
              const excludedType = allTypes.find(type => type.id === currentMembership.membership_type_id);
              console.log('Excluding current membership type:', currentMembership.membership_types?.name);
              setExcludedMembership(excludedType);
              filteredTypes = allTypes.filter(type => type.id !== currentMembership.membership_type_id);
            }
          } catch (membershipError) {
            console.error('Error fetching current membership:', membershipError);
            // Continue with all types if there's an error
          }
        }

        setMembershipTypes(filteredTypes);
      } catch (error) {
        console.error('Error fetching membership types:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembershipTypes();
  }, [existingMember]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    const newFormData = {
      ...formData,
      [field]: value
    };

    // If membership type changed, update related fields
    if (field === 'membershipTypeId') {
      const selectedType = membershipTypes.find(mt => mt.id === value);
      if (selectedType) {
        newFormData.membershipType = selectedType;
        newFormData.monthlyFee = selectedType.price || 0;
        newFormData.enrollmentFee = selectedType.enrollment_fee || 0;
        newFormData.contractLength = selectedType.duration_months || 12;

        // Set contract defaults
        setIsContracted(selectedType.duration_months > 0);
        setContractMonths(selectedType.duration_months || 12);

        // Initialize active months and due today
        // All months should be active by default
        const allActiveMonths = new Set();
        for (let i = 0; i < displayMonths; i++) {
          allActiveMonths.add(i);
        }
        setActiveMonths(allActiveMonths);

        // First month due today by default, all others not due today
        setDueToday(new Set([0]));

        // Generate billing schedule
        newFormData.billingSchedule = generateBillingSchedule(
          newFormData.startDate,
          newFormData.monthlyFee
        );
      }
    }

    // If start date changed, regenerate billing schedule
    if (field === 'startDate' && formData.membershipType) {
      newFormData.billingSchedule = generateBillingSchedule(
        value,
        formData.monthlyFee
      );
    }

    // If fees changed, regenerate billing schedule
    if ((field === 'monthlyFee' || field === 'enrollmentFee') && formData.membershipType) {
      newFormData.billingSchedule = generateBillingSchedule(
        formData.startDate,
        field === 'monthlyFee' ? value : formData.monthlyFee
      );
    }

    // Add due today information to the form data
    newFormData.dueToday = Array.from(dueToday);
    newFormData.dueTodayTotal = calculateDueTodayTotal();
    newFormData.activeMonths = Array.from(activeMonths);

    setFormData(newFormData);
    updateSalesData('membershipSelection', newFormData);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Generate billing schedule
  const generateBillingSchedule = (startDate, monthlyFee) => {
    if (!startDate || !monthlyFee) return [];

    const schedule = [];
    const start = new Date(startDate);

    for (let i = 0; i < displayMonths; i++) {
      const billDate = new Date(start);
      billDate.setMonth(billDate.getMonth() + i);

      schedule.push({
        month: billDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        fullDate: billDate,
        amount: monthlyFee,
        isFirstMonth: i === 0,
        monthIndex: i
      });
    }

    return schedule;
  };

  // Toggle month active/inactive
  const toggleMonth = (monthIndex) => {
    const newActiveMonths = new Set(activeMonths);
    if (newActiveMonths.has(monthIndex)) {
      newActiveMonths.delete(monthIndex);
    } else {
      newActiveMonths.add(monthIndex);
    }
    setActiveMonths(newActiveMonths);
  };

  // Toggle due today for a month
  const toggleDueToday = (monthIndex) => {
    const newDueToday = new Set(dueToday);
    if (newDueToday.has(monthIndex)) {
      newDueToday.delete(monthIndex);
    } else {
      newDueToday.add(monthIndex);
    }
    setDueToday(newDueToday);
  };

  // Add a month column
  const addMonth = () => {
    const newDisplayMonths = displayMonths + 1;
    setDisplayMonths(newDisplayMonths);

    // Automatically set the new month as active
    const newActiveMonths = new Set(activeMonths);
    newActiveMonths.add(newDisplayMonths - 1);
    setActiveMonths(newActiveMonths);
  };

  // Remove a month column
  const removeMonth = () => {
    if (displayMonths > 1) {
      const newDisplayMonths = displayMonths - 1;
      setDisplayMonths(newDisplayMonths);

      // Remove the last month from active and due today sets
      const newActiveMonths = new Set(activeMonths);
      const newDueToday = new Set(dueToday);
      newActiveMonths.delete(newDisplayMonths);
      newDueToday.delete(newDisplayMonths);
      setActiveMonths(newActiveMonths);
      setDueToday(newDueToday);
    }
  };

  // Format currency input
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : parseFloat(value);
    if (isNaN(numValue)) return '';
    return `$${numValue.toFixed(2)}`;
  };

  // Parse currency input
  const parseCurrency = (value) => {
    if (!value || value === '') return 0;
    // Remove all non-numeric characters except decimal point
    const cleanValue = value.toString().replace(/[^0-9.]/g, '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  };

  // Check if a month is within the contract period
  const isMonthInContract = (monthIndex) => {
    if (!isContracted) return false;
    return monthIndex < contractMonths;
  };

  // Calculate due today total
  const calculateDueTodayTotal = () => {
    let total = 0;

    // Add enrollment fee if first month is due today
    if (dueToday.has(0)) {
      total += formData.enrollmentFee || 0;
    }

    // Add monthly fees for months marked as due today
    formData.billingSchedule.forEach((item, index) => {
      if (dueToday.has(index) && activeMonths.has(index)) {
        total += item.amount || 0;
      }
    });

    return total;
  };



  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.membershipTypeId) {
      newErrors.membershipTypeId = 'Please select a membership plan';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.monthlyFee || formData.monthlyFee <= 0) {
      newErrors.monthlyFee = 'Monthly fee must be greater than 0';
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    updateStepValidation('membership-selection', isValid);
    
    return isValid;
  };

  // Validate on form data changes
  useEffect(() => {
    validateForm();
  }, [formData]);

  // Initialize form data
  useEffect(() => {
    setFormData(salesData.membershipSelection);
  }, [salesData.membershipSelection]);

  // Regenerate billing schedule when displayMonths changes
  useEffect(() => {
    if (formData.startDate && formData.monthlyFee) {
      const newFormData = {
        ...formData,
        billingSchedule: generateBillingSchedule(formData.startDate, formData.monthlyFee)
      };

      // Add due today information
      newFormData.dueToday = Array.from(dueToday);
      newFormData.dueTodayTotal = calculateDueTodayTotal();
      newFormData.activeMonths = Array.from(activeMonths);

      setFormData(newFormData);
      updateSalesData('membershipSelection', newFormData);

      // Set all months as active by default, first month due today
      const allActiveMonths = new Set();
      for (let i = 0; i < displayMonths; i++) {
        allActiveMonths.add(i);
      }
      setActiveMonths(allActiveMonths);
      setDueToday(new Set([0])); // Only first month due today
    }
  }, [displayMonths]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading membership plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">Membership Selection & Billing</h3>
        <p className="text-sm text-muted-foreground">
          Choose a membership plan and configure billing details
        </p>
      </div>

      {/* Membership Selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="border border-slate-300 shadow-sm bg-white">
          <CardHeader className="bg-slate-50 border-b border-slate-200 px-6 py-4">
            <CardTitle className="flex items-center gap-3 text-slate-800 font-semibold text-lg">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              Select Membership Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
          <div>
            <Label htmlFor="membershipType">Membership Plan *</Label>
            <Select 
              value={formData.membershipTypeId} 
              onValueChange={(value) => handleInputChange('membershipTypeId', value)}
            >
              <SelectTrigger className={errors.membershipTypeId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a membership plan" />
              </SelectTrigger>
              <SelectContent>
                {membershipTypes.length > 0 ? (
                  membershipTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{type.name}</span>
                        <span className="ml-2 text-muted-foreground">
                          ${type.price?.toFixed(2)}/month
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    No other membership plans available
                  </div>
                )}
              </SelectContent>
            </Select>
            {errors.membershipTypeId && (
              <p className="text-sm text-red-500 mt-1">{errors.membershipTypeId}</p>
            )}
          </div>

          {/* Show info about excluded current membership */}
          {existingMember && excludedMembership && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your current membership plan "{excludedMembership.name}" is not shown in the list above as you already have it.
                Selecting a new plan will replace your current membership.
              </p>
            </div>
          )}

          {/* Show message when no other plans are available */}
          {existingMember && excludedMembership && membershipTypes.length === 0 && (
            <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>No Other Plans Available:</strong> You currently have "{excludedMembership.name}" and there are no other membership plans available for purchase at this time.
              </p>
            </div>
          )}

          {formData.membershipType && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="p-4 bg-slate-50 border border-slate-200 shadow-sm"
            >
              <h4 className="font-semibold mb-2 text-slate-900 text-base">{formData.membershipType.name}</h4>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                {formData.membershipType.description}
              </p>
              <div className="mb-4">
                <span className="text-sm font-medium text-slate-700 bg-white px-3 py-1 border border-slate-300">
                  Billing Cycle: Monthly
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="border-slate-400 text-slate-700 bg-white font-medium">
                  {formData.membershipType.duration_months} months
                </Badge>
                <Badge className="bg-green-700 hover:bg-green-800 text-white font-semibold">
                  ${formData.membershipType.price}/month
                </Badge>
                {formData.membershipType.enrollment_fee > 0 && (
                  <Badge variant="outline" className="border-orange-400 text-orange-700 bg-white font-medium">
                    ${formData.membershipType.enrollment_fee} enrollment
                  </Badge>
                )}
              </div>
            </motion.div>
          )}
        </CardContent>
        </Card>
      </motion.div>

      {/* Billing Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
      >
        <Card className="border border-slate-300 shadow-sm bg-white">
          <CardHeader className="bg-slate-50 border-b border-slate-200 px-6 py-4">
            <CardTitle className="flex items-center gap-3 text-slate-800 font-semibold text-lg">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Billing Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <Label htmlFor="billDate">Bill Date</Label>
              <Input
                id="billDate"
                type="date"
                value={formData.billDate || formData.startDate}
                onChange={(e) => handleInputChange('billDate', e.target.value)}
                placeholder="Same as start date"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthlyFee">Monthly Fee *</Label>
              <CurrencyInput
                id="monthlyFee"
                value={formData.monthlyFee}
                onChange={(value) => handleInputChange('monthlyFee', value)}
                placeholder="0.00"
                className={errors.monthlyFee ? 'border-red-500' : ''}
              />
              {errors.monthlyFee && (
                <p className="text-sm text-red-500 mt-1">{errors.monthlyFee}</p>
              )}
            </div>

            <div>
              <Label htmlFor="enrollmentFee">Enrollment Fee</Label>
              <CurrencyInput
                id="enrollmentFee"
                value={formData.enrollmentFee}
                onChange={(value) => handleInputChange('enrollmentFee', value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
        </Card>
      </motion.div>

      {/* Contract Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Card className="border border-slate-300 shadow-sm bg-white">
          <CardHeader className="bg-slate-50 border-b border-slate-200 px-6 py-4">
            <CardTitle className="flex items-center gap-3 text-slate-800 font-semibold text-lg">
              <FileText className="h-5 w-5 text-indigo-600" />
              Contract Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="contracted"
              checked={isContracted}
              onCheckedChange={(checked) => {
                setIsContracted(checked);
                // Contract toggle only affects visual indication, not billing months
              }}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="contracted" className="text-sm font-semibold text-slate-800 cursor-pointer">
                Contract Agreement
              </Label>
              <p className="text-xs text-slate-600 mt-1">
                Enable to lock in pricing for a specified duration
              </p>
            </div>
          </div>

          {isContracted && (
            <div className="pl-6 border-l-2 border-slate-200 space-y-3">
              <div>
                <Label htmlFor="contractMonths" className="text-sm font-medium text-slate-700">
                  Contract Duration (months)
                </Label>
                <Input
                  id="contractMonths"
                  type="number"
                  min="1"
                  max="60"
                  value={contractMonths}
                  onChange={(e) => {
                    const months = parseInt(e.target.value) || 12;
                    setContractMonths(months);
                    // Contract length only affects visual indication
                  }}
                  className="w-24 mt-1 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="text-xs text-slate-500 bg-slate-50 p-3 border border-slate-200">
                <strong>Note:</strong> Contract months will be highlighted in the billing schedule below
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      </motion.div>

      {/* Billing Schedule */}
      {formData.billingSchedule.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          <Card className="border border-slate-300 shadow-sm bg-white">
            <CardHeader className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-800 font-semibold text-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Billing Schedule
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeMonth}
                    disabled={displayMonths <= 1}
                    className="h-8 w-8 p-0 border-slate-400 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-slate-700 bg-white px-3 py-1 border border-slate-300 min-w-[80px] text-center">
                    {displayMonths} months
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMonth}
                    disabled={displayMonths >= 24}
                    className="h-8 w-8 p-0 border-slate-400 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
            <div className="overflow-x-auto border border-slate-300">
              <table className="w-full border-collapse text-sm bg-white">
                <thead>
                  {/* Bill months header - clickable to toggle */}
                  <tr className="bg-gradient-to-r from-indigo-100 to-purple-100 border-b border-slate-300">
                    <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold min-w-[140px] text-indigo-900">Bill Month</th>
                    {formData.billingSchedule.map((item, index) => (
                      <th
                        key={index}
                        className={`border-r border-slate-300 px-3 py-3 text-center font-semibold w-20 cursor-pointer transition-colors duration-150 ${
                          activeMonths.has(index)
                            ? (isMonthInContract(index)
                                ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700')
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        onClick={() => toggleMonth(index)}
                        title={`Click to ${activeMonths.has(index) ? 'disable' : 'enable'} billing for this month${isMonthInContract(index) ? ' (Contract Period)' : ''}`}
                      >
                        {item.month}
                      </th>
                    ))}
                  </tr>

                  {/* Due today header - clickable to toggle */}
                  <tr className="bg-gradient-to-r from-indigo-100 to-purple-100 border-b border-slate-300">
                    <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold text-indigo-900">Due Today</th>
                    {formData.billingSchedule.map((item, index) => (
                      <th
                        key={index}
                        className={`border-r border-slate-300 px-3 py-3 text-center font-semibold cursor-pointer transition-colors duration-150 ${
                          dueToday.has(index)
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        onClick={() => toggleDueToday(index)}
                        title={`Click to ${dueToday.has(index) ? 'remove from' : 'add to'} due today`}
                      >
                        {dueToday.has(index) ? '✓' : '○'}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* Primary member row */}
                  <tr className="hover:bg-slate-50 transition-colors border-b border-slate-200">
                    <td className="border-r border-slate-300 px-4 py-3 font-semibold text-sm text-slate-900 bg-white">
                      {salesData.personalInfo.first_name} {salesData.personalInfo.last_name}
                    </td>
                    {formData.billingSchedule.map((item, index) => (
                      <td key={index} className={`border-r border-slate-300 px-3 py-3 text-center ${
                        activeMonths.has(index) ? 'bg-white' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {activeMonths.has(index) ? (
                          <div>
                            {index === 0 && formData.enrollmentFee > 0 && (
                              <div className="text-sm">
                                <div className="font-semibold text-orange-700">${formData.enrollmentFee.toFixed(2)}</div>
                                <div className="text-xs text-slate-500">+</div>
                              </div>
                            )}
                            <div className="text-sm font-semibold text-green-700">${item.amount.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-sm font-medium">$0</div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Additional family members - only show if membership allows family */}
                  {formData.membershipType?.allows_family && (
                    <>
                      <tr className="hover:bg-slate-50 transition-colors border-b border-slate-200">
                        <td className="border-r border-slate-300 px-4 py-3 text-slate-500 text-sm bg-white">[Family Member]</td>
                        {formData.billingSchedule.map((_, index) => (
                          <td key={index} className={`border-r border-slate-300 px-3 py-3 text-center text-slate-500 text-sm ${
                            activeMonths.has(index) ? 'bg-white' : 'bg-slate-50'
                          }`}>
                            $0
                          </td>
                        ))}
                      </tr>

                      <tr className="hover:bg-slate-50 transition-colors border-b border-slate-200">
                        <td className="border-r border-slate-300 px-4 py-3 text-slate-500 text-sm bg-white">[Family Member]</td>
                        {formData.billingSchedule.map((_, index) => (
                          <td key={index} className={`border-r border-slate-300 px-3 py-3 text-center text-slate-500 text-sm ${
                            activeMonths.has(index) ? 'bg-white' : 'bg-slate-50'
                          }`}>
                            $0
                          </td>
                        ))}
                      </tr>
                    </>
                  )}

                  {/* Total row */}
                  <tr className="bg-slate-100 border-t-2 border-slate-400 font-bold">
                    <td className="border-r border-slate-300 px-4 py-3 text-sm text-slate-900">Total Billed:</td>
                    {formData.billingSchedule.map((item, index) => (
                      <td key={index} className={`border-r border-slate-300 px-3 py-3 text-center text-sm font-bold ${
                        activeMonths.has(index) ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        {activeMonths.has(index)
                          ? `$${(item.amount + (index === 0 ? formData.enrollmentFee : 0)).toFixed(2)}`
                          : '$0'
                        }
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-4 px-6 pb-6">
              {/* Due Today Total */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="p-4 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-green-900">Due Today Total:</h4>
                  <span className="text-2xl font-bold text-green-800">
                    ${calculateDueTodayTotal().toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Amount to be collected at time of sale
                </p>
              </motion.div>

              {formData.enrollmentFee > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-orange-50 border border-orange-300 text-orange-800"
                >
                  <p className="text-sm font-medium">
                    <strong>Enrollment Fee:</strong> ${formData.enrollmentFee.toFixed(2)} will be charged with the first payment.
                  </p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="p-4 bg-slate-50 border border-slate-300"
              >
                <p className="text-sm text-slate-800 font-semibold mb-3">
                  Billing Schedule Instructions:
                </p>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li>• Click month headers to enable/disable billing for that month</li>
                  <li>• {isContracted ? 'Yellow' : 'Blue'} columns indicate active billing months{isContracted ? ' (contract pricing)' : ''}</li>
                  <li>• Gray columns indicate inactive months (no charge)</li>
                  <li>• Click "Due Today" cells to set immediate payment requirements</li>
                  <li>• Use +/- controls to adjust the number of months displayed</li>
                </ul>
              </motion.div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}
    </div>
  );
};

export default MembershipSelectionStep;
