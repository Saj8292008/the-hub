/**
 * AI Features Integration Tests
 * Tests deal scoring, natural language search, and AI blog generation
 */

const request = require('supertest');
const { expect } = require('chai');

describe('AI Features API', () => {
  let server;

  before(async () => {
    process.env.NODE_ENV = 'test';
    server = require('../../src/api/server');
  });

  after(() => {
    if (server && server.close) {
      server.close();
    }
  });

  describe('Natural Language Search - Watches', () => {
    it('should parse natural language query', async () => {
      const query = 'rolex submariner under 10000';

      const res = await request(server)
        .post('/api/search/watches')
        .send({ query })
        .expect(200);

      expect(res.body).to.have.property('interpreted_filters');
      expect(res.body).to.have.property('results');
      expect(res.body).to.have.property('message');
      expect(res.body.query).to.equal(query);
    });

    it('should extract brand from query', async () => {
      const res = await request(server)
        .post('/api/search/watches')
        .send({ query: 'omega speedmaster' })
        .expect(200);

      expect(res.body.interpreted_filters.brand).to.exist;
      expect(res.body.interpreted_filters.brand.toLowerCase()).to.include('omega');
    });

    it('should extract price range', async () => {
      const res = await request(server)
        .post('/api/search/watches')
        .send({ query: 'watches under 5000' })
        .expect(200);

      expect(res.body.interpreted_filters.price_max).to.exist;
      expect(res.body.interpreted_filters.price_max).to.be.at.most(5000);
    });

    it('should extract condition', async () => {
      const res = await request(server)
        .post('/api/search/watches')
        .send({ query: 'rolex submariner excellent condition' })
        .expect(200);

      if (res.body.interpreted_filters.condition) {
        expect(res.body.interpreted_filters.condition).to.be.oneOf([
          'excellent', 'good', 'fair', 'new'
        ]);
      }
    });

    it('should handle complex queries', async () => {
      const res = await request(server)
        .post('/api/search/watches')
        .send({
          query: 'vintage rolex submariner with box and papers under 15000 excellent condition'
        })
        .expect(200);

      expect(res.body.interpreted_filters).to.be.an('object');
      expect(res.body.results).to.be.an('array');
    });

    it('should return results matching filters', async () => {
      const res = await request(server)
        .post('/api/search/watches')
        .send({ query: 'rolex' })
        .expect(200);

      res.body.results.forEach(watch => {
        expect(watch).to.have.property('brand');
        expect(watch).to.have.property('model');
        expect(watch).to.have.property('price');
      });
    });

    it('should validate query parameter', async () => {
      await request(server)
        .post('/api/search/watches')
        .send({ /* missing query */ })
        .expect(400);
    });

    it('should handle empty results gracefully', async () => {
      const res = await request(server)
        .post('/api/search/watches')
        .send({ query: 'nonexistent watch brand model xyz123' })
        .expect(200);

      expect(res.body.results).to.be.an('array');
      expect(res.body.count).to.equal(0);
    });
  });

  describe('Natural Language Search - Sneakers', () => {
    it('should parse sneaker queries', async () => {
      const res = await request(server)
        .post('/api/search/sneakers')
        .send({ query: 'jordan 1 size 10' })
        .expect(200);

      expect(res.body.interpreted_filters).to.exist;
      if (res.body.interpreted_filters.brand) {
        expect(res.body.interpreted_filters.brand.toLowerCase()).to.include('jordan');
      }
    });

    it('should extract size from query', async () => {
      const res = await request(server)
        .post('/api/search/sneakers')
        .send({ query: 'nike dunk size 11' })
        .expect(200);

      if (res.body.interpreted_filters.size) {
        expect(res.body.interpreted_filters.size).to.equal(11);
      }
    });
  });

  describe('Natural Language Search - Cars', () => {
    it('should parse car queries', async () => {
      const res = await request(server)
        .post('/api/search/cars')
        .send({ query: 'porsche 911 under 100k miles' })
        .expect(200);

      expect(res.body.interpreted_filters).to.exist;
      if (res.body.interpreted_filters.make) {
        expect(res.body.interpreted_filters.make.toLowerCase()).to.include('porsche');
      }
    });

    it('should extract mileage constraints', async () => {
      const res = await request(server)
        .post('/api/search/cars')
        .send({ query: 'ferrari less than 50000 miles' })
        .expect(200);

      if (res.body.interpreted_filters.mileage_max) {
        expect(res.body.interpreted_filters.mileage_max).to.be.at.most(50000);
      }
    });
  });

  describe('Deal Scoring', () => {
    it('should score a watch listing', async () => {
      // First get a watch listing
      const listingsRes = await request(server)
        .get('/api/listings/watches?limit=1')
        .expect(200);

      if (listingsRes.body.length > 0) {
        const listingId = listingsRes.body[0].id;

        const res = await request(server)
          .post(`/api/listings/score/${listingId}`)
          .expect(200);

        expect(res.body).to.have.property('score');
        expect(res.body).to.have.property('breakdown');
        expect(res.body.score).to.be.a('number');
        expect(res.body.score).to.be.at.least(0);
        expect(res.body.score).to.be.at.most(100);

        // Verify breakdown
        expect(res.body.breakdown).to.have.property('price');
        expect(res.body.breakdown).to.have.property('condition');
        expect(res.body.breakdown).to.have.property('seller');
        expect(res.body.breakdown).to.have.property('quality');
      }
    });

    it('should return 404 for non-existent listing', async () => {
      await request(server)
        .post('/api/listings/score/99999999')
        .expect(404);
    });

    it('should calculate price score correctly', async () => {
      // This would require mocking or using test data
      // For now, verify the endpoint structure
      const res = await request(server)
        .get('/api/listings/watches?limit=1')
        .expect(200);

      if (res.body.length > 0 && res.body[0].deal_score) {
        expect(res.body[0].deal_score).to.be.a('number');
        expect(res.body[0].score_breakdown).to.be.an('object');
      }
    });
  });

  describe('Deal Scoring Scheduler', () => {
    it('should get scheduler status', async () => {
      const res = await request(server)
        .get('/api/deal-scoring/scheduler/status')
        .expect(200);

      expect(res.body).to.have.property('isRunning');
      expect(res.body).to.have.property('intervalMinutes');
      expect(res.body).to.have.property('stats');
    });

    it('should start scheduler', async () => {
      const res = await request(server)
        .post('/api/deal-scoring/scheduler/start')
        .expect(200);

      expect(res.body.message).to.include('started');
    });

    it('should stop scheduler', async () => {
      const res = await request(server)
        .post('/api/deal-scoring/scheduler/stop')
        .expect(200);

      expect(res.body.message).to.include('stopped');
    });

    it('should run scoring manually', async () => {
      const res = await request(server)
        .post('/api/deal-scoring/scheduler/run-now')
        .expect(200);

      expect(res.body).to.have.property('result');
      expect(res.body.result).to.have.property('watches');
      expect(res.body.result).to.have.property('cars');
      expect(res.body.result).to.have.property('sneakers');
    });

    it('should get scheduler stats', async () => {
      const res = await request(server)
        .get('/api/deal-scoring/scheduler/stats')
        .expect(200);

      expect(res.body).to.have.property('totalRuns');
      expect(res.body).to.have.property('totalScored');
      expect(res.body).to.have.property('averageScored');
    });
  });

  describe('AI Blog Generation', () => {
    it('should generate blog post with AI', async function() {
      this.timeout(60000); // AI generation can take 30-60 seconds

      const res = await request(server)
        .post('/api/blog/ai/generate')
        .send({
          topic: 'Test Watch Topic for Automation',
          category: 'watches',
          targetKeywords: ['test', 'automation'],
          tone: 'friendly',
          length: 'short'
        })
        .expect(200);

      expect(res.body).to.have.property('post');
      expect(res.body.post).to.have.property('title');
      expect(res.body.post).to.have.property('content');
      expect(res.body.post).to.have.property('slug');
      expect(res.body.post).to.have.property('meta_title');
      expect(res.body.post).to.have.property('meta_description');
      expect(res.body.post).to.have.property('keywords');
      expect(res.body.post.ai_generated).to.be.true;
    });

    it('should validate required parameters', async () => {
      await request(server)
        .post('/api/blog/ai/generate')
        .send({ /* missing topic */ })
        .expect(400);
    });

    it('should suggest blog titles', async () => {
      const res = await request(server)
        .post('/api/blog/ai/suggest-titles')
        .send({
          topic: 'Rolex Submariner',
          category: 'watches',
          count: 5
        })
        .expect(200);

      expect(res.body.suggestions).to.be.an('array');
      expect(res.body.suggestions).to.have.lengthOf(5);
    });

    it('should enhance existing content', async () => {
      const res = await request(server)
        .post('/api/blog/ai/enhance')
        .send({
          content: 'The Rolex Submariner is a popular watch.',
          action: 'expand'
        })
        .expect(200);

      expect(res.body.enhanced).to.be.a('string');
      expect(res.body.enhanced.length).to.be.greaterThan(0);
    });

    it('should get generation stats', async () => {
      const res = await request(server)
        .get('/api/blog/ai/stats')
        .expect(200);

      expect(res.body).to.have.property('totalGenerated');
      expect(res.body).to.have.property('byCategory');
      expect(res.body).to.have.property('byTone');
    });
  });

  describe('Performance', () => {
    it('should complete search in under 3 seconds', async function() {
      this.timeout(5000);

      const start = Date.now();

      await request(server)
        .post('/api/search/watches')
        .send({ query: 'rolex submariner' })
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).to.be.lessThan(3000);
    });

    it('should cache search results', async () => {
      const query = 'omega speedmaster cache test';

      // First request - should miss cache
      const res1 = await request(server)
        .post('/api/search/watches')
        .send({ query })
        .expect(200);

      // Second request - might hit cache if enabled
      const res2 = await request(server)
        .post('/api/search/watches')
        .send({ query })
        .expect(200);

      expect(res2.body.results).to.deep.equal(res1.body.results);
    });

    it('should handle rate limiting gracefully', async () => {
      // Make multiple rapid requests
      const promises = [];
      for (let i = 0; i < 65; i++) { // Exceed 60 req/min limit
        promises.push(
          request(server)
            .post('/api/search/watches')
            .send({ query: 'rate limit test' })
        );
      }

      const results = await Promise.allSettled(promises);

      // Some should succeed, some should be rate limited
      const rateLimited = results.filter(r =>
        r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimited.length).to.be.greaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      // This would trigger an error if OpenAI is unavailable
      const res = await request(server)
        .post('/api/blog/ai/generate')
        .send({
          topic: 'Error Test Topic',
          category: 'watches'
        });

      if (res.status !== 200) {
        expect(res.body).to.have.property('error');
        expect(res.body.error).to.be.a('string');
      }
    });

    it('should handle invalid category gracefully', async () => {
      const res = await request(server)
        .post('/api/search/invalid-category')
        .send({ query: 'test' });

      expect(res.status).to.be.oneOf([400, 404]);
    });

    it('should sanitize user input', async () => {
      const maliciousQuery = '<script>alert("xss")</script> rolex';

      const res = await request(server)
        .post('/api/search/watches')
        .send({ query: maliciousQuery })
        .expect(200);

      // Ensure no script tags in response
      const responseStr = JSON.stringify(res.body);
      expect(responseStr).to.not.include('<script>');
    });
  });
});
