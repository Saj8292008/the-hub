import React, { useState } from 'react'
import {
  ExternalLink,
  DollarSign,
  MapPin,
  User,
  Clock,
  Star,
  Bell,
  TrendingUp,
  TrendingDown,
  Flame,
  Zap,
  Info
} from 'lucide-react'
import clsx from 'clsx'
import { BaseListing } from '../../types/listings'
import toast from 'react-hot-toast'

interface DealScore {
  score: number
  breakdown?: {
    price: number
    condition: number
    seller: number
    quality: number
    rarity: number
  }
  grade?: string
}

interface ListingWithScore extends BaseListing {
  deal_score?: number
  score_breakdown?: DealScore['breakdown']
}

interface ListingCardProps {
  listing: ListingWithScore
  categoryColor: string
  onTrack?: (listing: ListingWithScore) => void
  onSetAlert?: (listing: ListingWithScore) => void
  onViewDetails?: (listing: ListingWithScore) => void
  showPriceChange?: boolean
  priceChange?: number
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  categoryColor,
  onTrack,
  onSetAlert,
  onViewDetails,
  showPriceChange,
  priceChange
}) => {
  const [isTracked, setIsTracked] = useState(listing.tracked || false)
  const [hasAlert, setHasAlert] = useState(listing.hasAlert || false)

  const handleTrack = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsTracked(!isTracked)
    onTrack?.(listing)
    toast.success(isTracked ? 'Removed from watchlist' : 'Added to watchlist')
  }

  const handleSetAlert = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setHasAlert(!hasAlert)
    onSetAlert?.(listing)
  }

  const getSourceBadge = (source: string | undefined) => {
    if (!source) return 'bg-gray-500/10 text-gray-400 border-gray-500/20'

    switch (source.toLowerCase()) {
      case 'reddit':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'ebay':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'watchuseek':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'autotrader':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
      case 'stockx':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getConditionBadge = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'new':
      case 'mint':
      case 'ds':
        return 'bg-emerald-500/10 text-emerald-400'
      case 'excellent':
      case 'very good':
      case 'vnds':
        return 'bg-blue-500/10 text-blue-400'
      case 'good':
      case 'used':
        return 'bg-yellow-500/10 text-yellow-400'
      default:
        return 'bg-gray-500/10 text-gray-400'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const posted = new Date(timestamp)
    const diffMs = now.getTime() - posted.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Deal Score Badge Component
  const renderDealScoreBadge = () => {
    const score = listing.deal_score
    if (!score || score < 60) return null // Only show for scores >= 60

    const isHotDeal = score >= 90
    const isGoodDeal = score >= 75 && score < 90
    const isFairDeal = score >= 60 && score < 75

    if (isHotDeal) {
      return (
        <div className="absolute top-3 right-3 z-10 group/score">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-50 animate-pulse" />
            <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 text-white font-bold text-xs shadow-lg">
              <Flame size={14} className="animate-pulse" />
              <span>HOT DEAL</span>
            </div>
          </div>
          {renderScoreTooltip(score)}
        </div>
      )
    }

    if (isGoodDeal) {
      return (
        <div className="absolute top-3 right-3 z-10 group/score">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500 text-black font-bold text-xs shadow-lg backdrop-blur-sm">
            <Zap size={14} />
            <span>GOOD DEAL</span>
          </div>
          {renderScoreTooltip(score)}
        </div>
      )
    }

    if (isFairDeal) {
      return (
        <div className="absolute top-3 right-3 z-10 group/score">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500 text-white font-semibold text-xs shadow-lg backdrop-blur-sm">
            <span>{score} / 100</span>
          </div>
          {renderScoreTooltip(score)}
        </div>
      )
    }

    return null
  }

  // Score Breakdown Tooltip
  const renderScoreTooltip = (score: number) => {
    if (!listing.score_breakdown) return null

    const { price, condition, seller, quality, rarity } = listing.score_breakdown

    return (
      <div className="absolute top-full right-0 mt-2 w-64 p-4 rounded-lg bg-gray-900 border border-gray-700 shadow-2xl opacity-0 invisible group-hover/score:opacity-100 group-hover/score:visible transition-all duration-200 pointer-events-none z-20">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-gray-400" />
            <span className="text-sm font-semibold text-white">Deal Score</span>
          </div>
          <span className="text-xl font-bold text-white">{score}</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Price vs Market</span>
            <span className="font-semibold text-white">{price} / 40</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Condition</span>
            <span className="font-semibold text-white">{condition} / 20</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Seller Reputation</span>
            <span className="font-semibold text-white">{seller} / 15</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Listing Quality</span>
            <span className="font-semibold text-white">{quality} / 15</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Rarity/Demand</span>
            <span className="font-semibold text-white">{rarity} / 10</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
          AI-powered deal analysis
        </div>
      </div>
    )
  }

  return (
    <div
      className="group relative bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 cursor-pointer"
      onClick={() => onViewDetails?.(listing)}
    >
      {/* Image Container */}
      <div className="relative h-48 bg-gray-900 overflow-hidden">
        {listing.images && listing.images[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <DollarSign size={48} className="text-gray-700" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm',
              getSourceBadge(listing.source)
            )}
          >
            {listing.source}
          </span>
          {listing.condition && (
            <span
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm',
                getConditionBadge(listing.condition)
              )}
            >
              {listing.condition}
            </span>
          )}
        </div>

        {/* Deal Score Badge */}
        {renderDealScoreBadge()}

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ marginTop: listing.deal_score && listing.deal_score >= 60 ? '3rem' : '0' }}>
          <button
            onClick={handleTrack}
            className={clsx(
              'p-2 rounded-full backdrop-blur-sm transition-all',
              isTracked
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-gray-900/80 text-gray-300 hover:bg-gray-800'
            )}
            title={isTracked ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Star size={16} fill={isTracked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleSetAlert}
            className={clsx(
              'p-2 rounded-full backdrop-blur-sm transition-all',
              hasAlert
                ? `bg-[${categoryColor}] text-white`
                : 'bg-gray-900/80 text-gray-300 hover:bg-gray-800'
            )}
            title="Set price alert"
          >
            <Bell size={16} fill={hasAlert ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Price Change Indicator */}
        {showPriceChange && priceChange !== undefined && priceChange !== 0 && (
          <div
            className={clsx(
              'absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center gap-1',
              priceChange > 0
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            )}
          >
            {priceChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(priceChange).toFixed(1)}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3
          className="font-semibold text-white mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all"
          style={{
            backgroundImage: `linear-gradient(to right, white, ${categoryColor})`
          }}
        >
          {listing.title}
        </h3>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={20} style={{ color: categoryColor }} />
            <span
              className="text-2xl font-bold"
              style={{ color: categoryColor }}
            >
              {listing.currency} {listing.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4 text-sm">
          {listing.seller && (
            <div className="flex items-center gap-2 text-gray-400">
              <User size={14} />
              <span className="truncate">{listing.seller}</span>
            </div>
          )}

          {listing.location && (
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin size={14} />
              <span className="truncate">{listing.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={12} />
            <span className="text-xs">{formatTimeAgo(listing.timestamp)}</span>
          </div>
        </div>

        {/* View Button */}
        <a
          href={listing.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg transition-all font-medium"
          style={{
            backgroundColor: `${categoryColor}15`,
            color: categoryColor,
            border: `1px solid ${categoryColor}30`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${categoryColor}25`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${categoryColor}15`
          }}
        >
          <span>View Listing</span>
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  )
}
