/**
 * 📊 PERMISSION REPORTS & ANALYTICS
 * Generate insights and reports on permission usage
 */

import { supabase } from '@/lib/supabaseClient';
import { AVAILABLE_PERMISSIONS, PERMISSION_CATEGORIES } from './permissionService';

// ==================== PERMISSION ANALYTICS ====================

/**
 * Get permission usage statistics
 */
export const getPermissionUsageStats = async () => {
  try {
    const { data: roles, error } = await supabase
      .from('staff_roles')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    const stats = {
      totalRoles: roles.length,
      permissionUsage: {},
      categoryUsage: {},
      mostUsedPermissions: [],
      leastUsedPermissions: [],
      rolesWithoutPermissions: 0
    };
    
    // Count permission usage
    roles.forEach(role => {
      const permissions = role.permissions || {};
      const hasPermissions = Object.values(permissions).some(Boolean);
      
      if (!hasPermissions) {
        stats.rolesWithoutPermissions++;
      }
      
      Object.entries(permissions).forEach(([permission, enabled]) => {
        if (enabled) {
          stats.permissionUsage[permission] = (stats.permissionUsage[permission] || 0) + 1;
          
          // Find category for this permission
          const permissionInfo = AVAILABLE_PERMISSIONS[permission];
          if (permissionInfo) {
            const category = permissionInfo.category;
            stats.categoryUsage[category] = (stats.categoryUsage[category] || 0) + 1;
          }
        }
      });
    });
    
    // Sort permissions by usage
    const sortedPermissions = Object.entries(stats.permissionUsage)
      .sort(([,a], [,b]) => b - a);
    
    stats.mostUsedPermissions = sortedPermissions.slice(0, 10);
    stats.leastUsedPermissions = sortedPermissions.slice(-10).reverse();
    
    return stats;
  } catch (error) {
    
    return null;
  }
};

/**
 * Get role complexity analysis
 */
export const getRoleComplexityAnalysis = async () => {
  try {
    const { data: roles, error } = await supabase
      .from('staff_roles')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    const analysis = {
      roleComplexity: [],
      averagePermissions: 0,
      complexityDistribution: {
        simple: 0,    // 1-5 permissions
        moderate: 0,  // 6-15 permissions
        complex: 0,   // 16-25 permissions
        advanced: 0   // 26+ permissions
      }
    };
    
    let totalPermissions = 0;
    
    roles.forEach(role => {
      const permissions = role.permissions || {};
      const permissionCount = Object.values(permissions).filter(Boolean).length;
      
      totalPermissions += permissionCount;
      
      // Categorize complexity
      let complexity;
      if (permissionCount <= 5) {
        complexity = 'simple';
        analysis.complexityDistribution.simple++;
      } else if (permissionCount <= 15) {
        complexity = 'moderate';
        analysis.complexityDistribution.moderate++;
      } else if (permissionCount <= 25) {
        complexity = 'complex';
        analysis.complexityDistribution.complex++;
      } else {
        complexity = 'advanced';
        analysis.complexityDistribution.advanced++;
      }
      
      analysis.roleComplexity.push({
        roleId: role.id,
        roleName: role.name,
        permissionCount,
        complexity,
        riskLevel: calculateRiskLevel(permissions)
      });
    });
    
    analysis.averagePermissions = roles.length > 0 ? totalPermissions / roles.length : 0;
    
    // Sort by permission count
    analysis.roleComplexity.sort((a, b) => b.permissionCount - a.permissionCount);
    
    return analysis;
  } catch (error) {
    
    return null;
  }
};

/**
 * Calculate risk level based on permissions
 */
const calculateRiskLevel = (permissions) => {
  const highRiskPermissions = [
    'manage_settings',
    'view_logs',
    'assign_roles',
    'impersonate_members',
    'manage_staff',
    'view_revenue'
  ];
  
  const highRiskCount = highRiskPermissions.filter(perm => permissions[perm]).length;
  const totalPermissions = Object.values(permissions).filter(Boolean).length;
  
  if (highRiskCount >= 4) return 'high';
  if (highRiskCount >= 2) return 'medium';
  if (totalPermissions >= 10) return 'medium';
  return 'low';
};

/**
 * Get permission coverage report
 */
export const getPermissionCoverageReport = async () => {
  try {
    const { data: roles, error } = await supabase
      .from('staff_roles')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    const report = {
      totalAvailablePermissions: Object.keys(AVAILABLE_PERMISSIONS).length,
      usedPermissions: new Set(),
      unusedPermissions: [],
      categoryCoverage: {}
    };
    
    // Track used permissions
    roles.forEach(role => {
      const permissions = role.permissions || {};
      Object.entries(permissions).forEach(([permission, enabled]) => {
        if (enabled) {
          report.usedPermissions.add(permission);
        }
      });
    });
    
    // Find unused permissions
    Object.keys(AVAILABLE_PERMISSIONS).forEach(permission => {
      if (!report.usedPermissions.has(permission)) {
        report.unusedPermissions.push({
          permission,
          ...AVAILABLE_PERMISSIONS[permission]
        });
      }
    });
    
    // Calculate category coverage
    Object.entries(PERMISSION_CATEGORIES).forEach(([category, info]) => {
      const categoryPermissions = Object.entries(AVAILABLE_PERMISSIONS)
        .filter(([, perm]) => perm.category === category);
      
      const usedInCategory = categoryPermissions.filter(([perm]) => 
        report.usedPermissions.has(perm)
      ).length;
      
      report.categoryCoverage[category] = {
        total: categoryPermissions.length,
        used: usedInCategory,
        coverage: categoryPermissions.length > 0 ? 
          Math.round((usedInCategory / categoryPermissions.length) * 100) : 0
      };
    });
    
    report.usedPermissions = Array.from(report.usedPermissions);
    report.overallCoverage = Math.round(
      (report.usedPermissions.length / report.totalAvailablePermissions) * 100
    );
    
    return report;
  } catch (error) {
    
    return null;
  }
};

/**
 * Get security audit report
 */
export const getSecurityAuditReport = async () => {
  try {
    const { data: roles, error } = await supabase
      .from('staff_roles')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    const audit = {
      highRiskRoles: [],
      overprivilegedRoles: [],
      underprivilegedRoles: [],
      duplicateRoles: [],
      recommendations: []
    };
    
    roles.forEach(role => {
      const permissions = role.permissions || {};
      const permissionCount = Object.values(permissions).filter(Boolean).length;
      const riskLevel = calculateRiskLevel(permissions);
      
      // High risk roles
      if (riskLevel === 'high') {
        audit.highRiskRoles.push({
          roleId: role.id,
          roleName: role.name,
          riskLevel,
          permissionCount
        });
      }
      
      // Overprivileged (too many permissions)
      if (permissionCount > 20) {
        audit.overprivilegedRoles.push({
          roleId: role.id,
          roleName: role.name,
          permissionCount
        });
      }
      
      // Underprivileged (too few permissions)
      if (permissionCount < 3 && permissionCount > 0) {
        audit.underprivilegedRoles.push({
          roleId: role.id,
          roleName: role.name,
          permissionCount
        });
      }
    });
    
    // Find duplicate roles (same permissions)
    const permissionSignatures = new Map();
    roles.forEach(role => {
      const signature = JSON.stringify(role.permissions || {});
      if (permissionSignatures.has(signature)) {
        const existing = permissionSignatures.get(signature);
        audit.duplicateRoles.push({
          roles: [existing, { id: role.id, name: role.name }],
          signature
        });
      } else {
        permissionSignatures.set(signature, { id: role.id, name: role.name });
      }
    });
    
    // Generate recommendations
    if (audit.highRiskRoles.length > 0) {
      audit.recommendations.push({
        type: 'security',
        priority: 'high',
        message: `${audit.highRiskRoles.length} role(s) have high-risk permissions. Review and minimize access.`
      });
    }
    
    if (audit.overprivilegedRoles.length > 0) {
      audit.recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: `${audit.overprivilegedRoles.length} role(s) may be overprivileged. Consider using permission templates.`
      });
    }
    
    if (audit.duplicateRoles.length > 0) {
      audit.recommendations.push({
        type: 'cleanup',
        priority: 'low',
        message: `${audit.duplicateRoles.length} duplicate role(s) found. Consider consolidating.`
      });
    }
    
    return audit;
  } catch (error) {
    
    return null;
  }
};

/**
 * Generate comprehensive permission report
 */
export const generateComprehensiveReport = async () => {
  try {
    const [usageStats, complexityAnalysis, coverageReport, securityAudit] = await Promise.all([
      getPermissionUsageStats(),
      getRoleComplexityAnalysis(),
      getPermissionCoverageReport(),
      getSecurityAuditReport()
    ]);
    
    return {
      generatedAt: new Date().toISOString(),
      usageStats,
      complexityAnalysis,
      coverageReport,
      securityAudit,
      summary: {
        totalRoles: usageStats?.totalRoles || 0,
        averagePermissions: Math.round(complexityAnalysis?.averagePermissions || 0),
        permissionCoverage: coverageReport?.overallCoverage || 0,
        securityIssues: (securityAudit?.highRiskRoles?.length || 0) + 
                       (securityAudit?.overprivilegedRoles?.length || 0)
      }
    };
  } catch (error) {
    
    return null;
  }
};

export default {
  getPermissionUsageStats,
  getRoleComplexityAnalysis,
  getPermissionCoverageReport,
  getSecurityAuditReport,
  generateComprehensiveReport
};

