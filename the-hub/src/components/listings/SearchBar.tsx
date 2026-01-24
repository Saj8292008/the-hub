import React, { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import clsx from 'clsx'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  categoryColor: string
  debounceMs?: number
  recentSearches?: string[]
  onRecentSearchClick?: (search: string) => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  categoryColor,
  debounceMs = 300,
  recentSearches = [],
  onRecentSearchClick
}) => {
  const [localValue, setLocalValue] = useState(value)
  const [showRecent, setShowRecent] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      onChange(localValue)
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [localValue, debounceMs, onChange])

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Click outside to close recent searches
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowRecent(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    inputRef.current?.focus()
  }

  const handleRecentClick = (search: string) => {
    setLocalValue(search)
    onChange(search)
    setShowRecent(false)
    onRecentSearchClick?.(search)
  }

  const filteredRecentSearches = recentSearches.filter(
    (search) =>
      search.toLowerCase().includes(localValue.toLowerCase()) && search !== localValue
  )

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search size={20} className="text-gray-500" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setShowRecent(true)}
          placeholder={placeholder}
          className={clsx(
            'w-full pl-12 pr-12 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 transition-all focus:outline-none',
            'focus:border-gray-500 focus:ring-2 focus:ring-opacity-20'
          )}
          style={{
            '--tw-ring-color': `${categoryColor}33`
          } as React.CSSProperties}
        />

        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Recent Searches Dropdown */}
      {showRecent && filteredRecentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2">
            <div className="text-xs text-gray-500 px-3 py-2 uppercase tracking-wider">
              Recent Searches
            </div>
            <div className="space-y-1">
              {filteredRecentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentClick(search)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Search size={14} className="text-gray-500" />
                  <span>{search}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
