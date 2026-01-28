import React, { useEffect, useState } from 'react'
import { Bell, Shield, Sliders, MessageSquare, RefreshCw, CheckCircle, XCircle, Save, Crown, CreditCard, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

interface Config {
  notifications?: {
    priceAlerts: boolean
    telegramEnabled: boolean
  }
  polling?: {
    schedule: string
    enabled: boolean
  }
  telegram?: {
    botUsername: string
    chatId: string
    status: string
  }
}

const Settings: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [config, setConfig] = useState<Config>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [apiHealth, setApiHealth] = useState<string>('Checking...')
  const [usage, setUsage] = useState<any>(null)
  const [managingSubscription, setManagingSubscription] = useState(false)

  useEffect(() => {
    fetchConfig()
    checkHealth()
    fetchUsageStats()
  }, [])

  const fetchUsageStats = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${API_URL}/api/auth/usage`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setUsage(data)
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error)
    }
  }

  const handleManageSubscription = async () => {
    try {
      setManagingSubscription(true)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

      const res = await fetch(`${API_URL}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (!res.ok) {
        throw new Error('Failed to create portal session')
      }

      const { url } = await res.json()
      window.location.href = url
    } catch (error) {
      console.error('Failed to open billing portal:', error)
      toast.error('Failed to open billing portal')
    } finally {
      setManagingSubscription(false)
    }
  }

  const checkHealth = async () => {
    try {
      const health = await api.healthCheck()
      setApiHealth(health.status)
    } catch {
      setApiHealth('Offline')
    }
  }

  const fetchConfig = async () => {
    try {
      setLoading(true)
      // In a real implementation, this would fetch from an API endpoint
      // For now, we'll use default values that match the .env configuration
      setConfig({
        notifications: {
          priceAlerts: true,
          telegramEnabled: true
        },
        polling: {
          schedule: '0 * * * *', // Every hour
          enabled: true
        },
        telegram: {
          botUsername: 'TheHubBot',
          chatId: '8427035818',
          status: apiHealth === 'OK' ? 'Connected' : 'Disconnected'
        }
      })
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // In a real implementation, this would save to an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateNotificationSetting = (key: string, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      notifications: {
        priceAlerts: prev.notifications?.priceAlerts ?? false,
        telegramEnabled: prev.notifications?.telegramEnabled ?? false,
        ...prev.notifications,
        [key]: value
      }
    }))
  }

  const parseCronSchedule = (cron: string): string => {
    if (cron === '0 * * * *') return 'Every hour'
    if (cron === '*/30 * * * *') return 'Every 30 minutes'
    if (cron === '0 */6 * * *') return 'Every 6 hours'
    if (cron === '0 0 * * 1') return 'Weekly (Mondays)'
    return cron
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Settings</h2>
          <p className="text-gray-400 mt-1">
            Control notifications, cadence, and integrations.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            saved
              ? 'bg-emerald-600 text-white'
              : saving
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {saved ? (
            <>
              <CheckCircle size={16} />
              Saved
            </>
          ) : saving ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </button>
      </header>

      {/* Subscription Management Section */}
      <section className="rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-gray-900 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center">
            <Crown className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Subscription & Billing</h3>
            <p className="text-gray-400 text-sm">Manage your plan and billing</p>
          </div>
        </div>

        {/* Current Plan */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Plan Info */}
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Current Plan</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                user?.tier === 'premium'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : user?.tier === 'pro'
                  ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30'
                  : 'bg-gray-700/50 text-gray-300'
              }`}>
                {user?.tier === 'premium' ? '👑 Premium' : user?.tier === 'pro' ? '⭐ Pro' : '🆓 Free'}
              </span>
            </div>
            <div className="text-2xl font-bold mb-1">
              {user?.tier === 'premium' ? '$14.99' : user?.tier === 'pro' ? '$39.99' : '$0'}
              <span className="text-sm text-gray-400 font-normal"> /month</span>
            </div>
            {user?.tier !== 'free' && user?.subscription_ends_at && (
              <p className="text-xs text-gray-400 mt-2">
                {new Date(user.subscription_ends_at) > new Date()
                  ? `Renews on ${new Date(user.subscription_ends_at).toLocaleDateString()}`
                  : `Expired on ${new Date(user.subscription_ends_at).toLocaleDateString()}`
                }
              </p>
            )}
          </div>

          {/* Usage Stats */}
          {usage && (
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <span className="text-sm text-gray-400 mb-3 block">Usage This Month</span>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300">Tracked Items</span>
                    <span className="text-white font-medium">
                      {usage.usage.trackedItems} / {usage.limits.trackedItems === 'unlimited' ? '∞' : usage.limits.trackedItems}
                    </span>
                  </div>
                  {usage.limits.trackedItems !== 'unlimited' && (
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((usage.usage.trackedItems / usage.limits.trackedItems) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300">Price Alerts</span>
                    <span className="text-white font-medium">
                      {usage.usage.priceAlerts} / {usage.limits.priceAlerts === 'unlimited' ? '∞' : usage.limits.priceAlerts}
                    </span>
                  </div>
                  {usage.limits.priceAlerts !== 'unlimited' && (
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((usage.usage.priceAlerts / usage.limits.priceAlerts) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {user?.tier === 'free' ? (
            <button
              onClick={() => navigate('/premium')}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold transition-all shadow-lg shadow-purple-500/25"
            >
              <Crown size={18} />
              Upgrade to Premium
            </button>
          ) : (
            <>
              <button
                onClick={handleManageSubscription}
                disabled={managingSubscription}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {managingSubscription ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Manage Subscription
                  </>
                )}
              </button>
              {user?.tier === 'premium' && (
                <button
                  onClick={() => navigate('/premium')}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-all"
                >
                  <TrendingUp size={18} />
                  Upgrade to Pro
                </button>
              )}
            </>
          )}
        </div>

        {/* Feature List */}
        {usage && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-sm font-semibold mb-3 text-gray-300">Your Features</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <div className={`flex items-center gap-2 text-sm ${usage.features.realtimeAlerts ? 'text-green-400' : 'text-gray-500'}`}>
                {usage.features.realtimeAlerts ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>Real-time Telegram alerts</span>
              </div>
              <div className={`flex items-center gap-2 text-sm ${usage.features.advancedAI ? 'text-green-400' : 'text-gray-500'}`}>
                {usage.features.advancedAI ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>Advanced AI features</span>
              </div>
              <div className={`flex items-center gap-2 text-sm ${usage.features.priceHistory ? 'text-green-400' : 'text-gray-500'}`}>
                {usage.features.priceHistory ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>Price history charts</span>
              </div>
              <div className={`flex items-center gap-2 text-sm ${usage.features.exportData ? 'text-green-400' : 'text-gray-500'}`}>
                {usage.features.exportData ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>Data export (CSV)</span>
              </div>
              <div className={`flex items-center gap-2 text-sm ${usage.features.apiAccess ? 'text-green-400' : 'text-gray-500'}`}>
                {usage.features.apiAccess ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>API access</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Telegram Bot Section */}
      <section className="rounded-2xl border border-gray-800 bg-gradient-to-br from-primary-900/20 to-gray-900 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600/20 text-primary-400">
            <MessageSquare size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">Telegram Bot</h3>
              <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                config.telegram?.status === 'Connected'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}>
                {config.telegram?.status === 'Connected' ? (
                  <CheckCircle size={12} />
                ) : (
                  <XCircle size={12} />
                )}
                {config.telegram?.status}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Command interface for tracking items and receiving alerts
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Bot Username</p>
                <p className="text-white font-mono">@{config.telegram?.botUsername}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Chat ID</p>
                <p className="text-white font-mono">{config.telegram?.chatId}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500">
                Available commands: /help, /addwatch, /addcar, /addsneaker, /prices, /settarget, /update, /history
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Notifications */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/20 text-primary-400">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Notifications</h3>
              <p className="text-xs text-gray-400">Alert preferences</p>
            </div>
          </div>
          <div className="mt-6 space-y-4 text-sm text-gray-300">
            <label className="flex items-center justify-between cursor-pointer">
              <span>Price drop alerts</span>
              <input
                type="checkbox"
                checked={config.notifications?.priceAlerts ?? true}
                onChange={(e) => updateNotificationSetting('priceAlerts', e.target.checked)}
                className="h-4 w-4 rounded cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Telegram notifications</span>
              <input
                type="checkbox"
                checked={config.notifications?.telegramEnabled ?? true}
                onChange={(e) => updateNotificationSetting('telegramEnabled', e.target.checked)}
                className="h-4 w-4 rounded cursor-pointer"
              />
            </label>
            <div className="pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500">
                Alerts are sent when tracked items hit target prices
              </p>
            </div>
          </div>
        </div>

        {/* Polling Cadence */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/20 text-primary-400">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Cadence</h3>
              <p className="text-xs text-gray-400">Background jobs</p>
            </div>
          </div>
          <div className="mt-6 space-y-4 text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span>Price polling</span>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 font-semibold">
                {parseCronSchedule(config.polling?.schedule || '0 * * * *')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                config.polling?.enabled
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-gray-800 text-gray-400'
              }`}>
                {config.polling?.enabled ? 'Active' : 'Paused'}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500">
                Automatic price updates run at the top of every hour
              </p>
            </div>
          </div>
        </div>

        {/* API & System */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/20 text-primary-400">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">System</h3>
              <p className="text-xs text-gray-400">API and backend</p>
            </div>
          </div>
          <div className="mt-6 space-y-4 text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span>API Status</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                apiHealth === 'OK'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}>
                {apiHealth}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>API Endpoint</span>
              <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-mono">
                :3001
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Database</span>
              <span className="rounded-full bg-gray-800 px-3 py-1 text-xs">
                Local config
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Data Sources Info */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <h3 className="text-lg font-semibold mb-4">Data Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
            <span className="text-gray-300">Chrono24 (Watches)</span>
            <span className="text-emerald-400 text-xs font-semibold">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
            <span className="text-gray-300">AutoTrader (Cars)</span>
            <span className="text-emerald-400 text-xs font-semibold">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
            <span className="text-gray-300">StockX (Sneakers)</span>
            <span className="text-emerald-400 text-xs font-semibold">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
            <span className="text-gray-300">ESPN API (Sports)</span>
            <span className="text-emerald-400 text-xs font-semibold">Active</span>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-primary-900/20 border border-primary-800/30">
          <p className="text-xs text-gray-400">
            All data sources use web scraping or public APIs. No API keys required. Rate limiting is automatically applied to prevent blocking.
          </p>
        </div>
      </section>
    </div>
  )
}

export default Settings
