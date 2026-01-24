import React, { useEffect, useState } from 'react'
import { ExternalLink, TrendingUp, Clock, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import clsx from 'clsx'

interface WatchListing {
  id: string
  source: string
  title: string
  price: number
  currency: string
  brand: string
  url: string
  timestamp: string
}

export const RecentListingsWidget: React.FC = () => {
  const [listings, setListings] = useState<WatchListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      const listings = await api.getScraperListings({ limit: 5 })
      setListings(listings)
    } catch (error) {
      console.error('Failed to fetch recent listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'reddit':
        return 'bg-orange-500/10 text-orange-400'
      case 'ebay':
        return 'bg-blue-500/10 text-blue-400'
      case 'watchuseek':
        return 'bg-purple-500/10 text-purple-400'
      default:
        return 'bg-gray-500/10 text-gray-400'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Listings</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-primary-500/30 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-primary-500" />
          Recent Listings
        </h3>
        <Link
          to="/watch-listings"
          className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1 transition-colors"
        >
          View All
          <ExternalLink size={14} />
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-8">
          <Search size={32} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm mb-3">No listings yet</p>
          <Link
            to="/watch-listings"
            className="text-primary-400 hover:text-primary-300 text-sm"
          >
            Start scraping →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <a
              key={listing.id}
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white line-clamp-1 group-hover:text-primary-400 transition-colors">
                    {listing.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span className={clsx('px-2 py-0.5 rounded-full', getSourceBadge(listing.source))}>
                      {listing.source}
                    </span>
                    {listing.brand && (
                      <span className="text-gray-500">• {listing.brand}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatTimestamp(listing.timestamp)}
                    </span>
                  </div>
                </div>
                {listing.price && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-emerald-400">
                      {listing.currency} {listing.price.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
