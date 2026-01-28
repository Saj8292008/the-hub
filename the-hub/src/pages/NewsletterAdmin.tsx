/**
 * Newsletter Admin Dashboard
 * Manage newsletter campaigns, subscribers, and analytics
 */

import { useState } from 'react';
import { Mail, Users, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import NewsletterMonitor from '../components/admin/NewsletterMonitor';
import CampaignEditor from '../components/admin/CampaignEditor';
import SubscriberManager from '../components/admin/SubscriberManager';
import NewsletterAnalytics from '../components/admin/NewsletterAnalytics';

type TabType = 'monitor' | 'campaigns' | 'subscribers' | 'analytics';

export default function NewsletterAdmin() {
  const [activeTab, setActiveTab] = useState<TabType>('monitor');

  const tabs = [
    { id: 'monitor' as TabType, label: 'Monitor', icon: SettingsIcon },
    { id: 'campaigns' as TabType, label: 'Campaigns', icon: Mail },
    { id: 'subscribers' as TabType, label: 'Subscribers', icon: Users },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg">
          <Mail className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Newsletter Admin</h1>
          <p className="text-gray-400">Manage email campaigns and subscribers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 font-medium transition-colors ${
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
        {activeTab === 'monitor' && <NewsletterMonitor />}
        {activeTab === 'campaigns' && <CampaignEditor />}
        {activeTab === 'subscribers' && <SubscriberManager />}
        {activeTab === 'analytics' && <NewsletterAnalytics />}
      </div>
    </div>
  );
}
