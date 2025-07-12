import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  FileText, 
  Calendar, 
  Users, 
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Building,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

const HeartlandIntegration = () => {
  const [integrationSettings, setIntegrationSettings] = useState({
    company_identifier: '',
    default_division: '',
    default_department: '',
    earnings_codes: {
      regular: '01',
      overtime: '02',
      holiday: '03',
      weekend: '01'
    },
    export_format: 'csv',
    auto_export: false
  });

  const [payrollPeriods, setPayrollPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [exportData, setExportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadIntegrationSettings();
    loadPayrollPeriods();
    loadLastExport();
  }, []);

  const loadIntegrationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('heartland_integration_settings')
        .limit(1);

      if (error) throw error;

      if (data?.[0]?.heartland_integration_settings) {
        setIntegrationSettings(prev => ({
          ...prev,
          ...data[0].heartland_integration_settings
        }));
      }
    } catch (error) {
      console.error('Error loading integration settings:', error);
    }
  };

  const loadPayrollPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_payroll_periods')
        .select(`
          *,
          staff:profiles!staff_id(first_name, last_name, employee_number)
        `)
        .order('period_start', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPayrollPeriods(data || []);
    } catch (error) {
      console.error('Error loading payroll periods:', error);
    }
  };

  const loadLastExport = async () => {
    try {
      const { data, error } = await supabase
        .from('heartland_exports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      setLastExport(data?.[0] || null);
    } catch (error) {
      console.error('Error loading last export:', error);
    }
  };

  const saveIntegrationSettings = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1,
          heartland_integration_settings: integrationSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Heartland integration settings have been updated.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving integration settings:', error);
      toast({
        title: "Error",
        description: "Failed to save integration settings.",
        variant: "destructive"
      });
    }
  };

  const generatePayrollExport = async (periodId) => {
    try {
      setIsExporting(true);

      // Get payroll period data
      const { data: periodData, error: periodError } = await supabase
        .from('staff_payroll_periods')
        .select(`
          *,
          staff:profiles!staff_id(
            first_name, 
            last_name, 
            employee_number,
            clock_number,
            location_id,
            department_code
          )
        `)
        .eq('id', periodId);

      if (periodError) throw periodError;

      if (!periodData || periodData.length === 0) {
        throw new Error('Payroll period not found');
      }

      // Generate CSV rows for each staff member
      const csvRows = [];
      
      for (const period of periodData) {
        const staff = period.staff;
        const baseRow = {
          company_identifier: integrationSettings.company_identifier || '',
          employee_number: staff.employee_number || '',
          division: staff.location_id || integrationSettings.default_division || '',
          department: staff.department_code || integrationSettings.default_department || '',
          clock_number: staff.clock_number || '',
          employee_name: `${staff.first_name} ${staff.last_name}`
        };

        // Regular hours
        if (period.regular_hours > 0) {
          csvRows.push({
            ...baseRow,
            earnings_code: integrationSettings.earnings_codes.regular,
            amount_type: 'H',
            amount: period.regular_hours.toFixed(2),
            rate: period.regular_rate.toFixed(2)
          });
        }

        // Overtime hours
        if (period.overtime_hours > 0) {
          csvRows.push({
            ...baseRow,
            earnings_code: integrationSettings.earnings_codes.overtime,
            amount_type: 'H',
            amount: period.overtime_hours.toFixed(2),
            rate: period.overtime_rate?.toFixed(2) || (period.regular_rate * 1.5).toFixed(2)
          });
        }

        // Holiday hours
        if (period.holiday_hours > 0) {
          csvRows.push({
            ...baseRow,
            earnings_code: integrationSettings.earnings_codes.holiday,
            amount_type: 'H',
            amount: period.holiday_hours.toFixed(2),
            rate: period.holiday_rate?.toFixed(2) || (period.regular_rate * 2).toFixed(2)
          });
        }

        // Weekend hours (if different rate)
        if (period.weekend_hours > 0 && period.weekend_rate && period.weekend_rate !== period.regular_rate) {
          csvRows.push({
            ...baseRow,
            earnings_code: integrationSettings.earnings_codes.weekend,
            amount_type: 'H',
            amount: period.weekend_hours.toFixed(2),
            rate: period.weekend_rate.toFixed(2)
          });
        }
      }

      setExportData(csvRows);
      return csvRows;
    } catch (error) {
      console.error('Error generating payroll export:', error);
      toast({
        title: "Export Error",
        description: "Failed to generate payroll export.",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsExporting(false);
    }
  };

  const downloadCSV = async (data, filename) => {
    try {
      // Generate CSV content according to Heartland specifications
      const headers = [
        'Company Identifier',
        'Employee Number',
        'Division',
        'Earnings Code',
        'Amount Type',
        'Amount',
        'Plus Sign',
        'Rate',
        'Department',
        'Clock Number',
        'Employee Name'
      ];

      const csvContent = [
        headers.join(','),
        ...data.map(row => [
          `"${row.company_identifier}"`,
          `"${row.employee_number}"`,
          `"${row.division}"`,
          `"${row.earnings_code}"`,
          `"${row.amount_type}"`,
          `"${row.amount}"`,
          `"+"`,
          `"${row.rate}"`,
          `"${row.department}"`,
          `"${row.clock_number}"`,
          `"${row.employee_name}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log export
      await logExport(filename, data.length);

      toast({
        title: "Export Complete",
        description: `Downloaded ${filename} with ${data.length} records.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast({
        title: "Download Error",
        description: "Failed to download CSV file.",
        variant: "destructive"
      });
    }
  };

  const logExport = async (filename, recordCount) => {
    try {
      await supabase
        .from('heartland_exports')
        .insert({
          filename,
          record_count: recordCount,
          payroll_period_id: selectedPeriod?.id,
          exported_by: (await supabase.auth.getUser()).data.user?.id,
          export_settings: integrationSettings
        });
    } catch (error) {
      console.error('Error logging export:', error);
    }
  };

  const handleExportPeriod = async (period) => {
    setSelectedPeriod(period);
    const data = await generatePayrollExport(period.id);
    
    if (data.length > 0) {
      const filename = `heartland_payroll_${format(new Date(period.period_start), 'yyyy-MM-dd')}_${format(new Date(period.period_end), 'yyyy-MM-dd')}.csv`;
      await downloadCSV(data, filename);
    }
  };

  const generateWeeklyExport = async () => {
    try {
      setIsLoading(true);

      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());

      // Get timeclock entries for the week
      const { data: entries, error } = await supabase
        .from('timeclock_entries')
        .select(`
          *,
          staff:profiles!staff_id(
            first_name,
            last_name,
            employee_number,
            clock_number,
            location_id,
            department_code
          ),
          rate:staff_pay_rates!staff_id(regular_hourly_rate, overtime_hourly_rate)
        `)
        .gte('clock_in_time', weekStart.toISOString())
        .lte('clock_in_time', weekEnd.toISOString())
        .not('clock_out_time', 'is', null);

      if (error) throw error;

      // Process entries into Heartland format
      const processedData = processTimeclockEntries(entries);
      
      if (processedData.length > 0) {
        const filename = `heartland_weekly_${format(weekStart, 'yyyy-MM-dd')}.csv`;
        await downloadCSV(processedData, filename);
      } else {
        toast({
          title: "No Data",
          description: "No timeclock entries found for this week.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating weekly export:', error);
      toast({
        title: "Export Error",
        description: "Failed to generate weekly export.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processTimeclockEntries = (entries) => {
    const staffHours = {};

    // Aggregate hours by staff member
    entries.forEach(entry => {
      const staffId = entry.staff_id;
      if (!staffHours[staffId]) {
        staffHours[staffId] = {
          staff: entry.staff,
          regular_hours: 0,
          overtime_hours: 0,
          holiday_hours: 0,
          weekend_hours: 0,
          rate: entry.rate?.[0] || { regular_hourly_rate: entry.hourly_rate_snapshot || 0 }
        };
      }

      const hours = entry.calculated_regular_hours || 0;
      const overtimeHours = entry.calculated_overtime_hours || 0;

      if (entry.is_holiday) {
        staffHours[staffId].holiday_hours += hours + overtimeHours;
      } else if (entry.is_weekend) {
        staffHours[staffId].weekend_hours += hours + overtimeHours;
      } else {
        staffHours[staffId].regular_hours += hours;
        staffHours[staffId].overtime_hours += overtimeHours;
      }
    });

    // Convert to CSV format
    const csvRows = [];
    Object.values(staffHours).forEach(staffData => {
      const baseRow = {
        company_identifier: integrationSettings.company_identifier || '',
        employee_number: staffData.staff.employee_number || '',
        division: staffData.staff.location_id || integrationSettings.default_division || '',
        department: staffData.staff.department_code || integrationSettings.default_department || '',
        clock_number: staffData.staff.clock_number || '',
        employee_name: `${staffData.staff.first_name} ${staffData.staff.last_name}`
      };

      // Add rows for each hour type
      if (staffData.regular_hours > 0) {
        csvRows.push({
          ...baseRow,
          earnings_code: integrationSettings.earnings_codes.regular,
          amount_type: 'H',
          amount: staffData.regular_hours.toFixed(2),
          rate: staffData.rate.regular_hourly_rate.toFixed(2)
        });
      }

      if (staffData.overtime_hours > 0) {
        csvRows.push({
          ...baseRow,
          earnings_code: integrationSettings.earnings_codes.overtime,
          amount_type: 'H',
          amount: staffData.overtime_hours.toFixed(2),
          rate: (staffData.rate.overtime_hourly_rate || staffData.rate.regular_hourly_rate * 1.5).toFixed(2)
        });
      }

      if (staffData.holiday_hours > 0) {
        csvRows.push({
          ...baseRow,
          earnings_code: integrationSettings.earnings_codes.holiday,
          amount_type: 'H',
          amount: staffData.holiday_hours.toFixed(2),
          rate: (staffData.rate.regular_hourly_rate * 2).toFixed(2)
        });
      }

      if (staffData.weekend_hours > 0) {
        csvRows.push({
          ...baseRow,
          earnings_code: integrationSettings.earnings_codes.weekend,
          amount_type: 'H',
          amount: staffData.weekend_hours.toFixed(2),
          rate: staffData.rate.regular_hourly_rate.toFixed(2)
        });
      }
    });

    return csvRows;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building className="h-8 w-8 text-blue-600" />
            Heartland Payroll Integration
          </h1>
          <p className="text-gray-600 mt-1">
            Export timeclock data to Heartland Time and Attendance system
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={generateWeeklyExport} disabled={isLoading} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export This Week
          </Button>
          <Button onClick={loadPayrollPeriods} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="settings">Integration Settings</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6 mt-6">
          {/* Quick Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Quick Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={generateWeeklyExport} 
                  disabled={isLoading}
                  className="h-20 flex flex-col gap-2"
                >
                  <Download className="h-6 w-6" />
                  <div>
                    <div className="font-medium">Export Current Week</div>
                    <div className="text-xs opacity-80">
                      {format(startOfWeek(new Date()), 'MMM d')} - {format(endOfWeek(new Date()), 'MMM d, yyyy')}
                    </div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => generateWeeklyExport(subWeeks(new Date(), 1))} 
                  disabled={isLoading}
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                >
                  <Download className="h-6 w-6" />
                  <div>
                    <div className="font-medium">Export Last Week</div>
                    <div className="text-xs opacity-80">
                      {format(startOfWeek(subWeeks(new Date(), 1)), 'MMM d')} - {format(endOfWeek(subWeeks(new Date(), 1)), 'MMM d, yyyy')}
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Periods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Payroll Periods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payrollPeriods.map((period) => (
                  <div
                    key={period.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">
                        {format(new Date(period.period_start), 'MMM d')} - {format(new Date(period.period_end), 'MMM d, yyyy')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {period.total_hours?.toFixed(1) || 0} hours • ${period.gross_pay?.toFixed(2) || 0} gross pay
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={period.status === 'approved' ? 'default' : 'secondary'}>
                        {period.status}
                      </Badge>
                      <Button
                        onClick={() => handleExportPeriod(period)}
                        disabled={isExporting}
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                ))}
                
                {payrollPeriods.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payroll periods found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Heartland Integration Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_identifier">Company Identifier</Label>
                  <Input
                    id="company_identifier"
                    value={integrationSettings.company_identifier}
                    onChange={(e) => setIntegrationSettings(prev => ({ 
                      ...prev, 
                      company_identifier: e.target.value 
                    }))}
                    placeholder="HRTL"
                  />
                </div>
                
                <div>
                  <Label htmlFor="default_division">Default Division Code</Label>
                  <Input
                    id="default_division"
                    value={integrationSettings.default_division}
                    onChange={(e) => setIntegrationSettings(prev => ({ 
                      ...prev, 
                      default_division: e.target.value 
                    }))}
                    placeholder="01"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="default_department">Default Department Code</Label>
                <Input
                  id="default_department"
                  value={integrationSettings.default_department}
                  onChange={(e) => setIntegrationSettings(prev => ({ 
                    ...prev, 
                    default_department: e.target.value 
                  }))}
                  placeholder="0100"
                />
              </div>

              <div>
                <Label>Earnings Codes</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <Label htmlFor="regular_code" className="text-xs">Regular Hours</Label>
                    <Input
                      id="regular_code"
                      value={integrationSettings.earnings_codes.regular}
                      onChange={(e) => setIntegrationSettings(prev => ({ 
                        ...prev, 
                        earnings_codes: { ...prev.earnings_codes, regular: e.target.value }
                      }))}
                      placeholder="01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="overtime_code" className="text-xs">Overtime Hours</Label>
                    <Input
                      id="overtime_code"
                      value={integrationSettings.earnings_codes.overtime}
                      onChange={(e) => setIntegrationSettings(prev => ({ 
                        ...prev, 
                        earnings_codes: { ...prev.earnings_codes, overtime: e.target.value }
                      }))}
                      placeholder="02"
                    />
                  </div>
                  <div>
                    <Label htmlFor="holiday_code" className="text-xs">Holiday Hours</Label>
                    <Input
                      id="holiday_code"
                      value={integrationSettings.earnings_codes.holiday}
                      onChange={(e) => setIntegrationSettings(prev => ({ 
                        ...prev, 
                        earnings_codes: { ...prev.earnings_codes, holiday: e.target.value }
                      }))}
                      placeholder="03"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weekend_code" className="text-xs">Weekend Hours</Label>
                    <Input
                      id="weekend_code"
                      value={integrationSettings.earnings_codes.weekend}
                      onChange={(e) => setIntegrationSettings(prev => ({ 
                        ...prev, 
                        earnings_codes: { ...prev.earnings_codes, weekend: e.target.value }
                      }))}
                      placeholder="01"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={saveIntegrationSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Integration Info */}
          <Card>
            <CardHeader>
              <CardTitle>Heartland CSV Format Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>CSV Format Requirements:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Files must be in .CSV format with quoted fields</li>
                    <li>Each row contains one amount (employees may have multiple rows)</li>
                    <li>Amount types: 'H' for hours, '$' for dollars, 'D' for deductions</li>
                    <li>Heartland will calculate overtime/double time - pass base rates only</li>
                    <li>At least Employee Number or Clock Number must be provided</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Export History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lastExport ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{lastExport.filename}</div>
                      <div className="text-sm text-gray-600">
                        {lastExport.record_count} records • {format(new Date(lastExport.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Exported
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No exports found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HeartlandIntegration;
