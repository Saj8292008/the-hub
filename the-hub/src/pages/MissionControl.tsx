import React, { useEffect, useState } from 'react'
import {
  Activity,
  Server,
  Database,
  Mail,
  MessageCircle,
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  RefreshCw,
  Zap,
  TrendingUp,
  Eye,
  Send,
  Brain,
  Calendar,
  FileText,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import api from '../services/api'

interface ServerStatus {
  status: string
  uptime: string
  uptimeSeconds: number
  startedAt: string
  memory: {
    used: number
    total: number
    percent: number
  }
  cpu: string
  nodeVersion: string
  platform: string
}

interface ScraperSource {
  lastRun: string | null
  status: string
}

interface ScraperStatus {
  sources: Record<string, ScraperSource>
  totalListings: number
  last24h: number
}

interface NewsletterStatus {
  subscribers: number
  lastCampaign: {
    name: string
    sentAt: string
    sent: number
    status: string
  } | null
  nextScheduled: string
}

interface TelegramStatus {
  botStatus: string
  channelId: string
  postsToday: number
  scheduledJobs: number
}

interface DealStatus {
  activeWatchlists: number
  hotDealsToday: number
}

interface ActivityItem {
  type: string
  title: string
  source: string
  price: number
  score: number
  timestamp: string
}

interface DailyNote {
  date: string
  content: string
  preview: string
}

interface MemoryData {
  dailyNotes: DailyNote[]
  allDays: string[]
  mainMemory: string
}

interface DashboardData {
  timestamp: string
  server: ServerStatus
  scrapers: ScraperStatus
  newsletter: NewsletterStatus
  telegram: TelegramStatus
  deals: DealStatus
  activity: ActivityItem[]
  errors: string[]
}

const MissionControl: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  // Memory state
  const [memoryData, setMemoryData] = useState<MemoryData | null>(null)
  const [memoryExpanded, setMemoryExpanded] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [noteCategory, setNoteCategory] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteSuccess, setNoteSuccess] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [dayContent, setDayContent] = useState<string>('')

  const fetchData = async () => {
    try {
      const response = await api.get('/api/dashboard/status')
      setData(response.data)
      setLastRefresh(new Date())
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchMemory = async () => {
    try {
      const response = await api.get('/api/dashboard/memory')
      setMemoryData(response.data)
    } catch (err: any) {
      console.error('Failed to fetch memory:', err)
    }
  }

  const fetchDayContent = async (date: string) => {
    try {
      const response = await api.get(`/api/dashboard/memory/${date}`)
      setDayContent(response.data.content)
      setSelectedDay(date)
    } catch (err: any) {
      console.error('Failed to fetch day:', err)
    }
  }

  const saveNote = async () => {
    if (!newNote.trim()) return
    setNoteSaving(true)
    try {
      await api.post('/api/dashboard/memory/note', {
        note: newNote,
        category: noteCategory || undefined
      })
      setNewNote('')
      setNoteCategory('')
      setNoteSuccess(true)
      setTimeout(() => setNoteSuccess(false), 3000)
      fetchMemory() // Refresh memory data
    } catch (err: any) {
      console.error('Failed to save note:', err)
    } finally {
      setNoteSaving(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchMemory()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    fetchData()
  }

  const formatTime = (isoString: string) => {
    if (!isoString) return 'Never'
    const date = new Date(isoString)
    return date.toLocaleString()
  }

  const getTimeAgo = (isoString: string) => {
    if (!isoString) return 'Never'
    const date = new Date(isoString)
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-800 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Zap className="text-yellow-400" />
              Mission Control
            </h1>
            <p className="text-gray-400 mt-1">The Hub System Status</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {data && (
          <>
            {/* Status Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Server Status */}
              <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold">Server</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    data.server.status === 'online' 
                      ? 'bg-green-900/50 text-green-400' 
                      : 'bg-red-900/50 text-red-400'
                  }`}>
                    {data.server.status.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Uptime</span>
                    <span className="text-white">{data.server.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory</span>
                    <span className="text-white">{data.server.memory.used}MB / {data.server.memory.total}MB</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        data.server.memory.percent > 80 ? 'bg-red-500' : 
                        data.server.memory.percent > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${data.server.memory.percent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Scrapers Status */}
              <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold">Scrapers</span>
                  </div>
                  <span className="text-purple-400 font-bold">{data.scrapers.totalListings.toLocaleString()}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last 24h</span>
                    <span className="text-green-400">+{data.scrapers.last24h}</span>
                  </div>
                  <div className="space-y-1 mt-3">
                    {Object.entries(data.scrapers.sources).map(([name, info]) => (
                      <div key={name} className="flex justify-between items-center">
                        <span className="text-gray-400 capitalize">{name}</span>
                        <span className={`text-xs ${info.lastRun ? 'text-green-400' : 'text-gray-500'}`}>
                          {info.lastRun ? getTimeAgo(info.lastRun) : 'Never'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Newsletter Status */}
              <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-cyan-400" />
                    <span className="font-semibold">Newsletter</span>
                  </div>
                  <span className="text-cyan-400 font-bold">{data.newsletter.subscribers}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subscribers</span>
                    <span className="text-white">{data.newsletter.subscribers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Send</span>
                    <span className="text-white">
                      {data.newsletter.lastCampaign?.sentAt 
                        ? getTimeAgo(data.newsletter.lastCampaign.sentAt)
                        : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next</span>
                    <span className="text-white">{data.newsletter.nextScheduled}</span>
                  </div>
                </div>
              </div>

              {/* Telegram Status */}
              <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">Telegram</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    data.telegram.botStatus === 'active' 
                      ? 'bg-green-900/50 text-green-400' 
                      : 'bg-yellow-900/50 text-yellow-400'
                  }`}>
                    {data.telegram.botStatus.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Channel</span>
                    <span className="text-white">{data.telegram.channelId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Posts Today</span>
                    <span className="text-white">{data.telegram.postsToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scheduled Jobs</span>
                    <span className="text-white">{data.telegram.scheduledJobs}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Row - Deals & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Deal Stats */}
              <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-orange-400" />
                  <span className="font-semibold">Deal Alerts</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-900 rounded-lg">
                    <div className="text-3xl font-bold text-orange-400">{data.deals.activeWatchlists}</div>
                    <div className="text-sm text-gray-400">Active Watchlists</div>
                  </div>
                  <div className="text-center p-4 bg-gray-900 rounded-lg">
                    <div className="text-3xl font-bold text-green-400">{data.deals.hotDealsToday}</div>
                    <div className="text-sm text-gray-400">Hot Deals Today</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-gray-800 rounded-lg p-5 border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span className="font-semibold">Recent Activity</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.activity.length > 0 ? (
                    data.activity.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-900 rounded-lg text-sm">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            item.source === 'reddit' ? 'bg-orange-900/50 text-orange-400' :
                            item.source === 'ebay' ? 'bg-blue-900/50 text-blue-400' :
                            'bg-purple-900/50 text-purple-400'
                          }`}>
                            {item.source}
                          </span>
                          <span className="text-gray-300 truncate max-w-xs">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.price && (
                            <span className="text-green-400">${item.price.toLocaleString()}</span>
                          )}
                          {item.score && item.score > 0 && (
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              item.score >= 20 ? 'bg-red-900/50 text-red-400' :
                              item.score >= 10 ? 'bg-yellow-900/50 text-yellow-400' :
                              'bg-gray-700 text-gray-400'
                            }`}>
                              {item.score}🔥
                            </span>
                          )}
                          <span className="text-gray-500 text-xs">{getTimeAgo(item.timestamp)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">No recent activity</div>
                  )}
                </div>
              </div>
            </div>

            {/* Jay's Memory Section */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              {/* Header */}
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-750"
                onClick={() => setMemoryExpanded(!memoryExpanded)}
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-pink-400" />
                  <div>
                    <h2 className="font-semibold text-lg">Jay's Memory</h2>
                    <p className="text-sm text-gray-400">Quick notes & recent context</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {memoryData && (
                    <span className="text-sm text-gray-500">
                      {memoryData.allDays.length} days logged
                    </span>
                  )}
                  {memoryExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {memoryExpanded && memoryData && (
                <div className="border-t border-gray-700 p-5 space-y-5">
                  {/* Quick Note Input */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Plus className="w-4 h-4 text-pink-400" />
                      <span className="text-sm font-medium">Add a note for Jay to remember</span>
                    </div>
                    <div className="space-y-3">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Type something you want Jay to remember..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-pink-500"
                        rows={3}
                      />
                      <div className="flex items-center gap-3">
                        <select
                          value={noteCategory}
                          onChange={(e) => setNoteCategory(e.target.value)}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                        >
                          <option value="">No category</option>
                          <option value="business">Business</option>
                          <option value="personal">Personal</option>
                          <option value="idea">Idea</option>
                          <option value="todo">To-Do</option>
                          <option value="reminder">Reminder</option>
                        </select>
                        <button
                          onClick={saveNote}
                          disabled={noteSaving || !newNote.trim()}
                          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                            noteSaving || !newNote.trim()
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-pink-600 hover:bg-pink-500 text-white'
                          }`}
                        >
                          {noteSaving ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Save Note
                            </>
                          )}
                        </button>
                        {noteSuccess && (
                          <span className="text-green-400 text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Saved!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Daily Notes */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Daily Notes List */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-medium">Recent Daily Notes</span>
                      </div>
                      <div className="space-y-2">
                        {memoryData.dailyNotes.map((note) => (
                          <div
                            key={note.date}
                            onClick={() => fetchDayContent(note.date)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedDay === note.date
                                ? 'bg-cyan-900/30 border border-cyan-600'
                                : 'bg-gray-900 hover:bg-gray-850 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{note.date}</span>
                              <FileText className="w-4 h-4 text-gray-500" />
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-2">
                              {note.preview.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 2).join(' ')}
                            </p>
                          </div>
                        ))}
                        {memoryData.allDays.length > 3 && (
                          <p className="text-xs text-gray-500 text-center mt-2">
                            + {memoryData.allDays.length - 3} more days
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Day Content Viewer */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium">
                          {selectedDay ? `Notes for ${selectedDay}` : 'Select a day to view'}
                        </span>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto">
                        {selectedDay ? (
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                            {dayContent}
                          </pre>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                            Click a date to view that day's notes
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* System Info Footer */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  <span>CPU: {data.server.cpu}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  <span>Node {data.server.nodeVersion}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Started: {formatTime(data.server.startedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>All Systems Operational</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MissionControl
