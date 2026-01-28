/**
 * Performance Monitoring Dashboard
 * View API performance metrics and cache statistics
 */

import { useState, useEffect } from 'react';
import { Zap, TrendingUp, AlertTriangle, Database, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface PerformanceSummary {
  totalRequests: number;
  avgResponseTime: number;
  slowestEndpoint: EndpointMetric | null;
  fastestEndpoint: EndpointMetric | null;
  errorRate: string;
  uniqueEndpoints: number;
}

interface EndpointMetric {
  path: string;
  method: string;
  count: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
  errors: number;
  lastCalled: string;
}

interface CacheStats {
  entries: number;
  maxSize: number;
  totalSizeBytes: number;
  totalSizeKB: string;
}

export default function PerformanceMonitor() {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [slowEndpoints, setSlowEndpoints] = useState<EndpointMetric[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, slowRes, cacheRes] = await Promise.all([
        fetch('http://localhost:3000/api/admin/performance/summary'),
        fetch('http://localhost:3000/api/admin/performance/slow?threshold=500'),
        fetch('http://localhost:3000/api/admin/cache/stats')
      ]);

      const [summaryData, slowData, cacheData] = await Promise.all([
        summaryRes.json(),
        slowRes.json(),
        cacheRes.json()
      ]);

      setSummary(summaryData);
      setSlowEndpoints(slowData);
      setCacheStats(cacheData);
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearMetrics = async () => {
    try {
      await fetch('http://localhost:3000/api/admin/performance/clear', {
        method: 'POST'
      });
      toast.success('Performance metrics cleared');
      fetchData();
    } catch (error) {
      toast.error('Failed to clear metrics');
    }
  };

  const handleClearCache = async () => {
    try {
      await fetch('http://localhost:3000/api/admin/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      toast.success('Cache cleared');
      fetchData();
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  const handleExportMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/performance/export');
      const data = await response.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-metrics-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Metrics exported');
    } catch (error) {
      toast.error('Failed to export metrics');
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 p-2">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Performance Monitor</h2>
            <p className="text-sm text-gray-400">
              Real-time API performance and caching statistics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="rounded-lg bg-gray-800 p-2 text-gray-300 transition-colors hover:bg-gray-700"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={handleExportMetrics}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Export
          </button>
          <button
            onClick={handleClearMetrics}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-700"
          >
            Clear Metrics
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Requests"
            value={summary.totalRequests.toLocaleString()}
            icon={<TrendingUp className="h-5 w-5" />}
            color="bg-blue-500"
          />
          <StatCard
            label="Avg Response Time"
            value={`${summary.avgResponseTime}ms`}
            icon={<Zap className="h-5 w-5" />}
            color="bg-green-500"
          />
          <StatCard
            label="Error Rate"
            value={summary.errorRate}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="bg-red-500"
          />
          <StatCard
            label="Unique Endpoints"
            value={summary.uniqueEndpoints.toString()}
            icon={<Database className="h-5 w-5" />}
            color="bg-purple-500"
          />
        </div>
      )}

      {/* Cache Statistics */}
      {cacheStats && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Response Cache</h3>
            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-700"
            >
              <Trash2 className="h-4 w-4" />
              Clear Cache
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-800 p-4">
              <p className="text-sm text-gray-400">Cached Entries</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {cacheStats.entries} / {cacheStats.maxSize}
              </p>
            </div>
            <div className="rounded-lg bg-gray-800 p-4">
              <p className="text-sm text-gray-400">Cache Size</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {cacheStats.totalSizeKB} KB
              </p>
            </div>
            <div className="rounded-lg bg-gray-800 p-4">
              <p className="text-sm text-gray-400">Memory Usage</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {((cacheStats.entries / cacheStats.maxSize) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Slow Endpoints */}
      {slowEndpoints.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Slow Endpoints (&gt;500ms)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-800">
                <tr className="text-left text-sm text-gray-400">
                  <th className="pb-3">Endpoint</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Avg Time</th>
                  <th className="pb-3">Min</th>
                  <th className="pb-3">Max</th>
                  <th className="pb-3">Calls</th>
                  <th className="pb-3">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {slowEndpoints.slice(0, 10).map((endpoint, i) => (
                  <tr key={i} className="text-sm">
                    <td className="py-3 font-mono text-white">{endpoint.path}</td>
                    <td className="py-3">
                      <span className="rounded bg-blue-500/20 px-2 py-1 text-xs font-semibold text-blue-400">
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-yellow-400">
                      {endpoint.avgDuration}ms
                    </td>
                    <td className="py-3 text-gray-400">{endpoint.minDuration}ms</td>
                    <td className="py-3 text-gray-400">{endpoint.maxDuration}ms</td>
                    <td className="py-3 text-gray-400">{endpoint.count}</td>
                    <td className="py-3">
                      {endpoint.errors > 0 ? (
                        <span className="text-red-400">{endpoint.errors}</span>
                      ) : (
                        <span className="text-green-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fastest Endpoints */}
      {summary && summary.fastestEndpoint && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Performance Leaders</h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-green-500/10 p-3">
              <div>
                <span className="font-mono text-sm text-white">
                  {summary.fastestEndpoint.method} {summary.fastestEndpoint.path}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {summary.fastestEndpoint.count} calls
                </p>
              </div>
              <span className="text-2xl font-bold text-green-400">
                {summary.fastestEndpoint.avgDuration}ms
              </span>
            </div>

            {summary.slowestEndpoint && (
              <div className="flex items-center justify-between rounded-lg bg-red-500/10 p-3">
                <div>
                  <span className="font-mono text-sm text-white">
                    {summary.slowestEndpoint.method} {summary.slowestEndpoint.path}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {summary.slowestEndpoint.count} calls
                  </p>
                </div>
                <span className="text-2xl font-bold text-red-400">
                  {summary.slowestEndpoint.avgDuration}ms
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`rounded-lg ${color} p-2 text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
