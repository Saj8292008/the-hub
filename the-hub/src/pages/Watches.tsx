import React, { useState, useEffect } from 'react'
import { Watch, Filter as FilterIcon } from 'lucide-react'
import { WatchListing, ViewMode, SortOption } from '../types/listings'
import { ListingCard } from '../components/listings/ListingCard'
import { FilterSidebar, FilterConfig } from '../components/listings/FilterSidebar'
import AISearchBar from '../components/listings/AISearchBar'
import { SortDropdown } from '../components/listings/SortDropdown'
import { ViewToggle } from '../components/listings/ViewToggle'
import api from '../services/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const CATEGORY_COLOR = '#D4AF37' // Gold

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'deals', label: 'Best Deals' }
]

const FILTER_CONFIG: FilterConfig[] = [
  {
    type: 'multiselect',
    label: 'Source',
    key: 'sources',
    options: [
      { value: 'reddit', label: 'Reddit' },
      { value: 'ebay', label: 'eBay' },
      { value: 'watchuseek', label: 'WatchUSeek' },
      { value: 'chrono24', label: 'Chrono24' }
    ]
  },
  {
    type: 'multiselect',
    label: 'Brand',
    key: 'brands',
    options: [
      { value: 'rolex', label: 'Rolex' },
      { value: 'omega', label: 'Omega' },
      { value: 'seiko', label: 'Seiko' },
      { value: 'tudor', label: 'Tudor' },
      { value: 'tag-heuer', label: 'TAG Heuer' },
      { value: 'breitling', label: 'Breitling' },
      { value: 'cartier', label: 'Cartier' },
      { value: 'iwc', label: 'IWC' }
    ]
  },
  {
    type: 'range',
    label: 'Price Range',
    key: 'price',
    min: 0,
    max: 100000,
    unit: 'USD'
  },
  {
    type: 'multiselect',
    label: 'Condition',
    key: 'conditions',
    options: [
      { value: 'new', label: 'New' },
      { value: 'excellent', label: 'Excellent' },
      { value: 'very-good', label: 'Very Good' },
      { value: 'good', label: 'Good' }
    ]
  },
  {
    type: 'multiselect',
    label: 'Movement',
    key: 'movements',
    options: [
      { value: 'automatic', label: 'Automatic' },
      { value: 'manual', label: 'Manual' },
      { value: 'quartz', label: 'Quartz' }
    ]
  },
  {
    type: 'multiselect',
    label: 'Case Material',
    key: 'materials',
    options: [
      { value: 'steel', label: 'Stainless Steel' },
      { value: 'gold', label: 'Gold' },
      { value: 'rose-gold', label: 'Rose Gold' },
      { value: 'titanium', label: 'Titanium' },
      { value: 'ceramic', label: 'Ceramic' }
    ]
  },
  {
    type: 'range',
    label: 'Case Diameter',
    key: 'diameter',
    min: 28,
    max: 50,
    unit: 'mm'
  },
  {
    type: 'select',
    label: 'Box & Papers',
    key: 'boxPapers',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'unknown', label: 'Unknown' }
    ]
  },
  {
    type: 'select',
    label: 'Seller Type',
    key: 'sellerType',
    options: [
      { value: 'dealer', label: 'Dealer' },
      { value: 'private', label: 'Private Seller' }
    ]
  },
  {
    type: 'date',
    label: 'Date Posted',
    key: 'datePosted',
    options: [
      { value: '24h', label: 'Last 24 hours' },
      { value: '7d', label: 'Last 7 days' },
      { value: '30d', label: 'Last 30 days' }
    ]
  }
]

const Watches: React.FC = () => {
  const [listings, setListings] = useState<WatchListing[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('watchesViewMode') as ViewMode) || 'grid'
  })
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem('watchesSortBy') || 'newest'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('watchesRecentSearches')
    return saved ? JSON.parse(saved) : []
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('watchesViewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    localStorage.setItem('watchesSortBy', sortBy)
  }, [sortBy])

  // Fetch listings
  const fetchListings = async () => {
    try {
      setLoading(true)

      // Build query params
      const params: Record<string, any> = {
        page,
        limit: 50,
        sort: sortBy
      }

      if (searchQuery) params.search = searchQuery
      if (filters.sources?.length) params.source = filters.sources.join(',')
      if (filters.brands?.length) params.brand = filters.brands.join(',')
      if (filters.price_min) params.minPrice = filters.price_min
      if (filters.price_max) params.maxPrice = filters.price_max
      if (filters.conditions?.length) params.condition = filters.conditions.join(',')
      if (filters.movements?.length) params.movement = filters.movements.join(',')
      if (filters.materials?.length) params.material = filters.materials.join(',')
      if (filters.diameter_min) params.minDiameter = filters.diameter_min
      if (filters.diameter_max) params.maxDiameter = filters.diameter_max
      if (filters.boxPapers) params.boxPapers = filters.boxPapers
      if (filters.sellerType) params.sellerType = filters.sellerType
      if (filters.datePosted) params.datePosted = filters.datePosted

      const response = await api.getScraperListings(params)

      // Transform backend data to match frontend interface
      const transformedListings = response.map((watch: any) => ({
        ...watch,
        source: Array.isArray(watch.sources) && watch.sources.length > 0
          ? watch.sources[0]
          : watch.source || 'unknown',
        title: watch.title || `${watch.brand} ${watch.model}`,
        price: watch.price || watch.currentPrice || 0,
        currency: watch.currency || 'USD',
        url: watch.url || '#',
        images: watch.images || [],
        timestamp: watch.timestamp || watch.created_at || new Date().toISOString(),
        created_at: watch.created_at || new Date().toISOString()
      }))

      setListings(transformedListings)

      // Mock pagination data (update when API supports it)
      setTotalItems(transformedListings.length)
      setTotalPages(Math.ceil(transformedListings.length / 50))

    } catch (error) {
      console.error('Failed to fetch listings:', error)
      toast.error('Failed to load watch listings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [page, sortBy, searchQuery, filters])

  // Save search to recent
  useEffect(() => {
    if (searchQuery && !recentSearches.includes(searchQuery)) {
      const updated = [searchQuery, ...recentSearches].slice(0, 10)
      setRecentSearches(updated)
      localStorage.setItem('watchesRecentSearches', JSON.stringify(updated))
    }
  }, [searchQuery])

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }))
    setPage(1) // Reset to first page on filter change
  }

  const handleClearFilters = () => {
    setFilters({})
    setPage(1)
  }

  const handleTrack = async (listing: WatchListing) => {
    try {
      // Add to watchlist via API
      await api.addWatch({
        brand: listing.brand,
        model: listing.model,
        specificModel: listing.specificModel,
        targetPrice: listing.price
      })
      toast.success('Added to watchlist!')
    } catch (error) {
      toast.error('Failed to add to watchlist')
    }
  }

  const handleSetAlert = async (listing: WatchListing) => {
    // Open alert modal (to be implemented)
    toast.success('Alert set! (Modal to be implemented)')
  }

  const handleAISearch = (aiFilters: any, message?: string) => {
    // Convert AI filters to internal filter format
    const convertedFilters: Record<string, any> = {}

    if (aiFilters.brand) {
      convertedFilters.brands = [aiFilters.brand.toLowerCase().replace(/\s+/g, '-')]
    }

    if (aiFilters.model) {
      setSearchQuery(aiFilters.model)
    } else {
      setSearchQuery('')
    }

    if (aiFilters.price_min) {
      convertedFilters.price_min = aiFilters.price_min
    }

    if (aiFilters.price_max) {
      convertedFilters.price_max = aiFilters.price_max
    }

    if (aiFilters.condition) {
      convertedFilters.conditions = [aiFilters.condition.toLowerCase().replace(/\s+/g, '-')]
    }

    if (aiFilters.box_and_papers) {
      convertedFilters.boxPapers = 'yes'
    }

    if (aiFilters.year_min || aiFilters.year_max) {
      // Years would need additional filter support
      // For now, add to search query
      if (aiFilters.year_min) {
        setSearchQuery((prev) => `${prev} ${aiFilters.year_min}`.trim())
      }
    }

    if (aiFilters.material) {
      const materialMap: Record<string, string> = {
        steel: 'steel',
        'stainless steel': 'steel',
        gold: 'gold',
        'rose gold': 'rose-gold',
        titanium: 'titanium',
        ceramic: 'ceramic'
      }
      const normalized = materialMap[aiFilters.material.toLowerCase()] || aiFilters.material.toLowerCase()
      convertedFilters.materials = [normalized]
    }

    setFilters(convertedFilters)
    setPage(1)

    if (message) {
      toast.success(message, { duration: 5000 })
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${CATEGORY_COLOR}20` }}
          >
            <Watch size={28} style={{ color: CATEGORY_COLOR }} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Watch Listings</h1>
            <p className="text-gray-400 mt-1">
              {totalItems.toLocaleString()} watches tracked across all sources
            </p>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg"
          >
            <FilterIcon size={18} />
            <span>Filters</span>
            {Object.keys(filters).length > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-xs"
                style={{
                  backgroundColor: `${CATEGORY_COLOR}30`,
                  color: CATEGORY_COLOR
                }}
              >
                {Object.keys(filters).length}
              </span>
            )}
          </button>

          {/* AI Search Bar */}
          <AISearchBar
            category="watches"
            categoryColor={CATEGORY_COLOR}
            placeholder='Try: "rolex submariner under 10k" or "omega speedmaster with box and papers"'
            onSearch={handleAISearch}
          />

          {/* Sort and View Controls */}
          <div className="flex gap-3">
            <SortDropdown
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={setSortBy}
              categoryColor={CATEGORY_COLOR}
            />
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              categoryColor={CATEGORY_COLOR}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Filter Sidebar */}
        <FilterSidebar
          filters={FILTER_CONFIG}
          activeFilters={filters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearFilters}
          categoryColor={CATEGORY_COLOR}
          isOpen={isFilterOpen}
          onToggle={() => setIsFilterOpen(!isFilterOpen)}
        />

        {/* Listings Grid/List */}
        <div className="flex-1">
          {loading ? (
            <div
              className={clsx(
                'grid gap-6',
                viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              )}
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-gray-700"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
              <Watch size={64} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-2xl font-bold text-white mb-2">No Watches Found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || Object.keys(filters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Start by searching for a specific watch or brand'}
              </p>
              {(searchQuery || Object.keys(filters).length > 0) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    handleClearFilters()
                  }}
                  className="px-6 py-3 rounded-lg font-medium"
                  style={{
                    backgroundColor: `${CATEGORY_COLOR}20`,
                    color: CATEGORY_COLOR,
                    border: `1px solid ${CATEGORY_COLOR}40`
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                className={clsx(
                  'grid gap-6',
                  viewMode === 'grid'
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                )}
              >
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    categoryColor={CATEGORY_COLOR}
                    onTrack={handleTrack}
                    onSetAlert={handleSetAlert}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Watches
