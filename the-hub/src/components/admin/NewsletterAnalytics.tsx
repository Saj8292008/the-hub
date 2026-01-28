/**
 * Newsletter Analytics Component
 * View newsletter performance metrics and trends
 */

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Mail, MousePointerClick } from 'lucide-react';
import newsletterService from '../../services/newsletter';

export default function NewsletterAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const data = await newsletterService.getAnalyticsOverview();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <p className="text-gray-400">Newsletter performance and engagement metrics</p>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Subscribers"
          value={analytics?.total_subscribers || 0}
          icon={<Users className="h-5 w-5" />}
          color="bg-blue-600"
        />
        <MetricCard
          label="Active Subscribers"
          value={analytics?.active_subscribers || 0}
          icon={<Users className="h-5 w-5" />}
          color="bg-green-600"
        />
        <MetricCard
          label="Campaigns Sent"
          value={analytics?.sent_campaigns || 0}
          icon={<Mail className="h-5 w-5" />}
          color="bg-purple-600"
        />
        <MetricCard
          label="Avg Open Rate"
          value={`${(analytics?.avg_open_rate || 0).toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="bg-orange-600"
        />
      </div>

      {/* Engagement metrics */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Engagement Rates</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-gray-400">Average Open Rate</span>
              <span className="font-semibold text-white">
                {(analytics?.avg_open_rate || 0).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full bg-purple-600"
                style={{ width: `${Math.min(analytics?.avg_open_rate || 0, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Industry avg: 20-25%</p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-gray-400">Average Click Rate</span>
              <span className="font-semibold text-white">
                {(analytics?.avg_click_rate || 0).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${Math.min(analytics?.avg_click_rate || 0, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Industry avg: 2-3%</p>
          </div>
        </div>
      </div>

      {/* Recent campaigns */}
      {analytics?.recent_campaigns && analytics.recent_campaigns.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Recent Campaigns</h3>
          <div className="space-y-3">
            {analytics.recent_campaigns.map((campaign: any) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 p-4"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{campaign.name}</h4>
                  <p className="text-sm text-gray-400">{campaign.subject_line}</p>
                </div>
                <div className="flex gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-400">Sent</p>
                    <p className="font-semibold text-white">{campaign.total_sent || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <span
                      className={`text-xs font-semibold ${
                        campaign.status === 'sent'
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-purple-600/10 to-gray-900 p-6">
        <h3 className="mb-3 text-lg font-semibold text-white">Performance Tips</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>✓ Aim for 20-25% open rate (industry average)</li>
          <li>✓ Keep click rate above 2% for good engagement</li>
          <li>✓ A/B test subject lines to improve opens</li>
          <li>✓ Send at consistent times (Fridays 9am works well)</li>
          <li>✓ Monitor unsubscribe rate (keep below 0.5%)</li>
        </ul>
      </div>
    </div>
  );
}

function MetricCard({
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
