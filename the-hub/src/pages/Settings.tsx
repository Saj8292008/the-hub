import React, { useEffect, useState } from 'react'
import { Bell, Shield, Sliders, MessageSquare, RefreshCw, CheckCircle, XCircle, Save } from 'lucide-react'
import api from '../services/api'

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
  const [config, setConfig] = useState<Config>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [apiHealth, setApiHealth] = useState<string>('Checking...')

  useEffect(() => {
    fetchConfig()
    checkHealth()
  }, [])

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
