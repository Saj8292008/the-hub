/**
 * Blog Index Page
 * Lists all blog posts with filters and search
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Search, Filter, Grid, List } from 'lucide-react';
import { blogService } from '../services/blog';
import type { BlogPostSummary, BlogCategory, BlogCategoryInfo } from '../types/blog';
import { BLOG_CATEGORY_COLORS } from '../types/blog';
import EmailCapture from '../components/newsletter/EmailCapture';

export default function Blog() {
  const { category: categoryParam } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [categories, setCategories] = useState<BlogCategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Get selected category from URL
  const selectedCategory = categoryParam as BlogCategory | undefined;

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch posts when filters change
  useEffect(() => {
    fetchPosts();
  }, [categoryParam, searchQuery, page]);

  const fetchCategories = async () => {
    try {
      const data = await blogService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await blogService.getPosts({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        page,
        limit: 12,
        sortBy: 'published_at',
        sortOrder: 'desc'
      });

      setPosts(response.posts);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: BlogCategory | null) => {
    if (category) {
      navigate(`/blog/category/${category}`);
    } else {
      navigate('/blog');
    }
    setPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Blog</h1>
            <p className="text-gray-400">Market insights and investment strategies</p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 rounded-lg bg-gray-800 p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-md p-2 transition-colors ${
              viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-md p-2 transition-colors ${
              viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          <Link
            to="/blog"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/blog/category/${category.slug}`}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category.slug
                  ? 'text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              style={{
                backgroundColor: selectedCategory === category.slug ? category.color : undefined,
              }}
            >
              {category.name} ({category.post_count})
            </Link>
          ))}
        </div>
      </div>

      {/* Category Header - Show when filtering */}
      {selectedCategory && (
        <div className="rounded-lg bg-gray-800/50 p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-2" style={{ textTransform: 'capitalize' }}>
            {selectedCategory} Articles
          </h2>
          <p className="text-gray-400">
            {posts.length} article{posts.length !== 1 ? 's' : ''} found in this category
          </p>
        </div>
      )}

      {/* Posts Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-96 animate-pulse rounded-2xl border border-gray-800 bg-gray-900"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="mb-4 h-16 w-16 text-gray-600" />
          <h3 className="mb-2 text-xl font-semibold text-white">No posts found</h3>
          <p className="text-gray-400">
            {searchQuery
              ? `No posts match "${searchQuery}"`
              : 'No posts available in this category'}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
              : 'space-y-4'
          }
        >
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} viewMode={viewMode} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Newsletter Signup */}
      <EmailCapture source="blog_listing" variant="default" />
    </div>
  );
}

// Blog Post Card Component
function BlogPostCard({ post, viewMode }: { post: BlogPostSummary; viewMode: 'grid' | 'list' }) {
  const categoryColor = BLOG_CATEGORY_COLORS[post.category];

  if (viewMode === 'list') {
    return (
      <Link
        to={`/blog/${post.slug}`}
        className="group flex gap-4 rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-4 transition-all hover:border-gray-700 hover:-translate-y-1"
      >
        {post.thumbnail_url && (
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="h-32 w-48 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: categoryColor }}
            >
              {post.category}
            </span>
            {post.ai_generated && (
              <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300">
                AI Generated
              </span>
            )}
          </div>
          <h3 className="mb-2 text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
            {post.title}
          </h3>
          <p className="mb-2 text-sm text-gray-400 line-clamp-2">{post.excerpt}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{post.read_time_minutes} min read</span>
            <span>{post.view_count} views</span>
            <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 transition-all hover:border-gray-700 hover:shadow-2xl hover:-translate-y-2"
    >
      {/* Image */}
      {post.thumbnail_url && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute top-2 left-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: categoryColor }}
            >
              {post.category}
            </span>
          </div>
          {post.ai_generated && (
            <div className="absolute top-2 right-2">
              <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300 backdrop-blur-sm">
                AI
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <h3 className="mb-2 text-xl font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="mb-4 text-sm text-gray-400 line-clamp-3">{post.excerpt}</p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{post.read_time_minutes} min read</span>
          <span>{post.view_count} views</span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {new Date(post.published_at || post.created_at).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
}
