import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Tags, 
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MemberTaggingService, CrossReportAnalyticsService } from '@/services/memberTaggingService';

const TagAnalyticsDashboard = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState({
    topTags: [],
    recentActivity: [],
    categoryDistribution: [],
    usageStats: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [tagAnalytics, reportAnalytics] = await Promise.all([
        MemberTaggingService.getTagAnalytics(),
        CrossReportAnalyticsService.getReportAnalytics({
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
          to: new Date().toISOString()
        })
      ]);

      if (tagAnalytics.error) {
        throw new Error(tagAnalytics.error.message);
      }

      setAnalytics({
        topTags: tagAnalytics.data || [],
        recentActivity: reportAnalytics.data || [],
        categoryDistribution: calculateCategoryDistribution(tagAnalytics.data || []),
        usageStats: calculateUsageStats(tagAnalytics.data || [])
      });
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCategoryDistribution = (tags) => {
    const distribution = {};
    tags.forEach(tag => {
      const categoryName = tag.tag_categories?.name || 'Uncategorized';
      if (!distribution[categoryName]) {
        distribution[categoryName] = {
          name: categoryName,
          count: 0,
          totalUsage: 0,
          color: tag.tag_categories?.color || '#6B7280'
        };
      }
      distribution[categoryName].count += 1;
      distribution[categoryName].totalUsage += tag.usage_count;
    });
    return Object.values(distribution);
  };

  const calculateUsageStats = (tags) => {
    const totalTags = tags.length;
    const totalUsage = tags.reduce((sum, tag) => sum + tag.usage_count, 0);
    const averageUsage = totalTags > 0 ? Math.round(totalUsage / totalTags) : 0;
    const mostUsedTag = tags.length > 0 ? tags[0] : null;
    const unusedTags = tags.filter(tag => tag.usage_count === 0).length;

    return {
      totalTags,
      totalUsage,
      averageUsage,
      mostUsedTag,
      unusedTags
    };
  };

  const exportAnalytics = () => {
    const csvData = [
      ['Tag Name', 'Category', 'Usage Count', 'Color'],
      ...analytics.topTags.map(tag => [
        tag.name,
        tag.tag_categories?.name || 'Uncategorized',
        tag.usage_count,
        tag.color
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tag-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tag Analytics</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Tags className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Tags</p>
                <p className="text-2xl font-bold">{analytics.usageStats.totalTags}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">{analytics.usageStats.totalUsage}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Usage</p>
                <p className="text-2xl font-bold">{analytics.usageStats.averageUsage}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Unused Tags</p>
                <p className="text-2xl font-bold">{analytics.usageStats.unusedTags}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Most Used Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topTags.slice(0, 10).map((tag, index) => (
                <div key={tag.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <Badge 
                      style={{ backgroundColor: tag.color }}
                      className="text-white"
                    >
                      {tag.name}
                    </Badge>
                    {tag.tag_categories && (
                      <span className="text-xs text-muted-foreground">
                        {tag.tag_categories.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{tag.usage_count}</span>
                    <Users className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.categoryDistribution.map(category => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {category.count} tags • {category.totalUsage} uses
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ 
                        backgroundColor: category.color,
                        width: `${(category.totalUsage / analytics.usageStats.totalUsage) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Used Tag Highlight */}
      {analytics.usageStats.mostUsedTag && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Badge 
                style={{ backgroundColor: analytics.usageStats.mostUsedTag.color }}
                className="text-white text-lg px-4 py-2"
              >
                {analytics.usageStats.mostUsedTag.name}
              </Badge>
              <div className="flex-1">
                <p className="font-medium">
                  Used by {analytics.usageStats.mostUsedTag.usage_count} members
                </p>
                {analytics.usageStats.mostUsedTag.tag_categories && (
                  <p className="text-sm text-muted-foreground">
                    Category: {analytics.usageStats.mostUsedTag.tag_categories.name}
                  </p>
                )}
                {analytics.usageStats.mostUsedTag.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {analytics.usageStats.mostUsedTag.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {Math.round((analytics.usageStats.mostUsedTag.usage_count / analytics.usageStats.totalUsage) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">of total usage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {analytics.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Report Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{activity.report_type.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">
                        by {activity.profiles?.first_name} {activity.profiles?.last_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{activity.record_count} records</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.executed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TagAnalyticsDashboard;

