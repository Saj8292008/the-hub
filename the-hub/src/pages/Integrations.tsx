import React, { useEffect, useState } from 'react'
import { Plug, ShieldCheck, Zap, Watch, Car, Footprints, Activity, ExternalLink, CheckCircle, Globe, Clock } from 'lucide-react'
import api from '../services/api'

const Integrations: React.FC = () => {
  const [stats, setStats] = useState({ watches: 0, cars: 0, sneakers: 0, aiModels: 0 })
  const [apiHealth, setApiHealth] = useState<string>('Checking...')

  useEffect(() => {
    checkHealth()
    fetchStats()
  }, [])

  const checkHealth = async () => {
    try {
      const health = await api.healthCheck()
      setApiHealth(health.status)
    } catch {
      setApiHealth('Offline')
    }
  }

  const fetchStats = async () => {
    try {
      const data = await api.getStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const sources = [
    {
      name: 'Chrono24',
      category: 'Watches',
      status: 'Active',
      detail: 'Web scraping (no API key required)',
      count: stats.watches,
      icon: Watch
    },
    {
      name: 'AutoTrader',
      category: 'Cars',
      status: 'Active',
      detail: 'Web scraping (no API key required)',
      count: stats.cars,
      icon: Car
    },
    {
      name: 'StockX',
      category: 'Sneakers',
      status: 'Active',
      detail: 'Web scraping (no API key required)',
      count: stats.sneakers,
      icon: Footprints
    },
    {
      name: 'ESPN API',
      category: 'Sports',
      status: 'Active',
      detail: 'Public API (no key required)',
      count: 0,
      icon: Activity
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Integrations
              </h2>
              <Plug className="text-primary-400" size={28} />
            </div>
            <p className="text-gray-400 mt-2 text-lg">
              Manage data sources and track integration status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-gray-900/50 border border-gray-800/50 px-4 py-3">
              <Globe className="text-primary-400" size={18} />
              <div className="text-sm">
                <span className="text-gray-400 font-medium">API Status:</span>
                <span className={`ml-2 font-bold ${apiHealth === 'OK' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {apiHealth}
                </span>
              </div>
              <div className={`flex h-2 w-2 ml-2 ${apiHealth === 'OK' ? '' : 'opacity-0'}`}>
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Data Sources */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-primary-400" size={22} />
            <h3 className="text-xl font-bold text-white">Data Sources</h3>
            <span className="ml-auto rounded-full bg-primary-500/20 px-3 py-1 text-xs font-bold text-primary-400">
              {sources.filter(s => s.status === 'Active').length} Active
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sources.map((source, index) => {
              const Icon = source.icon
              const gradients = [
                'from-blue-500/20 to-cyan-500/20',
                'from-purple-500/20 to-pink-500/20',
                'from-emerald-500/20 to-teal-500/20',
                'from-orange-500/20 to-amber-500/20'
              ]
              const iconColors = [
                'text-blue-400',
                'text-purple-400',
                'text-emerald-400',
                'text-orange-400'
              ]
              const iconBgs = [
                'bg-blue-500/20',
                'bg-purple-500/20',
                'bg-emerald-500/20',
                'bg-orange-500/20'
              ]

              return (
                <div
                  key={source.name}
                  className="group relative overflow-hidden rounded-xl border border-gray-800/50 bg-gray-900/50 p-5 transition-all hover:border-gray-700 hover:scale-105 hover:shadow-xl"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBgs[index]} ${iconColors[index]} transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                        <Icon size={20} />
                      </div>
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                        <CheckCircle size={12} />
                        {source.status}
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{source.category}</p>
                      <p className="text-base font-bold text-white mt-0.5">{source.name}</p>
                    </div>
                    <div className="flex items-center justify-between mb-3 py-3 border-t border-b border-gray-800/50">
                      <span className="text-xs text-gray-400 font-medium">Tracked Items</span>
                      <span className="text-2xl font-bold text-white">{source.count}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{source.detail}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      <span className="font-medium">Secure Connection</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Telegram & Polling */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telegram Bot */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm transition-all hover:border-primary-500/30 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600/30 to-purple-600/30 text-primary-400 transition-transform group-hover:scale-110 group-hover:rotate-6">
                <Zap size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Telegram Bot</h3>
                <p className="text-xs text-gray-400">Real-time commands and alerts</p>
              </div>
              <div className="flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 transition-colors hover:bg-gray-800/50">
                <CheckCircle className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                <span className="text-gray-300">Add items via chat commands</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 transition-colors hover:bg-gray-800/50">
                <CheckCircle className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                <span className="text-gray-300">Receive instant price alerts</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 transition-colors hover:bg-gray-800/50">
                <CheckCircle className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                <span className="text-gray-300">View tracked items anytime</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 transition-colors hover:bg-gray-800/50">
                <CheckCircle className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                <span className="text-gray-300">Set target prices easily</span>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-gray-800/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Status</span>
                <span className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Polling */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm transition-all hover:border-blue-500/30 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-600/30 text-blue-400 transition-transform group-hover:scale-110 group-hover:rotate-6">
                <Clock size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Price Polling</h3>
                <p className="text-xs text-gray-400">Automated background checks</p>
              </div>
              <div className="flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 transition-colors hover:bg-gray-800/50">
                <CheckCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={16} />
                <span className="text-gray-300">Hourly price updates</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 transition-colors hover:bg-gray-800/50">
                <CheckCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={16} />
                <span className="text-gray-300">Price history tracking</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 transition-colors hover:bg-gray-800/50">
                <CheckCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={16} />
                <span className="text-gray-300">Automatic alerts</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 transition-colors hover:bg-gray-800/50">
                <CheckCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={16} />
                <span className="text-gray-300">Rate limiting protection</span>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-gray-800/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Next Check</span>
                <span className="flex items-center gap-2 text-sm font-bold text-blue-400">
                  <Clock size={14} />
                  Top of the hour
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="relative overflow-hidden rounded-2xl border border-primary-500/20 bg-gradient-to-br from-primary-900/20 via-purple-900/10 to-gray-900 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600/30 to-purple-600/30 text-primary-400">
                <ExternalLink size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">API Endpoints</h3>
                <p className="text-sm text-gray-400 mb-4">
                  REST API running on port 3000
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  {[
                    'GET /stats - Dashboard statistics',
                    'GET /watches - List tracked watches',
                    'GET /cars - List tracked cars',
                    'GET /sneakers - List tracked sneakers',
                    'GET /alerts - Price alerts history',
                    'GET /:type/:id/history - Price history'
                  ].map((endpoint, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-900/50 text-gray-400 hover:bg-gray-900/70 hover:text-primary-400 transition-colors">
                      <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />
                      <span>{endpoint}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <a
              href="http://localhost:3000/health"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-xl bg-primary-600/20 border border-primary-500/30 px-4 py-2.5 text-sm font-semibold text-primary-400 transition-all hover:bg-primary-600 hover:text-white hover:scale-105 hover:shadow-lg hover:shadow-primary-500/25"
            >
              Test API
              <ExternalLink size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Integrations
