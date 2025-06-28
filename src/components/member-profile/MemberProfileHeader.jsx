/**
 * Member Profile Header
 * Displays member photo, basic info, and quick actions
 * Extracted from the massive MemberProfile component
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  MoreVertical,
  Edit3,
  UserCheck,
  UserX,
  Send,
  FileText
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useMemberProfile } from './MemberProfileContext';
import { format, isValid } from 'date-fns';

// ==================== HELPER FUNCTIONS ====================

const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

const formatDate = (dateString) => {
  if (!dateString) return 'Not provided';
  const date = new Date(dateString);
  return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid date';
};

const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    suspended: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };
  return colors[status] || colors.inactive;
};

// ==================== QUICK ACTIONS MENU ====================

const QuickActionsMenu = ({ memberData }) => {
  const handleEmailMember = () => {
    if (memberData?.email) {
      window.location.href = `mailto:${memberData.email}`;
    }
  };

  const handleSendSMS = () => {
    // SMS functionality not yet implemented
    // Feature planned for future release
    if (memberData?.phone) {
      // Placeholder for SMS integration
      alert(`SMS feature coming soon! Would send to: ${memberData.phone}`);
    }
  };

  const handleGenerateReport = () => {
    // Report generation not yet implemented
    // Feature planned for future release
    if (memberData?.id) {
      // Placeholder for report generation
      alert(`Report generation coming soon! Would generate for member: ${memberData.id}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleEmailMember} disabled={!memberData?.email}>
          <Mail className="h-4 w-4 mr-2" />
          Send Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSendSMS} disabled={!memberData?.phone}>
          <Send className="h-4 w-4 mr-2" />
          Send SMS
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleGenerateReport}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600">
          <UserX className="h-4 w-4 mr-2" />
          Suspend Member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ==================== MAIN COMPONENT ====================

const MemberProfileHeader = () => {
  const { memberData, isLoading, startEditing } = useMemberProfile();
  const [imageError, setImageError] = useState(false);

  if (isLoading || !memberData) {
    return (
      <Card className="overflow-hidden shadow-xl rounded-xl bg-card">
        <div className="relative p-6 bg-gradient-to-b from-primary/10 to-transparent">
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-24 h-24 bg-gray-300 rounded-full mb-4"></div>
            <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
      </Card>
    );
  }

  const {
    first_name,
    last_name,
    email,
    phone,
    profile_picture_url,
    status,
    system_member_id,
    created_at,
    currentMembership
  } = memberData;

  const fullName = `${first_name || ''} ${last_name || ''}`.trim();
  const memberSince = formatDate(created_at);

  return (
    <Card className="overflow-hidden shadow-xl rounded-xl bg-card">
      <div className="relative p-6 flex flex-col items-center bg-gradient-to-b from-primary/10 to-transparent">
        
        {/* Quick Actions - Top Right */}
        <div className="absolute top-4 right-4 flex gap-2">
          {email && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = `mailto:${email}`}
              className="px-3 py-2 text-xs font-medium border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <Mail className="h-3 w-3 mr-1" />
              Email
            </Button>
          )}
          <QuickActionsMenu memberData={memberData} />
        </div>

        {/* Profile Photo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative mb-4"
        >
          <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
            <AvatarImage 
              src={!imageError ? profile_picture_url : undefined}
              alt={fullName}
              onError={() => setImageError(true)}
            />
            <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
              {getInitials(first_name, last_name)}
            </AvatarFallback>
          </Avatar>
          
          {/* Edit Photo Button */}
          <Button
            size="sm"
            variant="outline"
            className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-white shadow-md"
            onClick={() => startEditing('photo')}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        </motion.div>

        {/* Member Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center space-y-2"
        >
          <h1 className="text-2xl font-bold text-foreground">
            {fullName || 'Unnamed Member'}
          </h1>
          
          <div className="flex items-center gap-2 justify-center">
            <Badge className={`text-xs px-2 py-1 ${getStatusColor(status)}`}>
              {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              ID: {system_member_id}
            </span>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground mt-4">
            {email && (
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>{email}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>{phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Member since {memberSince}</span>
            </div>
          </div>

          {/* Membership Info */}
          {currentMembership && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-4 p-3 bg-white/50 rounded-lg border"
            >
              <div className="text-sm">
                <span className="font-medium text-foreground">
                  {currentMembership.membership_type?.name || 'Unknown Membership'}
                </span>
                <div className="text-xs text-muted-foreground mt-1">
                  Status: {currentMembership.status}
                  {currentMembership.next_payment_date && (
                    <span className="ml-2">
                      • Next payment: {formatDate(currentMembership.next_payment_date)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Card>
  );
};

export default MemberProfileHeader;
