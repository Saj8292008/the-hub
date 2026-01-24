import React, { useState, useEffect } from 'react'
import { Trophy, RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Game } from '../types/listings'
import api from '../services/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const CATEGORY_COLOR = '#00FF88' // Neon Green

const LEAGUES = [
  { value: 'all', label: 'All Leagues' },
  { value: 'nfl', label: 'NFL' },
  { value: 'nba', label: 'NBA' },
  { value: 'mlb', label: 'MLB' },
  { value: 'nhl', label: 'NHL' },
  { value: 'mls', label: 'MLS' }
]

const Sports: React.FC = () => {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeague, setSelectedLeague] = useState('all')
  const [tab, setTab] = useState<'live' | 'upcoming' | 'finished'>('live')
  const [refreshing, setRefreshing] = useState(false)

  const fetchGames = async () => {
    try {
      setLoading(true)
      const league = selectedLeague === 'all' ? undefined : selectedLeague
      const response = await api.getScores(league)
      setGames(response.games || [])
    } catch (error) {
      console.error('Failed to fetch games:', error)
      toast.error('Failed to load sports data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGames()
  }, [selectedLeague])

  // Auto-refresh live games every 30 seconds
  useEffect(() => {
    if (tab === 'live') {
      const interval = setInterval(() => {
        fetchGames()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [tab])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchGames()
    setRefreshing(false)
    toast.success('Scores updated!')
  }

  const filterGamesByStatus = (status: Game['status']) => {
    return games.filter((game) => game.status === status)
  }

  const liveGames = filterGamesByStatus('live')
  const upcomingGames = filterGamesByStatus('scheduled')
  const finishedGames = filterGamesByStatus('finished')

  const GameCard: React.FC<{ game: Game }> = ({ game }) => {
    const isLive = game.status === 'live'
    const isFinished = game.status === 'finished'

    return (
      <div
        className={clsx(
          'bg-gray-800/50 border rounded-xl p-6 transition-all hover:border-gray-600',
          isLive ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'border-gray-700'
        )}
      >
        {/* League Badge */}
        <div className="flex items-center justify-between mb-4">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold uppercase"
            style={{
              backgroundColor: `${CATEGORY_COLOR}20`,
              color: CATEGORY_COLOR
            }}
          >
            {game.league}
          </span>
          {isLive && (
            <div className="flex items-center gap-2 text-emerald-400">
              <Activity size={16} className="animate-pulse" />
              <span className="text-sm font-semibold">LIVE</span>
            </div>
          )}
          {game.quarter && (
            <span className="text-sm text-gray-400">{game.quarter}</span>
          )}
        </div>

        {/* Teams and Scores */}
        <div className="space-y-3 mb-4">
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-semibold text-white">{game.awayTeam}</div>
              {game.venue && <div className="text-xs text-gray-500">{game.venue}</div>}
            </div>
            <div
              className={clsx(
                'text-3xl font-bold ml-4',
                isLive || isFinished ? 'text-white' : 'text-gray-600'
              )}
            >
              {isLive || isFinished ? game.awayScore : '-'}
            </div>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-semibold text-white">{game.homeTeam}</div>
            </div>
            <div
              className={clsx(
                'text-3xl font-bold ml-4',
                isLive || isFinished ? 'text-white' : 'text-gray-600'
              )}
            >
              {isLive || isFinished ? game.homeScore : '-'}
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="border-t border-gray-700 pt-4">
          {game.status === 'scheduled' && (
            <div className="text-sm text-gray-400">
              {new Date(game.startTime).toLocaleString()}
            </div>
          )}
          {game.timeRemaining && (
            <div className="text-sm text-gray-400">Time: {game.timeRemaining}</div>
          )}
          {game.spread !== undefined && (
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
              <div>Spread: {game.spread > 0 ? '+' : ''}{game.spread}</div>
              {game.overUnder && <div>O/U: {game.overUnder}</div>}
            </div>
          )}
          {game.moneyline && (
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
              <div className="flex items-center gap-1">
                <TrendingUp size={12} />
                Home: {game.moneyline.home > 0 ? '+' : ''}{game.moneyline.home}
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown size={12} />
                Away: {game.moneyline.away > 0 ? '+' : ''}{game.moneyline.away}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${CATEGORY_COLOR}20` }}>
              <Trophy size={28} style={{ color: CATEGORY_COLOR }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Sports Scores</h1>
              <p className="text-gray-400 mt-1">Live scores and upcoming games</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* League Filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {LEAGUES.map((league) => (
          <button
            key={league.value}
            onClick={() => setSelectedLeague(league.value)}
            className={clsx(
              'px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap',
              selectedLeague === league.value
                ? 'text-white shadow-lg'
                : 'text-gray-400 bg-gray-800 border border-gray-700 hover:bg-gray-700'
            )}
            style={
              selectedLeague === league.value
                ? { backgroundColor: `${CATEGORY_COLOR}30`, color: CATEGORY_COLOR }
                : {}
            }
          >
            {league.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setTab('live')}
          className={clsx(
            'px-6 py-3 font-medium transition-all relative',
            tab === 'live' ? 'text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          Live {liveGames.length > 0 && `(${liveGames.length})`}
          {tab === 'live' && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: CATEGORY_COLOR }}
            />
          )}
        </button>
        <button
          onClick={() => setTab('upcoming')}
          className={clsx(
            'px-6 py-3 font-medium transition-all relative',
            tab === 'upcoming' ? 'text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          Upcoming {upcomingGames.length > 0 && `(${upcomingGames.length})`}
          {tab === 'upcoming' && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: CATEGORY_COLOR }}
            />
          )}
        </button>
        <button
          onClick={() => setTab('finished')}
          className={clsx(
            'px-6 py-3 font-medium transition-all relative',
            tab === 'finished' ? 'text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          Finished {finishedGames.length > 0 && `(${finishedGames.length})`}
          {tab === 'finished' && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: CATEGORY_COLOR }}
            />
          )}
        </button>
      </div>

      {/* Games Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-700 rounded w-16 mb-4"></div>
              <div className="space-y-3">
                <div className="h-8 bg-gray-700 rounded"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {tab === 'live' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveGames.length > 0 ? (
                liveGames.map((game) => <GameCard key={game.id} game={game} />)
              ) : (
                <div className="col-span-full bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
                  <Activity size={48} className="mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Live Games</h3>
                  <p className="text-gray-400">Check back later for live scores</p>
                </div>
              )}
            </div>
          )}

          {tab === 'upcoming' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingGames.length > 0 ? (
                upcomingGames.map((game) => <GameCard key={game.id} game={game} />)
              ) : (
                <div className="col-span-full bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
                  <Trophy size={48} className="mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Upcoming Games</h3>
                  <p className="text-gray-400">No scheduled games at the moment</p>
                </div>
              )}
            </div>
          )}

          {tab === 'finished' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {finishedGames.length > 0 ? (
                finishedGames.map((game) => <GameCard key={game.id} game={game} />)
              ) : (
                <div className="col-span-full bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
                  <Trophy size={48} className="mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Finished Games</h3>
                  <p className="text-gray-400">No completed games yet</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Sports
