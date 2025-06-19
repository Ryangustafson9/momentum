
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast.js';

const MemberFormField = React.memo(({ label, name, type = "text", value, onChange, isRequiredByAdmin = false, children, min }) => {
  const isRequired = isRequiredByAdmin;
  return (
    <div>
      <Label htmlFor={name}>{label} {isRequired && <span className="text-red-500 ml-1">*</span>}</Label>
      {children ? children : (
        type === "textarea" ? (
          <Textarea id={name} name={name} value={value || ''} onChange={onChange} rows={2} required={isRequired} />
        ) : (
          <Input id={name} name={name} type={type} value={value || ''} onChange={onChange} required={isRequired} min={min} />
        )
      )}
    </div>
  );
});
MemberFormField.displayName = 'MemberFormField';

const useAdminSettings = () => {
  const [adminSettings, setAdminSettings] = useState({
    require_first_name: true,
    require_last_name: true,
    require_email: true,
    require_phone: false,
    require_dob: false,
    require_address: false,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const { data: settings, error } = await supabase
          .from('general_settings')
          .select('*')
          .single();

        if (error) throw error;

        if (isMounted && settings) {
          setAdminSettings(prevSettings => ({ ...prevSettings, ...settings }));
        }
      } catch (error) {
        console.error("Failed to fetch admin panel settings", error);
        // Use default settings if fetch fails
      }
    };
    fetchSettings();
    return () => { isMounted = false; };
  }, []);
  return adminSettings;
};

const useMemberFormInitialization = (editingMember, prefillName, isOpen, initialFormData) => {
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (isOpen) {
      if (prefillName && !editingMember) {
        const nameParts = prefillName.split(' ');
        setFormData({ ...initialFormData, first_name: nameParts[0] || '', last_name: nameParts.slice(1).join(' ') || '' });
      } else if (editingMember) {
        setFormData({
          ...initialFormData,
          ...editingMember,
          join_date: editingMember.join_date || new Date().toISOString().split('T')[0],
          dob: editingMember.dob || '',
          dependents_count: editingMember.dependents_count || 0,
          membership_history: editingMember.membership_history || [],
          assigned_plan_ids: editingMember.assigned_plan_ids || [],
        });
      } else {
        setFormData({ ...initialFormData, first_name: '', last_name: '' });
      }
    }
  }, [editingMember, prefillName, isOpen, initialFormData]);
  
  return { formData, setFormData };
};

const useAvailableMemberships = (membershipTypesList, editingMember, isOpen, currentFormData, setFormDataCallback) => {
    const [availableMemberships, setAvailableMemberships] = useState([]);
     useEffect(() => {
        if (!isOpen || !Array.isArray(membershipTypesList)) {
            setAvailableMemberships([]);
            return;
        }

        const nonMemberType = membershipTypesList.find(mt => mt.category === 'Non-Member');
        let filteredTypes = membershipTypesList.filter(mt => mt.available_for_sale || mt.category === 'Staff');
        
        if (editingMember?.current_membership_type_id) {
            const currentMemberType = membershipTypesList.find(mt => mt.id === editingMember.current_membership_type_id);
            if (currentMemberType && !filteredTypes.some(ft => ft.id === currentMemberType.id)) {
                filteredTypes.push(currentMemberType);
            }
        }
        
        if (nonMemberType && !filteredTypes.some(ft => ft.id === nonMemberType.id)) {
            filteredTypes.unshift(nonMemberType);
        }

        setAvailableMemberships(filteredTypes);

        const defaultMembershipId = nonMemberType?.id || (filteredTypes.length > 0 ? filteredTypes[0].id : '');
        
        if (!currentFormData.current_membership_type_id && defaultMembershipId) {
             if (!editingMember || (editingMember && !editingMember.current_membership_type_id)){
                 setFormDataCallback(prev => ({
                    ...prev,
                    current_membership_type_id: defaultMembershipId
                }));
             } else if (editingMember && editingMember.current_membership_type_id) {
                 setFormDataCallback(prev => ({
                    ...prev,
                    current_membership_type_id: editingMember.current_membership_type_id
                }));
             }
        }

    }, [membershipTypesList, editingMember, isOpen, currentFormData.current_membership_type_id, setFormDataCallback]); // currentFormData.current_membership_type_id ensures this re-evaluates if that specific part of formData changes
    return availableMemberships;
};


const MemberFormDialog = ({ isOpen, onOpenChange, editingMember, onSubmit, membershipTypesList = [], prefillName }) => {
  const { toast } = useToast();
  const adminSettings = useAdminSettings();
  
  const initialFormData = useMemo(() => ({
    first_name: '', last_name: '', email: '', phone: '',
    join_date: new Date().toISOString().split('T')[0],
    current_membership_type_id: '', status: 'Active',
    access_card_number: '', dependents_count: 0, notes: '', address: '',
    dob: '', emergency_contact_name: '', emergency_contact_phone: '',
    profile_picture_url: '', system_member_id: '', profile_creation_date: new Date().toISOString(),
    membership_history: [], assigned_plan_ids: [],
    auth_user_id: null, 
    role: 'member', 
  }), []);

  const { formData, setFormData } = useMemberFormInitialization(editingMember, prefillName, isOpen, initialFormData);
  const availableMemberships = useAvailableMemberships(membershipTypesList, editingMember, isOpen, formData, setFormData);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, [setFormData]);

  const handleSelectChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, [setFormData]);

  const validateForm = useCallback(() => {
    let isValid = true;
    const errors = {};
    const requiredFieldsConfig = {
        first_name: adminSettings.require_first_name,
        last_name: adminSettings.require_last_name,
        email: adminSettings.require_email,
        phone: adminSettings.require_phone,
        dob: adminSettings.require_dob,
        address: adminSettings.require_address,
    };
    
    Object.keys(requiredFieldsConfig).forEach(key => {
        if (requiredFieldsConfig[key] && !formData[key]?.trim()) {
            errors[key] = `${key.replace(/_/g, ' ')} is required.`.replace(/\b\w/g, l => l.toUpperCase());
            isValid = false;
        }
    });
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Invalid email format.';
        isValid = false;
    }

    if (!isValid) {
        Object.values(errors).forEach(errorMsg => {
            toast({ title: "Validation Error", description: errorMsg, variant: "destructive" });
        });
    }
    return isValid;
  }, [formData, adminSettings, toast]);

  const handleSubmitForm = useCallback((e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const submissionData = {
      ...formData,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      id: editingMember?.id || crypto.randomUUID(), 
      system_member_id: formData.system_member_id || Math.floor(100000 + Math.random() * 900000),
      profile_creation_date: formData.profile_creation_date || new Date().toISOString(),
      created_at: editingMember?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      role: formData.role || 'member',
    };
    onSubmit(submissionData, editingMember);
  }, [formData, editingMember, onSubmit, validateForm]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) setFormData(initialFormData); 
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingMember ? 'Edit Member Profile' : 'Add New Member'}</DialogTitle>
          <DialogDescription>
            {editingMember ? 'Update the member\'s information.' : 'Enter the details for the new member.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmitForm} className="space-y-3 py-3 max-h-[70vh] overflow-y-auto pr-2 text-sm">
          <MemberFormField 
            label="First Name" name="first_name" type="text"
            value={formData.first_name} onChange={handleInputChange}
            isRequiredByAdmin={adminSettings.require_first_name} 
          />
          <MemberFormField 
            label="Last Name" name="last_name" type="text" 
            value={formData.last_name} onChange={handleInputChange}
            isRequiredByAdmin={adminSettings.require_last_name} 
          />
          <MemberFormField 
            label="Email Address" name="email" type="email" 
            value={formData.email} onChange={handleInputChange}
            isRequiredByAdmin={adminSettings.require_email} 
          />
          <MemberFormField 
            label="Phone Number" name="phone" type="tel" 
            value={formData.phone} onChange={handleInputChange}
            isRequiredByAdmin={adminSettings.require_phone} 
          />
          <MemberFormField 
            label="Date of Birth" name="dob" type="date" 
            value={formData.dob} onChange={handleInputChange}
            isRequiredByAdmin={adminSettings.require_dob} 
          />
          <MemberFormField 
            label="Address" name="address" type="textarea" 
            value={formData.address} onChange={handleInputChange}
            isRequiredByAdmin={adminSettings.require_address} 
          />
          
          <MemberFormField label="Join Date" name="join_date" type="date" value={formData.join_date} onChange={handleInputChange} isRequiredByAdmin={true} />
          
          <MemberFormField label="Membership Type" name="current_membership_type_id">
            <Select name="current_membership_type_id" value={formData.current_membership_type_id || ''} onValueChange={(value) => handleSelectChange('current_membership_type_id', value)}>
              <SelectTrigger><SelectValue placeholder="Select membership" /></SelectTrigger>
              <SelectContent>
                {availableMemberships.map((type) => (
                  <SelectItem key={type.id} value={type.id}>{type.name} ({type.billing_type})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </MemberFormField>

          <MemberFormField label="Access Card Number" name="access_card_number" value={formData.access_card_number} onChange={handleInputChange} />

          <MemberFormField label="Status" name="status">
            <Select name="status" value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Frozen">Frozen</SelectItem>
                <SelectItem value="Guest">Guest</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </MemberFormField>

           <MemberFormField label="Number of Dependents" name="dependents_count" type="number" min="0" value={String(formData.dependents_count)} onChange={handleInputChange} />
          
          <MemberFormField label="Emergency Contact Name" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleInputChange} />
          <MemberFormField label="Emergency Contact Phone" name="emergency_contact_phone" type="tel" value={formData.emergency_contact_phone} onChange={handleInputChange} />
          
          <MemberFormField label="Notes" name="notes" type="textarea" value={formData.notes} onChange={handleInputChange} />

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              {editingMember ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MemberFormDialog;


