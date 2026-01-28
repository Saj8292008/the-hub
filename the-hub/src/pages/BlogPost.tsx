/**
 * Individual Blog Post Page
 * Full blog post view with TOC, related posts, sharing, and analytics
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Clock, Eye, Share2, ArrowLeft, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { blogService } from '../services/blog';
import type { BlogPost, BlogPostSummary } from '../types/blog';
import { BLOG_CATEGORY_COLORS } from '../types/blog';
import BlogContent from '../components/blog/BlogContent';
import TableOfContents from '../components/blog/TableOfContents';
import RelatedPosts from '../components/blog/RelatedPosts';
import EmailCaptureForm from '../components/blog/EmailCaptureForm';
import EmailCapturePopup from '../components/newsletter/EmailCapturePopup';
import EmailCapture from '../components/newsletter/EmailCapture';
import SocialShare from '../components/blog/SocialShare';
import SchemaMarkup from '../components/blog/SchemaMarkup';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  const fetchPost = async (postSlug: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await blogService.getPostBySlug(postSlug);
      setPost(response.post);
      setRelatedPosts(response.relatedPosts || []);

      // Track view
      if (response.post?.id) {
        blogService.trackView(response.post.id).catch(err => {
          console.error('Failed to track view:', err);
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch post:', err);
      setError(err.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="h-96 animate-pulse rounded-2xl bg-gray-900" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-gray-900" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-900" />
          <div className="space-y-2">
            <div className="h-4 animate-pulse rounded bg-gray-900" />
            <div className="h-4 animate-pulse rounded bg-gray-900" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-900" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 text-6xl">📝</div>
        <h2 className="mb-2 text-2xl font-bold text-white">Post Not Found</h2>
        <p className="mb-6 text-gray-400">
          {error || 'The blog post you are looking for does not exist.'}
        </p>
        <Link
          to="/blog"
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>
      </div>
    );
  }

  const categoryColor = BLOG_CATEGORY_COLORS[post.category];
  const publishedDate = new Date(post.published_at || post.created_at);

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{post.meta_title || post.title}</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
        {post.keywords && post.keywords.length > 0 && (
          <meta name="keywords" content={post.keywords.join(', ')} />
        )}

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt} />
        {post.hero_image_url && <meta property="og:image" content={post.hero_image_url} />}
        <meta property="og:url" content={`${window.location.origin}/blog/${post.slug}`} />
        {post.published_at && <meta property="article:published_time" content={post.published_at} />}
        <meta property="article:author" content={post.author_name || 'The Hub'} />
        <meta property="article:section" content={post.category} />
        {post.tags?.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.meta_title || post.title} />
        <meta name="twitter:description" content={post.meta_description || post.excerpt} />
        {post.hero_image_url && <meta name="twitter:image" content={post.hero_image_url} />}
      </Helmet>

      {/* Schema Markup */}
      <SchemaMarkup post={post} />

      <div className="space-y-8">
        {/* Back Button */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Hero Image */}
        {post.hero_image_url && (
          <div className="relative h-96 overflow-hidden rounded-2xl">
            <img
              src={post.hero_image_url}
              alt={post.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

            {/* Category Badge on Image */}
            <div className="absolute top-4 left-4">
              <span
                className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: categoryColor }}
              >
                {post.category}
              </span>
            </div>

            {/* AI Generated Badge */}
            {post.ai_generated && (
              <div className="absolute top-4 right-4">
                <span className="rounded-full bg-purple-500/20 px-4 py-2 text-sm font-semibold text-purple-300 backdrop-blur-sm">
                  AI Generated
                </span>
              </div>
            )}
          </div>
        )}

        {/* Article Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight text-white lg:text-5xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-gray-400">{post.excerpt}</p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            {post.author_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.published_at || post.created_at}>
                {publishedDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
            {post.read_time_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.read_time_minutes} min read</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{post.view_count.toLocaleString()} views</span>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="rounded-lg bg-gray-800 px-3 py-1 text-sm text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Share Buttons */}
          <SocialShare post={post} />
        </div>

        {/* Main Content Area */}
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Article Content */}
          <div className="space-y-8">
            {/* Table of Contents (Mobile) */}
            <div className="lg:hidden">
              <TableOfContents content={post.content} />
            </div>

            {/* Markdown Content */}
            <BlogContent content={post.content} />

            {/* Newsletter Signup - Inline Variant */}
            <div className="my-12">
              <EmailCapture source="blog_post" variant="inline" />
            </div>

            {/* Mid-Article Email Capture */}
            <div className="my-12">
              <EmailCaptureForm
                source="blog-post-mid"
                title="Enjoying this article?"
                description="Get weekly market insights and deal alerts delivered to your inbox."
              />
            </div>

            {/* Author Bio (if available) */}
            {post.author_name && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
                <div className="flex items-start gap-4">
                  {post.author_avatar_url ? (
                    <img
                      src={post.author_avatar_url}
                      alt={post.author_name}
                      className="h-16 w-16 rounded-full"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-2xl font-bold text-white">
                      {post.author_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {post.author_name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Expert in luxury asset tracking and market analysis
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Email Capture */}
            <EmailCaptureForm
              source="blog-post-bottom"
              title="Never miss a deal"
              description="Join thousands of subscribers getting weekly market insights and exclusive deal alerts."
            />
          </div>

          {/* Sidebar (Desktop) */}
          <div className="hidden space-y-6 lg:block">
            {/* Sticky TOC */}
            <div className="sticky top-6">
              <TableOfContents content={post.content} />
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <RelatedPosts posts={relatedPosts} currentPostId={post.id} />
        )}
      </div>

      {/* Email Capture Popup (Exit Intent) */}
      <EmailCapturePopup />
    </>
  );
}
