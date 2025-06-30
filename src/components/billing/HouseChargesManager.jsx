// 🚀 HOUSE CHARGES MANAGER - Manage additional billing items
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  DollarSign,
  Calendar,
  Users,
  MoreVertical,
  Clock,
  Tag,
  Calculator
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  useHouseCharges, 
  useCreateHouseCharge, 
  useUpdateHouseCharge, 
  useDeleteHouseCharge 
} from '@/hooks/useBillingConfig';

const HouseChargeDialog = ({ isOpen, onClose, charge, organizationId }) => {
  const createMutation = useCreateHouseCharge();
  const updateMutation = useUpdateHouseCharge();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    charge_type: 'recurring',
    billing_frequency: 'monthly',
    is_taxable: false,
    tax_rate: '',
    unit_name: '',
    unit_price: ''
  });

  // Initialize form data
  React.useEffect(() => {
    if (charge) {
      setFormData({
        name: charge.name || '',
        description: charge.description || '',
        amount: charge.amount?.toString() || '',
        charge_type: charge.charge_type || 'recurring',
        billing_frequency: charge.billing_frequency || 'monthly',
        is_taxable: charge.is_taxable || false,
        tax_rate: charge.tax_rate?.toString() || '',
        unit_name: charge.unit_name || '',
        unit_price: charge.unit_price?.toString() || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        amount: '',
        charge_type: 'recurring',
        billing_frequency: 'monthly',
        is_taxable: false,
        tax_rate: '',
        unit_name: '',
        unit_price: ''
      });
    }
  }, [charge, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const chargeData = {
      ...formData,
      amount: parseFloat(formData.amount),
      tax_rate: formData.tax_rate ? parseFloat(formData.tax_rate) : 0,
      unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null
    };

    try {
      if (charge) {
        await updateMutation.mutateAsync({
          chargeId: charge.id,
          updates: chargeData
        });
      } else {
        await createMutation.mutateAsync({
          organizationId,
          chargeData
        });
      }
      onClose();
    } catch (error) {
      
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {charge ? 'Edit House Charge' : 'Add New House Charge'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Charge Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Locker Rental"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the charge"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="charge_type">Charge Type</Label>
              <Select 
                value={formData.charge_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, charge_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recurring">Recurring</SelectItem>
                  <SelectItem value="one_time">One-time</SelectItem>
                  <SelectItem value="usage_based">Usage-based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.charge_type === 'recurring' && (
              <div>
                <Label htmlFor="billing_frequency">Frequency</Label>
                <Select 
                  value={formData.billing_frequency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, billing_frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {formData.charge_type === 'usage_based' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit_name">Unit Name</Label>
                <Input
                  id="unit_name"
                  value={formData.unit_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit_name: e.target.value }))}
                  placeholder="e.g., session, hour"
                />
              </div>
              <div>
                <Label htmlFor="unit_price">Price per Unit</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit_price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_taxable"
                checked={formData.is_taxable}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_taxable: checked }))}
              />
              <Label htmlFor="is_taxable">Taxable</Label>
            </div>

            {formData.is_taxable && (
              <div>
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: e.target.value }))}
                  placeholder="8.25"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {charge ? 'Update' : 'Create'} Charge
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const HouseChargeCard = ({ charge, onEdit, onDelete }) => {
  const getChargeTypeColor = (type) => {
    switch (type) {
      case 'recurring': return 'bg-blue-100 text-blue-800';
      case 'one_time': return 'bg-green-100 text-green-800';
      case 'usage_based': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyText = (frequency) => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'annually': return 'Annually';
      default: return frequency;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-gray-900">{charge.name}</h3>
                <Badge className={getChargeTypeColor(charge.charge_type)}>
                  {charge.charge_type.replace('_', ' ')}
                </Badge>
              </div>
              
              {charge.description && (
                <p className="text-sm text-gray-600 mb-3">{charge.description}</p>
              )}
              
              <div className="space-y-1">
                {charge.charge_type === 'usage_based' ? (
                  <div className="flex items-center space-x-2 text-sm">
                    <Calculator className="w-4 h-4 text-gray-500" />
                    <span>${charge.unit_price} per {charge.unit_name}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>${charge.amount}</span>
                    {charge.charge_type === 'recurring' && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span>{getFrequencyText(charge.billing_frequency)}</span>
                      </>
                    )}
                  </div>
                )}
                
                {charge.is_taxable && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span>Taxable ({charge.tax_rate}%)</span>
                  </div>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(charge)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(charge.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const HouseChargesManager = ({ organizationId = 'default-org-id' }) => {
  const { data: houseCharges = [], isLoading, error } = useHouseCharges(organizationId);
  const deleteMutation = useDeleteHouseCharge();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingCharge, setEditingCharge] = useState(null);

  const handleEdit = (charge) => {
    setEditingCharge(charge);
    setShowDialog(true);
  };

  const handleDelete = async (chargeId) => {
    if (window.confirm('Are you sure you want to delete this house charge?')) {
      try {
        await deleteMutation.mutateAsync(chargeId);
      } catch (error) {
        
      }
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingCharge(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading house charges...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading house charges: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">House Charges</h3>
          <p className="text-sm text-gray-600">
            Manage additional charges like locker rentals, towel service, and personal training
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add House Charge
        </Button>
      </div>

      {/* House Charges Grid */}
      {houseCharges.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {houseCharges.map((charge) => (
              <HouseChargeCard
                key={charge.id}
                charge={charge}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No House Charges</h3>
            <p className="text-gray-500 mb-4">
              Create your first house charge to start billing for additional services
            </p>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First House Charge
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <HouseChargeDialog
        isOpen={showDialog}
        onClose={handleCloseDialog}
        charge={editingCharge}
        organizationId={organizationId}
      />
    </div>
  );
};

export default HouseChargesManager;

