/**
 * AI Blog Post Generator Modal
 * Interface for generating blog posts with AI using GPT-4
 */

import { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import type { BlogCategory } from '../../types/blog';
import { BLOG_CATEGORY_COLORS } from '../../types/blog';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (generatedPost: GeneratedPost) => void;
}

export interface GeneratedPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  tags: string[];
  internal_links?: string[];
}

interface GenerateOptions {
  topic: string;
  category: BlogCategory;
  targetKeywords: string;
  includeData: boolean;
  tone: 'authoritative' | 'casual' | 'professional' | 'friendly';
  length: 'short' | 'medium' | 'long';
}

export default function AIGeneratorModal({ isOpen, onClose, onGenerate }: AIGeneratorModalProps) {
  const [options, setOptions] = useState<GenerateOptions>({
    topic: '',
    category: 'general',
    targetKeywords: '',
    includeData: true,
    tone: 'authoritative',
    length: 'long'
  });

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!options.topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/blog/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: options.topic,
          category: options.category,
          targetKeywords: options.targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
          includeData: options.includeData,
          tone: options.tone,
          length: options.length
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate post');
      }

      const data = await response.json();

      if (!data.success || !data.post) {
        throw new Error('Invalid response from AI generation');
      }

      onGenerate(data.post);
      onClose();

      // Reset form
      setOptions({
        topic: '',
        category: 'general',
        targetKeywords: '',
        includeData: true,
        tone: 'authoritative',
        length: 'long'
      });
    } catch (err: any) {
      console.error('AI generation error:', err);
      setError(err.message || 'Failed to generate post. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Blog Generator</h2>
              <p className="text-sm text-gray-400">Generate SEO-optimized content with GPT-4</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-800 p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
            <div>
              <p className="font-semibold text-red-400">Generation Error</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Topic */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Topic *
            </label>
            <input
              type="text"
              value={options.topic}
              onChange={(e) => setOptions({ ...options, topic: e.target.value })}
              placeholder="e.g., Best Rolex watches under $10k in 2025"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              disabled={generating}
            />
            <p className="mt-1 text-xs text-gray-500">
              Be specific. The AI will use this to generate a comprehensive post.
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['watches', 'cars', 'sneakers', 'sports', 'general'] as BlogCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setOptions({ ...options, category: cat })}
                  disabled={generating}
                  className={`flex items-center gap-2 rounded-lg border p-3 transition-colors ${
                    options.category === cat
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: BLOG_CATEGORY_COLORS[cat] }}
                  />
                  <span className="capitalize text-sm text-white">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Keywords */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Target Keywords (Optional)
            </label>
            <input
              type="text"
              value={options.targetKeywords}
              onChange={(e) => setOptions({ ...options, targetKeywords: e.target.value })}
              placeholder="rolex, submariner, investment, luxury watches"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              disabled={generating}
            />
            <p className="mt-1 text-xs text-gray-500">
              Comma-separated keywords for SEO optimization
            </p>
          </div>

          {/* Include Market Data */}
          <div>
            <label className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4 cursor-pointer hover:bg-gray-700">
              <input
                type="checkbox"
                checked={options.includeData}
                onChange={(e) => setOptions({ ...options, includeData: e.target.checked })}
                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                disabled={generating}
              />
              <div>
                <span className="font-medium text-white">Include Market Data</span>
                <p className="text-xs text-gray-400">
                  Use real market data from your database for unique insights
                </p>
              </div>
            </label>
          </div>

          {/* Tone */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Tone
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'authoritative', label: 'Authoritative', desc: 'Expert and trustworthy' },
                { value: 'professional', label: 'Professional', desc: 'Formal and polished' },
                { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
                { value: 'casual', label: 'Casual', desc: 'Conversational and relaxed' }
              ].map((tone) => (
                <button
                  key={tone.value}
                  onClick={() => setOptions({ ...options, tone: tone.value as any })}
                  disabled={generating}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    options.tone === tone.value
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium text-white">{tone.label}</div>
                  <div className="text-xs text-gray-400">{tone.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Length
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'short', label: 'Short', desc: '800-1200 words' },
                { value: 'medium', label: 'Medium', desc: '1200-1800 words' },
                { value: 'long', label: 'Long', desc: '1800-2500 words' }
              ].map((length) => (
                <button
                  key={length.value}
                  onClick={() => setOptions({ ...options, length: length.value as any })}
                  disabled={generating}
                  className={`rounded-lg border p-3 text-center transition-colors ${
                    options.length === length.value
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium text-white">{length.label}</div>
                  <div className="text-xs text-gray-400">{length.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={generating}
            className="rounded-lg bg-gray-800 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !options.topic.trim()}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="h-5 w-5" />
            {generating ? 'Generating...' : 'Generate Post'}
          </button>
        </div>

        {/* Generation Progress */}
        {generating && (
          <div className="mt-4 rounded-lg border border-purple-500/50 bg-purple-500/10 p-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              <div>
                <p className="font-medium text-purple-300">Generating your blog post...</p>
                <p className="text-sm text-purple-400">
                  This may take 10-30 seconds depending on length and data complexity
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
