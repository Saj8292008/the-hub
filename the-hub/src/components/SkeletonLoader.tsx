import React from 'react'

export const SkeletonCard: React.FC = () => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 w-24 bg-gray-800 rounded animate-shimmer"></div>
          <div className="h-12 w-12 bg-gray-800 rounded-xl animate-shimmer"></div>
        </div>

        {/* Value */}
        <div className="h-10 w-20 bg-gray-800 rounded mb-6 animate-shimmer"></div>

        {/* Badge */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-16 bg-gray-800 rounded-full animate-shimmer"></div>
          <div className="h-4 w-24 bg-gray-800 rounded animate-shimmer"></div>
        </div>
      </div>
    </div>
  )
}

export const SkeletonAlert: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-800/50 bg-gray-900/50 p-4">
      <div className="animate-pulse">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-3">
            {/* Badge */}
            <div className="h-5 w-20 bg-gray-800 rounded animate-shimmer"></div>
            {/* Title */}
            <div className="h-4 w-3/4 bg-gray-800 rounded animate-shimmer"></div>
            {/* Detail */}
            <div className="h-3 w-full bg-gray-800 rounded animate-shimmer"></div>
            {/* Timestamp */}
            <div className="h-3 w-20 bg-gray-800 rounded animate-shimmer"></div>
          </div>
          <div className="h-8 w-8 bg-gray-800 rounded-lg animate-shimmer"></div>
        </div>
      </div>
    </div>
  )
}

export const SkeletonWatchlistItem: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-800/50 bg-gray-900/50 p-4">
      <div className="animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-gray-800 rounded animate-shimmer"></div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-20 bg-gray-800 rounded animate-shimmer"></div>
              <div className="h-3 w-16 bg-gray-800 rounded animate-shimmer"></div>
            </div>
          </div>
          <div className="h-8 w-20 bg-gray-800 rounded-xl animate-shimmer"></div>
        </div>
      </div>
    </div>
  )
}

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="animate-pulse flex items-center gap-4">
          <div className="h-4 w-1/4 bg-gray-800 rounded animate-shimmer"></div>
          <div className="h-4 w-1/4 bg-gray-800 rounded animate-shimmer"></div>
          <div className="h-4 w-1/4 bg-gray-800 rounded animate-shimmer"></div>
          <div className="h-4 w-1/4 bg-gray-800 rounded animate-shimmer"></div>
        </div>
      ))}
    </div>
  )
}
