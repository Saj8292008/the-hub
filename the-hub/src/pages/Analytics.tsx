import React, { useEffect, useState } from 'react'
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
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { TrendingUp, TrendingDown, DollarSign, Watch, Car, Footprints, BarChart3, Target, Activity, Wallet, Sparkles } from 'lucide-react'
import api from '../services/api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface PriceHistoryItem {
  checked_at: string
  price: number
  source: string
}

const Analytics: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([])
  const [watches, setWatches] = useState<any[]>([])
  const [cars, setCars] = useState<any[]>([])
  const [sneakers, setSneakers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const [watchesData, carsData, sneakersData] = await Promise.all([
        api.getWatches(),
        api.getCars(),
        api.getSneakers()
      ])

      setWatches(watchesData)
      setCars(carsData)
      setSneakers(sneakersData)

      // Auto-select first item with price data
      if (watchesData.length > 0) {
        selectItem('watch', watchesData[0])
      } else if (carsData.length > 0) {
        selectItem('car', carsData[0])
      } else if (sneakersData.length > 0) {
        selectItem('sneaker', sneakersData[0])
      }
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectItem = async (type: string, item: any) => {
    setSelectedItem({ ...item, type })

    try {
      const history = await api.getPriceHistory(type, item.id, 30)
      setPriceHistory(history)
    } catch (error) {
      console.error('Failed to fetch price history:', error)
      setPriceHistory([])
    }
  }

  const chartData = {
    labels: priceHistory.map(h => new Date(h.checked_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Price',
        data: priceHistory.map(h => h.price),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      selectedItem?.targetPrice && {
        label: 'Target Price',
        data: priceHistory.map(() => selectedItem.targetPrice || selectedItem.target_price),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'transparent',
        borderDash: [8, 4],
        pointRadius: 0,
        tension: 0,
        borderWidth: 2
      }
    ].filter(Boolean)
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#d1d5db',
          font: {
            size: 13,
            weight: 'bold' as const
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += '$' + context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(55, 65, 81, 0.2)',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(55, 65, 81, 0.2)',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11
          },
          callback: function(value: any) {
            return '$' + value.toLocaleString()
          }
        }
      }
    }
  }

  const allItems = [
    ...watches.map(w => ({ ...w, type: 'watch', icon: Watch })),
    ...cars.map(c => ({ ...c, type: 'car', icon: Car })),
    ...sneakers.map(s => ({ ...s, type: 'sneaker', icon: Footprints }))
  ]

  const currentPrice = selectedItem?.currentPrice || selectedItem?.current_price
  const targetPrice = selectedItem?.targetPrice || selectedItem?.target_price
  const priceChange = priceHistory.length >= 2
    ? ((priceHistory[priceHistory.length - 1].price - priceHistory[0].price) / priceHistory[0].price) * 100
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-primary-500/20 rounded-full"></div>
            <BarChart3 className="relative animate-pulse text-primary-400" size={40} />
          </div>
          <p className="text-gray-300 font-medium">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Analytics
            </h2>
            <BarChart3 className="text-primary-400" size={28} />
          </div>
          <p className="text-gray-400 mt-2 text-lg">
            Price trends and historical data • {allItems.length} items tracked
          </p>
        </div>
      </header>

      {allItems.length === 0 ? (
        <div className="rounded-2xl border border-gray-800/50 bg-gray-900/60 p-12 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-800/50 mb-4">
            <BarChart3 className="text-gray-600" size={32} />
          </div>
          <p className="text-gray-400 text-lg">No items tracked yet</p>
          <p className="text-gray-600 text-sm mt-2">Use the Telegram bot to add items!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          {/* Items Selector Sidebar */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-4 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="text-primary-400" size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Select Item</h3>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {allItems.map((item) => {
                  const Icon = item.icon
                  const name = item.name ||
                    (item.type === 'watch' ? `${item.brand} ${item.model}` :
                     item.type === 'car' ? `${item.make} ${item.model} ${item.year}` :
                     `${item.brand} ${item.model}`)

                  const isSelected = selectedItem?.id === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => selectItem(item.type, item)}
                      className={`group relative w-full text-left px-3 py-3 rounded-xl transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25 scale-105'
                          : 'text-gray-300 hover:bg-gray-800/50 hover:scale-102'
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-white/20' : 'bg-gray-800'
                      }`}>
                        <Icon size={16} className={isSelected ? 'text-white' : 'text-gray-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold truncate block">{name}</span>
                        <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
                          {item.type}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="flex h-2 w-2">
                          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Analytics */}
          <div className="xl:col-span-3 space-y-6">
            {/* Stats Cards */}
            {selectedItem && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="group relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm transition-all hover:border-blue-500/30 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                        <DollarSign size={16} className="text-blue-400" />
                      </div>
                      <span className="font-semibold uppercase tracking-wider">Current Price</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {currentPrice ? `$${currentPrice.toLocaleString()}` : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm transition-all hover:border-emerald-500/30 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                        <Target size={16} className="text-emerald-400" />
                      </div>
                      <span className="font-semibold uppercase tracking-wider">Target Price</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {targetPrice ? `$${targetPrice.toLocaleString()}` : 'Not set'}
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm transition-all hover:scale-105">
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    priceChange >= 0
                      ? 'from-rose-500/10 to-orange-500/10'
                      : 'from-emerald-500/10 to-teal-500/10'
                  } opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        priceChange >= 0 ? 'bg-rose-500/20' : 'bg-emerald-500/20'
                      }`}>
                        {priceChange >= 0 ? (
                          <TrendingUp size={16} className="text-rose-400" />
                        ) : (
                          <TrendingDown size={16} className="text-emerald-400" />
                        )}
                      </div>
                      <span className="font-semibold uppercase tracking-wider">Price Change</span>
                    </div>
                    <div className={`text-3xl font-bold ${
                      priceChange >= 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Portfolio Value & Deal Savings - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Portfolio Value Over Time */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Wallet className="text-blue-400" size={20} />
                        Portfolio Value
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">Total value of tracked items</p>
                    </div>
                  </div>

                  {/* Value Chart Mockup */}
                  <div className="h-48 rounded-xl bg-gray-900/30 p-4 mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-end justify-around p-4 gap-2">
                      {/* Chart bars */}
                      {[65, 70, 68, 75, 72, 78, 82].map((height, idx) => (
                        <div key={idx} className="flex-1 flex flex-col justify-end group">
                          <div
                            className="w-full rounded-t-lg bg-gradient-to-t from-blue-500/40 to-blue-400/60 transition-all duration-300 group-hover:from-blue-500/60 group-hover:to-blue-400/80"
                            style={{ height: `${height}%` }}
                          >
                            <div className="w-full h-1 bg-blue-400 rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Overlay text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">$127,450</div>
                        <div className="flex items-center justify-center gap-1.5 text-sm">
                          <TrendingUp className="text-emerald-400" size={16} />
                          <span className="text-emerald-400 font-semibold">+12.5%</span>
                          <span className="text-gray-500">this month</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="text-gray-400">Watches</span>
                      </div>
                      <span className="font-semibold text-white">$85,200 (67%)</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                        <span className="text-gray-400">Cars</span>
                      </div>
                      <span className="font-semibold text-white">$35,750 (28%)</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <span className="text-gray-400">Sneakers</span>
                      </div>
                      <span className="font-semibold text-white">$6,500 (5%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deal Savings Tracker */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-emerald-400" size={20} />
                        Deal Savings
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">Money saved from alerts</p>
                    </div>
                  </div>

                  {/* Total Savings */}
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-6 mb-6 border border-emerald-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/30">
                        <DollarSign className="text-emerald-300" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-emerald-300 font-medium">Total Saved</p>
                        <p className="text-3xl font-bold text-white">$8,450</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <TrendingUp size={14} />
                        <span className="font-semibold">+15%</span>
                      </div>
                      <span className="text-gray-400">vs. retail prices</span>
                    </div>
                  </div>

                  {/* Top Deals */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Wins</h4>
                    <div className="space-y-3">
                      {[
                        { item: 'Rolex Submariner', saved: 2800, percent: 25 },
                        { item: 'Porsche 911', saved: 4200, percent: 18 },
                        { item: 'Jordan 1 Retro', saved: 450, percent: 35 },
                        { item: 'Omega Seamaster', saved: 1000, percent: 15 }
                      ].map((deal, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg bg-gray-800/30 px-3 py-2.5 transition-all hover:bg-gray-800/50"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                              <Sparkles className="text-emerald-400" size={14} />
                            </div>
                            <span className="text-sm font-medium text-white truncate">{deal.item}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-400">${deal.saved.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{deal.percent}% off</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <BarChart3 className="text-primary-400" size={22} />
                      Price History
                    </h3>
                    {selectedItem && (
                      <p className="text-sm text-gray-400 mt-1">
                        {selectedItem.name || 'Selected Item'} • {priceHistory.length} data points
                      </p>
                    )}
                  </div>
                  {priceHistory.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1.5 rounded-lg bg-primary-500/10 px-3 py-1.5">
                        <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                        <span className="text-gray-300 font-medium">Price</span>
                      </div>
                      {selectedItem?.targetPrice && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5">
                          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                          <span className="text-gray-300 font-medium">Target</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {priceHistory.length === 0 ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-800/50 mb-4">
                        <BarChart3 className="text-gray-600" size={32} />
                      </div>
                      <p className="text-gray-400 text-lg mb-2">No price history available</p>
                      <p className="text-gray-600 text-sm">
                        {selectedItem?.currentPrice
                          ? 'Price data will appear after the next update cycle'
                          : 'Price tracking is active and collecting data'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 rounded-xl bg-gray-900/30 p-4">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                )}
              </div>
            </div>

            {/* Price History Table */}
            {priceHistory.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm">
                <div className="relative">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Activity className="text-primary-400" size={20} />
                    Recent Price Checks
                  </h3>
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-sm">
                      <thead className="text-gray-400 border-b border-gray-800/50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold uppercase tracking-wider text-xs">Date</th>
                          <th className="text-left py-3 px-4 font-semibold uppercase tracking-wider text-xs">Price</th>
                          <th className="text-left py-3 px-4 font-semibold uppercase tracking-wider text-xs">Source</th>
                          <th className="text-right py-3 px-4 font-semibold uppercase tracking-wider text-xs">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceHistory.slice(-10).reverse().map((item, index, arr) => {
                          const prevPrice = arr[index + 1]?.price
                          const change = prevPrice ? ((item.price - prevPrice) / prevPrice) * 100 : 0

                          return (
                            <tr
                              key={index}
                              className="border-b border-gray-800/30 transition-colors hover:bg-gray-800/30"
                            >
                              <td className="py-3 px-4 text-gray-400 font-medium">
                                {new Date(item.checked_at).toLocaleDateString()} {new Date(item.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3 px-4 font-bold text-white">
                                ${item.price.toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center rounded-lg bg-gray-800/50 px-2.5 py-1 text-xs font-medium text-gray-300">
                                  {item.source}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                {change !== 0 && (
                                  <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                                    change > 0
                                      ? 'bg-rose-500/10 text-rose-400'
                                      : 'bg-emerald-500/10 text-emerald-400'
                                  }`}>
                                    {change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {change > 0 ? '+' : ''}{change.toFixed(2)}%
                                  </span>
                                )}
                                {change === 0 && (
                                  <span className="text-gray-500 font-medium">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics
