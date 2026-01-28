/**
 * Recent Blog Posts Widget
 * Displays latest blog posts on the dashboard
 */

import React, { useEffect, useState } from 'react';
import { FileText, ExternalLink, Clock, Eye, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { blogService } from '../services/blog';
import type { BlogPostSummary } from '../types/blog';
import { BLOG_CATEGORY_COLORS } from '../types/blog';
import clsx from 'clsx';

export const RecentBlogPosts: React.FC = () => {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await blogService.getPosts({
        limit: 4,
        status: 'published'
      });
      setPosts(response.posts || []);
    } catch (error) {
      console.error('Failed to fetch recent blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="text-primary-400" size={20} />
            <h3 className="text-lg font-bold text-white">Latest from the Blog</h3>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 p-6 shadow-xl backdrop-blur-sm transition-all hover:border-gray-700">
      {/* Gradient glow effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="text-purple-400" size={20} />
            <h3 className="text-lg font-bold text-white">Latest from the Blog</h3>
          </div>
          <Link
            to="/blog"
            className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 transition-colors"
          >
            View All
            <ExternalLink size={14} />
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 mb-4">
              <FileText className="text-purple-400/50" size={24} />
            </div>
            <p className="text-gray-400 text-sm font-semibold mb-1">No blog posts yet</p>
            <p className="text-gray-600 text-xs mb-4">Start sharing insights and updates</p>
            <Link
              to="/blog/admin"
              className="inline-flex items-center gap-1.5 text-xs text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg hover:bg-purple-500/20 transition-colors"
            >
              Create First Post →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post, index) => {
              const categoryColor = BLOG_CATEGORY_COLORS[post.category] || '#9333EA';
              const publishedDate = post.published_at || post.created_at;

              return (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group block p-4 bg-gray-900/50 rounded-xl hover:bg-gray-900 transition-all hover:scale-[1.02] border border-gray-800/50 hover:border-purple-500/30"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white flex-shrink-0"
                          style={{ backgroundColor: categoryColor }}
                        >
                          {post.category}
                        </span>
                        {post.ai_generated && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 flex-shrink-0">
                            AI
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-purple-400 transition-colors mb-2">
                        {post.title}
                      </h4>

                      {post.excerpt && (
                        <p className="text-xs text-gray-400 line-clamp-1 mb-2">
                          {post.excerpt}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {formatTimestamp(publishedDate)}
                        </span>
                        {post.view_count > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Eye size={10} />
                              {post.view_count.toLocaleString()}
                            </span>
                          </>
                        )}
                        {post.read_time_minutes && (
                          <>
                            <span>•</span>
                            <span>{post.read_time_minutes} min read</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Visual indicator for trending posts */}
                    {post.view_count > 100 && (
                      <div className="flex-shrink-0">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                          <TrendingUp size={12} className="text-orange-400" />
                          <span className="text-[10px] font-bold text-orange-400">Hot</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Call to action */}
        {posts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <Link
              to="/blog"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors group"
            >
              <span>Explore All Articles</span>
              <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
