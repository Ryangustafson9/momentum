
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast.js';
import { apiService, dataService } from '@/services/apiService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Shield } from 'lucide-react';

const AssignMembershipDialog = ({ isOpen, onOpenChange, member, membershipTypes, onSubmitSuccess }) => {
  const { toast } = useToast();
  const [selectedMembershipTypeId, setSelectedMembershipTypeId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  
  const [activeTab, setActiveTab] = useState('membershipPlans');

  const { memberPlans, staffPlans } = useMemo(() => {
    if (!Array.isArray(membershipTypes)) return { memberPlans: [], staffPlans: [] };
    const mPlans = membershipTypes.filter(mt => mt.category !== 'Staff' && (mt.available_for_sale || mt.id === member?.current_membership_type_id));
    const sPlans = membershipTypes.filter(mt => mt.category === 'Staff' && (mt.available_for_sale || member?.assigned_plan_ids?.includes(mt.id)));
    return { memberPlans: mPlans, staffPlans: sPlans };
  }, [membershipTypes, member]);

  useEffect(() => {
    if (isOpen && member) {
      const currentPlans = member?.assigned_plan_ids || [];
      const defaultPlan = activeTab === 'membershipPlans' 
        ? memberPlans.find(p => currentPlans.includes(p.id))?.id || memberPlans[0]?.id || ''
        : staffPlans.find(p => currentPlans.includes(p.id))?.id || staffPlans[0]?.id || '';
      
      setSelectedMembershipTypeId(defaultPlan);
      setStartDate(new Date().toISOString().split('T')[0]);
      setNotes(''); 
      setPriceOverride('');
    } else if (!isOpen) {
      setSelectedMembershipTypeId('');
      setActiveTab('membershipPlans');
    }
  }, [isOpen, member, activeTab, memberPlans, staffPlans]);

  const handleSubmit = async () => {
    if (!member || !member.id) {
      toast({ title: "Error", description: "Member data is missing.", variant: "destructive" });
      return;
    }
    if (!selectedMembershipTypeId) {
      toast({ title: "Error", description: "Please select a plan.", variant: "destructive" });
      return;
    }
    if (!startDate) {
      toast({ title: "Error", description: "Please select a start date.", variant: "destructive" });
      return;
    }

    const allPlans = [...memberPlans, ...staffPlans];
    const selectedPlanDetails = allPlans.find(p => p.id === selectedMembershipTypeId);

    if (!selectedPlanDetails) {
         toast({ title: "Error", description: "Selected plan details not found.", variant: "destructive" });
        return;
    }

    try {
        const pricePaid = priceOverride ? parseFloat(priceOverride) : selectedPlanDetails.price;
        const updatedMember = await dataService.assignMembershipToMember(
            member.id, 
            selectedMembershipTypeId, 
            startDate, 
            null, 
            pricePaid, 
            notes
        );
        toast({ title: "Success", description: `Plan "${selectedPlanDetails.name}" assigned successfully to ${member.name}.` });
        onSubmitSuccess(updatedMember);
        onOpenChange(false);
    } catch (error) {
        toast({ title: "Error", description: `Failed to assign plan: ${error.message}`, variant: "destructive" });
    }
  };

  const currentPlanList = activeTab === 'membershipPlans' ? memberPlans : staffPlans;
  const selectedTypeDetails = currentPlanList.find(mt => mt.id === selectedMembershipTypeId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Plan for {member?.name}</DialogTitle>
          <DialogDescription>Select a plan and its details. Assigning a new plan may end other active plans.</DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="membershipPlans" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Membership Plans
            </TabsTrigger>
            <TabsTrigger value="staffPlans" className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Staff Plans
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="membershipPlans" className="space-y-4 py-3">
            <PlanAssignmentFields 
                plans={memberPlans} 
                selectedPlanId={selectedMembershipTypeId}
                onPlanSelect={setSelectedMembershipTypeId}
                startDate={startDate}
                onStartDateChange={setStartDate}
                priceOverride={priceOverride}
                onPriceOverrideChange={setPriceOverride}
                notes={notes}
                onNotesChange={setNotes}
                selectedTypeDetails={selectedTypeDetails}
            />
          </TabsContent>
          <TabsContent value="staffPlans" className="space-y-4 py-3">
             <PlanAssignmentFields 
                plans={staffPlans} 
                selectedPlanId={selectedMembershipTypeId}
                onPlanSelect={setSelectedMembershipTypeId}
                startDate={startDate}
                onStartDateChange={setStartDate}
                priceOverride={priceOverride}
                onPriceOverrideChange={setPriceOverride}
                notes={notes}
                onNotesChange={setNotes}
                selectedTypeDetails={selectedTypeDetails}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!selectedMembershipTypeId}>Save Plan Assignment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const PlanAssignmentFields = ({ plans, selectedPlanId, onPlanSelect, startDate, onStartDateChange, priceOverride, onPriceOverrideChange, notes, onNotesChange, selectedTypeDetails}) => {
  return (
    <>
      <div>
        <Label htmlFor="membershipType">Plan</Label>
        <Select value={selectedPlanId} onValueChange={onPlanSelect}>
          <SelectTrigger id="membershipType">
            <SelectValue placeholder="Select a plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.length > 0 ? plans.map(type => (
              <SelectItem key={type.id} value={type.id}>
                {type.name} - ${type.price?.toFixed(2)}
              </SelectItem>
            )) : <SelectItem value="none" disabled>No plans available in this category.</SelectItem>}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="startDate">Start Date</Label>
        <Input id="startDate" type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
      </div>
      {selectedTypeDetails && (
        <div>
            <Label htmlFor="priceOverride">Price Override (Optional - Default: ${selectedTypeDetails.price?.toFixed(2)})</Label>
            <Input 
                id="priceOverride" 
                type="number" 
                placeholder={`Default: ${selectedTypeDetails.price?.toFixed(2)}`} 
                value={priceOverride} 
                onChange={(e) => onPriceOverrideChange(e.target.value)} 
            />
        </div>
      )}
      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => onNotesChange(e.target.value)} placeholder="Any specific terms, pro-rating info, etc." />
      </div>
    </>
  );
}

export default AssignMembershipDialog;


