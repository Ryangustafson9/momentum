// 🔑 UNIFIED QUERY KEYS - Centralized query key management for React Query
// This ensures consistent caching and invalidation across the entire application

export const queryKeys = {
  // ⭐ AUTH QUERIES
  auth: {
    all: ['auth'],
    session: () => [...queryKeys.auth.all, 'session'],
    user: () => [...queryKeys.auth.all, 'user'],
    profile: (userId) => [...queryKeys.auth.all, 'profile', userId],
  },

  // ⭐ MEMBER QUERIES
  members: {
    all: ['members'],
    lists: () => [...queryKeys.members.all, 'list'],
    list: (filters) => [...queryKeys.members.lists(), filters],
    details: () => [...queryKeys.members.all, 'detail'],
    detail: (id) => [...queryKeys.members.details(), id],
    stats: () => [...queryKeys.members.all, 'stats'],
    count: () => [...queryKeys.members.all, 'count'],
    search: (query) => [...queryKeys.members.all, 'search', query],
    profile: (memberId) => [...queryKeys.members.details(), memberId, 'profile'],
    membership: (memberId) => [...queryKeys.members.details(), memberId, 'membership'],
    billing: (memberId) => [...queryKeys.members.details(), memberId, 'billing'],
    attendance: (memberId) => [...queryKeys.members.details(), memberId, 'attendance'],
    family: (memberId) => [...queryKeys.members.details(), memberId, 'family'],
    checkIns: () => [...queryKeys.members.all, 'check-ins'],
    todayCheckIns: () => [...queryKeys.members.checkIns(), 'today'],
  },

  // ⭐ CLASS QUERIES
  classes: {
    all: ['classes'],
    lists: () => [...queryKeys.classes.all, 'list'],
    list: (filters) => [...queryKeys.classes.lists(), filters],
    details: () => [...queryKeys.classes.all, 'detail'],
    detail: (id) => [...queryKeys.classes.details(), id],
    schedule: () => [...queryKeys.classes.all, 'schedule'],
    scheduleByDate: (date) => [...queryKeys.classes.schedule(), date],
    bookings: () => [...queryKeys.classes.all, 'bookings'],
    memberBookings: (memberId) => [...queryKeys.classes.bookings(), memberId],
    instructors: () => [...queryKeys.classes.all, 'instructors'],
    instructor: (id) => [...queryKeys.classes.instructors(), id],
    attendance: (classId) => [...queryKeys.classes.details(), classId, 'attendance'],
    capacity: (classId) => [...queryKeys.classes.details(), classId, 'capacity'],
  },

  // ⭐ MEMBERSHIP QUERIES
  memberships: {
    all: ['memberships'],
    types: () => [...queryKeys.memberships.all, 'types'],
    type: (id) => [...queryKeys.memberships.types(), id],
    plans: () => [...queryKeys.memberships.all, 'plans'],
    plan: (id) => [...queryKeys.memberships.plans(), id],
    addons: () => [...queryKeys.memberships.all, 'addons'],
    addon: (id) => [...queryKeys.memberships.addons(), id],
    pricing: () => [...queryKeys.memberships.all, 'pricing'],
    available: () => [...queryKeys.memberships.all, 'available'],
    onlineAvailable: () => [...queryKeys.memberships.available(), 'online'],
  },

  // ⭐ BILLING QUERIES
  billing: {
    all: ['billing'],
    overview: () => [...queryKeys.billing.all, 'overview'],
    transactions: () => [...queryKeys.billing.all, 'transactions'],
    transaction: (id) => [...queryKeys.billing.transactions(), id],
    pending: () => [...queryKeys.billing.all, 'pending'],
    overdue: () => [...queryKeys.billing.all, 'overdue'],
    stats: () => [...queryKeys.billing.all, 'stats'],
    memberBilling: (memberId) => [...queryKeys.billing.all, 'member', memberId],
    paymentMethods: (memberId) => [...queryKeys.billing.memberBilling(memberId), 'methods'],
    invoices: (memberId) => [...queryKeys.billing.memberBilling(memberId), 'invoices'],
    subscriptions: (memberId) => [...queryKeys.billing.memberBilling(memberId), 'subscriptions'],
  },

  // ⭐ EQUIPMENT QUERIES
  equipment: {
    all: ['equipment'],
    lists: () => [...queryKeys.equipment.all, 'list'],
    list: (filters) => [...queryKeys.equipment.lists(), filters],
    details: () => [...queryKeys.equipment.all, 'detail'],
    detail: (id) => [...queryKeys.equipment.details(), id],
    maintenance: () => [...queryKeys.equipment.all, 'maintenance'],
    maintenanceRecords: (equipmentId) => [...queryKeys.equipment.maintenance(), equipmentId],
    stats: () => [...queryKeys.equipment.all, 'stats'],
    utilization: () => [...queryKeys.equipment.all, 'utilization'],
    status: () => [...queryKeys.equipment.all, 'status'],
  },

  // ⭐ COMMUNICATION QUERIES
  communications: {
    all: ['communications'],
    messages: () => [...queryKeys.communications.all, 'messages'],
    message: (id) => [...queryKeys.communications.messages(), id],
    templates: () => [...queryKeys.communications.all, 'templates'],
    template: (id) => [...queryKeys.communications.templates(), id],
    campaigns: () => [...queryKeys.communications.all, 'campaigns'],
    campaign: (id) => [...queryKeys.communications.campaigns(), id],
    analytics: () => [...queryKeys.communications.all, 'analytics'],
    stats: () => [...queryKeys.communications.all, 'stats'],
  },

  // ⭐ DASHBOARD QUERIES
  dashboard: {
    all: ['dashboard'],
    stats: () => [...queryKeys.dashboard.all, 'stats'],
    memberStats: () => [...queryKeys.dashboard.stats(), 'members'],
    classStats: () => [...queryKeys.dashboard.stats(), 'classes'],
    billingStats: () => [...queryKeys.dashboard.stats(), 'billing'],
    equipmentStats: () => [...queryKeys.dashboard.stats(), 'equipment'],
    recentActivity: () => [...queryKeys.dashboard.all, 'recent-activity'],
    notifications: () => [...queryKeys.dashboard.all, 'notifications'],
    quickActions: () => [...queryKeys.dashboard.all, 'quick-actions'],
  },

  // ⭐ REPORTS QUERIES
  reports: {
    all: ['reports'],
    membership: () => [...queryKeys.reports.all, 'membership'],
    attendance: () => [...queryKeys.reports.all, 'attendance'],
    revenue: () => [...queryKeys.reports.all, 'revenue'],
    equipment: () => [...queryKeys.reports.all, 'equipment'],
    custom: (reportId) => [...queryKeys.reports.all, 'custom', reportId],
  },

  // ⭐ SETTINGS QUERIES
  settings: {
    all: ['settings'],
    general: () => [...queryKeys.settings.all, 'general'],
    gym: () => [...queryKeys.settings.all, 'gym'],
    billing: () => [...queryKeys.settings.all, 'billing'],
    notifications: () => [...queryKeys.settings.all, 'notifications'],
    integrations: () => [...queryKeys.settings.all, 'integrations'],
    security: () => [...queryKeys.settings.all, 'security'],
  },

  // ⭐ TRAINERS/STAFF QUERIES
  staff: {
    all: ['staff'],
    lists: () => [...queryKeys.staff.all, 'list'],
    list: (filters) => [...queryKeys.staff.lists(), filters],
    details: () => [...queryKeys.staff.all, 'detail'],
    detail: (id) => [...queryKeys.staff.details(), id],
    trainers: () => [...queryKeys.staff.all, 'trainers'],
    trainer: (id) => [...queryKeys.staff.trainers(), id],
    schedules: () => [...queryKeys.staff.all, 'schedules'],
    schedule: (staffId) => [...queryKeys.staff.schedules(), staffId],
  },
};

// ⭐ QUERY KEY UTILITIES
export const queryKeyUtils = {
  // Get all keys for a specific domain
  getAllKeysForDomain: (domain) => {
    return queryKeys[domain]?.all || [];
  },

  // Check if a key belongs to a specific domain
  belongsToDomain: (queryKey, domain) => {
    const domainKeys = queryKeys[domain]?.all;
    if (!domainKeys || !Array.isArray(queryKey)) return false;
    return queryKey.length >= domainKeys.length && 
           queryKey.slice(0, domainKeys.length).every((key, index) => key === domainKeys[index]);
  },

  // Get related keys for invalidation
  getRelatedKeys: (queryKey) => {
    if (!Array.isArray(queryKey) || queryKey.length === 0) return [];
    
    const domain = queryKey[0];
    const relatedKeys = [];
    
    // Add the main domain key
    relatedKeys.push(queryKeys[domain]?.all || []);
    
    // Add specific related keys based on domain
    switch (domain) {
      case 'members':
        relatedKeys.push(queryKeys.dashboard.memberStats());
        relatedKeys.push(queryKeys.members.stats());
        relatedKeys.push(queryKeys.members.count());
        break;
      case 'classes':
        relatedKeys.push(queryKeys.dashboard.classStats());
        relatedKeys.push(queryKeys.classes.schedule());
        break;
      case 'billing':
        relatedKeys.push(queryKeys.dashboard.billingStats());
        break;
      case 'equipment':
        relatedKeys.push(queryKeys.dashboard.equipmentStats());
        break;
    }
    
    return relatedKeys.filter(key => key.length > 0);
  },

  // Create a filter-based key
  createFilterKey: (baseKey, filters) => {
    if (!filters || Object.keys(filters).length === 0) return baseKey;
    
    // Sort filters for consistent keys
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((obj, key) => {
        obj[key] = filters[key];
        return obj;
      }, {});
    
    return [...baseKey, sortedFilters];
  },

  // Create a paginated key
  createPaginatedKey: (baseKey, page, limit) => {
    return [...baseKey, 'paginated', { page, limit }];
  },

  // Create a date-range key
  createDateRangeKey: (baseKey, startDate, endDate) => {
    return [...baseKey, 'dateRange', { startDate, endDate }];
  },
};

// ⭐ CACHE TIME CONSTANTS
export const cacheConfig = {
  // Very stable data (rarely changes)
  STABLE: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  },
  
  // Moderately stable data
  MODERATE: {
    staleTime: 5 * 60 * 1000,  // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  },
  
  // Frequently changing data
  DYNAMIC: {
    staleTime: 1 * 60 * 1000,  // 1 minute
    cacheTime: 5 * 60 * 1000,  // 5 minutes
  },
  
  // Real-time data (always fresh)
  REALTIME: {
    staleTime: 0,              // Always stale
    cacheTime: 1 * 60 * 1000,  // 1 minute cache
  },
};

export default queryKeys;
