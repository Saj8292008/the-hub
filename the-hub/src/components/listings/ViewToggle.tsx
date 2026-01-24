import React from 'react'
import { Grid, List } from 'lucide-react'
import clsx from 'clsx'
import { ViewMode } from '../../types/listings'

interface ViewToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
  categoryColor: string
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  value,
  onChange,
  categoryColor
}) => {
  return (
    <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1">
      <button
        onClick={() => onChange('grid')}
        className={clsx(
          'p-2 rounded-md transition-all',
          value === 'grid'
            ? 'text-white shadow-lg'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        )}
        style={value === 'grid' ? { backgroundColor: `${categoryColor}30` } : {}}
        title="Grid view"
      >
        <Grid size={18} style={value === 'grid' ? { color: categoryColor } : {}} />
      </button>
      <button
        onClick={() => onChange('list')}
        className={clsx(
          'p-2 rounded-md transition-all',
          value === 'list'
            ? 'text-white shadow-lg'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        )}
        style={value === 'list' ? { backgroundColor: `${categoryColor}30` } : {}}
        title="List view"
      >
        <List size={18} style={value === 'list' ? { color: categoryColor } : {}} />
      </button>
    </div>
  )
}
