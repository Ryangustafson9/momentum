import React from 'react';
import { Users, CalendarDays, CheckCircle, AlertTriangle, Clock, MessageSquare, BellDot, Activity, BarChart2, CreditCard, UserPlus, TrendingUp, Settings } from 'lucide-react';

export const ALL_AVAILABLE_CARDS_CONFIG = [
	{
		id: 'totalMembers',
		title: 'Total Members',
		dataType: 'stat',
		dataKey: 'totalMembers',		trendKey: 'totalMembersTrend',
		defaultVisible: true,
		description: 'All registered members',
		icon: Users,
		navigateTo: '/staff-portal/members',
		color: 'from-blue-500 to-blue-600'
	},
	{
		id: 'activeClasses',
		title: 'Active Classes',
		dataType: 'stat',
		dataKey: 'activeClasses',
		trendKey: 'upcomingClassesTrend',
		defaultVisible: true,
		description: 'Currently scheduled classes',
		icon: CalendarDays,
		navigateTo: '/staff/classes',
		color: 'from-green-500 to-green-600'
	},
	{
		id: 'checkInsToday',
		title: 'Check-ins Today',
		dataType: 'stat',
		dataKey: 'checkInsToday',
		defaultVisible: true,
		description: 'Members checked in today',
		icon: CheckCircle,
		navigateTo: '/staff/checkins',
		color: 'from-purple-500 to-purple-600'
	},
	{
		id: 'monthlyRevenue',
		title: 'Monthly Revenue',
		dataType: 'stat',
		dataKey: 'monthlyRevenue',
		trendKey: 'revenueTrend',
		defaultVisible: true,
		description: 'Revenue this month',
		icon: TrendingUp,
		navigateTo: '/staff/reports',
		color: 'from-emerald-500 to-emerald-600'
	},
	{
		id: 'expiringMemberships',
		title: 'Expiring Soon',
		dataType: 'stat',
		dataKey: 'expiringMembershipsCount',
		badgeKey: 'expiringMembershipsCount',
		defaultVisible: true,
		description: 'Memberships expiring this month',		icon: AlertTriangle,
		navigateTo: '/staff-portal/memberships',
		color: 'from-orange-500 to-orange-600'
	},
	{
		id: 'newSignups',
		title: 'New Signups',
		dataType: 'stat',
		dataKey: 'newSignupsToday',
		trendKey: 'signupsTrend',
		defaultVisible: true,
		description: 'New members today',
		icon: UserPlus,
		navigateTo: '/staff-portal/members',
		color: 'from-indigo-500 to-indigo-600'
	},
	{
		id: 'pendingPayments',
		title: 'Pending Payments',
		dataType: 'stat',
		dataKey: 'pendingPaymentsCount',
		badgeKey: 'pendingPaymentsCount',
		defaultVisible: false,
		description: 'Outstanding payments',
		icon: CreditCard,
		navigateTo: '/staff/billing',
		color: 'from-red-500 to-red-600'
	},
	{
		id: 'recentActivity',
		title: 'Recent Activity',
		dataType: 'widget',
		defaultVisible: true,
	},
	{
		id: 'quickStats',
		title: 'Quick Stats',
		dataType: 'widget',
		defaultVisible: true,
	},
	{
		id: 'membershipInsights',
		title: 'Membership Insights',
		dataType: 'widget',
		defaultVisible: true,
	},
	{
		id: 'quickActions',
		title: 'Quick Actions',
		dataType: 'widget',
		defaultVisible: true,
	},
];


