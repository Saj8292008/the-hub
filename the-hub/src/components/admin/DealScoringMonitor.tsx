/**
 * Deal Scoring Monitor
 * Admin component to monitor and control the deal scoring scheduler
 */

import { useState, useEffect } from 'react';
import { Activity, Play, Square, RefreshCw, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface SchedulerStatus {
  isRunning: boolean;
  intervalMs: number;
  intervalMinutes: number;
  lastRun: string | null;
  nextRun: string | null;
  stats: {
    totalRuns: number;
    totalScored: number;
    totalErrors: number;
    lastRunStats: RunStats | null;
  };
  uptime: number;
}

interface RunStats {
  startTime: string;
  duration: number;
  watches: { total: number; scored: number; errors: number };
  cars: { total: number; scored: number; errors: number };
  sneakers: { total: number; scored: number; errors: number };
}

export default function DealScoringMonitor() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchStatus();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/deal-scoring/scheduler/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch scheduler status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setProcessing(true);
    try {
      const response = await fetch('http://localhost:3000/api/deal-scoring/scheduler/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMinutes: 60 })
      });

      if (!response.ok) throw new Error('Failed to start scheduler');

      const data = await response.json();
      setStatus(data.status);
      toast.success('Deal scoring scheduler started');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start scheduler');
    } finally {
      setProcessing(false);
    }
  };

  const handleStop = async () => {
    setProcessing(true);
    try {
      const response = await fetch('http://localhost:3000/api/deal-scoring/scheduler/stop', {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to stop scheduler');

      await fetchStatus();
      toast.success('Deal scoring scheduler stopped');
    } catch (error: any) {
      toast.error(error.message || 'Failed to stop scheduler');
    } finally {
      setProcessing(false);
    }
  };

  const handleRunNow = async () => {
    setProcessing(true);
    toast('Starting manual scoring run...', { icon: '⚡' });

    try {
      const response = await fetch('http://localhost:3000/api/deal-scoring/scheduler/run-now', {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to run scoring');

      const data = await response.json();
      await fetchStatus();

      const totalScored = data.result.watches.scored + data.result.cars.scored + data.result.sneakers.scored;
      toast.success(`Scored ${totalScored} listings in ${(data.result.duration / 1000).toFixed(1)}s`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to run scoring');
    } finally {
      setProcessing(false);
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

  if (!status) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        <p className="text-center text-gray-400">Failed to load scheduler status</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${status.isRunning ? 'bg-green-500/20' : 'bg-gray-800'}`}>
            <Activity className={`h-6 w-6 ${status.isRunning ? 'text-green-500' : 'text-gray-500'}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Deal Scoring Scheduler</h2>
            <p className="text-sm text-gray-400">
              {status.isRunning ? 'Running' : 'Stopped'} • {status.intervalMinutes} minute interval
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            disabled={processing}
            className="rounded-lg bg-gray-800 p-2 text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          {status.isRunning ? (
            <button
              onClick={handleStop}
              disabled={processing}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={processing}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Start
            </button>
          )}

          <button
            onClick={handleRunNow}
            disabled={processing}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Run Now
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Runs"
          value={status.stats.totalRuns.toLocaleString()}
          icon={<Activity className="h-5 w-5" />}
          color="bg-blue-500"
        />
        <StatCard
          label="Total Scored"
          value={status.stats.totalScored.toLocaleString()}
          icon={<TrendingUp className="h-5 w-5" />}
          color="bg-green-500"
        />
        <StatCard
          label="Total Errors"
          value={status.stats.totalErrors.toLocaleString()}
          icon={<AlertCircle className="h-5 w-5" />}
          color="bg-red-500"
        />
        <StatCard
          label="Next Run"
          value={status.nextRun ? formatTimeUntil(status.nextRun) : 'N/A'}
          icon={<Clock className="h-5 w-5" />}
          color="bg-purple-500"
        />
      </div>

      {/* Last Run Details */}
      {status.stats.lastRunStats && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Last Run Details</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Started:</span>
              <span className="text-white">
                {new Date(status.stats.lastRunStats.startTime).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Duration:</span>
              <span className="text-white">
                {(status.stats.lastRunStats.duration / 1000).toFixed(2)}s
              </span>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-2 border-t border-gray-800 pt-4">
              <h4 className="text-sm font-medium text-gray-300">Category Breakdown</h4>

              {status.stats.lastRunStats.watches.total > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">⌚ Watches:</span>
                  <span className="text-white">
                    {status.stats.lastRunStats.watches.scored} / {status.stats.lastRunStats.watches.total}
                    {status.stats.lastRunStats.watches.errors > 0 && (
                      <span className="ml-2 text-red-400">
                        ({status.stats.lastRunStats.watches.errors} errors)
                      </span>
                    )}
                  </span>
                </div>
              )}

              {status.stats.lastRunStats.cars.total > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">🚗 Cars:</span>
                  <span className="text-white">
                    {status.stats.lastRunStats.cars.scored} / {status.stats.lastRunStats.cars.total}
                  </span>
                </div>
              )}

              {status.stats.lastRunStats.sneakers.total > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">👟 Sneakers:</span>
                  <span className="text-white">
                    {status.stats.lastRunStats.sneakers.scored} / {status.stats.lastRunStats.sneakers.total}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string;
  value: string | number;
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

function formatTimeUntil(dateString: string): string {
  const now = new Date();
  const target = new Date(dateString);
  const diff = target.getTime() - now.getTime();

  if (diff < 0) return 'Overdue';

  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}
