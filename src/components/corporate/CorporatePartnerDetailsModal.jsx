/**
 * Corporate Partner Details Modal Component
 * Shows comprehensive details about a corporate partner
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  FileText,
  BarChart3,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const CorporatePartnerDetailsModal = ({ 
  isOpen, 
  onClose, 
  partner,
  onEdit,
  onToggleStatus 
}) => {
  const [memberAffiliations, setMemberAffiliations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && partner) {
      loadMemberAffiliations();
    }
  }, [isOpen, partner]);

  const loadMemberAffiliations = async () => {
    setLoading(true);
    try {
      const { data, error } = await CorporatePartnersService.getMemberAffiliations(partner.id);
      
      if (error) {
        
        return;
      }

      setMemberAffiliations(data || []);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (isActive, endDate) => {
    const now = new Date();
    const agreementEnd = new Date(endDate);
    
    if (!isActive) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Inactive
        </Badge>
      );
    }
    
    if (agreementEnd < now) {
      return (
        <Badge className="bg-red-100 text-red-700">
          <AlertCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }
    
    const daysUntilExpiry = Math.ceil((agreementEnd - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 30) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700">
          <Clock className="h-3 w-3 mr-1" />
          Expires Soon
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-green-100 text-green-700">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  const getVerificationStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-400 text-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Unknown
          </Badge>
        );
    }
  };

  if (!partner) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {partner.company_name}
              </DialogTitle>
              <DialogDescription>
                Corporate Partnership Details
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(partner.is_active, partner.agreement_end_date)}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(partner)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members ({memberAffiliations.length})</TabsTrigger>
            <TabsTrigger value="discounts">Discounts ({partner.corporate_discounts?.length || 0})</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{partner.company_name}</div>
                      <div className="text-sm text-gray-500">Code: {partner.company_code}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{partner.industry}</div>
                      <div className="text-sm text-gray-500">{partner.employee_count?.toLocaleString()} employees</div>
                    </div>
                  </div>
                  
                  {partner.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <a 
                        href={partner.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {partner.website}
                      </a>
                    </div>
                  )}
                  
                  {partner.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div className="text-sm">{partner.address}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{partner.contact_person}</div>
                      <div className="text-sm text-gray-500">{partner.contact_title}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <a 
                      href={`mailto:${partner.contact_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {partner.contact_email}
                    </a>
                  </div>
                  
                  {partner.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a 
                        href={`tel:${partner.contact_phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {partner.contact_phone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Agreement Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Agreement Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Start Date</div>
                      <div className="text-sm text-gray-500">
                        {new Date(partner.agreement_start_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">End Date</div>
                      <div className="text-sm text-gray-500">
                        {new Date(partner.agreement_end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Verification Required</div>
                      <div className="text-sm text-gray-500">
                        {partner.requires_verification ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {memberAffiliations.filter(m => m.verification_status === 'approved').length}
                      </div>
                      <div className="text-sm text-gray-600">Active Members</div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {partner.corporate_discounts?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Discounts</div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {memberAffiliations.filter(m => m.verification_status === 'pending').length}
                      </div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {partner.automated_reports_enabled ? 'Yes' : 'No'}
                      </div>
                      <div className="text-sm text-gray-600">Auto Reports</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            {partner.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{partner.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Corporate Members</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : memberAffiliations.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Members Yet</h3>
                    <p className="text-gray-500">
                      No employees from {partner.company_name} have joined yet.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Join Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberAffiliations.map((affiliation) => (
                        <TableRow key={affiliation.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{affiliation.member_name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{affiliation.member_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{affiliation.employee_id || 'N/A'}</TableCell>
                          <TableCell>{affiliation.department || 'N/A'}</TableCell>
                          <TableCell>
                            {getVerificationStatusBadge(affiliation.verification_status)}
                          </TableCell>
                          <TableCell>
                            {new Date(affiliation.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discounts Tab */}
          <TabsContent value="discounts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Corporate Discounts</CardTitle>
              </CardHeader>
              <CardContent>
                {!partner.corporate_discounts || partner.corporate_discounts.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Discounts Configured</h3>
                    <p className="text-gray-500">
                      No corporate discounts have been set up for {partner.company_name}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {partner.corporate_discounts.map((discount, index) => (
                      <Card key={index} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{discount.discount_name}</h4>
                              <p className="text-sm text-gray-500 mt-1">{discount.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {discount.discount_type === 'percentage' ? `${discount.discount_value}%` : `$${discount.discount_value}`}
                              </div>
                              <div className="text-sm text-gray-500 capitalize">
                                {discount.discount_type.replace('_', ' ')}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Automated Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Automated Reports Status</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {partner.automated_reports_enabled 
                        ? 'Automated reports are enabled for this partner'
                        : 'Automated reports are disabled for this partner'
                      }
                    </p>
                  </div>
                  <Badge variant={partner.automated_reports_enabled ? "default" : "secondary"}>
                    {partner.automated_reports_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                
                {partner.reports_contact_email && (
                  <div className="mt-4 p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">Reports Contact</h5>
                    <div className="text-sm text-gray-600">
                      <div>{partner.reports_contact_name}</div>
                      <div>{partner.reports_contact_email}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CorporatePartnerDetailsModal;

