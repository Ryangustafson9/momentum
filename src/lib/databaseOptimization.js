/**
 * 🗄️ DATABASE QUERY OPTIMIZATION
 * Advanced database query optimization and caching strategies
 */

import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

// ⭐ PERFORMANCE: Query optimization utilities
export class QueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.queryStats = new Map();
  }

  // ⭐ PERFORMANCE: Optimized select with field limiting
  async optimizedSelect(table, options = {}) {
    const {
      select = '*',
      filters = {},
      orderBy,
      limit = 50,
      offset = 0,
      cacheKey,
      cacheTTL = 300000, // 5 minutes
    } = options;

    const startTime = Date.now();
    
    // Check cache first
    if (cacheKey && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTTL) {
        this.recordQueryStats(table, Date.now() - startTime, true);
        return cached.data;
      }
    }

    try {
      let query = supabase.from(table).select(select);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle range queries, etc.
          if (value.gte !== undefined) query = query.gte(key, value.gte);
          if (value.lte !== undefined) query = query.lte(key, value.lte);
          if (value.gt !== undefined) query = query.gt(key, value.gt);
          if (value.lt !== undefined) query = query.lt(key, value.lt);
          if (value.like !== undefined) query = query.like(key, value.like);
          if (value.ilike !== undefined) query = query.ilike(key, value.ilike);
        } else {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        const { column, ascending = true } = orderBy;
        query = query.order(column, { ascending });
      }

      // Apply pagination
      if (limit) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const result = { data, count };
      const duration = Date.now() - startTime;

      // Cache the result
      if (cacheKey) {
        this.queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
      }

      this.recordQueryStats(table, duration, false);
      return result;

    } catch (error) {
      logger.error(`Query optimization error for table ${table}:`, error);
      throw error;
    }
  }

  // ⭐ PERFORMANCE: Batch operations
  async batchInsert(table, records, batchSize = 100) {
    const results = [];
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from(table)
          .insert(batch)
          .select();

        if (error) throw error;
        results.push(...(data || []));
      } catch (error) {
        logger.error(`Batch insert error for table ${table}:`, error);
        throw error;
      }
    }

    return results;
  }

  // ⭐ PERFORMANCE: Batch updates
  async batchUpdate(table, updates, batchSize = 50) {
    const results = [];
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      const promises = batch.map(({ id, data }) =>
        supabase.from(table).update(data).eq('id', id).select()
      );

      try {
        const batchResults = await Promise.all(promises);
        batchResults.forEach(({ data, error }) => {
          if (error) throw error;
          if (data) results.push(...data);
        });
      } catch (error) {
        logger.error(`Batch update error for table ${table}:`, error);
        throw error;
      }
    }

    return results;
  }

  // ⭐ PERFORMANCE: Optimized joins
  async optimizedJoin(primaryTable, joinConfig, options = {}) {
    const {
      select = '*',
      filters = {},
      limit = 50,
      offset = 0,
    } = options;

    try {
      let selectClause = select;
      
      // Build join select clause
      if (joinConfig && typeof select === 'string' && select !== '*') {
        const joinSelects = Object.entries(joinConfig).map(([table, config]) => {
          const fields = config.select || '*';
          return `${table}(${fields})`;
        });
        selectClause = `${select},${joinSelects.join(',')}`;
      }

      let query = supabase.from(primaryTable).select(selectClause);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      // Apply pagination
      if (limit) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    } catch (error) {
      logger.error(`Optimized join error for table ${primaryTable}:`, error);
      throw error;
    }
  }

  // ⭐ PERFORMANCE: Query statistics
  recordQueryStats(table, duration, fromCache) {
    if (!this.queryStats.has(table)) {
      this.queryStats.set(table, {
        totalQueries: 0,
        totalDuration: 0,
        cacheHits: 0,
        averageDuration: 0,
      });
    }

    const stats = this.queryStats.get(table);
    stats.totalQueries++;
    stats.totalDuration += duration;
    stats.averageDuration = stats.totalDuration / stats.totalQueries;
    
    if (fromCache) {
      stats.cacheHits++;
    }

    // Log slow queries
    if (duration > 1000) {
      logger.warn(`Slow query detected for table ${table}: ${duration}ms`);
    }
  }

  // ⭐ PERFORMANCE: Get query statistics
  getQueryStats(table = null) {
    if (table) {
      return this.queryStats.get(table) || null;
    }
    
    const allStats = {};
    for (const [tableName, stats] of this.queryStats.entries()) {
      allStats[tableName] = {
        ...stats,
        cacheHitRate: stats.totalQueries > 0 ? (stats.cacheHits / stats.totalQueries) * 100 : 0,
      };
    }
    
    return allStats;
  }

  // ⭐ PERFORMANCE: Clear cache
  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }
}

// ⭐ PERFORMANCE: Global query optimizer instance
export const queryOptimizer = new QueryOptimizer();

// ⭐ PERFORMANCE: Optimized query builders for common patterns
export const optimizedQueries = {
  // Get members with pagination and caching
  getMembers: async (options = {}) => {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'active',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;

    const offset = (page - 1) * limit;
    const cacheKey = `members_${page}_${limit}_${search}_${status}_${sortBy}_${sortOrder}`;

    const filters = { status };
    if (search) {
      filters.full_name = { ilike: `%${search}%` };
    }

    return queryOptimizer.optimizedSelect('profiles', {
      select: 'id, full_name, email, phone, status, created_at, avatar_url',
      filters,
      orderBy: { column: sortBy, ascending: sortOrder === 'asc' },
      limit,
      offset,
      cacheKey,
      cacheTTL: 300000, // 5 minutes
    });
  },

  // Get classes with instructor info
  getClassesWithInstructors: async (options = {}) => {
    const {
      date = null,
      limit = 50,
      includeBookings = false,
    } = options;

    const filters = {};
    if (date) {
      filters.date = date;
    }

    let select = `
      id, name, description, date, start_time, end_time, capacity, current_bookings,
      instructor:instructor_id(id, full_name, email)
    `;

    if (includeBookings) {
      select += `, bookings:class_bookings(id, member_id, status, booked_at)`;
    }

    return queryOptimizer.optimizedSelect('classes', {
      select,
      filters,
      orderBy: { column: 'date', ascending: true },
      limit,
      cacheKey: `classes_${date}_${limit}_${includeBookings}`,
      cacheTTL: 180000, // 3 minutes
    });
  },

  // Get member dashboard data
  getMemberDashboard: async (memberId) => {
    const cacheKey = `member_dashboard_${memberId}`;

    try {
      // Use Promise.all for parallel queries
      const [memberData, recentBookings, upcomingClasses, attendanceStats] = await Promise.all([
        // Member profile
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, avatar_url, membership_status')
          .eq('id', memberId)
          .single(),

        // Recent bookings
        supabase
          .from('class_bookings')
          .select(`
            id, status, booked_at,
            class:class_id(id, name, date, start_time)
          `)
          .eq('member_id', memberId)
          .order('booked_at', { ascending: false })
          .limit(5),

        // Upcoming classes
        supabase
          .from('class_bookings')
          .select(`
            id, status,
            class:class_id(id, name, date, start_time, end_time)
          `)
          .eq('member_id', memberId)
          .eq('status', 'confirmed')
          .gte('class.date', new Date().toISOString().split('T')[0])
          .order('class.date', { ascending: true })
          .limit(5),

        // Attendance statistics
        supabase
          .from('checkin_history')
          .select('check_in_time, check_out_time')
          .eq('profile_id', memberId)
          .gte('check_in_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const result = {
        member: memberData.data,
        recentBookings: recentBookings.data || [],
        upcomingClasses: upcomingClasses.data || [],
        attendanceStats: attendanceStats.data || [],
      };

      return result;
    } catch (error) {
      logger.error(`Member dashboard query error for ${memberId}:`, error);
      throw error;
    }
  },

  // Get staff dashboard data
  getStaffDashboard: async () => {
    const cacheKey = 'staff_dashboard';

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [todayStats, recentMembers, upcomingClasses, systemHealth] = await Promise.all([
        // Today's statistics
        Promise.all([
          supabase.from('checkin_history').select('id').eq('check_in_time::date', today),
          supabase.from('class_bookings').select('id').eq('booked_at::date', today),
          supabase.from('profiles').select('id').eq('created_at::date', today),
        ]),

        // Recent members
        supabase
          .from('profiles')
          .select('id, full_name, email, created_at')
          .order('created_at', { ascending: false })
          .limit(5),

        // Upcoming classes
        supabase
          .from('classes')
          .select(`
            id, name, date, start_time, capacity, current_bookings,
            instructor:instructor_id(full_name)
          `)
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(10),

        // System health metrics
        Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('classes').select('id', { count: 'exact', head: true }),
          supabase.from('class_bookings').select('id', { count: 'exact', head: true }),
        ]),
      ]);

      const result = {
        todayStats: {
          checkIns: todayStats[0].data?.length || 0,
          bookings: todayStats[1].data?.length || 0,
          newMembers: todayStats[2].data?.length || 0,
        },
        recentMembers: recentMembers.data || [],
        upcomingClasses: upcomingClasses.data || [],
        systemHealth: {
          totalMembers: systemHealth[0].count || 0,
          totalClasses: systemHealth[1].count || 0,
          totalBookings: systemHealth[2].count || 0,
        },
      };

      return result;
    } catch (error) {
      logger.error('Staff dashboard query error:', error);
      throw error;
    }
  },
};

// ⭐ PERFORMANCE: Database connection optimization
export const optimizeConnection = () => {
  // Configure Supabase client for optimal performance
  if (supabase.realtime) {
    // Optimize realtime connection
    supabase.realtime.setAuth(supabase.auth.session()?.access_token);
  }
};

// ⭐ PERFORMANCE: Query performance monitoring
export const monitorQueryPerformance = () => {
  setInterval(() => {
    const stats = queryOptimizer.getQueryStats();
    
    Object.entries(stats).forEach(([table, tableStats]) => {
      if (tableStats.averageDuration > 500) {
        logger.warn(`Table ${table} has slow average query time: ${tableStats.averageDuration}ms`);
      }
      
      if (tableStats.cacheHitRate < 50) {
        logger.warn(`Table ${table} has low cache hit rate: ${tableStats.cacheHitRate}%`);
      }
    });
  }, 60000); // Check every minute
};

export default queryOptimizer;

