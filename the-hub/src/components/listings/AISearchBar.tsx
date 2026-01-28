/**
 * AI-Powered Search Bar
 * Natural language search with interpreted filters display
 */

import { useState } from 'react';
import { Search, Sparkles, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface AISearchBarProps {
  category: 'watches' | 'sneakers' | 'cars';
  categoryColor: string;
  placeholder?: string;
  onSearch: (filters: any, interpretedMessage?: string) => void;
}

export default function AISearchBar({
  category,
  categoryColor,
  placeholder = 'Try: "rolex submariner under 10k"',
  onSearch
}: AISearchBarProps) {
  const [query, setQuery] = useState('');
  const [aiMode, setAiMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [interpretedFilters, setInterpretedFilters] = useState<any>(null);
  const [interpretedMessage, setInterpretedMessage] = useState<string>('');

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!query.trim()) {
      // Clear filters if query is empty
      setInterpretedFilters(null);
      setInterpretedMessage('');
      onSearch({});
      return;
    }

    if (aiMode) {
      // AI Natural Language Search
      setLoading(true);

      try {
        const response = await fetch(`http://localhost:3000/api/search/${category}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query,
            options: {
              limit: 100
            }
          })
        });

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error('Invalid search response');
        }

        setInterpretedFilters(data.interpreted_filters);
        setInterpretedMessage(data.message || '');

        // Pass the filters to parent component
        onSearch(data.interpreted_filters, data.message);

        if (data.fallback) {
          toast('AI unavailable, using keyword search', { icon: '⚠️' });
        }
      } catch (error: any) {
        console.error('AI search error:', error);
        toast.error('Search failed. Please try again.');

        // Fallback to regular text search
        onSearch({ search: query });
      } finally {
        setLoading(false);
      }
    } else {
      // Regular text search
      setInterpretedFilters(null);
      setInterpretedMessage('');
      onSearch({ search: query });
    }
  };

  const handleClear = () => {
    setQuery('');
    setInterpretedFilters(null);
    setInterpretedMessage('');
    onSearch({});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search size={20} className="text-gray-500" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 transition-all focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-opacity-20"
            style={{
              '--tw-ring-color': `${categoryColor}33`
            } as React.CSSProperties}
          />

          {query && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X size={16} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* AI Mode Toggle */}
        <button
          onClick={() => setAiMode(!aiMode)}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
            aiMode
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
              : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
          }`}
          title={aiMode ? 'AI Search Active' : 'Enable AI Search'}
        >
          <Sparkles size={18} />
          <span className="hidden sm:inline">AI</span>
        </button>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-3 bg-gray-800 border border-gray-700 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            'Search'
          )}
        </button>
      </div>

      {/* Interpreted Filters Display */}
      {interpretedMessage && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-purple-500/30 bg-purple-500/10">
          <Sparkles size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-300">AI Interpretation</p>
            <p className="text-sm text-gray-400 mt-1">{interpretedMessage}</p>

            {interpretedFilters && Object.keys(interpretedFilters).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(interpretedFilters).map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-500/20 text-xs text-purple-300"
                  >
                    <span className="font-semibold">{key}:</span>
                    <span>{String(value)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleClear}
            className="p-1 hover:bg-purple-500/20 rounded transition-colors"
          >
            <X size={16} className="text-purple-400" />
          </button>
        </div>
      )}

      {/* AI Search Info (only show when AI mode is on and no query) */}
      {aiMode && !query && !interpretedMessage && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Sparkles size={14} className="text-purple-500" />
          <span>
            AI search enabled. Try: "rolex submariner under 10k" or "jordan 1 size 11 good condition"
          </span>
        </div>
      )}
    </div>
  );
}
