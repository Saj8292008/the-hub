/**
 * Related Posts Component
 * Displays related blog posts at the bottom of an article
 */

import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import type { BlogPostSummary } from '../../types/blog';
import { BLOG_CATEGORY_COLORS } from '../../types/blog';

interface RelatedPostsProps {
  posts: BlogPostSummary[];
  currentPostId: string;
}

export default function RelatedPosts({ posts, currentPostId }: RelatedPostsProps) {
  // Filter out current post
  const relatedPosts = posts.filter(post => post.id !== currentPostId);

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Related Articles</h2>
        <Link
          to="/blog"
          className="flex items-center gap-2 text-sm text-purple-400 transition-colors hover:text-purple-300"
        >
          View all posts
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {relatedPosts.map((post) => (
          <RelatedPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

function RelatedPostCard({ post }: { post: BlogPostSummary }) {
  const categoryColor = BLOG_CATEGORY_COLORS[post.category];
  const publishedDate = new Date(post.published_at || post.created_at);

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 transition-all hover:border-gray-700 hover:shadow-2xl hover:-translate-y-1"
    >
      {/* Thumbnail */}
      {post.thumbnail_url && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: categoryColor }}
            >
              {post.category}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <h3 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-purple-400 line-clamp-2">
          {post.title}
        </h3>

        <p className="mb-4 text-sm text-gray-400 line-clamp-2">
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <time dateTime={post.published_at || post.created_at}>
            {publishedDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </time>

          {post.read_time_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{post.read_time_minutes} min</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
