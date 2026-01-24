import React, { useState, useEffect } from 'react'
import { Footprints } from 'lucide-react'
import { SneakerListing, ViewMode, SortOption } from '../types/listings'
import { ListingCard } from '../components/listings/ListingCard'
import { FilterSidebar, FilterConfig } from '../components/listings/FilterSidebar'
import { SearchBar } from '../components/listings/SearchBar'
import { SortDropdown } from '../components/listings/SortDropdown'
import { ViewToggle } from '../components/listings/ViewToggle'
import api from '../services/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const CATEGORY_COLOR = '#00D9FF' // Cyan

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'size', label: 'By Size' },
  { value: 'resale_value', label: 'Best Resale Value' }
]

const FILTER_CONFIG: FilterConfig[] = [
  {
    type: 'multiselect',
    label: 'Brand',
    key: 'brands',
    options: [
      { value: 'nike', label: 'Nike' },
      { value: 'jordan', label: 'Jordan' },
      { value: 'adidas', label: 'Adidas' },
      { value: 'yeezy', label: 'Yeezy' },
      { value: 'new-balance', label: 'New Balance' },
      { value: 'asics', label: 'ASICS' },
      { value: 'puma', label: 'Puma' }
    ]
  },
  {
    type: 'range',
    label: 'Price Range',
    key: 'price',
    min: 0,
    max: 5000,
    unit: 'USD'
  },
  {
    type: 'multiselect',
    label: 'Size (US)',
    key: 'sizes',
    options: [
      { value: '7', label: 'US 7' },
      { value: '7.5', label: 'US 7.5' },
      { value: '8', label: 'US 8' },
      { value: '8.5', label: 'US 8.5' },
      { value: '9', label: 'US 9' },
      { value: '9.5', label: 'US 9.5' },
      { value: '10', label: 'US 10' },
      { value: '10.5', label: 'US 10.5' },
      { value: '11', label: 'US 11' },
      { value: '11.5', label: 'US 11.5' },
      { value: '12', label: 'US 12' },
      { value: '13', label: 'US 13' }
    ]
  },
  {
    type: 'multiselect',
    label: 'Condition',
    key: 'conditions',
    options: [
      { value: 'ds', label: 'Deadstock (DS/New)' },
      { value: 'vnds', label: 'Very Near Deadstock (VNDS)' },
      { value: 'used', label: 'Used' }
    ]
  },
  {
    type: 'multiselect',
    label: 'Model',
    key: 'models',
    options: [
      { value: 'air-jordan-1', label: 'Air Jordan 1' },
      { value: 'dunk-low', label: 'Dunk Low' },
      { value: 'yeezy-350', label: 'Yeezy 350' },
      { value: 'travis-scott', label: 'Travis Scott' },
      { value: 'air-max', label: 'Air Max' }
    ]
  },
  {
    type: 'checkbox',
    label: 'Authenticity Guarantee',
    key: 'isAuthentic'
  },
  {
    type: 'range',
    label: 'Release Year',
    key: 'year',
    min: 2010,
    max: 2026
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

const Sneakers: React.FC = () => {
  const [listings, setListings] = useState<SneakerListing[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('sneakersViewMode') as ViewMode) || 'grid'
  })
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem('sneakersSortBy') || 'newest'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('sneakersRecentSearches')
    return saved ? JSON.parse(saved) : []
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    localStorage.setItem('sneakersViewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    localStorage.setItem('sneakersSortBy', sortBy)
  }, [sortBy])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const response = await api.getSneakers()
      setListings(response as any)
      setTotalItems(response.length)
      setTotalPages(Math.ceil(response.length / 50))
    } catch (error) {
      console.error('Failed to fetch listings:', error)
      toast.error('Failed to load sneaker listings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [page, sortBy, searchQuery, filters])

  useEffect(() => {
    if (searchQuery && !recentSearches.includes(searchQuery)) {
      const updated = [searchQuery, ...recentSearches].slice(0, 10)
      setRecentSearches(updated)
      localStorage.setItem('sneakersRecentSearches', JSON.stringify(updated))
    }
  }, [searchQuery])

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters({})
    setPage(1)
  }

  const handleTrack = async (listing: SneakerListing) => {
    try {
      await api.addSneaker({
        brand: listing.brand,
        model: listing.model,
        size: listing.size,
        targetPrice: listing.price
      })
      toast.success('Added to watchlist!')
    } catch (error) {
      toast.error('Failed to add to watchlist')
    }
  }

  const handleSetAlert = async (listing: SneakerListing) => {
    toast.success('Alert set! (Modal to be implemented)')
  }

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${CATEGORY_COLOR}20` }}>
            <Footprints size={28} style={{ color: CATEGORY_COLOR }} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Sneaker Listings</h1>
            <p className="text-gray-400 mt-1">
              {totalItems.toLocaleString()} sneakers from trusted sellers
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by model, colorway, or style code..."
            categoryColor={CATEGORY_COLOR}
            recentSearches={recentSearches}
            onRecentSearchClick={setSearchQuery}
          />
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

      <div className="flex gap-6">
        <FilterSidebar
          filters={FILTER_CONFIG}
          activeFilters={filters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearFilters}
          categoryColor={CATEGORY_COLOR}
          isOpen={isFilterOpen}
          onToggle={() => setIsFilterOpen(!isFilterOpen)}
        />

        <div className="flex-1">
          {loading ? (
            <div className={clsx('grid gap-6', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-700"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
              <Footprints size={64} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-2xl font-bold text-white mb-2">No Sneakers Found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || Object.keys(filters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Start by searching for your favorite sneakers'}
              </p>
            </div>
          ) : (
            <div className={clsx('grid gap-6', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
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
          )}
        </div>
      </div>
    </div>
  )
}

export default Sneakers
