/**
 * Saved Searches Component
 * Web UI for managing tracked searches (syncs with Telegram /track)
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Bell,
  BellOff,
  Mail,
  MailOff,
  Edit2,
  X,
  Check,
  AlertCircle,
  Crown,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SavedSearch {
  id: string;
  search_query: string;
  category: string;
  max_price: number | null;
  min_deal_score: number;
  notify_telegram: boolean;
  notify_email: boolean;
  is_active: boolean;
  created_at: string;
  last_notified: string | null;
  notify_count: number;
}

interface Limits {
  tier: string;
  limit: number | string;
  used: number;
  remaining: number | string;
}

export default function SavedSearches() {
  const { user, isAuthenticated } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    search_query: '',
    category: 'all',
    max_price: '',
    min_deal_score: 0,
    notify_telegram: true,
    notify_email: false
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'watches', label: 'Watches' },
    { value: 'cars', label: 'Cars' },
    { value: 'sneakers', label: 'Sneakers' },
    { value: 'sports', label: 'Sports' }
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchSearches();
      fetchLimits();
    }
  }, [isAuthenticated]);

  const fetchSearches = async () => {
    try {
      const res = await fetch(`${API_URL}/api/saved-searches`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setSearches(data.searches);
      }
    } catch (error) {
      console.error('Error fetching searches:', error);
      toast.error('Failed to load saved searches');
    } finally {
      setLoading(false);
    }
  };

  const fetchLimits = async () => {
    try {
      const res = await fetch(`${API_URL}/api/saved-searches/limits`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setLimits(data);
      }
    } catch (error) {
      console.error('Error fetching limits:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.search_query.trim()) {
      toast.error('Search query is required');
      return;
    }

    try {
      const url = editingId
        ? `${API_URL}/api/saved-searches/${editingId}`
        : `${API_URL}/api/saved-searches`;
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          max_price: formData.max_price ? parseFloat(formData.max_price) : null
        })
      });

      const data = await res.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(editingId ? 'Search updated!' : 'Search saved!');
      setShowAddForm(false);
      setEditingId(null);
      resetForm();
      fetchSearches();
      fetchLimits();
    } catch (error) {
      toast.error('Failed to save search');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved search?')) return;

    try {
      const res = await fetch(`${API_URL}/api/saved-searches/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Search deleted');
        fetchSearches();
        fetchLimits();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete search');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/saved-searches/${id}/toggle`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchSearches();
      } else {
        toast.error(data.error || 'Failed to toggle');
      }
    } catch (error) {
      toast.error('Failed to toggle search');
    }
  };

  const handleEdit = (search: SavedSearch) => {
    setFormData({
      search_query: search.search_query,
      category: search.category,
      max_price: search.max_price?.toString() || '',
      min_deal_score: search.min_deal_score,
      notify_telegram: search.notify_telegram,
      notify_email: search.notify_email
    });
    setEditingId(search.id);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      search_query: '',
      category: 'all',
      max_price: '',
      min_deal_score: 0,
      notify_telegram: true,
      notify_email: false
    });
  };

  const canAddMore = limits && (limits.remaining === 'Unlimited' || (typeof limits.remaining === 'number' && limits.remaining > 0));

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-8 text-center">
        <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-xl font-bold mb-2">Sign in to Track Searches</h3>
        <p className="text-gray-400 mb-4">
          Save your search queries and get notified when matching deals are found.
        </p>
        <a
          href="/login"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Search size={24} className="text-purple-400" />
            Saved Searches
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Get notified when deals match your criteria
          </p>
        </div>
        
        {limits && (
          <div className="text-right">
            <div className="text-sm text-gray-400">
              {limits.used} / {limits.limit} tracks used
            </div>
            {limits.tier !== 'premium' && (
              <a href="/premium" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 justify-end mt-1">
                <Crown size={12} />
                Upgrade for more
              </a>
            )}
          </div>
        )}
      </div>

      {/* Add Button */}
      {!showAddForm && (
        <button
          onClick={() => {
            if (canAddMore) {
              setShowAddForm(true);
              setEditingId(null);
              resetForm();
            } else {
              toast.error(`Track limit reached. Upgrade to ${user?.tier === 'free' ? 'Pro' : 'Premium'} for more.`);
            }
          }}
          className={`w-full mb-6 py-3 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center gap-2 ${
            canAddMore
              ? 'border-gray-600 hover:border-purple-500 text-gray-400 hover:text-purple-400'
              : 'border-gray-700 text-gray-600 cursor-not-allowed'
          }`}
        >
          <Plus size={20} />
          Add New Search
        </button>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">
              {editingId ? 'Edit Search' : 'New Saved Search'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
                resetForm();
              }}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Search Query */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Search Query *
              </label>
              <input
                type="text"
                value={formData.search_query}
                onChange={e => setFormData({ ...formData, search_query: e.target.value })}
                placeholder="e.g., Rolex Submariner, Air Jordan 1"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Max Price (optional)
                </label>
                <input
                  type="number"
                  value={formData.max_price}
                  onChange={e => setFormData({ ...formData, max_price: e.target.value })}
                  placeholder="e.g., 5000"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Min Deal Score */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Minimum Deal Score: {formData.min_deal_score}
              </label>
              <input
                type="range"
                min="0"
                max="90"
                step="10"
                value={formData.min_deal_score}
                onChange={e => setFormData({ ...formData, min_deal_score: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>All deals</span>
                <span>Only hot deals (90+)</span>
              </div>
            </div>

            {/* Notification Options */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notify_telegram}
                  onChange={e => setFormData({ ...formData, notify_telegram: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                />
                <Bell size={16} className="text-gray-400" />
                <span className="text-sm text-gray-300">Telegram</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notify_email}
                  onChange={e => setFormData({ ...formData, notify_email: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                />
                <Mail size={16} className="text-gray-400" />
                <span className="text-sm text-gray-300">Email</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg transition-colors"
            >
              {editingId ? 'Update Search' : 'Save Search'}
            </button>
          </div>
        </form>
      )}

      {/* Searches List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-800/50 rounded-lg h-20" />
          ))}
        </div>
      ) : searches.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>No saved searches yet</p>
          <p className="text-sm mt-1">Add a search to get notified about matching deals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map(search => (
            <div
              key={search.id}
              className={`p-4 rounded-lg border transition-colors ${
                search.is_active
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-gray-900/30 border-gray-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{search.search_query}</h4>
                    {!search.is_active && (
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                        Paused
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                    <span className="bg-gray-700 px-2 py-0.5 rounded">
                      {categories.find(c => c.value === search.category)?.label || search.category}
                    </span>
                    {search.max_price && (
                      <span className="bg-gray-700 px-2 py-0.5 rounded">
                        Under ${search.max_price.toLocaleString()}
                      </span>
                    )}
                    {search.min_deal_score > 0 && (
                      <span className="bg-gray-700 px-2 py-0.5 rounded">
                        Score ≥{search.min_deal_score}
                      </span>
                    )}
                    {search.notify_count > 0 && (
                      <span className="bg-green-900/50 text-green-400 px-2 py-0.5 rounded flex items-center gap-1">
                        <TrendingUp size={10} />
                        {search.notify_count} matches
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggle(search.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      search.is_active
                        ? 'text-green-400 hover:bg-green-500/10'
                        : 'text-gray-500 hover:bg-gray-700'
                    }`}
                    title={search.is_active ? 'Pause notifications' : 'Resume notifications'}
                  >
                    {search.is_active ? <Bell size={18} /> : <BellOff size={18} />}
                  </button>
                  <button
                    onClick={() => handleEdit(search)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(search.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Notification Status */}
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span className={search.notify_telegram ? 'text-purple-400' : ''}>
                  {search.notify_telegram ? <Bell size={12} className="inline mr-1" /> : <BellOff size={12} className="inline mr-1" />}
                  Telegram
                </span>
                <span className={search.notify_email ? 'text-blue-400' : ''}>
                  {search.notify_email ? <Mail size={12} className="inline mr-1" /> : <MailOff size={12} className="inline mr-1" />}
                  Email
                </span>
                {search.last_notified && (
                  <span>
                    Last match: {new Date(search.last_notified).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
