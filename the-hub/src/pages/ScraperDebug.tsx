/**
 * Scraper Debug Dashboard
 * Admin page for monitoring and debugging scrapers
 */

import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  Play,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Database,
  Activity
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ScraperLog {
  id: number;
  timestamp: string;
  category: string;
  source: string;
  status: string;
  items_found: number;
  items_new: number;
  duration_ms: number;
  error_message?: string;
}

interface HealthSummary {
  overall: {
    totalRuns: number;
    successfulRuns: number;
    successRate: number;
    lastHours: number;
  };
  bySource: Array<{
    category: string;
    source: string;
    total_runs: number;
    successful_runs: number;
    failed_runs: number;
    total_items_found: number;
    avg_duration_ms: number;
    last_run_at: string;
  }>;
  recentErrors: Array<{
    timestamp: string;
    source: string;
    error_message: string;
  }>;
  lastRuns: Array<{
    category: string;
    source: string;
    last_run_at: string;
    status: string;
    items_found: number;
  }>;
}

interface SchedulerStatus {
  isRunning: boolean;
  schedules: Record<string, string>;
  watchlistCount: number;
  activeJobs: number;
}

export default function ScraperDebug() {
  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [logs, setLogs] = useState<ScraperLog[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const [healthRes, logsRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/api/scraper-debug/health`),
        fetch(`${API_URL}/api/scraper-debug/logs?limit=50`),
        fetch(`${API_URL}/api/scraper-debug/scheduler/status`)
      ]);

      const [healthData, logsData, statusData] = await Promise.all([
        healthRes.json(),
        logsRes.json(),
        statusRes.json()
      ]);

      if (healthData.success) setHealth(healthData.health);
      if (logsData.success) setLogs(logsData.logs);
      if (statusData.success) setSchedulerStatus(statusData.scheduler);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch scraper data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = autoRefresh ? setInterval(fetchData, 10000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleTrigger = async (source: string) => {
    setTriggering(source);
    try {
      const res = await fetch(`${API_URL}/api/scraper-debug/trigger/${source}`, {
        method: 'POST'
      });
      const data = await res.json();

      if (data.success) {
        alert(`✅ ${source} scraper completed!\nItems found: ${data.itemsFound}\nDuration: ${data.duration}ms`);
      } else {
        alert(`❌ ${source} scraper failed:\n${data.error}`);
      }

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Failed to trigger scraper:', error);
      alert('Failed to trigger scraper');
    } finally {
      setTriggering(null);
    }
  };

  const handleTriggerAll = async () => {
    setTriggering('all');
    try {
      const res = await fetch(`${API_URL}/api/scraper-debug/trigger-all`, {
        method: 'POST'
      });
      const data = await res.json();

      if (data.success) {
        alert(`✅ All scrapers completed!\nTotal items: ${data.totalItems}`);
      } else {
        alert(`❌ Failed to trigger scrapers:\n${data.error}`);
      }

      fetchData();
    } catch (error) {
      console.error('Failed to trigger all scrapers:', error);
      alert('Failed to trigger scrapers');
    } finally {
      setTriggering(null);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400 bg-green-500/20';
      case 'error':
        return 'text-red-400 bg-red-500/20';
      case 'no_results':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'error':
        return <XCircle size={16} className="text-red-400" />;
      default:
        return <AlertCircle size={16} className="text-yellow-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Scraper Debug Dashboard</h2>
          <p className="text-gray-400 mt-1">Monitor and control all scrapers</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (10s)
          </label>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Scheduler Status */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <h3 className="text-xl font-bold mb-4">Scheduler Status</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gray-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={20} className={schedulerStatus?.isRunning ? 'text-green-400' : 'text-red-400'} />
              <span className="text-sm text-gray-400">Status</span>
            </div>
            <p className={`text-2xl font-bold ${schedulerStatus?.isRunning ? 'text-green-400' : 'text-red-400'}`}>
              {schedulerStatus?.isRunning ? 'Running' : 'Stopped'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Database size={20} className="text-blue-400" />
              <span className="text-sm text-gray-400">Active Jobs</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {schedulerStatus?.activeJobs || 0}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-800/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-purple-400" />
              <span className="text-sm text-gray-400">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {health?.overall.successRate.toFixed(1) || 0}%
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={20} className="text-yellow-400" />
              <span className="text-sm text-gray-400">Watchlist Items</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {schedulerStatus?.watchlistCount || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Manual Triggers */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <h3 className="text-xl font-bold mb-4">Manual Triggers</h3>
        <div className="flex flex-wrap gap-3">
          {['reddit', 'ebay', 'watchuseek'].map((source) => (
            <button
              key={source}
              onClick={() => handleTrigger(source)}
              disabled={triggering !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {triggering === source ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Run {source}
                </>
              )}
            </button>
          ))}
          <button
            onClick={handleTriggerAll}
            disabled={triggering !== null}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {triggering === 'all' ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play size={16} />
                Run All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Source Statistics */}
      {health && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <h3 className="text-xl font-bold mb-4">Source Statistics (Last 24h)</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                  <th className="pb-3">Source</th>
                  <th className="pb-3">Total Runs</th>
                  <th className="pb-3">Success</th>
                  <th className="pb-3">Failed</th>
                  <th className="pb-3">Items Found</th>
                  <th className="pb-3">Avg Duration</th>
                  <th className="pb-3">Last Run</th>
                </tr>
              </thead>
              <tbody>
                {health.bySource.map((stat) => (
                  <tr key={`${stat.category}-${stat.source}`} className="border-b border-gray-800/50">
                    <td className="py-3">
                      <span className="font-medium capitalize">{stat.source}</span>
                    </td>
                    <td className="py-3">{stat.total_runs}</td>
                    <td className="py-3 text-green-400">{stat.successful_runs}</td>
                    <td className="py-3 text-red-400">{stat.failed_runs}</td>
                    <td className="py-3">{stat.total_items_found}</td>
                    <td className="py-3">{Math.round(parseFloat(stat.avg_duration_ms as any))}ms</td>
                    <td className="py-3 text-sm text-gray-400">
                      {formatTimestamp(stat.last_run_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <h3 className="text-xl font-bold mb-4">Recent Logs (Last 50)</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(log.status)}
                  <span className="font-medium capitalize">{log.source}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(log.status)}`}>
                    {log.status}
                  </span>
                  {log.items_found > 0 && (
                    <span className="text-sm text-gray-400">
                      {log.items_found} items • {log.items_new} new
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {log.duration_ms}ms
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatTimestamp(log.timestamp)}
                </span>
              </div>
              {log.error_message && (
                <p className="text-sm text-red-400 mt-2 ml-7">
                  {log.error_message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Errors */}
      {health && health.recentErrors.length > 0 && (
        <div className="rounded-2xl border border-red-500/30 bg-red-900/20 p-6">
          <h3 className="text-xl font-bold mb-4 text-red-400">Recent Errors</h3>
          <div className="space-y-2">
            {health.recentErrors.map((error, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-red-500/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium capitalize">{error.source}</span>
                  <span className="text-sm text-gray-500">
                    {formatTimestamp(error.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-red-300">{error.error_message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
