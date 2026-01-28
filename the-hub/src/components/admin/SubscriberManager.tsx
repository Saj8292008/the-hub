/**
 * Subscriber Manager Component
 * View and manage newsletter subscribers
 */

import { useState, useEffect } from 'react';
import { Download, Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import newsletterService from '../../services/newsletter';

export default function SubscriberManager() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'unsubscribed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubscribers();
  }, [filter]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const options: any = { limit: 100 };

      if (filter === 'confirmed') {
        options.confirmed = true;
        options.unsubscribed = false;
      } else if (filter === 'unsubscribed') {
        options.unsubscribed = true;
      }

      const data = await newsletterService.getSubscribers(options);
      setSubscribers(data.subscribers || []);
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
      toast.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast('Exporting subscribers...', { icon: '📥' });
      const data = await newsletterService.exportSubscribers();

      // Create CSV download
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${data.count} subscribers`);
    } catch (error) {
      toast.error('Failed to export subscribers');
    }
  };

  const filteredSubscribers = subscribers.filter((sub) =>
    searchTerm
      ? sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.name && sub.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : true
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Subscribers</h2>
          <p className="text-gray-400">{subscribers.length} total subscribers</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-purple-700"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {['all', 'confirmed', 'unsubscribed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none sm:w-64"
          />
        </div>
      </div>

      {/* Subscribers table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/50">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Email
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Subscribed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <Users className="mx-auto mb-3 h-12 w-12 text-gray-600" />
                  <p className="text-gray-400">No subscribers found</p>
                </td>
              </tr>
            ) : (
              filteredSubscribers.map((subscriber) => (
                <tr
                  key={subscriber.id}
                  className="transition-colors hover:bg-gray-800/50"
                >
                  <td className="px-6 py-4 text-sm text-white">
                    {subscriber.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {subscriber.name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {subscriber.unsubscribed ? (
                      <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-400">
                        Unsubscribed
                      </span>
                    ) : subscriber.confirmed ? (
                      <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-semibold text-yellow-400">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(subscriber.subscribed_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
