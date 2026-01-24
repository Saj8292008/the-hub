import React, { useEffect, useState } from 'react'
import {
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  DollarSign,
  MapPin,
  User,
  Clock,
  Target,
  Play,
  Sparkles
} from 'lucide-react'
import api from '../services/api'
import { useWebSocket } from '../context/WebSocketContext'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface WatchListing {
  id: string
  source: string
  title: string
  price: number
  currency: string
  brand: string
  model: string
  condition: string
  location: string
  url: string
  images: string[]
  seller: string
  timestamp: string
  created_at: string
}

interface FilterState {
  source: string
  brand: string
  minPrice: string
  maxPrice: string
  condition: string
}

const WatchListings: React.FC = () => {
  const [listings, setListings] = useState<WatchListing[]>([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterState>({
    source: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    condition: ''
  })
  const [searchQuery, setSearchQuery] = useState({ brand: '', model: '' })
  const [stats, setStats] = useState<any>(null)

  const { socket } = useWebSocket()

  // Fetch listings
  const fetchListings = async () => {
    try {
      const listings = await api.getScraperListings({
        source: filter.source || undefined,
        brand: filter.brand || undefined,
        minPrice: filter.minPrice || undefined,
        maxPrice: filter.maxPrice || undefined,
        limit: 50
      })
      setListings(listings)
    } catch (error) {
      console.error('Failed to fetch listings:', error)
      toast.error('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  // Fetch scraper stats
  const fetchStats = async () => {
    try {
      const stats = await api.getScraperStats()
      setStats(stats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  // Trigger scrape
  const triggerScrape = async (source: string) => {
    setScraping(source)
    try {
      await api.triggerScrape(source || undefined)
      toast.success(`Started scraping ${source || 'all sources'}!`)
      setTimeout(() => {
        fetchListings()
        setScraping(null)
      }, 5000)
    } catch (error) {
      toast.error('Failed to start scrape')
      setScraping(null)
    }
  }

  // Search all sources
  const searchAllSources = async () => {
    if (!searchQuery.brand) {
      toast.error('Please enter a brand name')
      return
    }

    setScraping('search')
    try {
      const result = await api.searchWatches(
        searchQuery.brand,
        searchQuery.model,
        {
          reddit: { limit: 10 },
          ebay: { page: 1 }
        }
      )

      toast.success(`Found ${result.stats.total} listings!`)

      // Add to existing listings
      const newListings = result.allListings
      setListings(prev => [...newListings, ...prev])

    } catch (error) {
      toast.error('Search failed')
    } finally {
      setScraping(null)
    }
  }

  // WebSocket listeners
  useEffect(() => {
    if (!socket) return

    socket.on('scraper:newListings', (data: any) => {
      toast.success(`${data.count} new listings from ${data.source}!`)
      fetchListings()
    })

    socket.on('scraper:goodDeal', (data: any) => {
      toast.success(`🎯 Good deal found: ${data.watch}!`, { duration: 6000 })
    })

    return () => {
      socket.off('scraper:newListings')
      socket.off('scraper:goodDeal')
    }
  }, [socket])

  useEffect(() => {
    fetchListings()
    fetchStats()
  }, [filter])

  // Source badge color
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'reddit':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'ebay':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'watchuseek':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  // Condition badge color
  const getConditionBadge = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'new':
      case 'mint':
        return 'bg-emerald-500/10 text-emerald-400'
      case 'excellent':
      case 'very good':
        return 'bg-blue-500/10 text-blue-400'
      case 'good':
        return 'bg-yellow-500/10 text-yellow-400'
      default:
        return 'bg-gray-500/10 text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Watch Listings</h1>
          <p className="text-gray-400 mt-1">Scraped from multiple sources in real-time</p>
        </div>
        <button
          onClick={() => fetchListings()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Scraper Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats).map(([source, data]: [string, any]) => (
            <div key={source} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold capitalize text-white">{source}</h3>
                <span className={clsx(
                  'text-xs px-2 py-1 rounded-full',
                  data.successRate === '100.0%' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
                )}>
                  {data.successRate}
                </span>
              </div>
              <div className="text-sm text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Requests:</span>
                  <span className="text-white">{data.requests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Successes:</span>
                  <span className="text-emerald-400">{data.successes}</span>
                </div>
                {data.failures > 0 && (
                  <div className="flex justify-between">
                    <span>Failures:</span>
                    <span className="text-red-400">{data.failures}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Search size={18} />
          Search Across All Sources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Brand (e.g. Rolex)"
            value={searchQuery.brand}
            onChange={(e) => setSearchQuery({ ...searchQuery, brand: e.target.value })}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Model (e.g. Submariner)"
            value={searchQuery.model}
            onChange={(e) => setSearchQuery({ ...searchQuery, model: e.target.value })}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
          />
          <button
            onClick={searchAllSources}
            disabled={scraping === 'search' || !searchQuery.brand}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {scraping === 'search' ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search size={16} />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scrape Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => triggerScrape('reddit')}
          disabled={scraping !== null}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {scraping === 'reddit' ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
          Scrape Reddit
        </button>
        <button
          onClick={() => triggerScrape('ebay')}
          disabled={scraping !== null}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {scraping === 'ebay' ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
          Scrape eBay
        </button>
        <button
          onClick={() => triggerScrape('')}
          disabled={scraping !== null}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {scraping === '' ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Scrape All Sources
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Filter size={18} />
          Filters
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select
            value={filter.source}
            onChange={(e) => setFilter({ ...filter, source: e.target.value })}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
          >
            <option value="">All Sources</option>
            <option value="reddit">Reddit</option>
            <option value="ebay">eBay</option>
            <option value="watchuseek">WatchUSeek</option>
          </select>

          <input
            type="text"
            placeholder="Brand"
            value={filter.brand}
            onChange={(e) => setFilter({ ...filter, brand: e.target.value })}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
          />

          <input
            type="number"
            placeholder="Min Price"
            value={filter.minPrice}
            onChange={(e) => setFilter({ ...filter, minPrice: e.target.value })}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
          />

          <input
            type="number"
            placeholder="Max Price"
            value={filter.maxPrice}
            onChange={(e) => setFilter({ ...filter, maxPrice: e.target.value })}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
          />

          <button
            onClick={() => setFilter({ source: '', brand: '', minPrice: '', maxPrice: '', condition: '' })}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 animate-pulse">
              <div className="w-full h-48 bg-gray-700 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
          <Target size={48} className="mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold text-white mb-2">No Listings Found</h3>
          <p className="text-gray-400 mb-6">
            Try scraping some sources or adjusting your filters
          </p>
          <button
            onClick={() => triggerScrape('reddit')}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Scrape Reddit Now
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              Showing {listings.length} listing{listings.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-primary-500/50 transition-colors group"
              >
                {/* Image */}
                {listing.images && listing.images[0] ? (
                  <div className="relative h-48 bg-gray-900">
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image'
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className={clsx('px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm', getSourceBadge(listing.source))}>
                        {listing.source}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 bg-gray-900 flex items-center justify-center">
                    <Target size={48} className="text-gray-700" />
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  {/* Title */}
                  <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
                    {listing.title}
                  </h3>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    {listing.brand && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Brand:</span>
                        <span className="text-gray-300">{listing.brand}</span>
                      </div>
                    )}

                    {listing.price && (
                      <div className="flex items-center gap-2 text-lg font-bold">
                        <DollarSign size={18} className="text-emerald-400" />
                        <span className="text-emerald-400">
                          {listing.currency} {listing.price.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {listing.condition && (
                      <div className="flex items-center gap-2">
                        <span className={clsx('px-2 py-1 rounded-full text-xs', getConditionBadge(listing.condition))}>
                          {listing.condition}
                        </span>
                      </div>
                    )}

                    {listing.seller && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <User size={14} />
                        <span>{listing.seller}</span>
                      </div>
                    )}

                    {listing.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin size={14} />
                        <span>{listing.location}</span>
                      </div>
                    )}

                    {listing.timestamp && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>{new Date(listing.timestamp).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* View Button */}
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    <span>View Listing</span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default WatchListings
