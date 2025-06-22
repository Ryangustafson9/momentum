/**
 * Discount Management Component
 * Manages corporate discount structures and rules
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import CorporatePartnersService from '@/services/corporatePartnersService';

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage Discount', description: 'Fixed percentage off membership' },
  { value: 'fixed_amount', label: 'Fixed Amount', description: 'Fixed dollar amount off' },
  { value: 'membership_specific', label: 'Membership Specific', description: 'Discount for specific membership types' },
  { value: 'tiered', label: 'Tiered Discount', description: 'Discount based on company size' },
  { value: 'family_bonus', label: 'Family Bonus', description: 'Additional discount for family plans' }
];

const DiscountManagement = ({ partnerId, discounts = [], onDiscountsChange }) => {
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const { toast } = useToast();

  // Load membership types for membership-specific discounts
  useEffect(() => {
    loadMembershipTypes();
  }, []);

  const loadMembershipTypes = async () => {
    try {
      // This would be replaced with actual membership types service call
      setMembershipTypes([
        { id: '1', name: 'Basic Membership' },
        { id: '2', name: 'Premium Membership' },
        { id: '3', name: 'Family Membership' },
        { id: '4', name: 'Corporate Membership' }
      ]);
    } catch (error) {
      
    }
  };

  const createNewDiscount = () => {
    return {
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
      current_uses: 0,
      isNew: true
    };
  };

  const handleAddDiscount = () => {
    setEditingDiscount(createNewDiscount());
    setShowAddForm(true);
  };

  const handleEditDiscount = (discount) => {
    setEditingDiscount({ ...discount });
    setShowAddForm(true);
  };

  const handleSaveDiscount = async () => {
    try {
      if (!editingDiscount.discount_name || !editingDiscount.discount_value) {
        toast({
          title: "Validation Error",
          description: "Please fill in discount name and value",
          variant: "destructive",
        });
        return;
      }

      if (editingDiscount.discount_type === 'tiered' && 
          (!editingDiscount.tier_min_employees || !editingDiscount.tier_max_employees)) {
        toast({
          title: "Validation Error",
          description: "Please specify employee count range for tiered discounts",
          variant: "destructive",
        });
        return;
      }

      let result;
      if (editingDiscount.isNew) {
        // Create new discount
        const discountData = { ...editingDiscount };
        delete discountData.id;
        delete discountData.isNew;
        discountData.corporate_partner_id = partnerId;
        
        result = await CorporatePartnersService.createCorporateDiscount(discountData);
      } else {
        // Update existing discount
        const discountData = { ...editingDiscount };
        delete discountData.id;
        delete discountData.isNew;
        
        result = await CorporatePartnersService.updateCorporateDiscount(editingDiscount.id, discountData);
      }

      if (result.error) {
        toast({
          title: "Error",
          description: "Failed to save discount",
          variant: "destructive",
        });
        return;
      }

      // Update local discounts list
      let updatedDiscounts;
      if (editingDiscount.isNew) {
        updatedDiscounts = [...discounts, result.data];
      } else {
        updatedDiscounts = discounts.map(d => 
          d.id === editingDiscount.id ? result.data : d
        );
      }

      onDiscountsChange(updatedDiscounts);
      setShowAddForm(false);
      setEditingDiscount(null);

      toast({
        title: "Success",
        description: `Discount ${editingDiscount.isNew ? 'created' : 'updated'} successfully`,
      });
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to save discount",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    try {
      const { error } = await CorporatePartnersService.deleteCorporateDiscount(discountId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete discount",
          variant: "destructive",
        });
        return;
      }

      const updatedDiscounts = discounts.filter(d => d.id !== discountId);
      onDiscountsChange(updatedDiscounts);

      toast({
        title: "Success",
        description: "Discount deleted successfully",
      });
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to delete discount",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingDiscount(null);
  };

  const updateEditingDiscount = (field, value) => {
    setEditingDiscount(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getDiscountTypeLabel = (type) => {
    const discountType = DISCOUNT_TYPES.find(dt => dt.value === type);
    return discountType ? discountType.label : type;
  };

  const formatDiscountValue = (discount) => {
    if (discount.discount_type === 'percentage') {
      return `${discount.discount_value}%`;
    } else if (discount.discount_type === 'fixed_amount') {
      return `$${discount.discount_value}`;
    } else if (discount.discount_type === 'tiered') {
      return `${discount.discount_value}% (${discount.tier_min_employees}-${discount.tier_max_employees} employees)`;
    }
    return `${discount.discount_value}%`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Discount Programs</CardTitle>
          <Button onClick={handleAddDiscount} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Discount
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add/Edit Discount Form */}
        {showAddForm && editingDiscount && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-base">
                {editingDiscount.isNew ? 'Add New Discount' : 'Edit Discount'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_name">Discount Name</Label>
                  <Input
                    id="discount_name"
                    value={editingDiscount.discount_name}
                    onChange={(e) => updateEditingDiscount('discount_name', e.target.value)}
                    placeholder="e.g., Employee Discount"
                  />
                </div>
                
                <div>
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select 
                    value={editingDiscount.discount_type} 
                    onValueChange={(value) => updateEditingDiscount('discount_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DISCOUNT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="discount_value">
                    Discount Value {editingDiscount.discount_type === 'fixed_amount' ? '($)' : '(%)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    value={editingDiscount.discount_value}
                    onChange={(e) => updateEditingDiscount('discount_value', e.target.value)}
                    placeholder={editingDiscount.discount_type === 'fixed_amount' ? '25.00' : '15'}
                  />
                </div>

                {editingDiscount.discount_type === 'membership_specific' && (
                  <div>
                    <Label htmlFor="membership_type">Membership Type</Label>
                    <Select 
                      value={editingDiscount.membership_type_id || ''} 
                      onValueChange={(value) => updateEditingDiscount('membership_type_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select membership type" />
                      </SelectTrigger>
                      <SelectContent>
                        {membershipTypes.map(type => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {editingDiscount.discount_type === 'tiered' && (
                  <>
                    <div>
                      <Label htmlFor="tier_min_employees">Min Employees</Label>
                      <Input
                        id="tier_min_employees"
                        type="number"
                        value={editingDiscount.tier_min_employees}
                        onChange={(e) => updateEditingDiscount('tier_min_employees', e.target.value)}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tier_max_employees">Max Employees</Label>
                      <Input
                        id="tier_max_employees"
                        type="number"
                        value={editingDiscount.tier_max_employees}
                        onChange={(e) => updateEditingDiscount('tier_max_employees', e.target.value)}
                        placeholder="50"
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={editingDiscount.start_date}
                    onChange={(e) => updateEditingDiscount('start_date', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={editingDiscount.end_date}
                    onChange={(e) => updateEditingDiscount('end_date', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="max_uses">Max Uses (Optional)</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={editingDiscount.max_uses}
                    onChange={(e) => updateEditingDiscount('max_uses', e.target.value)}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="applies_to_family"
                    checked={editingDiscount.applies_to_family}
                    onCheckedChange={(checked) => updateEditingDiscount('applies_to_family', checked)}
                  />
                  <Label htmlFor="applies_to_family">Applies to Family Plans</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={editingDiscount.is_active}
                    onCheckedChange={(checked) => updateEditingDiscount('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveDiscount}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Discount
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Discounts Table */}
        {discounts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No discount programs configured</div>
            <Button onClick={handleAddDiscount} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add First Discount
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Discount Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell className="font-medium">{discount.discount_name}</TableCell>
                  <TableCell>{getDiscountTypeLabel(discount.discount_type)}</TableCell>
                  <TableCell>{formatDiscountValue(discount)}</TableCell>
                  <TableCell>
                    <Badge variant={discount.is_active ? "default" : "secondary"}>
                      {discount.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {discount.max_uses ? 
                      `${discount.current_uses || 0}/${discount.max_uses}` : 
                      `${discount.current_uses || 0} uses`
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditDiscount(discount)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteDiscount(discount.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscountManagement;

