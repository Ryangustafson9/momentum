/**
 * 📊 PERFORMANCE MONITOR COMPONENT
 * Real-time performance monitoring and optimization dashboard
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  Database, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Cpu,
  HardDrive,
  Wifi,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { performanceMonitor, generatePerformanceReport } from '@/lib/performance';
import { queryOptimizer } from '@/lib/databaseOptimization';
import { cacheManager } from '@/lib/advancedCaching';
import { cn } from '@/lib/utils';

const PerformanceMonitor = ({ className = '', showInProduction = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [performanceData, setPerformanceData] = useState({});
  const [queryStats, setQueryStats] = useState({});
  const [cacheStats, setCacheStats] = useState({});
  const [recommendations, setRecommendations] = useState([]);

  // Don't show in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null;
  }

  useEffect(() => {
    const updateStats = () => {
      const perfData = performanceMonitor.getSummary();
      const dbStats = queryOptimizer.getQueryStats();
      const cacheData = cacheManager.getStats();
      const report = generatePerformanceReport();

      setPerformanceData(perfData);
      setQueryStats(dbStats);
      setCacheStats(cacheData);
      setRecommendations(report.recommendations);
    };

    // Initial load
    updateStats();

    // Update every 5 seconds
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const getPerformanceScore = () => {
    const scores = [];
    
    // LCP Score (0-100)
    if (performanceData.lcp) {
      const lcpScore = Math.max(0, 100 - (performanceData.lcp.avg / 25));
      scores.push(lcpScore);
    }
    
    // FID Score (0-100)
    if (performanceData.fid) {
      const fidScore = Math.max(0, 100 - performanceData.fid.avg);
      scores.push(fidScore);
    }
    
    // Cache Hit Rate
    const avgCacheHitRate = Object.values(cacheStats).reduce((sum, cache) => {
      return sum + (cache.hitRate || 0);
    }, 0) / Object.keys(cacheStats).length || 0;
    scores.push(avgCacheHitRate);

    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  };

  const performanceScore = getPerformanceScore();

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (!isVisible) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          onClick={() => setIsVisible(true)}
          className="rounded-full w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
          title="Open Performance Monitor"
        >
          <Activity className="h-5 w-5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className={cn(
        'fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden',
        'bg-white rounded-lg shadow-2xl border border-gray-200',
        className
      )}
    >
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn('px-2 py-1', getScoreColor(performanceScore))}>
            Score: {performanceScore}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-8 w-8 p-0"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 m-2">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="queries" className="text-xs">Queries</TabsTrigger>
            <TabsTrigger value="cache" className="text-xs">Cache</TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs">Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-4 space-y-4">
            {/* Core Web Vitals */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Core Web Vitals</h4>
              
              {performanceData.lcp && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">LCP</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">{formatDuration(performanceData.lcp.avg)}</span>
                    <div className={cn('w-2 h-2 rounded-full', 
                      performanceData.lcp.avg < 2500 ? 'bg-green-500' : 
                      performanceData.lcp.avg < 4000 ? 'bg-yellow-500' : 'bg-red-500'
                    )} />
                  </div>
                </div>
              )}

              {performanceData.fid && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">FID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">{formatDuration(performanceData.fid.avg)}</span>
                    <div className={cn('w-2 h-2 rounded-full',
                      performanceData.fid.avg < 100 ? 'bg-green-500' : 
                      performanceData.fid.avg < 300 ? 'bg-yellow-500' : 'bg-red-500'
                    )} />
                  </div>
                </div>
              )}

              {performanceData.cls && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">CLS</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">{performanceData.cls.avg.toFixed(3)}</span>
                    <div className={cn('w-2 h-2 rounded-full',
                      performanceData.cls.avg < 0.1 ? 'bg-green-500' : 
                      performanceData.cls.avg < 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                    )} />
                  </div>
                </div>
              )}
            </div>

            {/* Memory Usage */}
            {performanceData['memory-usage'] && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Memory Usage</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Used</span>
                    <span>{formatBytes(performanceData['memory-usage'].latest)}</span>
                  </div>
                  <Progress 
                    value={performanceData['memory-usage'].latest / 100000000 * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="queries" className="p-4 space-y-4">
            <h4 className="font-medium text-sm text-gray-700">Database Performance</h4>
            
            {Object.entries(queryStats).map(([table, stats]) => (
              <div key={table} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">{table}</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.totalQueries} queries
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Avg Duration:</span>
                    <span className="ml-1 font-mono">{formatDuration(stats.averageDuration)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cache Hit:</span>
                    <span className="ml-1 font-mono">{stats.cacheHitRate.toFixed(1)}%</span>
                  </div>
                </div>
                
                <Progress value={stats.cacheHitRate} className="h-1" />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="cache" className="p-4 space-y-4">
            <h4 className="font-medium text-sm text-gray-700">Cache Performance</h4>
            
            {Object.entries(cacheStats).map(([type, stats]) => (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 capitalize">{type}</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.memorySize}/{stats.maxSize}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Hit Rate:</span>
                    <span className="ml-1 font-mono">{stats.hitRate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Ops:</span>
                    <span className="ml-1 font-mono">{stats.hits + stats.misses}</span>
                  </div>
                </div>
                
                <Progress value={stats.hitRate} className="h-1" />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="recommendations" className="p-4 space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Optimization Tips</h4>
            
            {recommendations.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600 text-xs">
                <CheckCircle className="h-4 w-4" />
                <span>All systems performing well!</span>
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded text-xs">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-yellow-800">{rec}</span>
                </div>
              ))
            )}
            
            {/* Quick Actions */}
            <div className="space-y-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => cacheManager.cleanup()}
                className="w-full text-xs h-8"
              >
                <HardDrive className="h-3 w-3 mr-1" />
                Clear Cache
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="w-full text-xs h-8"
              >
                <Zap className="h-3 w-3 mr-1" />
                Reload App
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default React.memo(PerformanceMonitor);
