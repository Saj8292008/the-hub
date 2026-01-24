import React, { useEffect, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Car,
  Footprints,
  Watch,
  TrendingUp,
  Bell,
  Sparkles,
  TrendingDown,
  Package,
  Zap,
  AlertTriangle,
  Trophy
} from 'lucide-react'
import api from '../services/api'
import { SkeletonCard, SkeletonAlert, SkeletonWatchlistItem } from '../components/SkeletonLoader'
import { RecentListingsWidget } from '../components/RecentListingsWidget'
import { ScraperDashboard } from '../components/ScraperDashboard'

interface Stats {
  watches: number
  cars: number
  sneakers: number
  sports: number
  aiModels: number
}

interface Alert {
  id: string
  type: string
  alertType?: 'price_drop' | 'new_listing' | 'restock' | 'price_jump'
  severity?: 'hot' | 'warning' | 'normal'
  title: string
  detail: string
  time: string
  createdAt?: string
  message?: string
}

interface WatchlistItem {
  id: string
  name: string
  status: string
  source: string
  currentPrice?: number
  targetPrice?: number
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ watches: 0, cars: 0, sneakers: 0, sports: 0, aiModels: 0 })
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Helper to get alert type badge
  const getAlertTypeBadge = (alertType?: string) => {
    switch (alertType) {
      case 'price_drop':
        return { label: 'Price Drop', icon: TrendingDown, color: 'emerald' }
      case 'new_listing':
        return { label: 'New Listing', icon: Package, color: 'blue' }
      case 'restock':
        return { label: 'Restock', icon: Zap, color: 'purple' }
      case 'price_jump':
        return { label: 'Price Jump', icon: AlertTriangle, color: 'orange' }
      default:
        return { label: 'Alert', icon: Bell, color: 'rose' }
    }
  }

  // Helper to get severity indicator
  const getSeverityIndicator = (severity?: string) => {
    switch (severity) {
      case 'hot':
        return { emoji: '🔥', label: 'Hot Deal', color: 'rose' }
      case 'warning':
        return { emoji: '⚠️', label: 'Price Jump', color: 'amber' }
      default:
        return null
    }
  }

  // Helper to format timestamp
  const formatTimestamp = (time?: string) => {
    if (!time) return 'Just now'

    const date = new Date(time)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const fetchData = async () => {
    try {
      setRefreshing(true)

      // Fetch stats
      const statsData = await api.getStats()
      setStats({
        watches: statsData.watches || 0,
        cars: statsData.cars || 0,
        sneakers: statsData.sneakers || 0,
        sports: statsData.sports || 0,
        aiModels: statsData.aiModels || 0
      })

      // Fetch alerts
      const alertsData = await api.getAlerts()

      // Enrich alerts with types and severity (demo data until backend supports it)
      const enrichedAlerts = alertsData.slice(0, 3).map((alert: any, idx: number) => {
        const types: Array<'price_drop' | 'new_listing' | 'restock' | 'price_jump'> = ['price_drop', 'new_listing', 'restock', 'price_jump']

        return {
          ...alert,
          alertType: alert.alertType || types[idx % types.length],
          severity: alert.severity || (idx === 0 ? 'hot' : idx === 1 ? 'warning' : 'normal')
        }
      })

      setAlerts(enrichedAlerts)

      // Fetch watchlist items (combine watches, cars, sneakers)
      const [watches, cars, sneakers] = await Promise.all([
        api.getWatches(),
        api.getCars(),
        api.getSneakers()
      ])

      const allItems: WatchlistItem[] = [
        ...watches.slice(0, 2).map((w: any) => ({
          id: w.id,
          name: w.name || `${w.brand} ${w.model}`,
          status: w.currentPrice && w.targetPrice && w.currentPrice <= w.targetPrice ? 'Alert' : 'Tracking',
          source: 'Chrono24',
          currentPrice: w.currentPrice || w.current_price,
          targetPrice: w.targetPrice || w.target_price
        })),
        ...cars.slice(0, 1).map((c: any) => ({
          id: c.id,
          name: `${c.make} ${c.model} ${c.year}`,
          status: c.currentPrice && c.targetPrice && c.currentPrice <= c.targetPrice ? 'Alert' : 'Watching',
          source: 'AutoTrader',
          currentPrice: c.currentPrice || c.current_price,
          targetPrice: c.targetPrice || c.target_price
        })),
        ...sneakers.slice(0, 1).map((s: any) => ({
          id: s.id,
          name: s.name || `${s.brand} ${s.model}`,
          status: s.currentPrice && s.targetPrice && s.currentPrice <= s.targetPrice ? 'Alert' : 'Tracking',
          source: 'StockX',
          currentPrice: s.currentPrice || s.current_price,
          targetPrice: s.targetPrice || s.target_price
        }))
      ]

      setWatchlist(allItems)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const statsConfig = [
    {
      label: 'Watches',
      value: (stats.watches || 0).toString(),
      change: '+' + (stats.watches || 0),
      trend: 'up' as const,
      icon: Watch
    },
    {
      label: 'Cars',
      value: (stats.cars || 0).toString(),
      change: '+' + (stats.cars || 0),
      trend: 'up' as const,
      icon: Car
    },
    {
      label: 'Sneakers',
      value: (stats.sneakers || 0).toString(),
      change: '+' + (stats.sneakers || 0),
      trend: 'up' as const,
      icon: Footprints
    },
    {
      label: 'Sports',
      value: (stats.sports || 0).toString(),
      change: '+' + (stats.sports || 0),
      trend: 'up' as const,
      icon: Trophy
    },
    {
      label: 'AI Models',
      value: (stats.aiModels || 0).toString(),
      change: '+' + (stats.aiModels || 0),
      trend: 'up' as const,
      icon: Brain
    }
  ]

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Header Skeleton */}
        <header className="relative">
          <div className="animate-pulse space-y-3">
            <div className="h-10 w-64 bg-gray-800 rounded animate-shimmer"></div>
            <div className="h-5 w-96 bg-gray-800 rounded animate-shimmer"></div>
          </div>
        </header>

        {/* Stats Cards Skeleton */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </section>

        {/* Alerts & Watchlist Skeleton */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Latest Alerts Skeleton */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm">
            <div className="animate-pulse mb-6">
              <div className="h-6 w-32 bg-gray-800 rounded animate-shimmer"></div>
            </div>
            <div className="space-y-3">
              <SkeletonAlert />
              <SkeletonAlert />
              <SkeletonAlert />
            </div>
          </div>

          {/* Watchlist Skeleton */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm xl:col-span-2">
            <div className="animate-pulse mb-6">
              <div className="h-6 w-40 bg-gray-800 rounded animate-shimmer"></div>
            </div>
            <div className="space-y-3">
              <SkeletonWatchlistItem />
              <SkeletonWatchlistItem />
              <SkeletonWatchlistItem />
              <SkeletonWatchlistItem />
            </div>
          </div>
        </section>
      </div>
    )
  }

  const totalItems = stats.watches + stats.cars + stats.sneakers + stats.sports

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with gradient */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Dashboard
              </h2>
              <Sparkles className="text-primary-400" size={24} />
            </div>
            <p className="text-gray-400 mt-2 text-lg">
              Live snapshot across all tracker agents • {totalItems} items tracked
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 animate-pulse-subtle overflow-hidden"
          >
            {/* Shimmer effect when refreshing */}
            {refreshing && (
              <div className="absolute inset-0 animate-shimmer opacity-30"></div>
            )}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-400 to-primary-300 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
            <Activity size={18} className={refreshing ? 'animate-spin' : 'group-hover:rotate-90 transition-transform duration-300'} />
            <span className="relative">Refresh Data</span>
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statsConfig.map(({ label, value, change, icon: Icon }, index) => {
          const gradients = [
            'from-blue-500/20 to-cyan-500/20',
            'from-purple-500/20 to-pink-500/20',
            'from-emerald-500/20 to-teal-500/20',
            'from-yellow-500/20 to-orange-500/20',
            'from-orange-500/20 to-red-500/20'
          ]
          const iconBgs = [
            'from-blue-500/20 to-cyan-500/30',
            'from-purple-500/20 to-pink-500/30',
            'from-emerald-500/20 to-teal-500/30',
            'from-yellow-500/20 to-orange-500/30',
            'from-orange-500/20 to-red-500/30'
          ]
          const iconColors = [
            'text-blue-400',
            'text-purple-400',
            'text-emerald-400',
            'text-yellow-400',
            'text-orange-400'
          ]

          return (
            <div
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:border-gray-700 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              {/* Glow effect */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${gradients[index]} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500 -z-10`}></div>

              {/* Content */}
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${iconBgs[index]} ${iconColors[index]} shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                    <Icon size={20} />
                  </span>
                </div>
                <div className="mt-6 text-4xl font-bold text-white">{value}</div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1">
                    <TrendingUp className="text-emerald-400" size={14} />
                    <span className="text-emerald-400 font-semibold">
                      {change}
                    </span>
                  </div>
                  <span className="text-gray-500">total tracked</span>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* Alerts & Watchlist */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Latest Alerts */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="text-rose-400" size={20} />
              <h3 className="text-lg font-bold text-white">Latest Alerts</h3>
              {alerts.length > 0 && (
                <span className="ml-auto rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
                  {alerts.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/10 to-pink-500/10 mb-4 animate-pulse-subtle">
                    <Bell className="text-rose-400/50" size={24} />
                  </div>
                  <p className="text-gray-400 text-sm font-semibold mb-1">No alerts yet</p>
                  <p className="text-gray-600 text-xs mb-4">Set target prices to get notified</p>
                  <div className="inline-flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                    Use <code className="mx-1 font-mono">/settarget</code> in Telegram
                  </div>
                </div>
              ) : (
                alerts.map((alert, index) => {
                  const typeBadge = getAlertTypeBadge(alert.alertType)
                  const severity = getSeverityIndicator(alert.severity)
                  const TypeIcon = typeBadge.icon

                  return (
                    <div
                      key={alert.id}
                      className="group relative overflow-hidden rounded-xl border border-gray-800/50 bg-gray-900/50 p-4 transition-all hover:border-rose-500/30 hover:bg-gray-900/80"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/5 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative">
                        {/* Severity indicator banner */}
                        {severity && (
                          <div className={`mb-3 flex items-center gap-1.5 rounded-lg bg-${severity.color}-500/10 px-2.5 py-1.5 border border-${severity.color}-500/20`}>
                            <span className="text-sm">{severity.emoji}</span>
                            <span className={`text-xs font-bold text-${severity.color}-400`}>{severity.label}</span>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center gap-1 rounded-md bg-${typeBadge.color}-500/10 px-2 py-0.5 text-xs font-semibold text-${typeBadge.color}-400`}>
                                <TypeIcon size={10} />
                                {typeBadge.label}
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-white truncate">{alert.title || 'Price Alert'}</div>
                            <div className="mt-1 text-xs text-gray-400 line-clamp-2">{alert.detail || alert.message}</div>
                          </div>
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${typeBadge.color}-500/10`}>
                            <TypeIcon className={`text-${typeBadge.color}-400`} size={14} />
                          </div>
                        </div>

                        {/* Timestamp */}
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs text-gray-500">{formatTimestamp(alert.time || alert.createdAt)}</span>
                          <span className="inline-block w-1 h-1 rounded-full bg-gray-600"></span>
                          <span className="text-xs text-gray-600">
                            {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Watchlist Snapshot */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm xl:col-span-2">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="text-primary-400" size={20} />
                <h3 className="text-lg font-bold text-white">Watchlist Snapshot</h3>
              </div>
              <button className="text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors">
                View all →
              </button>
            </div>
            <div className="space-y-3">
              {watchlist.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-800/50 mb-4">
                    <Watch className="text-gray-600" size={24} />
                  </div>
                  <p className="text-gray-500 text-sm font-semibold mb-1">No items tracked yet</p>
                  <p className="text-gray-600 text-xs mb-6">Start tracking your first watch, car, or sneaker</p>
                  <a
                    href="https://t.me/your_bot_username"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105"
                  >
                    <Sparkles size={16} />
                    Track Your First Item
                  </a>
                  <p className="text-gray-600 text-xs mt-4">
                    Or send <code className="bg-gray-800 px-1.5 py-0.5 rounded text-primary-400">/addwatch</code> in Telegram
                  </p>
                </div>
              ) : (
                watchlist.map((item, index) => {
                  const priceStatus = item.currentPrice && item.targetPrice
                    ? item.currentPrice <= item.targetPrice ? 'below' : 'above'
                    : null
                  const priceDiff = item.currentPrice && item.targetPrice
                    ? Math.abs(((item.currentPrice - item.targetPrice) / item.targetPrice) * 100)
                    : null

                  return (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-xl border border-gray-800/50 bg-gray-900/50 p-4 transition-all hover:border-primary-500/30 hover:bg-gray-900/80 hover:scale-[1.02]"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-white truncate">{item.name}</div>
                            {priceStatus === 'below' && (
                              <span className="flex h-2 w-2">
                                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
                            <span className="font-medium">{item.source}</span>
                            {item.currentPrice && (
                              <>
                                <span className="text-gray-600">•</span>
                                <span className="font-semibold text-white">${item.currentPrice.toLocaleString()}</span>
                              </>
                            )}
                            {item.targetPrice && (
                              <>
                                <span className="text-gray-600">•</span>
                                <span>Target: ${item.targetPrice.toLocaleString()}</span>
                              </>
                            )}
                          </div>
                          {priceDiff !== null && (
                            <div className="mt-2">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                priceStatus === 'below'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-emerald-500/10 text-emerald-400'
                              }`}>
                                {priceStatus === 'below' ? (
                                  <ArrowDownRight size={12} />
                                ) : (
                                  <ArrowUpRight size={12} />
                                )}
                                {priceDiff.toFixed(1)}% {priceStatus} target
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${
                            item.status === 'Alert'
                              ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30'
                              : 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/30'
                          }`}>
                            {item.status === 'Alert' && <Bell size={12} />}
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Scraper Monitor */}
      <section>
        <ScraperDashboard />
      </section>

      {/* Recent Scraped Listings */}
      <section>
        <RecentListingsWidget />
      </section>
    </div>
  )
}

export default Dashboard
