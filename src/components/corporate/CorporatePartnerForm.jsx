/**
 * Corporate Partner Form Component
 * Form for creating and editing corporate partners
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import CorporatePartnersService from '@/services/corporatePartnersService';
import AutomatedReportsManager from './AutomatedReportsManager';
import EnhancedReportsSection from './EnhancedReportsSection';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Manufacturing',
  'Retail',
  'Education',
  'Government',
  'Non-Profit',
  'Energy',
  'Transportation',
  'Real Estate',
  'Other'
];

const CorporatePartnerForm = ({ 
  isOpen, 
  onClose, 
  partner = null, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    company_name: '',
    company_code: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    company_address: '',
    website: '',
    employee_count: '',
    industry: '',
    agreement_start_date: '',
    agreement_end_date: '',
    is_active: true,
    requires_verification: false,
    notes: '',
    automated_reports_enabled: false
  });
  
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Initialize form data when partner changes
  useEffect(() => {
    if (partner) {
      setFormData({
        company_name: partner.company_name || '',
        company_code: partner.company_code || '',
        contact_person: partner.contact_person || '',
        contact_email: partner.contact_email || '',
        contact_phone: partner.contact_phone || '',
        company_address: partner.company_address || '',
        website: partner.website || '',
        employee_count: partner.employee_count || '',
        industry: partner.industry || '',
        agreement_start_date: partner.agreement_start_date || '',
        agreement_end_date: partner.agreement_end_date || '',
        is_active: partner.is_active ?? true,
        requires_verification: partner.requires_verification ?? false,
        notes: partner.notes || '',
        automated_reports_enabled: partner.automated_reports_enabled ?? false
      });
      setDiscounts(partner.corporate_discounts || []);
    } else {
      // Reset form for new partner
      setFormData({
        company_name: '',
        company_code: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        company_address: '',
        website: '',
        employee_count: '',
        industry: '',
        agreement_start_date: '',
        agreement_end_date: '',
        is_active: true,
        requires_verification: false,
        notes: '',
        automated_reports_enabled: false
      });
      setDiscounts([]);
    }
  }, [partner]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateCompanyCode = (companyName) => {
    return companyName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10);
  };

  const handleCompanyNameChange = (value) => {
    handleInputChange('company_name', value);
    
    // Auto-generate company code if it's empty
    if (!formData.company_code && value) {
      handleInputChange('company_code', generateCompanyCode(value));
    }
  };

  const addDiscount = () => {
    const newDiscount = {
      id: `temp_${Date.now()}`,
      discount_name: '',
      discount_type: 'percentage',
      discount_value: '',
      membership_type_id: null,
      tier_min_employees: '',
      tier_max_employees: '',
      applies_to_family: false,
      is_active: true,
      start_date: '',
      end_date: '',
      max_uses: '',
      isNew: true
    };
    setDiscounts(prev => [...prev, newDiscount]);
  };

  const updateDiscount = (index, field, value) => {
    setDiscounts(prev => prev.map((discount, i) => 
      i === index ? { ...discount, [field]: value } : discount
    ));
  };

  const removeDiscount = (index) => {
    setDiscounts(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const required = ['company_name', 'company_code', 'contact_person', 'contact_email'];
    const missing = required.filter(field => !formData[field]);
    
    if (missing.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in required fields: ${missing.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contact_email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    // Validate dates
    if (formData.agreement_start_date && formData.agreement_end_date) {
      if (new Date(formData.agreement_start_date) >= new Date(formData.agreement_end_date)) {
        toast({
          title: "Validation Error",
          description: "Agreement end date must be after start date",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      let result;
      
      if (partner) {
        // Update existing partner
        result = await CorporatePartnersService.updateCorporatePartner(partner.id, formData);
      } else {
        // Create new partner
        result = await CorporatePartnersService.createCorporatePartner(formData, 'current-user-id');
      }

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message || "Failed to save corporate partner",
          variant: "destructive",
        });
        return;
      }

      // Save discounts
      const partnerId = result.data.id;
      
      for (const discount of discounts) {
        if (discount.isNew) {
          const discountData = { ...discount };
          delete discountData.id;
          delete discountData.isNew;
          discountData.corporate_partner_id = partnerId;
          
          await CorporatePartnersService.createCorporateDiscount(discountData);
        }
      }

      toast({
        title: "Success",
        description: `Corporate partner ${partner ? 'updated' : 'created'} successfully`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to save corporate partner",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {partner ? 'Edit Corporate Partner' : 'Add Corporate Partner'}
          </DialogTitle>
          <DialogDescription>
            {partner 
              ? 'Update corporate partnership details and discount structures'
              : 'Create a new corporate partnership with employee discount programs'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="company_code">Company Code *</Label>
                  <Input
                    id="company_code"
                    value={formData.company_code}
                    onChange={(e) => handleInputChange('company_code', e.target.value.toUpperCase())}
                    placeholder="COMPANYCODE"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map(industry => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="employee_count">Employee Count</Label>
                  <Input
                    id="employee_count"
                    type="number"
                    value={formData.employee_count}
                    onChange={(e) => handleInputChange('employee_count', e.target.value)}
                    placeholder="Number of employees"
                  />
                </div>
                
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://company.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="company_address">Company Address</Label>
                <Textarea
                  id="company_address"
                  value={formData.company_address}
                  onChange={(e) => handleInputChange('company_address', e.target.value)}
                  placeholder="Enter company address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contact_person">Contact Person *</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    placeholder="Contact person name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contact@company.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agreement Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agreement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agreement_start_date">Agreement Start Date</Label>
                  <Input
                    id="agreement_start_date"
                    type="date"
                    value={formData.agreement_start_date}
                    onChange={(e) => handleInputChange('agreement_start_date', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="agreement_end_date">Agreement End Date</Label>
                  <Input
                    id="agreement_end_date"
                    type="date"
                    value={formData.agreement_end_date}
                    onChange={(e) => handleInputChange('agreement_end_date', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Active Partnership</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires_verification"
                    checked={formData.requires_verification}
                    onCheckedChange={(checked) => handleInputChange('requires_verification', checked)}
                  />
                  <Label htmlFor="requires_verification">Requires Member Verification</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes about this partnership"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Automated Reports */}
          <EnhancedReportsSection
            corporatePartner={partner}
            formData={formData}
            onFormDataChange={handleInputChange}
            onReportsUpdate={() => {
              // Callback for when reports are updated
              
            }}
          />

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : (partner ? 'Update Partner' : 'Create Partner')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CorporatePartnerForm;

