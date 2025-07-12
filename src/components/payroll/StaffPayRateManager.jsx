import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  Calendar, 
  Users, 
  Plus, 
  Edit, 
  History,
  Save,
  X,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';

const StaffPayRateManager = () => {
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [payRates, setPayRates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const { toast } = useToast();

  const [rateForm, setRateForm] = useState({
    regular_hourly_rate: '',
    overtime_hourly_rate: '',
    holiday_hourly_rate: '',
    weekend_hourly_rate: '',
    effective_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadStaff(),
        loadPayRateTemplates()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          role,
          hire_date,
          employment_status,
          staff_pay_rates!staff_id (
            id,
            regular_hourly_rate,
            overtime_hourly_rate,
            effective_date,
            end_date
          )
        `)
        .eq('role', 'staff')
        .eq('employment_status', 'active')
        .order('first_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const loadPayRates = async (staffId) => {
    try {
      const { data, error } = await supabase
        .from('staff_pay_rates')
        .select(`
          *,
          approved_by:profiles!approved_by(first_name, last_name),
          created_by:profiles!created_by(first_name, last_name)
        `)
        .eq('staff_id', staffId)
        .order('effective_date', { ascending: false });

      if (error) throw error;
      setPayRates(data || []);
    } catch (error) {
      console.error('Error loading pay rates:', error);
    }
  };

  const loadPayRateTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('pay_rate_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleStaffSelect = (staffMember) => {
    setSelectedStaff(staffMember);
    loadPayRates(staffMember.id);
  };

  const handleCreateRate = () => {
    setEditingRate(null);
    setRateForm({
      regular_hourly_rate: '',
      overtime_hourly_rate: '',
      holiday_hourly_rate: '',
      weekend_hourly_rate: '',
      effective_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleEditRate = (rate) => {
    setEditingRate(rate);
    setRateForm({
      regular_hourly_rate: rate.regular_hourly_rate?.toString() || '',
      overtime_hourly_rate: rate.overtime_hourly_rate?.toString() || '',
      holiday_hourly_rate: rate.holiday_hourly_rate?.toString() || '',
      weekend_hourly_rate: rate.weekend_hourly_rate?.toString() || '',
      effective_date: rate.effective_date || new Date().toISOString().split('T')[0],
      notes: rate.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveRate = async () => {
    if (!selectedStaff || !rateForm.regular_hourly_rate) {
      toast({
        title: "Error",
        description: "Please fill in the regular hourly rate.",
        variant: "destructive"
      });
      return;
    }

    try {
      const rateData = {
        staff_id: selectedStaff.id,
        regular_hourly_rate: parseFloat(rateForm.regular_hourly_rate),
        overtime_hourly_rate: rateForm.overtime_hourly_rate ? parseFloat(rateForm.overtime_hourly_rate) : null,
        holiday_hourly_rate: rateForm.holiday_hourly_rate ? parseFloat(rateForm.holiday_hourly_rate) : null,
        weekend_hourly_rate: rateForm.weekend_hourly_rate ? parseFloat(rateForm.weekend_hourly_rate) : null,
        effective_date: rateForm.effective_date,
        notes: rateForm.notes || null,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      if (editingRate) {
        const { error } = await supabase
          .from('staff_pay_rates')
          .update(rateData)
          .eq('id', editingRate.id);

        if (error) throw error;
      } else {
        // End current rate if creating a new one
        if (payRates.length > 0 && payRates[0].end_date === null) {
          await supabase
            .from('staff_pay_rates')
            .update({ end_date: rateForm.effective_date })
            .eq('id', payRates[0].id);
        }

        const { error } = await supabase
          .from('staff_pay_rates')
          .insert(rateData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Pay rate ${editingRate ? 'updated' : 'created'} successfully.`,
        duration: 3000,
      });

      setIsEditDialogOpen(false);
      loadPayRates(selectedStaff.id);
      loadStaff(); // Refresh staff list to update current rates
    } catch (error) {
      console.error('Error saving pay rate:', error);
      toast({
        title: "Error",
        description: "Failed to save pay rate.",
        variant: "destructive"
      });
    }
  };

  const applyTemplate = (template) => {
    setRateForm(prev => ({
      ...prev,
      regular_hourly_rate: template.regular_hourly_rate.toString(),
      overtime_hourly_rate: (template.regular_hourly_rate * template.overtime_multiplier).toFixed(2),
      holiday_hourly_rate: (template.regular_hourly_rate * template.holiday_multiplier).toFixed(2),
      weekend_hourly_rate: (template.regular_hourly_rate * template.weekend_multiplier).toFixed(2)
    }));
  };

  const getCurrentRate = (staffMember) => {
    const currentRate = staffMember.staff_pay_rates?.find(rate => rate.end_date === null);
    return currentRate?.regular_hourly_rate || 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-8 w-8 animate-pulse" />
          <span className="text-xl">Loading pay rates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-600" />
            Staff Pay Rate Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage hourly rates and payroll settings for staff members
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Members ({staff.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {staff.map((staffMember) => (
                <div
                  key={staffMember.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedStaff?.id === staffMember.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleStaffSelect(staffMember)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {staffMember.first_name} {staffMember.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{staffMember.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(getCurrentRate(staffMember))}
                      </div>
                      <div className="text-xs text-gray-500">per hour</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pay Rate Details */}
        <div className="lg:col-span-2">
          {selectedStaff ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {selectedStaff.first_name} {selectedStaff.last_name} - Pay Rates
                  </CardTitle>
                  <Button onClick={handleCreateRate} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Rate
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payRates.map((rate) => (
                    <div
                      key={rate.id}
                      className={`p-4 border rounded-lg ${
                        rate.end_date === null ? 'border-green-200 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(rate.regular_hourly_rate)}
                            </span>
                            <span className="text-sm text-gray-600">regular</span>
                            {rate.end_date === null && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            {rate.overtime_hourly_rate && (
                              <div>
                                <span className="text-gray-600">Overtime: </span>
                                <span className="font-medium">{formatCurrency(rate.overtime_hourly_rate)}</span>
                              </div>
                            )}
                            {rate.holiday_hourly_rate && (
                              <div>
                                <span className="text-gray-600">Holiday: </span>
                                <span className="font-medium">{formatCurrency(rate.holiday_hourly_rate)}</span>
                              </div>
                            )}
                            {rate.weekend_hourly_rate && (
                              <div>
                                <span className="text-gray-600">Weekend: </span>
                                <span className="font-medium">{formatCurrency(rate.weekend_hourly_rate)}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Effective: {format(new Date(rate.effective_date), 'MMM d, yyyy')}
                            {rate.end_date && ` - ${format(new Date(rate.end_date), 'MMM d, yyyy')}`}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRate(rate)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {payRates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pay rates configured for this staff member.</p>
                      <Button onClick={handleCreateRate} className="mt-4">
                        Create First Rate
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a staff member to view and manage their pay rates.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Rate Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRate ? 'Edit Pay Rate' : 'Create New Pay Rate'}
              {selectedStaff && ` - ${selectedStaff.first_name} ${selectedStaff.last_name}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Selection */}
            {templates.length > 0 && !editingRate && (
              <div>
                <Label>Apply Rate Template</Label>
                <Select onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  if (template) applyTemplate(template);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} - {formatCurrency(template.regular_hourly_rate)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Rate Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="regular_rate">Regular Hourly Rate *</Label>
                <Input
                  id="regular_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={rateForm.regular_hourly_rate}
                  onChange={(e) => setRateForm(prev => ({ ...prev, regular_hourly_rate: e.target.value }))}
                  placeholder="15.00"
                />
              </div>
              <div>
                <Label htmlFor="overtime_rate">Overtime Hourly Rate</Label>
                <Input
                  id="overtime_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={rateForm.overtime_hourly_rate}
                  onChange={(e) => setRateForm(prev => ({ ...prev, overtime_hourly_rate: e.target.value }))}
                  placeholder="22.50 (auto: 1.5x regular)"
                />
              </div>
              <div>
                <Label htmlFor="holiday_rate">Holiday Hourly Rate</Label>
                <Input
                  id="holiday_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={rateForm.holiday_hourly_rate}
                  onChange={(e) => setRateForm(prev => ({ ...prev, holiday_hourly_rate: e.target.value }))}
                  placeholder="30.00 (auto: 2x regular)"
                />
              </div>
              <div>
                <Label htmlFor="weekend_rate">Weekend Hourly Rate</Label>
                <Input
                  id="weekend_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={rateForm.weekend_hourly_rate}
                  onChange={(e) => setRateForm(prev => ({ ...prev, weekend_hourly_rate: e.target.value }))}
                  placeholder="15.00 (auto: same as regular)"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="effective_date">Effective Date</Label>
              <Input
                id="effective_date"
                type="date"
                value={rateForm.effective_date}
                onChange={(e) => setRateForm(prev => ({ ...prev, effective_date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={rateForm.notes}
                onChange={(e) => setRateForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes about this rate change..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRate} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {editingRate ? 'Update Rate' : 'Create Rate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPayRateManager;
