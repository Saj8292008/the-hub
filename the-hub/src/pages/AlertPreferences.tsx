import { useState, useEffect } from 'react';
import { 
  Bell, Mail, MessageCircle, Send, Globe, 
  Save, TestTube, Check, X, Plus, Trash2,
  Clock, Filter, Zap, Shield, AlertTriangle
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface AlertPreferences {
  email_enabled: boolean;
  email_address: string;
  telegram_enabled: boolean;
  telegram_chat_id: string;
  telegram_bot_token?: string;
  discord_enabled: boolean;
  discord_webhook_url: string;
  custom_webhook_enabled: boolean;
  custom_webhook_url: string;
  custom_webhook_headers: Record<string, string>;
  brands: string[];
  categories: string[];
  min_price?: number;
  max_price?: number;
  min_deal_score: number;
  min_discount_percent: number;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  max_alerts_per_day: number;
  bundle_alerts: boolean;
  bundle_interval_minutes: number;
  tier: string;
  alert_delay_minutes: number;
}

interface BrandWatchlistItem {
  id: string;
  brand: string;
  category: string;
  min_deal_score: number;
  max_price?: number;
  notify_all_deals: boolean;
}

interface AlertStats {
  today: number;
  thisWeek: number;
  pending: number;
  byChannel: Record<string, number>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AlertPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<AlertPreferences | null>(null);
  const [watchlist, setWatchlist] = useState<BrandWatchlistItem[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  
  // New brand form
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('watches');
  const [newMinScore, setNewMinScore] = useState(70);

  const isPremium = user?.tier === 'pro' || user?.tier === 'premium';

  useEffect(() => {
    fetchAll();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchAll = async () => {
    try {
      const [prefsRes, watchlistRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/premium-alerts/preferences`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/premium-alerts/watchlist`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/premium-alerts/stats`, { headers: getAuthHeaders() })
      ]);

      const prefsData = await prefsRes.json();
      const watchlistData = await watchlistRes.json();
      const statsData = await statsRes.json();

      if (prefsData.success) setPreferences(prefsData.preferences);
      if (watchlistData.success) setWatchlist(watchlistData.watchlist);
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      console.error('Failed to fetch alert data:', error);
      toast.error('Failed to load alert preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;
    
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/premium-alerts/preferences`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(preferences)
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Preferences saved!');
        setPreferences(data.preferences);
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const testChannel = async (channel: string) => {
    setTestingChannel(channel);
    try {
      const res = await fetch(`${API_URL}/api/premium-alerts/test/${channel}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`Test alert sent to ${channel}!`);
      } else {
        toast.error(data.error || `Failed to test ${channel}`);
      }
    } catch (error) {
      toast.error(`Failed to test ${channel}`);
    } finally {
      setTestingChannel(null);
    }
  };

  const addToWatchlist = async () => {
    if (!newBrand.trim()) {
      toast.error('Please enter a brand name');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/premium-alerts/watchlist`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          brand: newBrand.trim(),
          category: newCategory,
          minDealScore: newMinScore
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`Added ${newBrand} to watchlist`);
        setWatchlist([...watchlist, data.item]);
        setNewBrand('');
      } else {
        toast.error(data.error || 'Failed to add');
      }
    } catch (error) {
      toast.error('Failed to add to watchlist');
    }
  };

  const removeFromWatchlist = async (brand: string, category: string) => {
    try {
      const res = await fetch(`${API_URL}/api/premium-alerts/watchlist/${brand}/${category}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`Removed ${brand}`);
        setWatchlist(watchlist.filter(w => !(w.brand === brand && w.category === category)));
      }
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  const updatePref = (key: keyof AlertPreferences, value: any) => {
    if (preferences) {
      setPreferences({ ...preferences, [key]: value });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Alert Preferences | The Hub</title>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Bell className="w-8 h-8 text-green-400" />
                Deal Alerts
              </h1>
              <p className="text-gray-400 mt-2">
                Get notified instantly when deals match your criteria
              </p>
            </div>
            
            <button
              onClick={savePreferences}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* Tier Info */}
          <div className={`rounded-xl p-6 ${isPremium ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30' : 'bg-yellow-900/20 border border-yellow-500/30'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isPremium ? (
                  <Zap className="w-10 h-10 text-purple-400" />
                ) : (
                  <Clock className="w-10 h-10 text-yellow-400" />
                )}
                <div>
                  <h3 className="text-xl font-semibold">
                    {isPremium ? '⚡ Real-Time Alerts Active' : '⏰ 15-Minute Delay Active'}
                  </h3>
                  <p className="text-gray-400">
                    {isPremium 
                      ? 'Your alerts are delivered instantly as deals are discovered'
                      : 'Upgrade to Pro or Premium for instant alerts with 0 delay'}
                  </p>
                </div>
              </div>
              {!isPremium && (
                <a
                  href="/premium"
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-6 py-2 rounded-lg font-semibold transition-all"
                >
                  Upgrade Now
                </a>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{stats.today}</div>
                <div className="text-gray-400 text-sm">Today</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{stats.thisWeek}</div>
                <div className="text-gray-400 text-sm">This Week</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
                <div className="text-gray-400 text-sm">Pending</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {Object.keys(stats.byChannel || {}).length}
                </div>
                <div className="text-gray-400 text-sm">Channels</div>
              </div>
            </div>
          )}

          {/* Notification Channels */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-400" />
              Notification Channels
            </h2>

            <div className="space-y-6">
              {/* Email */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-6 h-6 text-red-400" />
                    <span className="font-medium">Email</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.email_enabled || false}
                        onChange={(e) => updatePref('email_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                    <button
                      onClick={() => testChannel('email')}
                      disabled={!preferences?.email_enabled || testingChannel === 'email'}
                      className="text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-1 rounded flex items-center gap-1"
                    >
                      <TestTube className="w-4 h-4" />
                      Test
                    </button>
                  </div>
                </div>
                {preferences?.email_enabled && (
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={preferences?.email_address || ''}
                    onChange={(e) => updatePref('email_address', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>

              {/* Telegram */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6 text-blue-400" />
                    <span className="font-medium">Telegram</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.telegram_enabled || false}
                        onChange={(e) => updatePref('telegram_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                    <button
                      onClick={() => testChannel('telegram')}
                      disabled={!preferences?.telegram_enabled || testingChannel === 'telegram'}
                      className="text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-1 rounded flex items-center gap-1"
                    >
                      <TestTube className="w-4 h-4" />
                      Test
                    </button>
                  </div>
                </div>
                {preferences?.telegram_enabled && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Chat ID (e.g., 123456789)"
                      value={preferences?.telegram_chat_id || ''}
                      onChange={(e) => updatePref('telegram_chat_id', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-gray-500 text-sm">
                      Message <a href="https://t.me/userinfobot" target="_blank" className="text-blue-400 hover:underline">@userinfobot</a> on Telegram to get your Chat ID
                    </p>
                  </div>
                )}
              </div>

              {/* Discord */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    <span className="font-medium">Discord Webhook</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.discord_enabled || false}
                        onChange={(e) => updatePref('discord_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                    <button
                      onClick={() => testChannel('discord')}
                      disabled={!preferences?.discord_enabled || testingChannel === 'discord'}
                      className="text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-1 rounded flex items-center gap-1"
                    >
                      <TestTube className="w-4 h-4" />
                      Test
                    </button>
                  </div>
                </div>
                {preferences?.discord_enabled && (
                  <div className="space-y-3">
                    <input
                      type="url"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={preferences?.discord_webhook_url || ''}
                      onChange={(e) => updatePref('discord_webhook_url', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-gray-500 text-sm">
                      Server Settings → Integrations → Webhooks → New Webhook → Copy URL
                    </p>
                  </div>
                )}
              </div>

              {/* Custom Webhook */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-6 h-6 text-green-400" />
                    <span className="font-medium">Custom Webhook</span>
                    {!isPremium && (
                      <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded">Premium</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.custom_webhook_enabled || false}
                        onChange={(e) => updatePref('custom_webhook_enabled', e.target.checked)}
                        disabled={!isPremium}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 peer-disabled:opacity-50"></div>
                    </label>
                    <button
                      onClick={() => testChannel('webhook')}
                      disabled={!preferences?.custom_webhook_enabled || testingChannel === 'webhook'}
                      className="text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-1 rounded flex items-center gap-1"
                    >
                      <TestTube className="w-4 h-4" />
                      Test
                    </button>
                  </div>
                </div>
                {preferences?.custom_webhook_enabled && (
                  <input
                    type="url"
                    placeholder="https://your-server.com/webhook"
                    value={preferences?.custom_webhook_url || ''}
                    onChange={(e) => updatePref('custom_webhook_url', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Alert Filters */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Filter className="w-5 h-5 text-yellow-400" />
              Alert Filters
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-400 mb-2">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {['watches', 'sneakers', 'cars'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        const current = preferences?.categories || [];
                        const updated = current.includes(cat)
                          ? current.filter(c => c !== cat)
                          : [...current, cat];
                        updatePref('categories', updated);
                      }}
                      className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                        preferences?.categories?.includes(cat)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <p className="text-gray-500 text-sm mt-2">Leave empty for all categories</p>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Minimum Deal Score</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={preferences?.min_deal_score || 0}
                    onChange={(e) => updatePref('min_deal_score', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-green-400 w-16 text-right">
                    {preferences?.min_deal_score || 0}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Price Range</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Min $"
                    value={preferences?.min_price || ''}
                    onChange={(e) => updatePref('min_price', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max $"
                    value={preferences?.max_price || ''}
                    onChange={(e) => updatePref('max_price', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Minimum Discount %</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="75"
                    step="5"
                    value={preferences?.min_discount_percent || 0}
                    onChange={(e) => updatePref('min_discount_percent', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-blue-400 w-16 text-right">
                    {preferences?.min_discount_percent || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Watchlist */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Brand Watchlist
            </h2>

            {/* Add Brand Form */}
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                placeholder="Brand name (e.g., Rolex, Nike)"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="watches">Watches</option>
                <option value="sneakers">Sneakers</option>
                <option value="cars">Cars</option>
              </select>
              <button
                onClick={addToWatchlist}
                className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>

            {/* Watchlist Items */}
            {watchlist.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No brands in your watchlist</p>
                <p className="text-sm">Add brands above to get alerts for specific brands</p>
              </div>
            ) : (
              <div className="space-y-3">
                {watchlist.map(item => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4"
                  >
                    <div>
                      <span className="font-medium capitalize">{item.brand}</span>
                      <span className="text-gray-500 mx-2">•</span>
                      <span className="text-gray-400 capitalize">{item.category}</span>
                      <span className="text-gray-500 mx-2">•</span>
                      <span className="text-sm text-gray-400">
                        Min score: {item.min_deal_score}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFromWatchlist(item.brand, item.category)}
                      className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quiet Hours */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" />
              Quiet Hours
            </h2>
            
            <p className="text-gray-400 mb-4">
              Don't send alerts during these hours (your local time)
            </p>

            <div className="flex items-center gap-4">
              <div>
                <label className="block text-gray-500 text-sm mb-1">Start</label>
                <input
                  type="time"
                  value={preferences?.quiet_hours_start || ''}
                  onChange={(e) => updatePref('quiet_hours_start', e.target.value || undefined)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-gray-500 mt-6">to</span>
              <div>
                <label className="block text-gray-500 text-sm mb-1">End</label>
                <input
                  type="time"
                  value={preferences?.quiet_hours_end || ''}
                  onChange={(e) => updatePref('quiet_hours_end', e.target.value || undefined)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Save Button (Bottom) */}
          <div className="flex justify-end">
            <button
              onClick={savePreferences}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save All Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
