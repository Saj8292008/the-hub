import React, { useEffect, useState } from 'react'
import {
  Target,
  CheckCircle2,
  Circle,
  Clock,
  Lightbulb,
  RefreshCw,
  Search,
  Brain,
  FileText,
  Users,
  Pause,
  Bell,
  ChevronDown,
  Calendar,
  ArrowRight
} from 'lucide-react'
import api from '../services/api'

interface Goal {
  id: string
  name: string
  status: 'done' | 'in-progress' | 'blocked' | 'todo'
  notes: string
  completedAt?: string
}

interface Project {
  id: string
  name: string
  emoji: string
  status: string
  priority: string
  description: string
  vision?: string
  eta?: string
  goals: Goal[]
  nextUp: string[]
  lastCompleted?: string
  nextTask?: string
}

interface ProjectsData {
  lastUpdated: string
  updatedBy: string
  projects: Project[]
  ideas: { id: string; name: string; category: string; priority: string; notes: string }[]
  recentCompletions: { date: string; project: string; what: string }[]
  weeklyGoals: { week: string; goals: { name: string; done: boolean }[] }
}

const Projects: React.FC = () => {
  const [data, setData] = useState<ProjectsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('projects')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = async () => {
    try {
      const response = await api.get('/api/projects')
      setData(response.data)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      'done': { bg: 'bg-green-500/20', text: 'text-green-400', label: '✓ Complete' },
      'in-progress': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '● In Progress' },
      'blocked': { bg: 'bg-red-500/20', text: 'text-red-400', label: '⚠ Blocked' },
      'live': { bg: 'bg-green-500/20', text: 'text-green-400', label: '✓ Live' },
      'active': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '● In Progress' },
      'research': { bg: 'bg-purple-500/20', text: 'text-purple-400', label: '◉ Research Done' },
      'design': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: '◉ Design Done' },
      'architecture': { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '◉ Architecture Done' }
    }
    return config[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', label: status }
  }

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, string> = {
      'high': 'bg-red-600 text-white',
      'medium': 'bg-yellow-600 text-white',
      'low': 'bg-gray-600 text-white'
    }
    return config[priority] || 'bg-gray-600 text-white'
  }

  const getLastCompleted = (project: Project) => {
    const doneGoals = project.goals.filter(g => g.status === 'done')
    if (doneGoals.length === 0) return 'No completed tasks yet'
    return doneGoals[doneGoals.length - 1]?.name || 'No completed tasks yet'
  }

  const getNextTask = (project: Project) => {
    const pendingGoals = project.goals.filter(g => g.status !== 'done')
    if (pendingGoals.length === 0 && project.nextUp.length === 0) return 'No upcoming tasks'
    return pendingGoals[0]?.name || project.nextUp[0] || 'No upcoming tasks'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-800 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-800/50 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#0d0d20]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Tabs */}
            <div className="flex items-center gap-1">
              {[
                { id: 'projects', icon: Target, label: 'Projects' },
                { id: 'memory', icon: Brain, label: 'Memory' },
                { id: 'docs', icon: FileText, label: 'Docs' },
                { id: 'people', icon: Users, label: 'People' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-gray-800 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white transition-colors">
                <Pause className="w-4 h-4" />
                Pause
              </button>
              <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
                <Bell className="w-4 h-4" />
                Ping Jay
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search projects, tasks, memory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {activeTab === 'projects' && (
          <>
            {/* Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.projects.map(project => {
                const statusConfig = getStatusBadge(project.status)
                const completedCount = project.goals.filter(g => g.status === 'done').length
                const totalCount = project.goals.length
                
                return (
                  <div 
                    key={project.id}
                    className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
                  >
                    {/* Card Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      </div>

                      <h3 className="text-xl font-semibold text-white mb-2">
                        {project.emoji} {project.name}
                      </h3>
                      
                      <p className="text-gray-400 text-sm leading-relaxed mb-4">
                        <span className="text-gray-500">Vision:</span> {project.description}
                      </p>

                      {/* Tags */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(project.priority)}`}>
                          {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                        </span>
                        {project.eta && (
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300">
                            ETA {project.eta}
                          </span>
                        )}
                        {totalCount > 0 && (
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300">
                            {completedCount}/{totalCount} tasks
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="border-t border-gray-800 bg-gray-900/30 px-5 py-4 space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Completed</div>
                        <div className="text-sm text-gray-300">{getLastCompleted(project)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next Task</div>
                        <div className="text-sm text-gray-300 flex items-center gap-2">
                          {getNextTask(project)}
                          {getNextTask(project) !== 'No upcoming tasks' && (
                            <ArrowRight className="w-3 h-3 text-blue-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Ideas Section */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Ideas Backlog
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.ideas.map(idea => (
                  <div key={idea.id} className="p-4 bg-gray-900/30 border border-gray-800 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-white text-sm">{idea.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs ${getPriorityBadge(idea.priority)}`}>
                        {idea.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{idea.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Goals */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Weekly Goals
                <span className="text-sm text-gray-500 font-normal ml-2">{data.weeklyGoals.week}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {data.weeklyGoals.goals.map((goal, i) => (
                  <div 
                    key={i}
                    className={`p-3 rounded-lg border ${
                      goal.done 
                        ? 'bg-green-900/20 border-green-800/50' 
                        : 'bg-gray-900/30 border-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {goal.done 
                        ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        : <Circle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      }
                      <span className={`text-sm ${goal.done ? 'text-gray-400 line-through' : 'text-white'}`}>
                        {goal.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'memory' && (
          <div className="text-center py-20 text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Memory search coming soon...</p>
            <p className="text-sm mt-2">View MEMORY.md and daily logs</p>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="text-center py-20 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Documentation coming soon...</p>
          </div>
        )}

        {activeTab === 'people' && (
          <div className="text-center py-20 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>People/Contacts coming soon...</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 py-4 text-center text-gray-500 text-sm">
        Updated by {data.updatedBy} • {new Date(data.lastUpdated).toLocaleString()}
      </div>
    </div>
  )
}

export default Projects
