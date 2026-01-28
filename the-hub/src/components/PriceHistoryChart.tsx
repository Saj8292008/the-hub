/**
 * Price History Chart Component
 * Displays price trends over time using Chart.js
 */

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  RefreshCw,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface PriceData {
  date: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  count: number;
}

interface Stats {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  trend: string;
  volatility: number;
}

interface PriceHistoryChartProps {
  brand?: string;
  model?: string;
  category?: string;
  initialDays?: number;
  compact?: boolean;
}

export default function PriceHistoryChart({
  brand,
  model,
  category = 'watch',
  initialDays = 90,
  compact = false
}: PriceHistoryChartProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PriceData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [days, setDays] = useState(initialDays);
  const [searchBrand, setSearchBrand] = useState(brand || '');
  const [searchModel, setSearchModel] = useState(model || '');

  useEffect(() => {
    if (brand || searchBrand) {
      fetchPriceHistory();
    }
  }, [brand, model, category, days]);

  const fetchPriceHistory = async (customBrand?: string, customModel?: string) => {
    const b = customBrand || brand || searchBrand;
    if (!b) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        brand: b,
        category,
        days: days.toString()
      });
      
      const m = customModel || model || searchModel;
      if (m) params.append('model', m);

      const res = await fetch(`${API_URL}/api/price-history?${params}`, {
        credentials: 'include'
      });
      
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setHistory(data.history || []);
      setStats(data.stats);

      if (!data.history?.length) {
        setError('No price history found for this item');
      }
    } catch (err) {
      setError('Failed to load price history');
      console.error('Price history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchBrand.trim()) {
      toast.error('Please enter a brand name');
      return;
    }
    fetchPriceHistory(searchBrand, searchModel);
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'rising_fast':
      case 'rising':
        return <TrendingUp className="text-green-400" size={20} />;
      case 'falling_fast':
      case 'falling':
        return <TrendingDown className="text-red-400" size={20} />;
      default:
        return <Minus className="text-gray-400" size={20} />;
    }
  };

  const getTrendLabel = (trend?: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      rising_fast: { text: 'Rising Fast', color: 'text-green-400' },
      rising: { text: 'Rising', color: 'text-green-400' },
      falling_fast: { text: 'Falling Fast', color: 'text-red-400' },
      falling: { text: 'Falling', color: 'text-red-400' },
      stable: { text: 'Stable', color: 'text-gray-400' },
      insufficient_data: { text: 'Limited Data', color: 'text-yellow-400' }
    };
    return labels[trend || 'stable'] || labels.stable;
  };

  // Chart configuration
  const chartData = {
    labels: history.map(h => new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Average Price',
        data: history.map(h => h.avgPrice),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: compact ? 0 : 3,
        pointHoverRadius: 6
      },
      {
        label: 'Min Price',
        data: history.map(h => h.minPrice),
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
        hidden: compact
      },
      {
        label: 'Max Price',
        data: history.map(h => h.maxPrice),
        borderColor: '#EF4444',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
        hidden: compact
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        display: !compact,
        position: 'top' as const,
        labels: {
          color: '#9CA3AF',
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F3F4F6',
        bodyColor: '#D1D5DB',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => `${context.dataset.label}: $${context.raw.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        ticks: {
          color: '#9CA3AF',
          maxTicksLimit: compact ? 5 : 10
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        ticks: {
          color: '#9CA3AF',
          callback: (value: number) => `$${value.toLocaleString()}`
        }
      }
    }
  };

  // Render search form if no brand provided
  const renderSearchForm = () => (
    <form onSubmit={handleSearch} className="flex gap-2 mb-4">
      <input
        type="text"
        value={searchBrand}
        onChange={e => setSearchBrand(e.target.value)}
        placeholder="Brand (e.g., Rolex)"
        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
      />
      <input
        type="text"
        value={searchModel}
        onChange={e => setSearchModel(e.target.value)}
        placeholder="Model (optional)"
        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
      >
        Search
      </button>
    </form>
  );

  const trendInfo = getTrendLabel(stats?.trend);

  return (
    <div className={`bg-gray-800/30 rounded-xl border border-gray-700 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`font-bold flex items-center gap-2 ${compact ? 'text-lg' : 'text-xl'}`}>
            <TrendingUp className="text-purple-400" size={compact ? 20 : 24} />
            Price History
          </h3>
          {(brand || searchBrand) && stats && (
            <p className="text-sm text-gray-400 mt-1">
              {brand || searchBrand} {model || searchModel || ''} • {stats.count} sales tracked
            </p>
          )}
        </div>
        
        {!compact && (
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={e => setDays(parseInt(e.target.value))}
              className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </select>
            <button
              onClick={() => fetchPriceHistory()}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
      </div>

      {/* Search form if no brand */}
      {!brand && renderSearchForm()}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <AlertCircle size={48} className="mb-4 opacity-50" />
          <p>{error}</p>
          {!brand && (
            <p className="text-sm mt-2">Try searching for a different brand or model</p>
          )}
        </div>
      )}

      {/* Chart */}
      {!loading && !error && history.length > 0 && (
        <>
          <div className={`${compact ? 'h-48' : 'h-72'}`}>
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* Stats */}
          {stats && !compact && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  ${stats.avg.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mt-1">Average</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  ${stats.min.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mt-1">Lowest</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  ${stats.max.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mt-1">Highest</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  ${stats.median.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mt-1">Median</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold flex items-center justify-center gap-2 ${trendInfo.color}`}>
                  {getTrendIcon(stats.trend)}
                  {trendInfo.text}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {stats.volatility}% volatility
                </div>
              </div>
            </div>
          )}

          {/* Compact stats */}
          {stats && compact && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700 text-sm">
              <div className="text-gray-400">
                Avg: <span className="text-white font-medium">${stats.avg.toLocaleString()}</span>
              </div>
              <div className={`flex items-center gap-1 ${trendInfo.color}`}>
                {getTrendIcon(stats.trend)}
                <span>{trendInfo.text}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
