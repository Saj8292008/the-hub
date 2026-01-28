/**
 * Admin Settings Page
 * Central control panel for platform administration
 */

import { useState } from 'react';
import { Settings, Activity, FileText, Database, Sparkles, Zap, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import DealScoringMonitor from '../components/admin/DealScoringMonitor';
import PerformanceMonitor from '../components/admin/PerformanceMonitor';

type TabType = 'deal-scoring' | 'blog' | 'newsletter' | 'database' | 'ai' | 'performance';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('deal-scoring');

  const tabs = [
    { id: 'deal-scoring' as TabType, label: 'Deal Scoring', icon: Activity },
    { id: 'performance' as TabType, label: 'Performance', icon: Zap },
    { id: 'blog' as TabType, label: 'Blog Management', icon: FileText },
    { id: 'newsletter' as TabType, label: 'Newsletter', icon: Mail },
    { id: 'ai' as TabType, label: 'AI Services', icon: Sparkles },
    { id: 'database' as TabType, label: 'Database', icon: Database }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 shadow-lg">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
          <p className="text-gray-400">Manage platform services and configurations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'deal-scoring' && <DealScoringMonitor />}

        {activeTab === 'performance' && <PerformanceMonitor />}

        {activeTab === 'blog' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Blog Management</h2>

              <div className="space-y-4">
                <Link
                  to="/blog/admin"
                  className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:bg-gray-700"
                >
                  <div>
                    <h3 className="font-semibold text-white">Blog Admin Dashboard</h3>
                    <p className="text-sm text-gray-400">Manage posts, view analytics</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>

                <Link
                  to="/blog/editor/new"
                  className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:bg-gray-700"
                >
                  <div>
                    <h3 className="font-semibold text-white">Create New Post</h3>
                    <p className="text-sm text-gray-400">Write or generate with AI</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>

                <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                  <h3 className="mb-2 font-semibold text-white">Generate Blog Posts (CLI)</h3>
                  <p className="mb-3 text-sm text-gray-400">
                    Generate 20 SEO-optimized blog posts using GPT-4
                  </p>
                  <code className="block rounded bg-gray-900 p-3 text-xs text-green-400">
                    $ cd /Users/sydneyjackson/the-hub<br />
                    $ ./scripts/runBlogGeneration.sh
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'newsletter' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Newsletter System</h2>

              <div className="space-y-4">
                <Link
                  to="/newsletter/admin"
                  className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:bg-gray-700"
                >
                  <div>
                    <h3 className="font-semibold text-white">Newsletter Admin Dashboard</h3>
                    <p className="text-sm text-gray-400">Manage campaigns, subscribers, and analytics</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>

                <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                  <h3 className="mb-2 font-semibold text-white">Features</h3>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>AI-generated weekly newsletters with GPT-4</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Email tracking (opens, clicks, unsubscribes)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>A/B testing for subject lines</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Automated scheduler (Fridays 9am EST)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Subscriber management and CSV export</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                  <h3 className="mb-2 font-semibold text-white">Email Service Provider</h3>
                  <p className="mb-3 text-sm text-gray-400">
                    Powered by Resend - configured in environment variables
                  </p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>RESEND_API_KEY: {process.env.REACT_APP_RESEND_API_KEY ? '✓ Set' : '✗ Not set'}</div>
                    <div>Free tier: 3,000 emails/month</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Database Management</h2>

              <div className="space-y-4">
                <Link
                  to="/admin/scraper-debug"
                  className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:bg-gray-700"
                >
                  <div>
                    <h3 className="font-semibold text-white">Scraper Debug Dashboard</h3>
                    <p className="text-sm text-gray-400">
                      Monitor scrapers, view logs, manual triggers
                    </p>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>

                <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                  <h3 className="mb-2 font-semibold text-white">Database Connection</h3>
                  <p className="text-sm text-gray-400">
                    Connected to Supabase PostgreSQL
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <div>Tables: watch_listings, car_listings, sneaker_listings, scraper_logs</div>
                    <div>Full-text search: Enabled</div>
                    <div>Row Level Security: Active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">AI Services</h2>

              <div className="space-y-4">
                <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-white">OpenAI GPT-4</h3>
                    <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-400">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Used for blog generation and natural language search</p>
                </div>

                <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Deal Scoring Algorithm</h3>
                    <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-400">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    5-factor weighted algorithm with optional AI rarity assessment
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-gray-900 p-2">
                      <span className="text-gray-500">Price:</span>
                      <span className="ml-2 text-white">40%</span>
                    </div>
                    <div className="rounded bg-gray-900 p-2">
                      <span className="text-gray-500">Condition:</span>
                      <span className="ml-2 text-white">20%</span>
                    </div>
                    <div className="rounded bg-gray-900 p-2">
                      <span className="text-gray-500">Seller:</span>
                      <span className="ml-2 text-white">15%</span>
                    </div>
                    <div className="rounded bg-gray-900 p-2">
                      <span className="text-gray-500">Quality:</span>
                      <span className="ml-2 text-white">15%</span>
                    </div>
                    <div className="rounded bg-gray-900 p-2">
                      <span className="text-gray-500">Rarity:</span>
                      <span className="ml-2 text-white">10%</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Natural Language Search</h3>
                    <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-400">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Query parsing for watches, cars, and sneakers using GPT-4
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
