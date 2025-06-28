/**
 * Membership Tab Component
 * Displays and manages member's membership information, plans, and history
 * Extracted from the massive MemberProfile component
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Clock, 
  Plus,
  Edit3,
  Pause,
  Play,
  X,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMemberProfile } from '../MemberProfileContext';
import { format, isValid, addDays } from 'date-fns';
import { getMembershipStatusColor, isGuestUser, USER_STATUSES } from '@/utils/statusUtils';

// ==================== HELPER FUNCTIONS ====================

const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  try {
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid date';
  } catch {
    return 'Invalid date';
  }
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// getMembershipStatusColor is now imported from statusUtils

const getBillingCycleText = (cycle) => {
  const cycles = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annually: 'Annually',
    lifetime: 'Lifetime'
  };
  return cycles[cycle] || cycle;
};

// ==================== CURRENT MEMBERSHIP CARD ====================

const CurrentMembershipCard = ({ membership, isGuestUser = false }) => {
  // Don't show membership card for guest users
  if (isGuestUser) {
    return (
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-6 text-center">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Guest User</h3>
          <p className="text-gray-600 mb-4">This user has guest access with no membership required.</p>
        </CardContent>
      </Card>
    );
  }

  if (!membership) {
    return (
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-6 text-center">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Membership</h3>
          <p className="text-gray-600 mb-4">This member doesn't have an active membership plan.</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Assign Membership
          </Button>
        </CardContent>
      </Card>
    );
  }

  const membershipType = membership.membership_type;
  const nextPayment = membership.next_payment_date;
  const isExpiringSoon = nextPayment && new Date(nextPayment) <= addDays(new Date(), 7);

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Current Membership
          </CardTitle>
          <Badge className={getMembershipStatusColor(membership.status)}>
            {membership.status?.charAt(0).toUpperCase() + membership.status?.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          
          {/* Membership Details */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {membershipType?.name || 'Unknown Plan'}
            </h3>
            <p className="text-gray-600">
              {membershipType?.category} • {getBillingCycleText(membership.billing_cycle)}
            </p>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Start Date */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Start Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(membership.start_date)}
                </p>
              </div>
            </div>

            {/* Next Payment */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Next Payment</p>
                <p className={`text-sm font-medium ${isExpiringSoon ? 'text-orange-600' : 'text-gray-900'}`}>
                  {formatDate(nextPayment)}
                  {isExpiringSoon && (
                    <AlertCircle className="h-3 w-3 inline ml-1 text-orange-500" />
                  )}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Price</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(membershipType?.price)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Modify
            </Button>
            <Button variant="outline" size="sm">
              <Pause className="h-4 w-4 mr-2" />
              Suspend
            </Button>
            <Button variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== MEMBERSHIP HISTORY TABLE ====================

const MembershipHistoryTable = ({ history = [] }) => {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No membership history available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Membership History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.plan_name}</p>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{formatDate(item.start_date)}</p>
                    <p className="text-gray-600">to {formatDate(item.end_date)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getMembershipStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(item.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================

const MembershipTab = () => {
  const { memberData, isLoading } = useMemberProfile();
  const [membershipHistory, setMembershipHistory] = useState([]);

  // Get current membership from member data
  const currentMembership = memberData?.currentMembership;

  // Check if user is a guest (no membership history and guest status)
  const userIsGuest = isGuestUser(memberData?.status);

  useEffect(() => {
    // TODO: Fetch membership history from API
    // For now, using mock data
    setMembershipHistory([]);
  }, [memberData?.id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Current Membership */}
      <CurrentMembershipCard membership={currentMembership} isGuestUser={userIsGuest} />

      {/* Membership History */}
      <MembershipHistoryTable history={membershipHistory} />
    </motion.div>
  );
};

export default MembershipTab;
