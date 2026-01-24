import React, { useState, useEffect } from 'react'
import { Car } from 'lucide-react'
import { CarListing, ViewMode, SortOption } from '../types/listings'
import { ListingCard } from '../components/listings/ListingCard'
import { FilterSidebar, FilterConfig } from '../components/listings/FilterSidebar'
import { SearchBar } from '../components/listings/SearchBar'
import { SortDropdown } from '../components/listings/SortDropdown'
import { ViewToggle } from '../components/listings/ViewToggle'
import api from '../services/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const CATEGORY_COLOR = '#FF6B35' // Burnt Orange

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_desc', label: 'Year: Newest First' },
  { value: 'year_asc', label: 'Year: Oldest First' },
  { value: 'mileage_asc', label: 'Mileage: Low to High' }
]

const FILTER_CONFIG: FilterConfig[] = [
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
      { value: 'tesla', label: 'Tesla' }
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
    min: 1980,
    max: 2026
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
      { value: 'truck', label: 'Truck' }
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
      { value: 'hybrid', label: 'Hybrid' }
    ]
  },
  {
    type: 'checkbox',
    label: 'Clean Title Only',
    key: 'cleanTitle'
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
      const response = await api.getCars()
      setListings(response as any)
      setTotalItems(response.length)
      setTotalPages(Math.ceil(response.length / 50))
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

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${CATEGORY_COLOR}20` }}>
            <Car size={28} style={{ color: CATEGORY_COLOR }} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Car Listings</h1>
            <p className="text-gray-400 mt-1">
              {totalItems.toLocaleString()} cars tracked from premium dealers
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by make, model, or keywords..."
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
              <Car size={64} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-2xl font-bold text-white mb-2">No Cars Found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || Object.keys(filters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Start by searching for a specific make or model'}
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

export default Cars
