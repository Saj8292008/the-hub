/**
 * Blog Admin Dashboard
 * Manage blog posts - list, create, edit, delete
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  TrendingUp,
  FileText,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import { blogService } from '../services/blog';
import { useAuth } from '../contexts/AuthContext';
import type { BlogPostSummary } from '../types/blog';
import { BLOG_CATEGORY_COLORS } from '../types/blog';

export default function BlogAdmin() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    totalViews: 0
  });

  useEffect(() => {
    // Check auth on mount
    if (!isAuthenticated) {
      toast.error('Please sign in to access admin');
      navigate('/login');
    } else {
      fetchPosts();
    }
  }, [isAuthenticated, filter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await blogService.getPosts({
        status: filter === 'all' ? undefined : filter,
        limit: 100,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      setPosts(response.posts);
      calculateStats(response.posts);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (postList: BlogPostSummary[]) => {
    const published = postList.filter(p => p.published_at).length;
    const totalViews = postList.reduce((sum, p) => sum + (p.view_count || 0), 0);

    setStats({
      total: postList.length,
      published,
      drafts: postList.length - published,
      totalViews
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await blogService.deletePost(id);
      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('Signed out');
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Blog Admin</h1>
          <p className="text-gray-400">Manage your blog posts</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/blog/editor/new"
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
          >
            <PlusCircle className="h-5 w-5" />
            New Post
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-3 text-gray-300 transition-colors hover:bg-gray-700"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Posts"
          value={stats.total}
          icon={<FileText className="h-6 w-6" />}
          color="bg-blue-500"
        />
        <StatCard
          label="Published"
          value={stats.published}
          icon={<Eye className="h-6 w-6" />}
          color="bg-green-500"
        />
        <StatCard
          label="Drafts"
          value={stats.drafts}
          icon={<EyeOff className="h-6 w-6" />}
          color="bg-yellow-500"
        />
        <StatCard
          label="Total Views"
          value={stats.totalViews.toLocaleString()}
          icon={<TrendingUp className="h-6 w-6" />}
          color="bg-purple-500"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Filter:</span>
        {(['all', 'published', 'draft'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts Table */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-gray-900"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-800 bg-gray-900/50 py-16 text-center">
          <FileText className="mb-4 h-16 w-16 text-gray-600" />
          <h3 className="mb-2 text-xl font-semibold text-white">No posts yet</h3>
          <p className="mb-6 text-gray-400">Create your first blog post to get started</p>
          <Link
            to="/blog/editor/new"
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
          >
            <PlusCircle className="h-5 w-5" />
            Create Post
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Views
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Date
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {posts.map((post) => (
                <PostRow
                  key={post.id}
                  post={post}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`rounded-lg ${color} p-3 text-white`}>{icon}</div>
      </div>
    </div>
  );
}

function PostRow({
  post,
  onDelete
}: {
  post: BlogPostSummary;
  onDelete: (id: string, title: string) => void;
}) {
  const categoryColor = BLOG_CATEGORY_COLORS[post.category];
  const isPublished = !!post.published_at;

  return (
    <tr className="transition-colors hover:bg-gray-800/50">
      <td className="px-6 py-4">
        <div>
          <Link
            to={`/blog/${post.slug}`}
            className="font-semibold text-white hover:text-purple-400"
          >
            {post.title}
          </Link>
          {post.ai_generated && (
            <span className="ml-2 rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
              AI
            </span>
          )}
          <p className="mt-1 text-sm text-gray-400 line-clamp-1">
            {post.excerpt}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: categoryColor }}
        >
          {post.category}
        </span>
      </td>
      <td className="px-6 py-4">
        {isPublished ? (
          <span className="flex items-center gap-2 text-sm text-green-400">
            <Eye className="h-4 w-4" />
            Published
          </span>
        ) : (
          <span className="flex items-center gap-2 text-sm text-yellow-400">
            <EyeOff className="h-4 w-4" />
            Draft
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-400">
        {post.view_count.toLocaleString()}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="h-4 w-4" />
          {new Date(post.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/blog/editor/${post.id}`}
            className="rounded-lg bg-gray-800 p-2 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </Link>
          <button
            onClick={() => onDelete(post.id, post.title)}
            className="rounded-lg bg-gray-800 p-2 text-gray-300 transition-colors hover:bg-red-600 hover:text-white"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
