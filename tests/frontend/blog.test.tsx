/**
 * Frontend Blog Component Tests
 * Tests React components for blog features
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { expect, describe, it, vi } from 'vitest';
import Blog from '../../the-hub/src/pages/Blog';
import BlogPost from '../../the-hub/src/pages/BlogPost';
import BlogEditor from '../../the-hub/src/pages/BlogEditor';
import BlogCard from '../../the-hub/src/components/blog/BlogCard';

// Mock fetch
global.fetch = vi.fn();

function renderWithRouter(component: React.ReactElement) {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
}

describe('Blog Components', () => {
  describe('Blog Index Page', () => {
    const mockPosts = [
      {
        id: 1,
        title: 'Test Post 1',
        slug: 'test-post-1',
        excerpt: 'This is a test excerpt',
        category: 'watches',
        hero_image_url: 'https://example.com/image.jpg',
        published_at: '2026-01-01T00:00:00Z',
        read_time_minutes: 5,
        view_count: 100,
        tags: ['rolex', 'luxury']
      },
      {
        id: 2,
        title: 'Test Post 2',
        slug: 'test-post-2',
        excerpt: 'Another test excerpt',
        category: 'cars',
        hero_image_url: 'https://example.com/image2.jpg',
        published_at: '2026-01-02T00:00:00Z',
        read_time_minutes: 8,
        view_count: 200,
        tags: ['porsche', 'sports']
      }
    ];

    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: mockPosts,
          count: 2,
          page: 1,
          limit: 10
        })
      });
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should render blog posts', async () => {
      renderWithRouter(<Blog />);

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        expect(screen.getByText('Test Post 2')).toBeInTheDocument();
      });
    });

    it('should display category filters', async () => {
      renderWithRouter(<Blog />);

      await waitFor(() => {
        expect(screen.getByText('Watches')).toBeInTheDocument();
        expect(screen.getByText('Cars')).toBeInTheDocument();
        expect(screen.getByText('Sneakers')).toBeInTheDocument();
      });
    });

    it('should filter posts by category', async () => {
      renderWithRouter(<Blog />);

      await waitFor(() => {
        const watchesFilter = screen.getByText('Watches');
        fireEvent.click(watchesFilter);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('category=watches'),
          expect.any(Object)
        );
      });
    });

    it('should search posts', async () => {
      renderWithRouter(<Blog />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search/i);
        fireEvent.change(searchInput, { target: { value: 'rolex' } });
        fireEvent.submit(searchInput.closest('form')!);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('search=rolex'),
          expect.any(Object)
        );
      });
    });

    it('should paginate results', async () => {
      renderWithRouter(<Blog />);

      await waitFor(() => {
        const nextButton = screen.getByText(/next/i);
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2'),
          expect.any(Object)
        );
      });
    });

    it('should toggle view mode (grid/list)', async () => {
      renderWithRouter(<Blog />);

      await waitFor(() => {
        const viewToggle = screen.getByLabelText(/view mode/i);
        fireEvent.click(viewToggle);
      });

      // Check that layout class changed
      const container = screen.getByTestId('blog-posts-container');
      expect(container).toHaveClass(/list/i);
    });
  });

  describe('BlogCard Component', () => {
    const mockPost = {
      id: 1,
      title: 'Test Blog Post',
      slug: 'test-blog-post',
      excerpt: 'This is a test excerpt for the blog post',
      category: 'watches',
      hero_image_url: 'https://example.com/image.jpg',
      published_at: '2026-01-24T12:00:00Z',
      read_time_minutes: 5,
      view_count: 150,
      tags: ['rolex', 'submariner', 'luxury']
    };

    it('should render post title', () => {
      renderWithRouter(<BlogCard post={mockPost} />);
      expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
    });

    it('should render post excerpt', () => {
      renderWithRouter(<BlogCard post={mockPost} />);
      expect(screen.getByText(/test excerpt/i)).toBeInTheDocument();
    });

    it('should display category badge', () => {
      renderWithRouter(<BlogCard post={mockPost} />);
      expect(screen.getByText('watches')).toBeInTheDocument();
    });

    it('should display read time', () => {
      renderWithRouter(<BlogCard post={mockPost} />);
      expect(screen.getByText('5 min read')).toBeInTheDocument();
    });

    it('should display view count', () => {
      renderWithRouter(<BlogCard post={mockPost} />);
      expect(screen.getByText(/150/)).toBeInTheDocument();
    });

    it('should link to post detail page', () => {
      renderWithRouter(<BlogCard post={mockPost} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/blog/test-blog-post');
    });

    it('should lazy load hero image', () => {
      renderWithRouter(<BlogCard post={mockPost} />);
      const image = screen.getByAltText('Test Blog Post');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('should render tags', () => {
      renderWithRouter(<BlogCard post={mockPost} />);
      expect(screen.getByText('rolex')).toBeInTheDocument();
      expect(screen.getByText('submariner')).toBeInTheDocument();
    });
  });

  describe('BlogPost Detail Page', () => {
    const mockPost = {
      id: 1,
      title: 'Complete Guide to Rolex Submariner',
      slug: 'complete-guide-rolex-submariner',
      content: '# Introduction\n\nThis is the content of the blog post.\n\n## Section 1\n\nMore content here.',
      excerpt: 'A comprehensive guide to the Rolex Submariner',
      category: 'watches',
      hero_image_url: 'https://example.com/rolex.jpg',
      published_at: '2026-01-20T12:00:00Z',
      author_name: 'John Doe',
      read_time_minutes: 12,
      view_count: 500,
      tags: ['rolex', 'submariner', 'diving watches'],
      meta_title: 'Complete Guide to Rolex Submariner | The Hub',
      meta_description: 'Everything you need to know about the Rolex Submariner'
    };

    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPost
      });
    });

    it('should render post title', async () => {
      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        expect(screen.getByText('Complete Guide to Rolex Submariner')).toBeInTheDocument();
      });
    });

    it('should render markdown content', async () => {
      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        expect(screen.getByText('Introduction')).toBeInTheDocument();
        expect(screen.getByText('Section 1')).toBeInTheDocument();
      });
    });

    it('should display author and date', async () => {
      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
        expect(screen.getByText(/Jan 20, 2026/i)).toBeInTheDocument();
      });
    });

    it('should render table of contents', async () => {
      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        expect(screen.getByText('Table of Contents')).toBeInTheDocument();
        expect(screen.getByText('Introduction')).toBeInTheDocument();
        expect(screen.getByText('Section 1')).toBeInTheDocument();
      });
    });

    it('should display related posts', async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/related')) {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: 2, title: 'Related Post 1', slug: 'related-1' },
              { id: 3, title: 'Related Post 2', slug: 'related-2' }
            ])
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockPost
        });
      });

      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        expect(screen.getByText('Related Posts')).toBeInTheDocument();
        expect(screen.getByText('Related Post 1')).toBeInTheDocument();
      });
    });

    it('should show email subscription form', async () => {
      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        expect(screen.getByText(/subscribe/i)).toBeInTheDocument();
      });
    });

    it('should handle social sharing', async () => {
      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        const twitterButton = screen.getByLabelText(/share on twitter/i);
        expect(twitterButton).toBeInTheDocument();
      });
    });
  });

  describe('BlogEditor Component', () => {
    it('should render editor fields', () => {
      renderWithRouter(<BlogEditor />);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/excerpt/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    });

    it('should show markdown preview', async () => {
      renderWithRouter(<BlogEditor />);

      const contentField = screen.getByLabelText(/content/i);
      fireEvent.change(contentField, { target: { value: '# Test Heading\n\nTest content' } });

      await waitFor(() => {
        expect(screen.getByText('Test Heading')).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      renderWithRouter(<BlogEditor />);

      const submitButton = screen.getByText(/publish/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });

    it('should show AI generation button', () => {
      renderWithRouter(<BlogEditor />);

      const aiButton = screen.getByText(/generate with ai/i);
      expect(aiButton).toBeInTheDocument();
    });

    it('should open AI generation modal', async () => {
      renderWithRouter(<BlogEditor />);

      const aiButton = screen.getByText(/generate with ai/i);
      fireEvent.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText(/ai blog generator/i)).toBeInTheDocument();
      });
    });

    it('should handle image upload', async () => {
      renderWithRouter(<BlogEditor />);

      const fileInput = screen.getByLabelText(/hero image/i);
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument();
      });
    });

    it('should save draft', async () => {
      renderWithRouter(<BlogEditor />);

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Draft Post' } });

      const saveDraftButton = screen.getByText(/save draft/i);
      fireEvent.click(saveDraftButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/blog/posts'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Draft Post')
          })
        );
      });
    });
  });

  describe('Email Subscription', () => {
    it('should validate email format', async () => {
      renderWithRouter(<BlogPost />);

      await waitFor(async () => {
        const emailInput = screen.getByPlaceholderText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

        const subscribeButton = screen.getByText(/subscribe/i);
        fireEvent.click(subscribeButton);

        await waitFor(() => {
          expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
        });
      });
    });

    it('should submit valid email', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Successfully subscribed' })
      });

      renderWithRouter(<BlogPost />);

      await waitFor(async () => {
        const emailInput = screen.getByPlaceholderText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        const subscribeButton = screen.getByText(/subscribe/i);
        fireEvent.click(subscribeButton);

        await waitFor(() => {
          expect(screen.getByText(/successfully subscribed/i)).toBeInTheDocument();
        });
      });
    });
  });

  describe('SEO Meta Tags', () => {
    it('should render meta tags in document head', async () => {
      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        const title = document.querySelector('title');
        expect(title?.textContent).toContain('Complete Guide to Rolex Submariner');

        const metaDescription = document.querySelector('meta[name="description"]');
        expect(metaDescription?.getAttribute('content')).toContain('Everything you need to know');
      });
    });

    it('should render Open Graph tags', async () => {
      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        const ogTitle = document.querySelector('meta[property="og:title"]');
        expect(ogTitle?.getAttribute('content')).toBeTruthy();

        const ogImage = document.querySelector('meta[property="og:image"]');
        expect(ogImage?.getAttribute('content')).toContain('rolex.jpg');
      });
    });

    it('should render Twitter Card tags', async () => {
      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        const twitterCard = document.querySelector('meta[name="twitter:card"]');
        expect(twitterCard?.getAttribute('content')).toBe('summary_large_image');
      });
    });
  });
});
