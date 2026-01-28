/**
 * Schema Markup Component
 * JSON-LD structured data for SEO
 */

import { Helmet } from 'react-helmet-async';
import type { BlogPost } from '../../types/blog';

interface SchemaMarkupProps {
  post: BlogPost;
}

export default function SchemaMarkup({ post }: SchemaMarkupProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.hero_image_url ? [post.hero_image_url] : [],
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author_name || 'The Hub',
      url: window.location.origin,
    },
    publisher: {
      '@type': 'Organization',
      name: 'The Hub',
      url: window.location.origin,
      logo: {
        '@type': 'ImageObject',
        url: `${window.location.origin}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${window.location.origin}/blog/${post.slug}`,
    },
    keywords: post.keywords?.join(', ') || '',
    articleSection: post.category,
    wordCount: post.content.split(/\s+/).length,
    ...(post.read_time_minutes && {
      timeRequired: `PT${post.read_time_minutes}M`,
    }),
  };

  // Add BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: window.location.origin,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${window.location.origin}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${window.location.origin}/blog/${post.slug}`,
      },
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
}
