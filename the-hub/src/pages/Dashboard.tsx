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
  Trophy,
  User,
  LogOut,
  Crown
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { SkeletonCard, SkeletonAlert, SkeletonWatchlistItem } from '../components/SkeletonLoader'
import { RecentListingsWidget } from '../components/RecentListingsWidget'
import { RecentBlogPosts } from '../components/RecentBlogPosts'
import { ScraperDashboard } from '../components/ScraperDashboard'
import EmailCapture from '../components/newsletter/EmailCapture'
import { PricingPlans } from '../components/PricingPlans'

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
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()

  const [stats, setStats] = useState<Stats>({ watches: 0, cars: 0, sneakers: 0, sports: 0, aiModels: 0 })
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'premium':
        return { label: 'Premium', color: 'from-purple-500 to-purple-600', icon: Crown }
      case 'pro':
        return { label: 'Pro', color: 'from-blue-500 to-blue-600', icon: Crown }
      case 'enterprise':
        return { label: 'Enterprise', color: 'from-amber-500 to-amber-600', icon: Crown }
      default:
        return { label: 'Free', color: 'from-gray-600 to-gray-700', icon: User }
    }
  }

  const tierBadge = getTierBadge(user?.tier)

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
      {/* Header with gradient - Redesigned for no overlap */}
      <header className="relative">
        <div className="absolute inset-0 opacity-30 rounded-3xl blur-3xl" style={{ background: 'linear-gradient(90deg, rgba(26,141,95,0.1), rgba(26,141,95,0.05))' }}></div>
        <div className="relative">
          {/* User info bar */}
          {isAuthenticated && user && (
            <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#1a8d5f' }}>
                  <User className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: '#f0f0f0' }}>
                    Welcome back, {user.firstName || user.email?.split('@')[0]}!
                  </p>
                  <p className="text-sm" style={{ color: '#888' }}>
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Tier Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm font-semibold" style={{
                  background: tierBadge.label === 'Premium' ? '#1a8d5f' : 'rgba(255,255,255,0.1)'
                }}>
                  <tierBadge.icon size={14} />
                  {tierBadge.label}
                </div>
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 transition-colors font-medium"
                  style={{ 
                    color: '#888',
                    borderRadius: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = '#f0f0f0'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#888'
                  }}
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          )}

          {/* Title and subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl sm:text-4xl font-bold" style={{ 
                  color: '#f0f0f0',
                  letterSpacing: '-1px'
                }}>
                  Dashboard Overview
                </h2>
                <Sparkles size={24} style={{ color: '#1a8d5f' }} />
              </div>
              <p className="mt-2 text-base sm:text-lg" style={{ color: '#888' }}>
                Live snapshot across all tracker agents • {totalItems} items tracked
              </p>
            </div>

            {/* Refresh button - Now clearly separated */}
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 overflow-hidden min-w-[140px]"
              style={{ 
                background: '#1a8d5f',
                borderRadius: '12px'
              }}
              onMouseEnter={(e) => {
                if (!refreshing) e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                if (!refreshing) e.currentTarget.style.opacity = '1'
              }}
            >
              <Activity size={16} className={refreshing ? 'animate-spin' : 'group-hover:rotate-90 transition-transform duration-300'} />
              <span className="relative">{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statsConfig.map(({ label, value, change, icon: Icon }, index) => {
          const iconColors = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ef4444']

          return (
            <div
              key={label}
              className="group relative overflow-hidden p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1"
              style={{ 
                background: '#141414',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                animationDelay: `${index * 100}ms`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              }}
            >
              {/* Content */}
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#888' }}>{label}</span>
                  <span 
                    className="flex h-12 w-12 items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6"
                    style={{ 
                      background: `${iconColors[index]}15`,
                      borderRadius: '10px',
                      color: iconColors[index]
                    }}
                  >
                    <Icon size={20} />
                  </span>
                </div>
                <div className="mt-6 text-4xl font-bold" style={{ color: '#f0f0f0' }}>{value}</div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1 rounded-full px-2 py-1" style={{ background: 'rgba(26, 141, 95, 0.15)' }}>
                    <TrendingUp size={14} style={{ color: '#1a8d5f' }} />
                    <span className="font-semibold" style={{ color: '#1a8d5f' }}>
                      {change}
                    </span>
                  </div>
                  <span style={{ color: '#555' }}>total tracked</span>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* Alerts & Watchlist */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Latest Alerts */}
        <div className="relative overflow-hidden p-6 backdrop-blur-sm" style={{ 
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px'
        }}>
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="text-rose-400" size={20} />
              <h3 className="text-lg font-bold" style={{ color: '#f0f0f0', letterSpacing: '-0.3px' }}>Latest Alerts</h3>
              {alerts.length > 0 && (
                <span className="ml-auto rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
                  {alerts.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full mb-4 animate-pulse-subtle" style={{ background: 'rgba(244, 63, 94, 0.1)' }}>
                    <Bell className="text-rose-400/50" size={24} />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#888' }}>No alerts yet</p>
                  <p className="text-xs mb-4" style={{ color: '#555' }}>Set target prices to get notified</p>
                  <div className="inline-flex items-center gap-1.5 text-xs text-rose-400 px-3 py-1.5" style={{ 
                    background: 'rgba(244, 63, 94, 0.1)',
                    borderRadius: '8px'
                  }}>
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
                      className="group relative overflow-hidden p-4 transition-all"
                      style={{ 
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        animationDelay: `${index * 100}ms`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      }}
                    >
                      <div className="relative">
                        {/* Severity indicator banner */}
                        {severity && (
                          <div className="mb-3 flex items-center gap-1.5 px-2.5 py-1.5" style={{
                            background: severity.color === 'rose' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            border: severity.color === 'rose' ? '1px solid rgba(244, 63, 94, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
                            borderRadius: '8px'
                          }}>
                            <span className="text-sm">{severity.emoji}</span>
                            <span className="text-xs font-bold" style={{ color: severity.color === 'rose' ? '#fb7185' : '#fbbf24' }}>{severity.label}</span>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold" style={{
                                background: `${typeBadge.color === 'emerald' ? 'rgba(16, 185, 129, 0.1)' : typeBadge.color === 'blue' ? 'rgba(59, 130, 246, 0.1)' : typeBadge.color === 'purple' ? 'rgba(168, 85, 245, 0.1)' : 'rgba(245, 158, 11, 0.1)'}`,
                                color: `${typeBadge.color === 'emerald' ? '#10b981' : typeBadge.color === 'blue' ? '#3b82f6' : typeBadge.color === 'purple' ? '#a855f7' : '#f59e0b'}`,
                                borderRadius: '6px'
                              }}>
                                <TypeIcon size={10} />
                                {typeBadge.label}
                              </span>
                            </div>
                            <div className="text-sm font-semibold truncate" style={{ color: '#f0f0f0' }}>{alert.title || 'Price Alert'}</div>
                            <div className="mt-1 text-xs line-clamp-2" style={{ color: '#888' }}>{alert.detail || alert.message}</div>
                          </div>
                          <div className="flex h-8 w-8 items-center justify-center" style={{
                            background: `${typeBadge.color === 'emerald' ? 'rgba(16, 185, 129, 0.1)' : typeBadge.color === 'blue' ? 'rgba(59, 130, 246, 0.1)' : typeBadge.color === 'purple' ? 'rgba(168, 85, 245, 0.1)' : 'rgba(245, 158, 11, 0.1)'}`,
                            color: `${typeBadge.color === 'emerald' ? '#10b981' : typeBadge.color === 'blue' ? '#3b82f6' : typeBadge.color === 'purple' ? '#a855f7' : '#f59e0b'}`,
                            borderRadius: '8px'
                          }}>
                            <TypeIcon size={14} />
                          </div>
                        </div>

                        {/* Timestamp */}
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs" style={{ color: '#555' }}>{formatTimestamp(alert.time || alert.createdAt)}</span>
                          <span className="inline-block w-1 h-1 rounded-full" style={{ background: '#555' }}></span>
                          <span className="text-xs" style={{ color: '#555' }}>
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
        <div className="relative overflow-hidden p-6 backdrop-blur-sm xl:col-span-2" style={{ 
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px'
        }}>
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity size={20} style={{ color: '#1a8d5f' }} />
                <h3 className="text-lg font-bold" style={{ color: '#f0f0f0', letterSpacing: '-0.3px' }}>Watchlist Snapshot</h3>
              </div>
              <button className="text-sm font-semibold transition-colors" style={{ color: '#1a8d5f' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                View all →
              </button>
            </div>
            <div className="space-y-3">
              {watchlist.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <Watch size={24} style={{ color: '#555' }} />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#888' }}>No items tracked yet</p>
                  <p className="text-xs mb-6" style={{ color: '#555' }}>Start tracking your first watch, car, or sneaker</p>
                  <a
                    href="https://t.me/your_bot_username"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105"
                    style={{ 
                      background: '#1a8d5f',
                      borderRadius: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <Sparkles size={16} />
                    Track Your First Item
                  </a>
                  <p className="text-xs mt-4" style={{ color: '#555' }}>
                    Or send <code className="px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(255,255,255,0.05)', color: '#1a8d5f' }}>/addwatch</code> in Telegram
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
                      className="group relative overflow-hidden p-4 transition-all hover:scale-[1.01]"
                      style={{ 
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        animationDelay: `${index * 100}ms`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(26, 141, 95, 0.3)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      }}
                    >
                      <div className="relative flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold truncate" style={{ color: '#f0f0f0' }}>{item.name}</div>
                            {priceStatus === 'below' && (
                              <span className="flex h-2 w-2">
                                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2 text-xs" style={{ color: '#888' }}>
                            <span className="font-medium">{item.source}</span>
                            {item.currentPrice && (
                              <>
                                <span style={{ color: '#555' }}>•</span>
                                <span className="font-semibold" style={{ color: '#f0f0f0' }}>${item.currentPrice.toLocaleString()}</span>
                              </>
                            )}
                            {item.targetPrice && (
                              <>
                                <span style={{ color: '#555' }}>•</span>
                                <span>Target: ${item.targetPrice.toLocaleString()}</span>
                              </>
                            )}
                          </div>
                          {priceDiff !== null && (
                            <div className="mt-2">
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" style={{
                                background: priceStatus === 'below' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: priceStatus === 'below' ? '#fb7185' : '#10b981'
                              }}>
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
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold" style={{
                            background: item.status === 'Alert' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(26, 141, 95, 0.15)',
                            color: item.status === 'Alert' ? '#fb7185' : '#1a8d5f',
                            border: item.status === 'Alert' ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(26, 141, 95, 0.3)',
                            borderRadius: '12px'
                          }}>
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

      {/* Pricing Plans */}
      {(!user || user.tier === 'free') && (
        <section className="relative overflow-hidden p-8 sm:p-12 backdrop-blur-sm" style={{ 
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px'
        }}>
          <PricingPlans />
        </section>
      )}

      {/* Recent Activity Grid */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent Scraped Listings */}
        <RecentListingsWidget />

        {/* Recent Blog Posts */}
        <RecentBlogPosts />
      </section>

      {/* Newsletter Signup */}
      <section>
        <EmailCapture source="homepage" variant="hero" />
      </section>
    </div>
  )
}

export default Dashboard
