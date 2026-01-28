/**
 * Newsletter Monitor Component
 * Scheduler status, controls, and statistics
 */

import { useState, useEffect } from 'react';
import { Play, Square, Zap, Clock, Users, Send, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import newsletterService from '../../services/newsletter';

export default function NewsletterMonitor() {
  const [status, setStatus] = useState<any>(null);
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
      const data = await newsletterService.getSchedulerStatus();
      setStatus(data);
    } catch (error: any) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      setProcessing(true);
      await newsletterService.startScheduler();
      toast.success('Newsletter scheduler started');
      await fetchStatus();
    } catch (error: any) {
      toast.error('Failed to start scheduler');
    } finally {
      setProcessing(false);
    }
  };

  const handleStop = async () => {
    try {
      setProcessing(true);
      await newsletterService.stopScheduler();
      toast.success('Newsletter scheduler stopped');
      await fetchStatus();
    } catch (error: any) {
      toast.error('Failed to stop scheduler');
    } finally {
      setProcessing(false);
    }
  };

  const handleRunNow = async () => {
    if (!confirm('This will generate and send a newsletter to all active subscribers. Continue?')) {
      return;
    }

    try {
      setProcessing(true);
      toast('Starting manual newsletter run...', { icon: '⚡' });
      await newsletterService.runSchedulerNow();
      toast.success('Newsletter sent successfully!');
      await fetchStatus();
    } catch (error: any) {
      toast.error('Failed to run newsletter');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Newsletter Scheduler</h2>
          <p className="text-gray-400">Automated weekly newsletter system</p>
        </div>
        <div className="flex gap-2">
          {status?.isRunning ? (
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
            <Zap className="h-4 w-4" />
            Run Now
          </button>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Status"
          value={status?.isRunning ? 'Running' : 'Stopped'}
          icon={<Clock className="h-5 w-5" />}
          color={status?.isRunning ? 'bg-green-600' : 'bg-gray-600'}
        />
        <StatCard
          label="Total Runs"
          value={status?.stats?.totalRuns || 0}
          icon={<Send className="h-5 w-5" />}
          color="bg-blue-600"
        />
        <StatCard
          label="Total Sent"
          value={status?.stats?.totalSent || 0}
          icon={<Users className="h-5 w-5" />}
          color="bg-purple-600"
        />
        <StatCard
          label="Average Per Run"
          value={status?.stats?.averagePerRun || 0}
          icon={<TrendingUp className="h-5 w-5" />}
          color="bg-orange-600"
        />
      </div>

      {/* Schedule info */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Schedule Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-400">Last Run</p>
            <p className="text-white">
              {status?.lastRun
                ? new Date(status.lastRun).toLocaleString()
                : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Next Run</p>
            <p className="text-white">
              {status?.nextRun
                ? new Date(status.nextRun).toLocaleString()
                : 'Not scheduled'}
            </p>
          </div>
        </div>
      </div>

      {/* Last run stats */}
      {status?.stats?.lastRunStats && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Last Run Statistics</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-400">Sent</p>
              <p className="text-2xl font-bold text-green-400">
                {status.stats.lastRunStats.sent}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Failed</p>
              <p className="text-2xl font-bold text-red-400">
                {status.stats.lastRunStats.failed}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Duration</p>
              <p className="text-2xl font-bold text-blue-400">
                {((status.stats.lastRunStats.duration || 0) / 1000).toFixed(1)}s
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color
}: {
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
