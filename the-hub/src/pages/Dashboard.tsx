import React, { useEffect, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Car,
  Footprints,
  Watch,
  RefreshCw,
  TrendingUp,
  Bell,
  Sparkles
} from 'lucide-react'
import api from '../services/api'

interface Stats {
  watches: number
  cars: number
  sneakers: number
  aiModels: number
}

interface Alert {
  id: string
  type: string
  title: string
  detail: string
  time: string
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
  const [stats, setStats] = useState<Stats>({ watches: 0, cars: 0, sneakers: 0, aiModels: 0 })
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setRefreshing(true)

      // Fetch stats
      const statsData = await api.getStats()
      setStats(statsData)

      // Fetch alerts
      const alertsData = await api.getAlerts()
      setAlerts(alertsData.slice(0, 3))

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
      value: stats.watches.toString(),
      change: '+' + stats.watches,
      trend: 'up' as const,
      icon: Watch
    },
    {
      label: 'Cars',
      value: stats.cars.toString(),
      change: '+' + stats.cars,
      trend: 'up' as const,
      icon: Car
    },
    {
      label: 'Sneakers',
      value: stats.sneakers.toString(),
      change: '+' + stats.sneakers,
      trend: 'up' as const,
      icon: Footprints
    },
    {
      label: 'AI Models',
      value: stats.aiModels.toString(),
      change: '+' + stats.aiModels,
      trend: 'up' as const,
      icon: Brain
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-primary-500/20 rounded-full"></div>
            <RefreshCw className="relative animate-spin text-primary-400" size={40} />
          </div>
          <p className="text-gray-300 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const totalItems = stats.watches + stats.cars + stats.sneakers

  return (
    <div className="space-y-8">
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
            className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            <Activity size={18} className={refreshing ? 'animate-spin' : 'group-hover:rotate-90 transition-transform duration-300'} />
            Refresh Data
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statsConfig.map(({ label, value, change, trend, icon: Icon }, index) => {
          const gradients = [
            'from-blue-500/20 to-cyan-500/20',
            'from-purple-500/20 to-pink-500/20',
            'from-emerald-500/20 to-teal-500/20',
            'from-orange-500/20 to-amber-500/20'
          ]
          const iconBgs = [
            'from-blue-500/20 to-cyan-500/30',
            'from-purple-500/20 to-pink-500/30',
            'from-emerald-500/20 to-teal-500/30',
            'from-orange-500/20 to-amber-500/30'
          ]
          const iconColors = [
            'text-blue-400',
            'text-purple-400',
            'text-emerald-400',
            'text-orange-400'
          ]

          return (
            <div
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl shadow-black/20 backdrop-blur-sm transition-all hover:border-gray-700 hover:shadow-2xl hover:scale-105"
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

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
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-800/50 mb-4">
                    <Bell className="text-gray-600" size={24} />
                  </div>
                  <p className="text-gray-500 text-sm">No alerts yet</p>
                  <p className="text-gray-600 text-xs mt-1">Set target prices to receive alerts!</p>
                </div>
              ) : (
                alerts.map((alert, index) => (
                  <div
                    key={alert.id}
                    className="group relative overflow-hidden rounded-xl border border-gray-800/50 bg-gray-900/50 p-4 transition-all hover:border-rose-500/30 hover:bg-gray-900/80"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/5 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{alert.title || 'Price Alert'}</div>
                          <div className="mt-1 text-xs text-gray-400 line-clamp-2">{alert.detail || alert.message}</div>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                          <Bell className="text-rose-400" size={14} />
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">{alert.time || new Date(alert.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))
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
                  <p className="text-gray-500 text-sm">No items tracked yet</p>
                  <p className="text-gray-600 text-xs mt-1">Use the Telegram bot to add items!</p>
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
    </div>
  )
}

export default Dashboard
