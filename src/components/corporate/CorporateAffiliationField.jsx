/**
 * Corporate Affiliation Field Component
 * Allows members to select and verify their corporate affiliation
 */

import React, { useState, useEffect } from 'react';
import { Search, Building, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import CorporatePartnersService from '@/services/corporatePartnersService';
import CorporateDiscountCalculator from '@/utils/corporateDiscountCalculator';

const CorporateAffiliationField = ({
  value = null,
  onChange,
  membershipTypeId = null,
  membershipPrice = 0,
  showDiscountPreview = true,
  required = false,
  disabled = false
}) => {
  const [corporatePartners, setCorporatePartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(value?.corporate_partner_id || null);
  const [employeeId, setEmployeeId] = useState(value?.employee_id || '');
  const [department, setDepartment] = useState(value?.department || '');
  const [jobTitle, setJobTitle] = useState(value?.job_title || '');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discountPreview, setDiscountPreview] = useState(null);
  const { toast } = useToast();

  // Load corporate partners on mount
  useEffect(() => {
    loadCorporatePartners();
  }, []);

  // Calculate discount preview when partner or membership details change
  useEffect(() => {
    if (selectedPartner && membershipTypeId && membershipPrice && showDiscountPreview) {
      calculateDiscountPreview();
    } else {
      setDiscountPreview(null);
    }
  }, [selectedPartner, membershipTypeId, membershipPrice, showDiscountPreview]);

  // Update parent component when affiliation changes
  useEffect(() => {
    const affiliationData = selectedPartner ? {
      corporate_partner_id: selectedPartner,
      employee_id: employeeId,
      department: department,
      job_title: jobTitle,
      verification_status: 'pending'
    } : null;

    onChange?.(affiliationData);
  }, [selectedPartner, employeeId, department, jobTitle, onChange]);

  const loadCorporatePartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await CorporatePartnersService.getCorporatePartners({
        isActive: true
      });

      if (error) {
        
        return;
      }

      setCorporatePartners(data || []);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscountPreview = async () => {
    try {
      const partner = corporatePartners.find(p => p.id === selectedPartner);
      if (!partner || !partner.corporate_discounts) return;

      const membershipDetails = {
        membershipTypeId,
        basePrice: membershipPrice,
        isFamily: false // This could be passed as a prop if needed
      };

      const mockAffiliation = {
        corporate_partners: partner
      };

      const discountResult = CorporateDiscountCalculator.calculateBestDiscount(
        mockAffiliation,
        partner.corporate_discounts,
        membershipDetails
      );

      setDiscountPreview(discountResult);
    } catch (error) {
      
    }
  };

  const getSelectedPartner = () => {
    return corporatePartners.find(p => p.id === selectedPartner);
  };

  const getVerificationStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-400 text-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending Verification
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Verification Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const selectedPartnerData = getSelectedPartner();

  return (
    <div className="space-y-4">
      {/* Corporate Partner Selection */}
      <div>
        <Label htmlFor="corporate-partner">
          Corporate Partner {required && <span className="text-red-500">*</span>}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled}
            >
              {selectedPartnerData ? (
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  {selectedPartnerData.company_name}
                </div>
              ) : (
                <div className="flex items-center text-gray-500">
                  <Search className="h-4 w-4 mr-2" />
                  Search for your company...
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search companies..." />
              <CommandEmpty>
                <div className="p-4 text-center">
                  <Building className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No corporate partners found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Contact us if your company should be listed
                  </p>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {corporatePartners.map((partner) => (
                  <CommandItem
                    key={partner.id}
                    value={partner.company_name}
                    onSelect={() => {
                      setSelectedPartner(partner.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{partner.company_name}</div>
                        <div className="text-sm text-gray-500">
                          {partner.industry} • {partner.employee_count} employees
                        </div>
                      </div>
                      {partner.corporate_discounts?.length > 0 && (
                        <Badge variant="outline" className="ml-2">
                          {partner.corporate_discounts.length} discount{partner.corporate_discounts.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Employee Details */}
      {selectedPartner && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="employee-id">Employee ID</Label>
                <Input
                  id="employee-id"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Your employee ID"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="job-title">Job Title</Label>
                <Input
                  id="job-title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Your job title"
                  disabled={disabled}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Your department"
                disabled={disabled}
              />
            </div>

            {/* Verification Status */}
            {value?.verification_status && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">Verification Status:</span>
                {getVerificationStatusBadge(value.verification_status)}
              </div>
            )}

            {/* Verification Notice */}
            {selectedPartnerData?.requires_verification && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Verification Required</p>
                    <p className="text-yellow-700 mt-1">
                      Your employment with {selectedPartnerData.company_name} will need to be verified 
                      before corporate discounts can be applied.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Discount Preview */}
      {discountPreview && discountPreview.discountAmount > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-800">Corporate Discount Available</h4>
                <p className="text-sm text-green-700">
                  {discountPreview.appliedDiscount?.discount_name}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-800">
                  -${discountPreview.discountAmount.toFixed(2)}
                </div>
                <div className="text-sm text-green-600">
                  {discountPreview.discountPercentage.toFixed(1)}% off
                </div>
              </div>
            </div>
            
            {discountPreview.calculationDetails && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <p className="text-xs text-green-600">
                  {CorporateDiscountCalculator.formatDiscountDisplay(discountPreview.appliedDiscount)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Corporate Affiliation Option */}
      {selectedPartner && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedPartner(null);
            setEmployeeId('');
            setDepartment('');
            setJobTitle('');
          }}
          disabled={disabled}
          className="text-gray-500 hover:text-gray-700"
        >
          Remove corporate affiliation
        </Button>
      )}
    </div>
  );
};

export default CorporateAffiliationField;

