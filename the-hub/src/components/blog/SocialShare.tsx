/**
 * Social Share Component
 * Social media sharing buttons for blog posts
 */

import { Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { BlogPost } from '../../types/blog';

interface SocialShareProps {
  post: BlogPost;
}

export default function SocialShare({ post }: SocialShareProps) {
  const url = `${window.location.origin}/blog/${post.slug}`;
  const title = post.title;
  const text = post.excerpt || post.title;

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  };

  const handleShare = async (platform: string) => {
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
      return;
    }

    // Open share URL in new window
    const shareUrl = shareLinks[platform as keyof typeof shareLinks];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  // Check if Web Share API is available
  const canUseWebShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: post.title,
        text: post.excerpt || '',
        url: url,
      });
    } catch (error) {
      // User cancelled or share failed
      console.log('Share cancelled');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-400">Share:</span>

      {/* Native Share (Mobile) */}
      {canUseWebShare && (
        <button
          onClick={handleNativeShare}
          className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 lg:hidden"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      )}

      {/* Social Share Buttons (Desktop) */}
      <div className="hidden flex-wrap gap-2 lg:flex">
        <button
          onClick={() => handleShare('twitter')}
          className="rounded-lg bg-[#1DA1F2] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          title="Share on Twitter"
        >
          𝕏 Twitter
        </button>

        <button
          onClick={() => handleShare('linkedin')}
          className="rounded-lg bg-[#0A66C2] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          title="Share on LinkedIn"
        >
          LinkedIn
        </button>

        <button
          onClick={() => handleShare('facebook')}
          className="rounded-lg bg-[#1877F2] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          title="Share on Facebook"
        >
          Facebook
        </button>

        <button
          onClick={() => handleShare('reddit')}
          className="rounded-lg bg-[#FF4500] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          title="Share on Reddit"
        >
          Reddit
        </button>

        <button
          onClick={() => handleShare('copy')}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          title="Copy link"
        >
          Copy Link
        </button>
      </div>
    </div>
  );
}
