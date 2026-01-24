# 🔌 Integrating Scrapers with The Hub Dashboard

## Quick Integration Examples

### 1. Display Scraped Listings in Dashboard

Create a new React component:

```jsx
// the-hub/src/pages/WatchListings.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface WatchListing {
  id: string;
  source: string;
  title: string;
  price: number;
  currency: string;
  brand: string;
  model: string;
  condition: string;
  url: string;
  images: string[];
  seller: string;
  timestamp: string;
}

export default function WatchListings() {
  const [listings, setListings] = useState<WatchListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ source: '', brand: '', minPrice: '', maxPrice: '' });

  useEffect(() => {
    fetchListings();
  }, [filter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.source) params.append('source', filter.source);
      if (filter.brand) params.append('brand', filter.brand);
      if (filter.minPrice) params.append('minPrice', filter.minPrice);
      if (filter.maxPrice) params.append('maxPrice', filter.maxPrice);
      params.append('limit', '50');

      const response = await axios.get(`http://localhost:3000/scraper/listings?${params}`);
      setListings(response.data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerScrape = async (source: string) => {
    try {
      await axios.post(`http://localhost:3000/scraper/scheduler/run`, { source });
      alert('Scrape started! New listings will appear in a few seconds.');
      setTimeout(fetchListings, 5000); // Refresh after 5 seconds
    } catch (error) {
      alert('Failed to start scrape');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Watch Listings</h1>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <select
          value={filter.source}
          onChange={(e) => setFilter({ ...filter, source: e.target.value })}
          className="p-2 border rounded"
        >
          <option value="">All Sources</option>
          <option value="reddit">Reddit</option>
          <option value="ebay">eBay</option>
          <option value="watchuseek">WatchUSeek</option>
        </select>

        <input
          type="text"
          placeholder="Brand (e.g. Rolex)"
          value={filter.brand}
          onChange={(e) => setFilter({ ...filter, brand: e.target.value })}
          className="p-2 border rounded"
        />

        <input
          type="number"
          placeholder="Min Price"
          value={filter.minPrice}
          onChange={(e) => setFilter({ ...filter, minPrice: e.target.value })}
          className="p-2 border rounded"
        />

        <input
          type="number"
          placeholder="Max Price"
          value={filter.maxPrice}
          onChange={(e) => setFilter({ ...filter, maxPrice: e.target.value })}
          className="p-2 border rounded"
        />
      </div>

      {/* Scrape Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => triggerScrape('reddit')}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Scrape Reddit
        </button>
        <button
          onClick={() => triggerScrape('ebay')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Scrape eBay
        </button>
        <button
          onClick={() => triggerScrape('')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Scrape All
        </button>
      </div>

      {/* Listings */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <div key={listing.id} className="border rounded-lg p-4 hover:shadow-lg transition">
              {/* Image */}
              {listing.images[0] && (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-48 object-cover rounded mb-3"
                />
              )}

              {/* Title */}
              <h3 className="font-semibold mb-2 line-clamp-2">{listing.title}</h3>

              {/* Details */}
              <div className="space-y-1 text-sm mb-3">
                <p>
                  <span className="font-medium">Brand:</span> {listing.brand}
                </p>
                <p>
                  <span className="font-medium">Price:</span> {listing.currency} {listing.price?.toFixed(2) || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Condition:</span> {listing.condition}
                </p>
                <p>
                  <span className="font-medium">Seller:</span> {listing.seller}
                </p>
              </div>

              {/* Source Badge */}
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs ${
                  listing.source === 'reddit' ? 'bg-orange-100 text-orange-800' :
                  listing.source === 'ebay' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {listing.source}
                </span>

                <a
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  View →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {listings.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No listings found. Try scraping some sources!
        </div>
      )}
    </div>
  );
}
```

### 2. Add to Router

```tsx
// the-hub/src/App.tsx
import WatchListings from './pages/WatchListings';

// In your routes:
<Route path="/watch-listings" element={<WatchListings />} />
```

### 3. Add to Navigation

```tsx
// the-hub/src/components/Layout.tsx
<Link to="/watch-listings" className="nav-link">
  Watch Listings
</Link>
```

## Real-Time Updates with WebSocket

```tsx
// the-hub/src/pages/WatchListings.tsx
import { useWebSocket } from '../context/WebSocketContext';

export default function WatchListings() {
  const { socket } = useWebSocket();
  const [listings, setListings] = useState<WatchListing[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for new listings
    socket.on('scraper:newListings', (data) => {
      console.log(`New listings from ${data.source}:`, data.count);
      fetchListings(); // Refresh the list

      // Show toast notification
      toast.success(`${data.count} new listings from ${data.source}!`);
    });

    // Listen for good deals
    socket.on('scraper:goodDeal', (data) => {
      toast.success(`🎯 Good deal alert: ${data.watch}!`);
      // Optionally show a modal with deals
    });

    return () => {
      socket.off('scraper:newListings');
      socket.off('scraper:goodDeal');
    };
  }, [socket]);

  // ... rest of component
}
```

## Search Feature

```tsx
// the-hub/src/components/WatchSearch.tsx
import React, { useState } from 'react';
import axios from 'axios';

export default function WatchSearch() {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/scraper/search', {
        brand,
        model,
        options: {
          reddit: { limit: 10 },
          ebay: { page: 1 }
        }
      });

      setResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Search Across All Sources</h2>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Brand (e.g. Omega)"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Model (e.g. Speedmaster)"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !brand}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {results && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">{results.stats.total}</div>
              <div className="text-gray-600">Total Found</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">${results.stats.priceRange.min}</div>
              <div className="text-gray-600">Lowest Price</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">${results.stats.priceRange.max}</div>
              <div className="text-gray-600">Highest Price</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">
                ${results.stats.priceRange.average?.toFixed(0)}
              </div>
              <div className="text-gray-600">Average Price</div>
            </div>
          </div>

          {/* Results by Source */}
          {Object.entries(results.sources).map(([source, data]: any) => (
            <div key={source} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2 capitalize">{source}: {data.count} listings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.listings.slice(0, 3).map((listing: any) => (
                  <div key={listing.url} className="border p-3 rounded">
                    <div className="font-medium line-clamp-2">{listing.title}</div>
                    <div className="text-lg font-bold mt-2">
                      {listing.currency} {listing.price}
                    </div>
                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 text-sm hover:underline"
                    >
                      View →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Price Alert Widget

```tsx
// the-hub/src/components/PriceAlertWidget.tsx
import React, { useState } from 'react';
import axios from 'axios';

export default function PriceAlertWidget() {
  const [watchlist, setWatchlist] = useState<Array<{brand: string, model: string}>>([]);

  const addToWatchlist = async (brand: string, model: string) => {
    try {
      await axios.post('http://localhost:3000/scraper/watchlist', {
        brand,
        model,
        options: { minPrice: 0 }
      });

      setWatchlist([...watchlist, { brand, model }]);
      toast.success(`Now monitoring ${brand} ${model}`);
    } catch (error) {
      toast.error('Failed to add to watchlist');
    }
  };

  const removeFromWatchlist = async (brand: string, model: string) => {
    try {
      await axios.delete('http://localhost:3000/scraper/watchlist', {
        data: { brand, model }
      });

      setWatchlist(watchlist.filter(w => !(w.brand === brand && w.model === model)));
      toast.success('Removed from watchlist');
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-bold mb-3">Price Alerts</h3>

      {watchlist.length === 0 ? (
        <p className="text-gray-500">No watches being monitored</p>
      ) : (
        <ul className="space-y-2">
          {watchlist.map((watch, i) => (
            <li key={i} className="flex justify-between items-center">
              <span>{watch.brand} {watch.model}</span>
              <button
                onClick={() => removeFromWatchlist(watch.brand, watch.model)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => {
          const brand = prompt('Enter brand:');
          const model = prompt('Enter model:');
          if (brand && model) addToWatchlist(brand, model);
        }}
        className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        + Add Watch
      </button>
    </div>
  );
}
```

## Dashboard Stats Widget

```tsx
// Add to existing Dashboard.tsx
const [scraperStats, setScraperStats] = useState(null);

useEffect(() => {
  // Fetch scraper stats
  axios.get('http://localhost:3000/scraper/stats')
    .then(res => setScraperStats(res.data));
}, []);

// In JSX:
<div className="bg-white p-6 rounded-lg shadow">
  <h3 className="text-lg font-semibold mb-4">Scraper Status</h3>
  {scraperStats && Object.entries(scraperStats).map(([source, stats]: any) => (
    <div key={source} className="mb-3">
      <div className="flex justify-between items-center">
        <span className="capitalize">{source}</span>
        <span className={`px-2 py-1 rounded text-xs ${
          stats.successRate === '100.0%' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {stats.successRate}
        </span>
      </div>
      <div className="text-xs text-gray-500">
        {stats.requests} requests, {stats.successes} successes
      </div>
    </div>
  ))}
</div>
```

---

These examples show how to integrate the scraping framework with your existing React dashboard. The API is ready to use - just call the endpoints and display the data!
