/**
 * Blog Post Editor
 * Create and edit blog posts with Markdown, AI generation, and SEO fields
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  Calendar,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { blogService } from '../services/blog';
import { useAuth } from '../contexts/AuthContext';
import type { BlogPost, BlogCategory, CreatePostInput } from '../types/blog';
import { BLOG_CATEGORY_COLORS } from '../types/blog';
import BlogContent from '../components/blog/BlogContent';
import AIGeneratorModal, { type GeneratedPost } from '../components/admin/AIGeneratorModal';

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isNew = id === 'new';

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<BlogCategory>('general');
  const [tags, setTags] = useState<string>('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);

  useEffect(() => {
    // Check auth on mount
    if (!isAuthenticated) {
      toast.error('Please sign in to access editor');
      navigate('/login');
      return;
    }

    if (!isNew && id) {
      fetchPost(id);
    } else {
      setInitialLoad(false);
    }
  }, [id, isAuthenticated]);

  const fetchPost = async (postId: string) => {
    setLoading(true);
    try {
      const post = await blogService.getPostById(postId);

      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt || '');
      setContent(post.content);
      setCategory(post.category);
      setTags(post.tags?.join(', ') || '');
      setMetaTitle(post.meta_title || '');
      setMetaDescription(post.meta_description || '');
      setKeywords(post.keywords?.join(', ') || '');
      setHeroImageUrl(post.hero_image_url || '');
      setStatus(post.status as 'draft' | 'published');
    } catch (error) {
      console.error('Failed to fetch post:', error);
      toast.error('Failed to load post');
      navigate('/blog/admin');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (isNew && !slug) {
      setSlug(generateSlug(value));
    }
    if (!metaTitle) {
      setMetaTitle(value);
    }
  };

  const handleSave = async (publishNow: boolean = false) => {
    if (!title || !content) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);

    const postData: CreatePostInput = {
      title,
      slug: slug || generateSlug(title),
      excerpt,
      content,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      meta_title: metaTitle || title,
      meta_description: metaDescription || excerpt,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      hero_image_url: heroImageUrl || undefined,
      status: publishNow ? 'published' : status,
      author_name: 'The Hub Team'
    };

    try {
      if (isNew) {
        const created = await blogService.createPost(postData);
        toast.success('Post created!');
        navigate(`/blog/editor/${created.id}`);
      } else if (id) {
        await blogService.updatePost(id, postData);
        toast.success('Post saved!');
      }
    } catch (error: any) {
      console.error('Failed to save post:', error);
      toast.error(error.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = () => {
    setShowAIModal(true);
  };

  const handleAIGeneratedContent = (generatedPost: GeneratedPost) => {
    // Populate form with AI-generated content
    setTitle(generatedPost.title);
    setSlug(generatedPost.slug);
    setExcerpt(generatedPost.excerpt);
    setContent(generatedPost.content);
    setMetaTitle(generatedPost.meta_title);
    setMetaDescription(generatedPost.meta_description);
    setKeywords(generatedPost.keywords.join(', '));
    setTags(generatedPost.tags.join(', '));

    toast.success('Post generated successfully! Review and edit as needed.');
  };

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-gray-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/blog/admin')}
            className="rounded-lg bg-gray-800 p-2 text-gray-300 transition-colors hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isNew ? 'Create New Post' : 'Edit Post'}
            </h1>
            {!isNew && (
              <p className="text-sm text-gray-400">ID: {id}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAIGenerate}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            AI Generate
          </button>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Edit' : 'Preview'}
          </button>

          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Publish
          </button>
        </div>
      </div>

      {showPreview ? (
        /* Preview Mode */
        <div className="space-y-6 rounded-2xl border border-gray-800 bg-gray-900/50 p-8">
          {heroImageUrl && (
            <img
              src={heroImageUrl}
              alt={title}
              className="w-full rounded-xl"
            />
          )}
          <h1 className="text-4xl font-bold text-white">{title || 'Untitled'}</h1>
          {excerpt && <p className="text-xl text-gray-400">{excerpt}</p>}
          <div className="border-t border-gray-800 pt-6">
            <BlogContent content={content || '_No content yet_'} />
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Main Editor */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter post title"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-from-title"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                URL: /blog/{slug || 'your-slug-here'}
              </p>
            </div>

            {/* Excerpt */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary of the post"
                rows={3}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Content */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Content (Markdown) *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content in Markdown..."
                rows={20}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 font-mono text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Supports Markdown, code blocks, tables, and more
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
              <h3 className="mb-4 font-semibold text-white">Category</h3>
              <div className="space-y-2">
                {(['watches', 'cars', 'sneakers', 'sports', 'general'] as BlogCategory[]).map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-3 rounded-lg border border-gray-800 p-3 transition-colors hover:bg-gray-800/50"
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={category === cat}
                      onChange={(e) => setCategory(e.target.value as BlogCategory)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: BLOG_CATEGORY_COLORS[cat] }}
                    />
                    <span className="capitalize text-white">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
                <ImageIcon className="h-4 w-4" />
                Hero Image
              </h3>
              <input
                type="url"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {heroImageUrl && (
                <img
                  src={heroImageUrl}
                  alt="Preview"
                  className="mt-4 w-full rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Invalid+URL';
                  }}
                />
              )}
            </div>

            {/* Tags */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
              <h3 className="mb-4 font-semibold text-white">Tags</h3>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="rolex, submariner, investment"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Comma-separated
              </p>
            </div>

            {/* SEO */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
              <h3 className="mb-4 font-semibold text-white">SEO</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-400">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Default: Post title"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-400">
                    Meta Description
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Default: Excerpt"
                    rows={3}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-400">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="keyword1, keyword2"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Generator Modal */}
      <AIGeneratorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerate={handleAIGeneratedContent}
      />
    </div>
  );
}
