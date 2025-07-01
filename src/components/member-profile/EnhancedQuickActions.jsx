import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  CreditCard, 
  UserCheck, 
  PauseCircle, 
  XCircle, 
  Edit, 
  MoreHorizontal,
  Send,
  Calendar,
  FileText,
  Printer,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const EnhancedQuickActions = ({ 
  memberData, 
  onEditProfile,
  onAssignMembership,
  onSuspendMember,
  onCancelMembership,
  onImpersonateMember,
  onSendEmail,
  onScheduleCall,
  onViewBilling
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState({});

  const handleAction = async (actionKey, actionFn, ...args) => {
    if (!actionFn) return;
    
    try {
      setIsLoading(prev => ({ ...prev, [actionKey]: true }));
      await actionFn(...args);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Action failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleEmailMember = () => {
    if (memberData?.email) {
      window.location.href = `mailto:${memberData.email}`;
    } else {
      toast({
        title: "No Email",
        description: "This member doesn't have an email address on file.",
        variant: "destructive"
      });
    }
  };

  const handleCallMember = () => {
    if (memberData?.phone) {
      window.location.href = `tel:${memberData.phone}`;
    } else {
      toast({
        title: "No Phone",
        description: "This member doesn't have a phone number on file.",
        variant: "destructive"
      });
    }
  };

  const handleSendSMS = () => {
    if (memberData?.phone) {
      window.location.href = `sms:${memberData.phone}`;
    } else {
      toast({
        title: "No Phone",
        description: "This member doesn't have a phone number on file.",
        variant: "destructive"
      });
    }
  };

  const getMembershipStatus = () => {
    const membership = memberData?.memberships?.[0];
    if (!membership) return { status: 'none', color: 'gray' };
    
    switch (membership.status) {
      case 'active': return { status: 'Active', color: 'green' };
      case 'suspended': return { status: 'Suspended', color: 'yellow' };
      case 'cancelled': return { status: 'Cancelled', color: 'red' };
      case 'expired': return { status: 'Expired', color: 'red' };
      case 'pending': return { status: 'Pending', color: 'blue' };
      default: return { status: 'Unknown', color: 'gray' };
    }
  };

  const membershipStatus = getMembershipStatus();

  return (
    <div className="flex flex-wrap gap-2">
      {/* Primary Actions */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleEmailMember}
        disabled={!memberData?.email}
        className="flex items-center gap-2"
      >
        <Mail className="h-4 w-4" />
        Email
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCallMember}
        disabled={!memberData?.phone}
        className="flex items-center gap-2"
      >
        <Phone className="h-4 w-4" />
        Call
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('edit', onEditProfile)}
        className="flex items-center gap-2"
      >
        <Edit className="h-4 w-4" />
        Edit
      </Button>

      {/* Membership Status Badge */}
      <Badge 
        variant={membershipStatus.color === 'green' ? 'default' : 'secondary'}
        className="flex items-center gap-1"
      >
        <CreditCard className="h-3 w-3" />
        {membershipStatus.status}
      </Badge>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="px-2">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Communication</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleSendSMS} disabled={!memberData?.phone}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Send SMS
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('email', onSendEmail)}>
            <Send className="mr-2 h-4 w-4" />
            Send Email Template
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('schedule', onScheduleCall)}>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Call
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Membership</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleAction('assign', onAssignMembership)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Assign Membership
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('billing', onViewBilling)}>
            <FileText className="mr-2 h-4 w-4" />
            View Billing
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleAction('impersonate', onImpersonateMember)}>
            <UserCheck className="mr-2 h-4 w-4" />
            Impersonate Member
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleAction('suspend', onSuspendMember)}
            className="text-yellow-600"
          >
            <PauseCircle className="mr-2 h-4 w-4" />
            Suspend Account
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleAction('cancel', onCancelMembership)}
            className="text-red-600"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Membership
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Reports</DropdownMenuLabel>
          <DropdownMenuItem>
            <Printer className="mr-2 h-4 w-4" />
            Print Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </DropdownMenuItem>
          <DropdownMenuItem>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default EnhancedQuickActions;
