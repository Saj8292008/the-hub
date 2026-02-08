import React, { useEffect, useState } from 'react'
import {
  Server,
  Database,
  Mail,
  MessageCircle,
  Zap,
  RefreshCw,
  Brain,
  TrendingUp,
  Code,
  Activity
} from 'lucide-react'
import api from '../services/api'

interface ServerStatus {
  status: string
  uptime: string
  memory: {
    used: number
    total: number
    percent: number
  }
  cpu: string
}

interface ScraperStatus {
  sources: Record<string, { lastRun: string | null; status: string }>
  totalListings: number
  last24h: number
}

interface NewsletterStatus {
  subscribers: number
  lastCampaign: any
}

interface TelegramStatus {
  botStatus: string
  channelId: string
  postsToday: number
}

interface DealStatus {
  activeWatchlists: number
  hotDealsToday: number
}

interface DashboardData {
  server: ServerStatus
  scrapers: ScraperStatus
  newsletter: NewsletterStatus
  telegram: TelegramStatus
  deals: DealStatus
}

interface AgentCard {
  id: string
  name: string
  role: string
  icon: React.FC<any>
  color: string
  status: 'online' | 'offline' | 'partial'
  model: string
  capabilities: string[]
  metrics?: { label: string; value: string | number }[]
}

const MissionControl: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = async () => {
    try {
      const response = await api.get('/api/dashboard/status')
      setData(response.data)
      setLastRefresh(new Date())
    } catch (err: any) {
      console.error('Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    fetchData()
  }

  // Transform data into agent cards
  const agents: AgentCard[] = data ? [
    {
      id: 'server',
      name: 'Server Core',
      role: 'Infrastructure Manager',
      icon: Server,
      color: 'purple',
      status: data.server.status === 'online' ? 'online' : 'offline',
      model: 'Node.js Runtime',
      capabilities: ['API Gateway', 'Load Balancing', 'Session Management'],
      metrics: [
        { label: 'Uptime', value: data.server.uptime },
        { label: 'Memory', value: `${data.server.memory.used}MB / ${data.server.memory.total}MB` },
        { label: 'CPU Load', value: data.server.cpu }
      ]
    },
    {
      id: 'scrapers',
      name: 'Data Hunter',
      role: 'Chief Sourcing Officer',
      icon: Database,
      color: 'blue',
      status: data.scrapers.last24h > 0 ? 'online' : 'partial',
      model: 'Multi-Source Aggregator',
      capabilities: ['Reddit Scraping', 'eBay Monitoring', 'Price Tracking'],
      metrics: [
        { label: 'Total Listings', value: data.scrapers.totalListings.toLocaleString() },
        { label: 'Last 24h', value: `+${data.scrapers.last24h}` },
        { label: 'Sources', value: Object.keys(data.scrapers.sources).length }
      ]
    },
    {
      id: 'newsletter',
      name: 'Email Manager',
      role: 'Communications Director',
      icon: Mail,
      color: 'cyan',
      status: data.newsletter.subscribers > 0 ? 'online' : 'offline',
      model: 'Resend API',
      capabilities: ['Campaign Management', 'Subscriber Growth', 'Analytics'],
      metrics: [
        { label: 'Subscribers', value: data.newsletter.subscribers },
        { label: 'Last Send', value: data.newsletter.lastCampaign ? 'Recently' : 'Never' },
        { label: 'Schedule', value: '8:00 AM daily' }
      ]
    },
    {
      id: 'telegram',
      name: 'Telegram Bot',
      role: 'Social Media Manager',
      icon: MessageCircle,
      color: 'blue-light',
      status: data.telegram.botStatus === 'active' ? 'online' : 'offline',
      model: 'Telegram Bot API',
      capabilities: ['Auto-Posting', 'Deal Alerts', 'Community Engagement'],
      metrics: [
        { label: 'Channel', value: data.telegram.channelId },
        { label: 'Posts Today', value: data.telegram.postsToday },
        { label: 'Scheduled Jobs', value: data.telegram.scheduledJobs }
      ]
    },
    {
      id: 'deals',
      name: 'Deal Analyzer',
      role: 'Intelligence Officer',
      icon: TrendingUp,
      color: 'orange',
      status: data.deals.activeWatchlists > 0 ? 'online' : 'offline',
      model: 'ML Scoring Engine',
      capabilities: ['Price Analysis', 'Hot Deal Detection', 'Alert System'],
      metrics: [
        { label: 'Watchlists', value: data.deals.activeWatchlists },
        { label: 'Hot Deals Today', value: data.deals.hotDealsToday },
        { label: 'Score Threshold', value: '12+' }
      ]
    },
    {
      id: 'empire',
      name: 'Empire Controller',
      role: 'Agent Orchestrator',
      icon: Brain,
      color: 'pink',
      status: 'online',
      model: 'Multi-Agent System',
      capabilities: ['Agent Spawning', 'Task Delegation', 'Coordination'],
      metrics: [
        { label: 'Available Agents', value: 5 },
        { label: 'Active Now', value: 0 },
        { label: 'Tasks Completed', value: 0 }
      ]
    }
  ] : []

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading Mission Control...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Zap className="text-yellow-400" />
              Mission Control
            </h1>
            <p className="text-gray-400 mt-1">The Hub System Status</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Org Chart Layout */}
        <div className="space-y-16">
          {/* Level 1: Core (CEO equivalent) */}
          <div className="flex justify-center">
            <AgentCardComponent
              agent={{
                id: 'jay',
                name: 'Jay',
                role: 'Chief Executive Officer',
                icon: Zap,
                color: 'purple',
                status: 'online',
                model: 'Claude Sonnet 4.5',
                capabilities: ['Strategy', 'Oversight', 'Coordination']
              }}
            />
          </div>

          {/* Connector */}
          <div className="w-0.5 h-16 bg-gradient-to-b from-purple-600/50 to-transparent mx-auto" />

          {/* Level 2: Primary Systems */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {agents.slice(0, 3).map(agent => (
              <AgentCardComponent key={agent.id} agent={agent} />
            ))}
          </div>

          {/* Connector */}
          <div className="w-0.5 h-16 bg-gradient-to-b from-blue-600/50 to-transparent mx-auto" />

          {/* Level 3: Secondary Systems */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {agents.slice(3).map(agent => (
              <AgentCardComponent key={agent.id} agent={agent} />
            ))}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-16 bg-gray-900/30 border border-gray-800 rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-green-400">{agents.filter(a => a.status === 'online').length}</div>
              <div className="text-sm text-gray-400 mt-1">Systems Online</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400">{data?.scrapers.totalListings.toLocaleString() || 0}</div>
              <div className="text-sm text-gray-400 mt-1">Total Listings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">{data?.newsletter.subscribers || 0}</div>
              <div className="text-sm text-gray-400 mt-1">Subscribers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">{data?.deals.hotDealsToday || 0}</div>
              <div className="text-sm text-gray-400 mt-1">Hot Deals Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Agent Card Component
const AgentCardComponent: React.FC<{ agent: AgentCard | any }> = ({ agent }) => {
  const colorMap: Record<string, string> = {
    purple: 'from-purple-600 to-purple-400',
    blue: 'from-blue-600 to-blue-400',
    cyan: 'from-cyan-600 to-cyan-400',
    'blue-light': 'from-blue-500 to-cyan-400',
    orange: 'from-orange-600 to-orange-400',
    green: 'from-green-600 to-green-400',
    pink: 'from-pink-600 to-pink-400'
  }

  const glowMap: Record<string, string> = {
    purple: 'rgba(139, 92, 246, 0.3)',
    blue: 'rgba(59, 130, 246, 0.3)',
    cyan: 'rgba(6, 182, 212, 0.3)',
    'blue-light': 'rgba(59, 130, 246, 0.3)',
    orange: 'rgba(249, 115, 22, 0.3)',
    green: 'rgba(16, 185, 129, 0.3)',
    pink: 'rgba(236, 72, 153, 0.3)'
  }

  const Icon = agent.icon

  return (
    <div
      className="relative bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
      style={{
        boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.1), 0 10px 40px ${glowMap[agent.color] || 'rgba(0, 0, 0, 0.3)'}`,
      }}
    >
      {/* Gradient border on hover */}
      <div 
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${colorMap[agent.color]} -z-10 blur-sm`}
      />
      
      {/* Top gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${colorMap[agent.color]} opacity-60`} />
      
      {/* Status dot */}
      <div className="absolute top-6 right-6">
        <div className={`w-3 h-3 rounded-full ${
          agent.status === 'online' ? 'bg-green-500' :
          agent.status === 'partial' ? 'bg-yellow-500' : 'bg-gray-500'
        } ${agent.status === 'online' ? 'animate-pulse' : ''}`}
          style={{
            boxShadow: agent.status === 'online' ? '0 0 12px rgba(34, 197, 94, 0.8)' : 'none'
          }}
        />
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[agent.color]} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{agent.name}</h3>
          <p className="text-sm text-gray-400 truncate">{agent.role}</p>
        </div>
      </div>

      {/* Model Badge */}
      <div className="mb-4">
        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <Code className="w-3 h-3 mr-2 text-indigo-400" />
          <span className="text-xs text-indigo-300 font-medium">{agent.model}</span>
        </div>
      </div>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-2 mb-4">
        {agent.capabilities?.map((cap: string, i: number) => (
          <span
            key={i}
            className="px-2.5 py-1 rounded-md bg-gray-800/50 border border-gray-700/50 text-xs text-gray-300"
          >
            {cap}
          </span>
        ))}
      </div>

      {/* Metrics */}
      {agent.metrics && (
        <div className="space-y-2 pt-4 border-t border-gray-800">
          {agent.metrics.map((metric: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-gray-400">{metric.label}</span>
              <span className="text-white font-medium">{metric.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MissionControl
