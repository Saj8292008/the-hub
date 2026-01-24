import React, { useState, useEffect } from 'react'
import { Activity, CheckCircle, XCircle, Clock, Play, TrendingUp, Zap, AlertCircle, RefreshCw } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

interface ScraperStats {
  totalListings: number
  sources: string[]
  lastScrapeTime: string
  successRate: number
  activeScrapers: number
}

interface ScraperSource {
  name: string
  status: 'active' | 'idle' | 'error'
  lastRun: string
  listingsFound: number
  avgResponseTime: number
}

export const ScraperDashboard: React.FC = () => {
  const [stats, setStats] = useState<ScraperStats>({
    totalListings: 0,
    sources: [],
    lastScrapeTime: 'Never',
    successRate: 0,
    activeScrapers: 0
  })

  const [sources, setSources] = useState<ScraperSource[]>([
    {
      name: 'Chrono24',
      status: 'idle',
      lastRun: '5m ago',
      listingsFound: 142,
      avgResponseTime: 1.2
    },
    {
      name: 'Bob\'s Watches',
      status: 'idle',
      lastRun: '8m ago',
      listingsFound: 89,
      avgResponseTime: 2.1
    },
    {
      name: 'WatchBox',
      status: 'idle',
      lastRun: '12m ago',
      listingsFound: 67,
      avgResponseTime: 1.8
    }
  ])

  const [loading, setLoading] = useState(false)
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string
    action: string
    source: string
    timestamp: string
    status: 'success' | 'error'
  }>>([])

  useEffect(() => {
    fetchScraperStats()
    fetchSources()

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchScraperStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchScraperStats = async () => {
    try {
      const data = await api.getScraperStats()
      setStats({
        totalListings: data.totalListings || 0,
        sources: data.sources || [],
        lastScrapeTime: data.lastScrapeTime || 'Never',
        successRate: data.successRate || 95,
        activeScrapers: data.activeScrapers || 0
      })
    } catch (error) {
      console.error('Failed to fetch scraper stats:', error)
    }
  }

  const fetchSources = async () => {
    try {
      const data = await api.getScraperSources()
      // Mock source data for now - replace with real data when backend is ready
      console.log('Scraper sources:', data)
    } catch (error) {
      console.error('Failed to fetch sources:', error)
    }
  }

  const triggerScrape = async (source?: string) => {
    setLoading(true)

    try {
      // Update source status to active
      if (source) {
        setSources(prev => prev.map(s =>
          s.name === source ? { ...s, status: 'active' as const } : s
        ))
      }

      await api.triggerScrape(source)

      toast.success(
        `🔍 ${source ? `${source} scraper` : 'All scrapers'} triggered!`,
        {
          icon: '⚡',
          duration: 3000,
          style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            fontWeight: '500'
          }
        }
      )

      // Add to recent activity
      const newActivity = {
        id: Date.now().toString(),
        action: 'Scrape triggered',
        source: source || 'All sources',
        timestamp: 'Just now',
        status: 'success' as const
      }
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)])

      // Reset source status after a delay
      setTimeout(() => {
        if (source) {
          setSources(prev => prev.map(s =>
            s.name === source ? { ...s, status: 'idle' as const, lastRun: 'Just now' } : s
          ))
        }
        fetchScraperStats()
      }, 3000)

    } catch (error) {
      toast.error('Failed to trigger scraper')

      // Mark as error
      if (source) {
        setSources(prev => prev.map(s =>
          s.name === source ? { ...s, status: 'error' as const } : s
        ))
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-400 bg-blue-500/10'
      case 'idle': return 'text-emerald-400 bg-emerald-500/10'
      case 'error': return 'text-rose-400 bg-rose-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="animate-pulse" size={14} />
      case 'idle': return <CheckCircle size={14} />
      case 'error': return <XCircle size={14} />
      default: return <Clock size={14} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <Zap className="text-purple-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Scraper Monitor</h3>
            <p className="text-sm text-gray-400">Real-time scraping status</p>
          </div>
        </div>

        <button
          onClick={() => triggerScrape()}
          disabled={loading}
          className="group relative inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Play size={16} />
          )}
          <span>Run All</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Listings */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-4 shadow-xl backdrop-blur-sm transition-all hover:border-purple-500/30 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <TrendingUp size={14} className="text-purple-400" />
              <span className="font-semibold uppercase tracking-wider">Total Listings</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalListings.toLocaleString()}</div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-4 shadow-xl backdrop-blur-sm transition-all hover:border-emerald-500/30 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="font-semibold uppercase tracking-wider">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.successRate}%</div>
          </div>
        </div>

        {/* Active Scrapers */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-4 shadow-xl backdrop-blur-sm transition-all hover:border-blue-500/30 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <Activity size={14} className="text-blue-400" />
              <span className="font-semibold uppercase tracking-wider">Active Now</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.activeScrapers}</div>
          </div>
        </div>

        {/* Last Scrape */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-4 shadow-xl backdrop-blur-sm transition-all hover:border-orange-500/30 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <Clock size={14} className="text-orange-400" />
              <span className="font-semibold uppercase tracking-wider">Last Scrape</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.lastScrapeTime}</div>
          </div>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sources.map((source) => (
          <div
            key={source.name}
            className="group relative overflow-hidden rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-4 shadow-xl backdrop-blur-sm transition-all hover:border-gray-700"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800/0 via-gray-800/20 to-gray-800/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${getStatusColor(source.status)}`}>
                    {getStatusIcon(source.status)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{source.name}</h4>
                    <p className="text-xs text-gray-500">{source.lastRun}</p>
                  </div>
                </div>

                <button
                  onClick={() => triggerScrape(source.name)}
                  disabled={loading || source.status === 'active'}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all disabled:opacity-50"
                >
                  {source.status === 'active' ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} />
                  )}
                </button>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Listings Found</span>
                  <span className="font-semibold text-white">{source.listingsFound}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Avg Response</span>
                  <span className="font-semibold text-white">{source.avgResponseTime}s</span>
                </div>

                {/* Progress bar */}
                {source.status === 'active' && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-shimmer"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="relative overflow-hidden rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-blue-400" size={18} />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Recent Activity</h4>
          </div>

          <div className="space-y-2">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-lg bg-gray-800/30 px-3 py-2 transition-colors hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  {activity.status === 'success' ? (
                    <CheckCircle className="text-emerald-400" size={14} />
                  ) : (
                    <XCircle className="text-rose-400" size={14} />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.source}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{activity.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
