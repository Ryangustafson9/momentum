// Configuration Templates Manager
// Allows admins to view, create, edit, and manage configuration templates
// Created: June 21, 2025

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Eye, 
  Star, 
  Building,
  CreditCard,
  Settings,
  Users,
  Download,
  Upload,
  Save,
  X
} from 'lucide-react';
import LocationService from '@/lib/services/locationService';
import { useToast } from '@/hooks/use-toast';

const ConfigurationTemplatesManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const { toast } = useToast();

  const templateCategories = [
    { value: 'all', label: 'All Templates' },
    { value: 'gym_franchise', label: 'Gym Franchise' },
    { value: 'boutique_fitness', label: 'Boutique Fitness' },
    { value: 'martial_arts', label: 'Martial Arts' },
    { value: 'yoga_studio', label: 'Yoga Studio' },
    { value: 'crossfit_box', label: 'CrossFit Box' },
    { value: 'swimming_pool', label: 'Swimming Pool' },
    { value: 'personal_training', label: 'Personal Training' },
    { value: 'custom', label: 'Custom' }
  ];

  const billingTypes = [
    { value: 'monthly', label: 'Monthly Billing' },
    { value: 'annual', label: 'Annual Billing' },
    { value: 'session_based', label: 'Session-Based' },
    { value: 'flexible', label: 'Flexible Billing' }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const result = await LocationService.getLocationTemplates();
      if (result.data) {
        setTemplates(result.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateTemplate = async (templateData) => {
    try {
      const result = await LocationService.createLocationTemplate(templateData);
      if (result.data) {
        setTemplates([...templates, result.data]);
        setShowCreateModal(false);
        toast({
          title: "Success",
          description: "Template created successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateTemplate = async (template) => {
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      is_momentum_official: false,
      usage_count: 0,
      created_at: new Date().toISOString()
    };
    delete duplicatedTemplate.id;
    
    await handleCreateTemplate(duplicatedTemplate);
  };

  const TemplateCard = ({ template }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {template.name}
              {template.is_momentum_official && (
                <Badge variant="default" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Official
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {template.description}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewingTemplate(template)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDuplicateTemplate(template)}
            >
              <Copy className="w-4 h-4" />
            </Button>
            {!template.is_momentum_official && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingTemplate(template)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Badge variant="outline">
              {templateCategories.find(cat => cat.value === template.category)?.label || template.category}
            </Badge>
            <Badge variant="secondary">
              Used {template.usage_count} times
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(template.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TemplateFormModal = ({ template, isOpen, onClose, onSave, title }) => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      category: 'custom',
      billing_config_template: {
        membership_billing_type: 'monthly',
        late_fee_amount: 25,
        payment_grace_period_days: 3,
        auto_suspend_days: 7,
        family_discount_enabled: true,
        family_discount_percent: 10,
        personal_training_enabled: true,
        personal_training_hourly_rate: 75,
        day_pass_enabled: true,
        day_pass_price: 25,
        guest_pass_enabled: true,
        guest_pass_price: 15,
        initiation_fee_enabled: false,
        initiation_fee_amount: 0,
        annual_discount_enabled: false,
        annual_discount_percent: 0
      },
      payment_config_template: {
        accepted_payment_methods: ['credit_card', 'bank_transfer'],
        payment_processor: 'stripe',
        auto_payment_enabled: true,
        payment_retry_attempts: 3,
        payment_retry_interval_days: 7
      },
      business_rules_template: {
        minimum_membership_duration_months: 1,
        cancellation_notice_days: 30,
        freeze_enabled: true,
        freeze_max_days_per_year: 60,
        freeze_fee_per_month: 10,
        transfer_enabled: true,
        transfer_fee: 25
      }
    });

    useEffect(() => {
      if (template) {
        setFormData({
          name: template.name || '',
          description: template.description || '',
          category: template.category || 'custom',
          billing_config_template: template.billing_config_template || formData.billing_config_template,
          payment_config_template: template.payment_config_template || formData.payment_config_template,
          business_rules_template: template.business_rules_template || formData.business_rules_template
        });
      }
    }, [template]);

    const handleSave = () => {
      onSave(formData);
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Standard Gym Template"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateCategories.filter(cat => cat.value !== 'all').map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this template and its use case..."
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Configuration Tabs */}
            <Tabs defaultValue="billing" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="billing">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing
                </TabsTrigger>
                <TabsTrigger value="payment">
                  <Settings className="w-4 h-4 mr-2" />
                  Payment
                </TabsTrigger>
                <TabsTrigger value="business">
                  <Users className="w-4 h-4 mr-2" />
                  Business Rules
                </TabsTrigger>
              </TabsList>

              <TabsContent value="billing" className="space-y-4">
                <h4 className="font-semibold">Billing Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Billing Type</Label>
                    <Select
                      value={formData.billing_config_template.membership_billing_type}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        billing_config_template: {
                          ...prev.billing_config_template,
                          membership_billing_type: value
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {billingTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Late Fee Amount ($)</Label>
                    <Input
                      type="number"
                      value={formData.billing_config_template.late_fee_amount}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billing_config_template: {
                          ...prev.billing_config_template,
                          late_fee_amount: parseFloat(e.target.value) || 0
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Grace Period (Days)</Label>
                    <Input
                      type="number"
                      value={formData.billing_config_template.payment_grace_period_days}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billing_config_template: {
                          ...prev.billing_config_template,
                          payment_grace_period_days: parseInt(e.target.value) || 0
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Auto Suspend (Days)</Label>
                    <Input
                      type="number"
                      value={formData.billing_config_template.auto_suspend_days}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billing_config_template: {
                          ...prev.billing_config_template,
                          auto_suspend_days: parseInt(e.target.value) || 0
                        }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Family Discount</Label>
                    <Switch
                      checked={formData.billing_config_template.family_discount_enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        billing_config_template: {
                          ...prev.billing_config_template,
                          family_discount_enabled: checked
                        }
                      }))}
                    />
                  </div>
                  {formData.billing_config_template.family_discount_enabled && (
                    <div>
                      <Label>Family Discount Percentage</Label>
                      <Input
                        type="number"
                        value={formData.billing_config_template.family_discount_percent}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          billing_config_template: {
                            ...prev.billing_config_template,
                            family_discount_percent: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Personal Training</Label>
                    <Switch
                      checked={formData.billing_config_template.personal_training_enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        billing_config_template: {
                          ...prev.billing_config_template,
                          personal_training_enabled: checked
                        }
                      }))}
                    />
                  </div>
                  {formData.billing_config_template.personal_training_enabled && (
                    <div>
                      <Label>Hourly Rate ($)</Label>
                      <Input
                        type="number"
                        value={formData.billing_config_template.personal_training_hourly_rate}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          billing_config_template: {
                            ...prev.billing_config_template,
                            personal_training_hourly_rate: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="payment" className="space-y-4">
                <h4 className="font-semibold">Payment Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Processor</Label>
                    <Select
                      value={formData.payment_config_template.payment_processor}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        payment_config_template: {
                          ...prev.payment_config_template,
                          payment_processor: value
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="authorize_net">Authorize.Net</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Retry Attempts</Label>
                    <Input
                      type="number"
                      value={formData.payment_config_template.payment_retry_attempts}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        payment_config_template: {
                          ...prev.payment_config_template,
                          payment_retry_attempts: parseInt(e.target.value) || 0
                        }
                      }))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Auto Payment</Label>
                  <Switch
                    checked={formData.payment_config_template.auto_payment_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      payment_config_template: {
                        ...prev.payment_config_template,
                        auto_payment_enabled: checked
                      }
                    }))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="business" className="space-y-4">
                <h4 className="font-semibold">Business Rules</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Duration (Months)</Label>
                    <Input
                      type="number"
                      value={formData.business_rules_template.minimum_membership_duration_months}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        business_rules_template: {
                          ...prev.business_rules_template,
                          minimum_membership_duration_months: parseInt(e.target.value) || 0
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Cancellation Notice (Days)</Label>
                    <Input
                      type="number"
                      value={formData.business_rules_template.cancellation_notice_days}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        business_rules_template: {
                          ...prev.business_rules_template,
                          cancellation_notice_days: parseInt(e.target.value) || 0
                        }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Membership Freeze</Label>
                    <Switch
                      checked={formData.business_rules_template.freeze_enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        business_rules_template: {
                          ...prev.business_rules_template,
                          freeze_enabled: checked
                        }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Membership Transfer</Label>
                    <Switch
                      checked={formData.business_rules_template.transfer_enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        business_rules_template: {
                          ...prev.business_rules_template,
                          transfer_enabled: checked
                        }
                      }))}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const TemplateViewModal = ({ template, isOpen, onClose }) => {
    if (!template) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {template.name}
              {template.is_momentum_official && (
                <Badge variant="default">
                  <Star className="w-3 h-3 mr-1" />
                  Official
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <p className="text-muted-foreground">{template.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">
                  {templateCategories.find(cat => cat.value === template.category)?.label || template.category}
                </Badge>
                <Badge variant="secondary">
                  Used {template.usage_count} times
                </Badge>
              </div>
            </div>

            <Separator />

            <Tabs defaultValue="billing" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="billing">Billing Config</TabsTrigger>
                <TabsTrigger value="payment">Payment Config</TabsTrigger>
                <TabsTrigger value="business">Business Rules</TabsTrigger>
              </TabsList>

              <TabsContent value="billing">
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(template.billing_config_template, null, 2)}
                </pre>
              </TabsContent>

              <TabsContent value="payment">
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(template.payment_config_template, null, 2)}
                </pre>
              </TabsContent>

              <TabsContent value="business">
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(template.business_rules_template, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleDuplicateTemplate(template)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Configuration Templates</h2>
          <p className="text-muted-foreground">
            Manage pre-configured templates for different types of fitness businesses
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templateCategories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first configuration template to get started'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}

      {/* Modals */}
      <TemplateFormModal
        template={null}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateTemplate}
        title="Create New Template"
      />

      <TemplateFormModal
        template={editingTemplate}
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSave={handleCreateTemplate}
        title="Edit Template"
      />

      <TemplateViewModal
        template={viewingTemplate}
        isOpen={!!viewingTemplate}
        onClose={() => setViewingTemplate(null)}
      />
    </div>
  );
};

export default ConfigurationTemplatesManager;

