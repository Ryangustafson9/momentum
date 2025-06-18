
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';
import { Badge } from '@/components/ui/badge';
import { format, addMonths, addDays } from 'date-fns';
import { Briefcase, Shield, DollarSign, CalendarDays, Info, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

const PlanDetailsDisplay = ({ plan, type }) => {
  if (!plan) return <p className="text-sm text-muted-foreground">Select a {type} to see details.</p>;

  return (
    <div className="mt-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800 space-y-2 text-sm">
      <h4 className="font-semibold text-base">{plan.name}</h4>
      {type === 'membership' && (
        <>
          <p><Info className="inline h-4 w-4 mr-1 text-blue-500" /> Type: <span className="font-medium">{plan.billing_type}</span></p>
          <p><DollarSign className="inline h-4 w-4 mr-1 text-green-500" /> Price: <span className="font-medium">${plan.price?.toFixed(2)}</span></p>
          {plan.duration_months && <p><CalendarDays className="inline h-4 w-4 mr-1 text-purple-500" /> Duration: <span className="font-medium">{plan.duration_months} months</span></p>}
          {plan.features && plan.features.length > 0 && (
            <div>
              <span className="font-medium">Features:</span>
              <ul className="list-disc list-inside ml-4">
                {plan.features.map((feature, index) => <li key={index}>{feature}</li>)}
              </ul>
            </div>
          )}
        </>
      )}
      {type === 'staff role' && plan.permissions && (
        <div>
          <span className="font-medium">Permissions:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {Object.entries(plan.permissions).map(([key, value]) => (
              value && <Badge key={key} variant="secondary" className="text-xs">{key.replace(/_/g, ' ')}</Badge>
            ))}
            {Object.values(plan.permissions).every(v => !v) && <p className="text-xs text-muted-foreground">No specific permissions defined for this role.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

const PricingScheduleDisplay = ({ plan, proRate }) => {
  if (!plan || plan.billing_type === 'One-Time') return null;

  const nextBillingDate = plan.duration_months 
    ? format(addMonths(new Date(), 1), 'PPP') 
    : format(addDays(new Date(), 30), 'PPP'); // Example logic

  return (
    <div className="mt-3 p-3 border rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm space-y-1">
      <h5 className="font-semibold mb-1">Pricing Schedule (Example)</h5>
      <p>Billing Frequency: <span className="font-medium">{plan.billing_type === 'Recurring' ? 'Monthly' : plan.billing_type}</span></p>
      <p>Next Billing Date: <span className="font-medium">{nextBillingDate}</span></p>
      {/* Placeholder for enrollment fee */}
      <p>Enrollment Fee: <span className="font-medium">$0.00 (if applicable)</span></p>
      {proRate && <p className="text-green-600 dark:text-green-400 font-medium">First payment will be pro-rated.</p>}
    </div>
  );
};

const AssignPlanDialog = ({ isOpen, onOpenChange, member, onAssignmentSuccess }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('membership');
  
  const [allMembershipTypes, setAllMembershipTypes] = useState([]);
  const [staffRoles, setStaffRoles] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [selectedMembershipId, setSelectedMembershipId] = useState('');
  const [proRatePayment, setProRatePayment] = useState(false);
  
  const [selectedStaffRoleId, setSelectedStaffRoleId] = useState('');

  const fetchInitialData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [mTypesData, sRolesData] = await Promise.all([
        dataService.getMembershipTypes(),
        dataService.getStaffRoles()
      ]);
      
      setAllMembershipTypes(Array.isArray(mTypesData) ? mTypesData : []);
      setStaffRoles(Array.isArray(sRolesData) ? sRolesData : []);

    } catch (error) {
      console.error("Error fetching initial data for AssignPlanDialog:", error);
      toast({ title: "Error", description: `Could not load plans or roles: ${error.message}`, variant: "destructive" });
      setAllMembershipTypes([]); // Ensure it's an array on error
      setStaffRoles([]); // Ensure it's an array on error
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      setSelectedMembershipId('');
      setSelectedStaffRoleId('');
      setProRatePayment(false);
    }
  }, [isOpen, fetchInitialData]);

  const memberCategoryPlans = useMemo(() => 
    allMembershipTypes.filter(mt => mt.available_for_sale && mt.category !== 'Staff'),
    [allMembershipTypes]
  );
  
  const staffCategoryPlans = useMemo(() =>
    allMembershipTypes.filter(mt => mt.category === 'Staff' && mt.role_id), // Staff plans must have a role_id
    [allMembershipTypes]
  );

  const selectedMembershipPlan = useMemo(() => 
    memberCategoryPlans.find(mt => mt.id === selectedMembershipId),
    [memberCategoryPlans, selectedMembershipId]
  );

  const selectedStaffRoleDetails = useMemo(() =>
    staffRoles.find(sr => sr.id === selectedStaffRoleId),
    [staffRoles, selectedStaffRoleId]
  );

  const handleConfirmMembership = async () => {
    if (!selectedMembershipId || !member?.id) {
      toast({ title: "Missing Information", description: "Please select a membership and ensure member data is available.", variant: "destructive" });
      return;
    }
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const pricePaid = selectedMembershipPlan.price; 
      
      const updatedMember = await dataService.assignMembershipToMember(
        member.id,
        selectedMembershipId,
        startDate,
        null, 
        pricePaid,
        `Assigned via profile. Pro-rate: ${proRatePayment}`
      );
      toast({ title: "Membership Assigned", description: `${selectedMembershipPlan.name} assigned to ${member.name}.`, className: "bg-green-500 text-white" });
      onAssignmentSuccess(updatedMember);
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Assignment Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleConfirmStaffRole = async () => {
    if (!selectedStaffRoleId || !member?.id) {
      toast({ title: "Missing Information", description: "Please select a staff role.", variant: "destructive" });
      return;
    }
    
    const staffPlanToAssign = staffCategoryPlans.find(mt => mt.role_id === selectedStaffRoleId);

    if (!staffPlanToAssign) {
        toast({ title: "Configuration Error", description: `No 'Staff' category membership type is linked to the role "${selectedStaffRoleDetails?.name}". Please configure this in Admin Panel > Memberships and ensure it has a 'role_id'.`, variant: "destructive" });
        return;
    }

    try {
      const startDate = new Date().toISOString().split('T')[0];
      const pricePaid = staffPlanToAssign.price || 0;

      const updatedMember = await dataService.assignMembershipToMember(
        member.id,
        staffPlanToAssign.id, 
        startDate,
        null,
        pricePaid,
        `Assigned staff role: ${selectedStaffRoleDetails.name}`
      );
      toast({ title: "Staff Role Assigned", description: `${selectedStaffRoleDetails.name} role (via plan ${staffPlanToAssign.name}) assigned to ${member.name}.`, className: "bg-green-500 text-white" });
      onAssignmentSuccess(updatedMember); 
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Staff Role Assignment Failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Manage Plans for {member?.name}</DialogTitle>
          <DialogDescription>Assign or update memberships and staff roles.</DialogDescription>
        </DialogHeader>

        {isLoadingData ? <LoadingSpinner text="Loading options..." /> : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="membership"><Briefcase className="inline h-4 w-4 mr-2" />Membership</TabsTrigger>
              <TabsTrigger value="staff"><Shield className="inline h-4 w-4 mr-2" />Staff Role</TabsTrigger>
            </TabsList>

            <TabsContent value="membership" className="py-4 space-y-4">
              <div>
                <Label htmlFor="membership-select">Select Membership</Label>
                <Select value={selectedMembershipId} onValueChange={setSelectedMembershipId}>
                  <SelectTrigger id="membership-select">
                    <SelectValue placeholder="Choose a membership plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberCategoryPlans.map(mt => (
                      <SelectItem key={mt.id} value={mt.id}>{mt.name} (${mt.price?.toFixed(2)})</SelectItem>
                    ))}
                    {memberCategoryPlans.length === 0 && <p className="p-2 text-sm text-muted-foreground">No membership plans available for sale.</p>}
                  </SelectContent>
                </Select>
              </div>
              
              <PlanDetailsDisplay plan={selectedMembershipPlan} type="membership" />
              
              {selectedMembershipPlan && selectedMembershipPlan.billing_type !== 'One-Time' && (
                <PricingScheduleDisplay plan={selectedMembershipPlan} proRate={proRatePayment} />
              )}

              {selectedMembershipPlan && selectedMembershipPlan.billing_type !== 'One-Time' && (
                <div className="flex items-center space-x-2 mt-3">
                  <Switch id="prorate-payment" checked={proRatePayment} onCheckedChange={setProRatePayment} />
                  <Label htmlFor="prorate-payment">Pro-rate first payment (if applicable)</Label>
                </div>
              )}
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleConfirmMembership} disabled={!selectedMembershipId}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Confirm Membership
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="staff" className="py-4 space-y-4">
              <div>
                <Label htmlFor="staff-role-select">Assign Staff Role</Label>
                <Select value={selectedStaffRoleId} onValueChange={setSelectedStaffRoleId}>
                  <SelectTrigger id="staff-role-select">
                    <SelectValue placeholder="Choose a staff role" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoles.map(sr => (
                      <SelectItem key={sr.id} value={sr.id}>{sr.name}</SelectItem>
                    ))}
                     {staffRoles.length === 0 && <p className="p-2 text-sm text-muted-foreground">No staff roles configured.</p>}
                  </SelectContent>
                </Select>
              </div>

              <PlanDetailsDisplay plan={selectedStaffRoleDetails} type="staff role" />
              
              {selectedStaffRoleId && !staffCategoryPlans.find(mt => mt.role_id === selectedStaffRoleId) && (
                <p className="text-sm text-destructive flex items-center">
                  <XCircle className="h-4 w-4 mr-2 shrink-0" />
                  Warning: No 'Staff' category membership type is linked to the selected role "{selectedStaffRoleDetails?.name}". 
                  Assignment will fail. Please configure a corresponding Staff Plan in Admin Panel &gt; Memberships and ensure it has a 'role_id'.
                </p>
              )}

              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleConfirmStaffRole} disabled={!selectedStaffRoleId}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Confirm Staff Role
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignPlanDialog;


