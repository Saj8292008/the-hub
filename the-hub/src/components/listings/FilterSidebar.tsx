import React, { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'

export interface FilterConfig {
  type: 'select' | 'multiselect' | 'range' | 'checkbox' | 'date'
  label: string
  key: string
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  unit?: string
}

interface FilterSidebarProps {
  filters: FilterConfig[]
  activeFilters: Record<string, any>
  onFilterChange: (key: string, value: any) => void
  onClearAll: () => void
  categoryColor: string
  isOpen: boolean
  onToggle: () => void
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  categoryColor,
  isOpen,
  onToggle
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const activeFilterCount = Object.values(activeFilters).filter(
    (v) => v !== '' && v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true)
  ).length

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 left-0 h-screen lg:h-auto w-80 bg-gray-800/50 border-r border-gray-700 lg:border-r-0 lg:border border-gray-700 lg:rounded-xl p-6 overflow-y-auto z-50 transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter size={20} style={{ color: categoryColor }} />
            <h3 className="font-semibold text-white">Filters</h3>
            {activeFilterCount > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${categoryColor}20`,
                  color: categoryColor
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Clear All Button */}
        {activeFilterCount > 0 && (
          <button
            onClick={onClearAll}
            className="w-full mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            Clear All Filters
          </button>
        )}

        {/* Filter Sections */}
        <div className="space-y-4">
          {filters.map((filter) => (
            <div key={filter.key} className="border-b border-gray-700 pb-4 last:border-0">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(filter.key)}
                className="w-full flex items-center justify-between mb-3 text-left"
              >
                <span className="font-medium text-gray-300">{filter.label}</span>
                {collapsedSections[filter.key] ? (
                  <ChevronDown size={16} className="text-gray-500" />
                ) : (
                  <ChevronUp size={16} className="text-gray-500" />
                )}
              </button>

              {/* Filter Content */}
              {!collapsedSections[filter.key] && (
                <div className="space-y-2">
                  {/* Select Dropdown */}
                  {filter.type === 'select' && (
                    <select
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => onFilterChange(filter.key, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-gray-500 focus:outline-none"
                    >
                      <option value="">All</option>
                      {filter.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Multiselect Checkboxes */}
                  {filter.type === 'multiselect' && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filter.options?.map((opt) => {
                        const isChecked = Array.isArray(activeFilters[filter.key])
                          ? activeFilters[filter.key].includes(opt.value)
                          : false

                        return (
                          <label
                            key={opt.value}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const currentValues = activeFilters[filter.key] || []
                                const newValues = e.target.checked
                                  ? [...currentValues, opt.value]
                                  : currentValues.filter((v: string) => v !== opt.value)
                                onFilterChange(filter.key, newValues)
                              }}
                              className="w-4 h-4 rounded border-gray-600 text-primary-500 focus:ring-primary-500 focus:ring-offset-gray-900"
                            />
                            <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                              {opt.label}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {/* Range Slider */}
                  {filter.type === 'range' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          placeholder={`Min ${filter.unit || ''}`}
                          value={activeFilters[`${filter.key}_min`] || ''}
                          onChange={(e) =>
                            onFilterChange(`${filter.key}_min`, e.target.value)
                          }
                          min={filter.min}
                          max={filter.max}
                          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-gray-500 focus:outline-none"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="number"
                          placeholder={`Max ${filter.unit || ''}`}
                          value={activeFilters[`${filter.key}_max`] || ''}
                          onChange={(e) =>
                            onFilterChange(`${filter.key}_max`, e.target.value)
                          }
                          min={filter.min}
                          max={filter.max}
                          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-gray-500 focus:outline-none"
                        />
                      </div>
                      {filter.unit && (
                        <div className="text-xs text-gray-500">
                          Range: {filter.min?.toLocaleString()} - {filter.max?.toLocaleString()} {filter.unit}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Checkbox */}
                  {filter.type === 'checkbox' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeFilters[filter.key] || false}
                        onChange={(e) => onFilterChange(filter.key, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 text-primary-500 focus:ring-primary-500 focus:ring-offset-gray-900"
                      />
                      <span className="text-sm text-gray-400">Enable</span>
                    </label>
                  )}

                  {/* Date Filter */}
                  {filter.type === 'date' && (
                    <div className="space-y-2">
                      {filter.options?.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <input
                            type="radio"
                            name={filter.key}
                            value={opt.value}
                            checked={activeFilters[filter.key] === opt.value}
                            onChange={(e) => onFilterChange(filter.key, e.target.value)}
                            className="w-4 h-4 border-gray-600 text-primary-500 focus:ring-primary-500 focus:ring-offset-gray-900"
                          />
                          <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
