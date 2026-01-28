import React, { useState, useEffect } from 'react'
import { Car, Filter as FilterIcon } from 'lucide-react'
import { CarListing, ViewMode, SortOption } from '../types/listings'
import { ListingCard } from '../components/listings/ListingCard'
import { FilterSidebar, FilterConfig } from '../components/listings/FilterSidebar'
import AISearchBar from '../components/listings/AISearchBar'
import { SortDropdown } from '../components/listings/SortDropdown'
import { ViewToggle } from '../components/listings/ViewToggle'
import api from '../services/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const CATEGORY_COLOR = '#FF6B35' // Burnt Orange

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest Listings' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_desc', label: 'Year: Newest First' },
  { value: 'year_asc', label: 'Year: Oldest First' },
  { value: 'mileage_asc', label: 'Mileage: Lowest First' },
  { value: 'deals', label: 'Best Deals' }
]

const FILTER_CONFIG: FilterConfig[] = [
  {
    type: 'multiselect',
    label: 'Source',
    key: 'sources',
    options: [
      { value: 'autotrader', label: 'AutoTrader' },
      { value: 'cargurus', label: 'CarGurus' },
      { value: 'cars.com', label: 'Cars.com' },
      { value: 'ebay', label: 'eBay Motors' },
      { value: 'reddit', label: 'Reddit' }
    ]
  },
  {
    type: 'multiselect',
    label: 'Make',
    key: 'makes',
    options: [
      { value: 'porsche', label: 'Porsche' },
      { value: 'bmw', label: 'BMW' },
      { value: 'mercedes', label: 'Mercedes-Benz' },
      { value: 'audi', label: 'Audi' },
      { value: 'ferrari', label: 'Ferrari' },
      { value: 'lamborghini', label: 'Lamborghini' },
      { value: 'mclaren', label: 'McLaren' },
      { value: 'tesla', label: 'Tesla' },
      { value: 'toyota', label: 'Toyota' },
      { value: 'honda', label: 'Honda' },
      { value: 'ford', label: 'Ford' },
      { value: 'chevrolet', label: 'Chevrolet' }
    ]
  },
  {
    type: 'range',
    label: 'Price Range',
    key: 'price',
    min: 0,
    max: 500000,
    unit: 'USD'
  },
  {
    type: 'range',
    label: 'Year',
    key: 'year',
    min: 1950,
    max: 2025
  },
  {
    type: 'range',
    label: 'Mileage',
    key: 'mileage',
    min: 0,
    max: 200000,
    unit: 'miles'
  },
  {
    type: 'multiselect',
    label: 'Body Style',
    key: 'bodyStyles',
    options: [
      { value: 'sedan', label: 'Sedan' },
      { value: 'coupe', label: 'Coupe' },
      { value: 'suv', label: 'SUV' },
      { value: 'convertible', label: 'Convertible' },
      { value: 'wagon', label: 'Wagon' },
      { value: 'truck', label: 'Truck' },
      { value: 'hatchback', label: 'Hatchback' }
    ]
  },
  {
    type: 'multiselect',
    label: 'Transmission',
    key: 'transmissions',
    options: [
      { value: 'manual', label: 'Manual' },
      { value: 'automatic', label: 'Automatic' },
      { value: 'cvt', label: 'CVT' }
    ]
  },
  {
    type: 'multiselect',
    label: 'Fuel Type',
    key: 'fuelTypes',
    options: [
      { value: 'gas', label: 'Gasoline' },
      { value: 'diesel', label: 'Diesel' },
      { value: 'electric', label: 'Electric' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'plug-in-hybrid', label: 'Plug-in Hybrid' }
    ]
  },
  {
    type: 'multiselect',
    label: 'Exterior Color',
    key: 'exteriorColors',
    options: [
      { value: 'black', label: 'Black' },
      { value: 'white', label: 'White' },
      { value: 'silver', label: 'Silver' },
      { value: 'gray', label: 'Gray' },
      { value: 'red', label: 'Red' },
      { value: 'blue', label: 'Blue' }
    ]
  },
  {
    type: 'multiselect',
    label: 'Title Status',
    key: 'titleStatus',
    options: [
      { value: 'clean', label: 'Clean' },
      { value: 'salvage', label: 'Salvage' },
      { value: 'rebuilt', label: 'Rebuilt' },
      { value: 'lien', label: 'Lien' }
    ]
  },
  {
    type: 'multiselect',
    label: 'Condition',
    key: 'conditions',
    options: [
      { value: 'new', label: 'New' },
      { value: 'excellent', label: 'Excellent' },
      { value: 'very-good', label: 'Very Good' },
      { value: 'good', label: 'Good' },
      { value: 'fair', label: 'Fair' }
    ]
  },
  {
    type: 'multiselect',
    label: 'Previous Owners',
    key: 'owners',
    options: [
      { value: '1', label: '1 Owner' },
      { value: '2', label: '2 Owners' },
      { value: '3', label: '3 Owners' },
      { value: '4+', label: '4+ Owners' }
    ]
  },
  {
    type: 'checkbox',
    label: 'Service History Available',
    key: 'hasServiceHistory'
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

const Cars: React.FC = () => {
  const [listings, setListings] = useState<CarListing[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('carsViewMode') as ViewMode) || 'grid'
  })
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem('carsSortBy') || 'newest'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('carsRecentSearches')
    return saved ? JSON.parse(saved) : []
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    localStorage.setItem('carsViewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    localStorage.setItem('carsSortBy', sortBy)
  }, [sortBy])

  const fetchListings = async () => {
    try {
      setLoading(true)

      // Call scraper car listings endpoint instead of watchlist
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/scraper/car-listings?limit=100`)
      const data = await response.json()

      // Transform backend data to match frontend interface
      const transformedListings = data.map((car: any) => ({
        ...car,
        source: car.source || 'unknown',
        title: car.title || `${car.make} ${car.model} ${car.year || ''}`.trim(),
        price: car.price || 0,
        currency: car.currency || 'USD',
        url: car.url || '#',
        images: car.images || [],
        timestamp: car.timestamp || car.created_at || new Date().toISOString(),
        created_at: car.created_at || new Date().toISOString(),
        condition: car.condition,
        location: car.location,
        seller: car.seller_name,
        deal_score: car.deal_score,
        score_breakdown: car.score_breakdown
      }))

      setListings(transformedListings as any)
      setTotalItems(transformedListings.length)
      setTotalPages(Math.ceil(transformedListings.length / 50))
    } catch (error) {
      console.error('Failed to fetch listings:', error)
      toast.error('Failed to load car listings')
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
      localStorage.setItem('carsRecentSearches', JSON.stringify(updated))
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

  const handleTrack = async (listing: CarListing) => {
    try {
      await api.addCar({
        make: listing.make,
        model: listing.model,
        year: listing.year,
        targetPrice: listing.price
      })
      toast.success('Added to watchlist!')
    } catch (error) {
      toast.error('Failed to add to watchlist')
    }
  }

  const handleSetAlert = async (listing: CarListing) => {
    toast.success('Alert set! (Modal to be implemented)')
  }

  const handleAISearch = (aiFilters: any, message?: string) => {
    // Convert AI filters to internal filter format
    const convertedFilters: Record<string, any> = {}

    if (aiFilters.make) {
      convertedFilters.makes = [aiFilters.make.toLowerCase().replace(/\s+/g, '-')]
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

    if (aiFilters.year_min) {
      convertedFilters.year_min = aiFilters.year_min
    }

    if (aiFilters.year_max) {
      convertedFilters.year_max = aiFilters.year_max
    }

    if (aiFilters.mileage_max) {
      convertedFilters.mileage_max = aiFilters.mileage_max
    }

    if (aiFilters.body_style) {
      convertedFilters.bodyStyles = [aiFilters.body_style.toLowerCase().replace(/\s+/g, '-')]
    }

    if (aiFilters.transmission) {
      convertedFilters.transmissions = [aiFilters.transmission.toLowerCase()]
    }

    if (aiFilters.fuel_type) {
      convertedFilters.fuelTypes = [aiFilters.fuel_type.toLowerCase().replace(/\s+/g, '-')]
    }

    if (aiFilters.condition) {
      convertedFilters.conditions = [aiFilters.condition.toLowerCase().replace(/\s+/g, '-')]
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
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${CATEGORY_COLOR}20` }}>
            <Car size={28} style={{ color: CATEGORY_COLOR }} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Car Listings</h1>
            <p className="text-gray-400 mt-1">
              {totalItems.toLocaleString()} cars tracked across all sources
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
            category="cars"
            categoryColor={CATEGORY_COLOR}
            placeholder='Try: "porsche 911 under 50k" or "tesla model 3 low mileage"'
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
              <Car size={64} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-2xl font-bold text-white mb-2">No Cars Found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || Object.keys(filters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Start by searching for a specific make or model'}
              </p>
            </div>
          ) : (
            <>
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

export default Cars
