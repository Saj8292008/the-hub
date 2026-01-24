// Shared types for all listing categories

export interface BaseListing {
  id: string
  source: string
  title: string
  price: number
  currency: string
  condition?: string
  location?: string
  url: string
  images: string[]
  seller?: string
  timestamp: string
  created_at: string
  description?: string
  tracked?: boolean
  hasAlert?: boolean
}

export interface WatchListing extends BaseListing {
  brand: string
  model: string
  specificModel?: string
  reference?: string
  caseMaterial?: string
  movement?: string
  caseDiameter?: number
  year?: number
  boxAndPapers?: 'yes' | 'no' | 'unknown'
  certification?: string
  dealerType?: 'dealer' | 'private'
  shippingCost?: number
}

export interface CarListing extends BaseListing {
  make: string
  model: string
  year: number
  mileage: number
  vin?: string
  transmission?: 'manual' | 'automatic' | 'cvt'
  fuelType?: 'gas' | 'diesel' | 'electric' | 'hybrid'
  bodyStyle?: string
  exteriorColor?: string
  interiorColor?: string
  titleStatus?: 'clean' | 'salvage' | 'rebuilt'
  owners?: number
  hasServiceHistory?: boolean
  accidentHistory?: boolean
}

export interface SneakerListing extends BaseListing {
  brand: string
  model: string
  colorway?: string
  size: number
  styleCode?: string
  releaseYear?: number
  retailPrice?: number
  stockXPrice?: number
  isAuthentic?: boolean
}

export interface Game {
  id: string
  league: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  status: 'scheduled' | 'live' | 'finished'
  startTime: string
  quarter?: string
  timeRemaining?: string
  spread?: number
  overUnder?: number
  moneyline?: {
    home: number
    away: number
  }
  venue?: string
}

export interface FilterOptions {
  sources: string[]
  brands: string[]
  conditions: string[]
  priceRange: [number, number]
  [key: string]: any
}

export interface SortOption {
  value: string
  label: string
  icon?: React.ReactNode
}

export type ViewMode = 'grid' | 'list'

export interface PaginationInfo {
  total: number
  page: number
  pages: number
  limit: number
}

export interface ListingsResponse<T = BaseListing> {
  items: T[]
  total: number
  page: number
  pages: number
  filters: FilterOptions
}
