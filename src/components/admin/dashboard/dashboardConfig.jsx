import React from 'react';
import { Users, CalendarDays, CheckCircle, AlertTriangle, Clock, MessageSquare, BellDot, Activity, BarChart2, DollarSign } from 'lucide-react';

export const ALL_AVAILABLE_CARDS_CONFIG = [
	{
		id: 'totalMembers',
		title: 'Total Members',
		dataType: 'stat',
		dataKey: 'totalMembers',
		trendKey: 'totalMembersTrend',
		defaultVisible: true,
		description: 'All registered members',
		navigateTo: '/staff/members',
		icon: Users,
	},
	{
		id: 'activeClasses',
		title: 'Active Classes',
		dataType: 'stat',
		dataKey: 'activeClasses',
		trendKey: 'upcomingClassesTrend',
		defaultVisible: true,
		description: 'Currently scheduled classes',
		navigateTo: '/staff/classes',
		icon: CalendarDays,
	},
	{
		id: 'checkInsToday',
		title: 'Check-ins Today',
		dataType: 'stat',
		dataKey: 'checkInsToday',
		defaultVisible: true,
		description: 'Members checked in today',
		navigateTo: '/staff/checkin',
		icon: CheckCircle,
	},
	{
		id: 'monthlyRevenue',
		title: 'Monthly Revenue',
		dataType: 'stat',
		dataKey: 'monthlyRevenue',
		defaultVisible: true,
		description: 'Revenue for current month',
		navigateTo: '/staff/reports',
		icon: DollarSign,
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
];


