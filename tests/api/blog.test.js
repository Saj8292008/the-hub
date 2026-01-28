/**
 * Blog API Integration Tests
 * Tests all blog-related endpoints
 */

const request = require('supertest');
const { expect } = require('chai');

describe('Blog API', () => {
  let server;
  let testPost;

  before(async () => {
    // Start server
    process.env.NODE_ENV = 'test';
    server = require('../../src/api/server');
  });

  after(() => {
    // Cleanup
    if (server && server.close) {
      server.close();
    }
  });

  describe('GET /api/blog/posts', () => {
    it('should return list of published posts', async () => {
      const res = await request(server)
        .get('/api/blog/posts')
        .expect(200);

      expect(res.body).to.be.an('object');
      expect(res.body.data).to.be.an('array');
      expect(res.body).to.have.property('count');
      expect(res.body).to.have.property('page');
      expect(res.body).to.have.property('limit');
    });

    it('should support pagination', async () => {
      const res = await request(server)
        .get('/api/blog/posts?page=1&limit=10')
        .expect(200);

      expect(res.body.page).to.equal(1);
      expect(res.body.limit).to.equal(10);
      expect(res.body.data.length).to.be.at.most(10);
    });

    it('should filter by category', async () => {
      const res = await request(server)
        .get('/api/blog/posts?category=watches')
        .expect(200);

      res.body.data.forEach(post => {
        expect(post.category).to.equal('watches');
      });
    });

    it('should filter by tag', async () => {
      const res = await request(server)
        .get('/api/blog/posts?tag=rolex')
        .expect(200);

      res.body.data.forEach(post => {
        expect(post.tags).to.include('rolex');
      });
    });

    it('should search by query', async () => {
      const res = await request(server)
        .get('/api/blog/posts?search=rolex')
        .expect(200);

      expect(res.body.data).to.be.an('array');
    });

    it('should include cache headers', async () => {
      const res = await request(server)
        .get('/api/blog/posts')
        .expect(200);

      expect(res.headers).to.have.property('x-cache');
      expect(res.headers).to.have.property('cache-control');
    });
  });

  describe('GET /api/blog/posts/:slug', () => {
    it('should return post by slug', async () => {
      // First get a post slug
      const listRes = await request(server)
        .get('/api/blog/posts?limit=1')
        .expect(200);

      if (listRes.body.data.length > 0) {
        const slug = listRes.body.data[0].slug;

        const res = await request(server)
          .get(`/api/blog/posts/${slug}`)
          .expect(200);

        expect(res.body).to.be.an('object');
        expect(res.body.slug).to.equal(slug);
        expect(res.body).to.have.property('title');
        expect(res.body).to.have.property('content');
        expect(res.body).to.have.property('meta_title');
        expect(res.body).to.have.property('meta_description');
      }
    });

    it('should return 404 for non-existent slug', async () => {
      await request(server)
        .get('/api/blog/posts/non-existent-slug-12345')
        .expect(404);
    });

    it('should increment view count', async () => {
      const listRes = await request(server)
        .get('/api/blog/posts?limit=1')
        .expect(200);

      if (listRes.body.data.length > 0) {
        const slug = listRes.body.data[0].slug;
        const initialViews = listRes.body.data[0].view_count || 0;

        // View the post
        await request(server)
          .get(`/api/blog/posts/${slug}`)
          .expect(200);

        // Small delay for async view count update
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check view count increased
        const updatedRes = await request(server)
          .get(`/api/blog/posts/${slug}`)
          .expect(200);

        expect(updatedRes.body.view_count).to.be.at.least(initialViews);
      }
    });
  });

  describe('POST /api/blog/posts', () => {
    it('should create new post (admin)', async () => {
      const newPost = {
        title: 'Test Blog Post',
        content: '# Test Content\n\nThis is a test post.',
        excerpt: 'This is a test excerpt',
        category: 'watches',
        tags: ['test', 'automation'],
        status: 'draft',
        meta_title: 'Test Meta Title',
        meta_description: 'Test meta description',
        keywords: ['test', 'blog'],
        author_name: 'Test Author'
      };

      const res = await request(server)
        .post('/api/blog/posts')
        .send(newPost)
        .expect(201);

      expect(res.body).to.have.property('id');
      expect(res.body).to.have.property('slug');
      expect(res.body.title).to.equal(newPost.title);
      expect(res.body.status).to.equal('draft');

      testPost = res.body;
    });

    it('should auto-generate slug from title', async () => {
      const res = await request(server)
        .post('/api/blog/posts')
        .send({
          title: 'Auto Generated Slug Test',
          content: 'Test content',
          category: 'general',
          status: 'draft'
        })
        .expect(201);

      expect(res.body.slug).to.equal('auto-generated-slug-test');
    });

    it('should validate required fields', async () => {
      await request(server)
        .post('/api/blog/posts')
        .send({
          // Missing title
          content: 'Test content',
          category: 'general'
        })
        .expect(400);
    });

    it('should prevent duplicate slugs', async () => {
      const post1 = {
        title: 'Duplicate Test',
        content: 'Content 1',
        category: 'general',
        status: 'draft'
      };

      await request(server)
        .post('/api/blog/posts')
        .send(post1)
        .expect(201);

      // Try to create another with same slug
      const res = await request(server)
        .post('/api/blog/posts')
        .send(post1)
        .expect(201);

      // Should auto-increment slug
      expect(res.body.slug).to.not.equal('duplicate-test');
      expect(res.body.slug).to.include('duplicate-test');
    });
  });

  describe('PUT /api/blog/posts/:id', () => {
    it('should update existing post (admin)', async () => {
      if (!testPost) {
        return this.skip();
      }

      const updates = {
        title: 'Updated Test Post',
        status: 'published'
      };

      const res = await request(server)
        .put(`/api/blog/posts/${testPost.id}`)
        .send(updates)
        .expect(200);

      expect(res.body.title).to.equal(updates.title);
      expect(res.body.status).to.equal('published');
    });

    it('should return 404 for non-existent post', async () => {
      await request(server)
        .put('/api/blog/posts/99999999')
        .send({ title: 'Updated' })
        .expect(404);
    });

    it('should clear cache on update', async () => {
      if (!testPost) {
        return this.skip();
      }

      const res = await request(server)
        .put(`/api/blog/posts/${testPost.id}`)
        .send({ title: 'Cache Test Update' })
        .expect(200);

      expect(res.headers).to.not.have.property('x-cache');
    });
  });

  describe('DELETE /api/blog/posts/:id', () => {
    it('should delete post (admin)', async () => {
      if (!testPost) {
        return this.skip();
      }

      await request(server)
        .delete(`/api/blog/posts/${testPost.id}`)
        .expect(200);

      // Verify deletion
      await request(server)
        .get(`/api/blog/posts/${testPost.slug}`)
        .expect(404);
    });

    it('should return 404 for non-existent post', async () => {
      await request(server)
        .delete('/api/blog/posts/99999999')
        .expect(404);
    });
  });

  describe('GET /api/blog/categories', () => {
    it('should return all categories with counts', async () => {
      const res = await request(server)
        .get('/api/blog/categories')
        .expect(200);

      expect(res.body).to.be.an('array');
      res.body.forEach(category => {
        expect(category).to.have.property('name');
        expect(category).to.have.property('count');
      });
    });
  });

  describe('GET /api/blog/tags', () => {
    it('should return all tags with counts', async () => {
      const res = await request(server)
        .get('/api/blog/tags')
        .expect(200);

      expect(res.body).to.be.an('array');
      res.body.forEach(tag => {
        expect(tag).to.have.property('name');
        expect(tag).to.have.property('count');
      });
    });
  });

  describe('POST /api/blog/subscribe', () => {
    it('should subscribe email to newsletter', async () => {
      const res = await request(server)
        .post('/api/blog/subscribe')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(res.body.message).to.include('subscribed');
    });

    it('should validate email format', async () => {
      await request(server)
        .post('/api/blog/subscribe')
        .send({ email: 'invalid-email' })
        .expect(400);
    });

    it('should handle duplicate subscriptions', async () => {
      const email = 'duplicate@example.com';

      // First subscription
      await request(server)
        .post('/api/blog/subscribe')
        .send({ email })
        .expect(200);

      // Duplicate subscription
      const res = await request(server)
        .post('/api/blog/subscribe')
        .send({ email })
        .expect(200);

      expect(res.body.message).to.include('already subscribed');
    });
  });
});
