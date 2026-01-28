#!/usr/bin/env node

/**
 * Performance Benchmark Script
 * Tests API endpoints and measures response times
 */

const http = require('http');

class PerformanceBenchmarker {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.results = [];
    this.colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m'
    };
  }

  log(message, color = 'reset') {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  async request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseURL);
      const options = {
        hostname: url.hostname,
        port: url.port || 3000,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const startTime = Date.now();
      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          const duration = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            duration,
            headers: res.headers,
            data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  async benchmarkEndpoint(name, path, method = 'GET', body = null, iterations = 10) {
    this.log(`\n📊 Benchmarking: ${name}`, 'blue');
    this.log(`   Method: ${method} ${path}`, 'blue');
    this.log(`   Iterations: ${iterations}`, 'blue');

    const durations = [];
    let errors = 0;

    for (let i = 0; i < iterations; i++) {
      try {
        const result = await this.request(path, method, body);

        if (result.statusCode >= 200 && result.statusCode < 300) {
          durations.push(result.duration);
          process.stdout.write('.');
        } else {
          errors++;
          process.stdout.write('E');
        }
      } catch (error) {
        errors++;
        process.stdout.write('F');
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('');

    if (durations.length === 0) {
      this.log('   ❌ All requests failed', 'red');
      this.results.push({
        name,
        path,
        method,
        failed: true,
        errors
      });
      return;
    }

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const median = durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)];

    const result = {
      name,
      path,
      method,
      iterations,
      successful: durations.length,
      errors,
      avg,
      min,
      max,
      median,
      failed: false
    };

    this.results.push(result);

    // Display results
    this.log(`   ✅ Successful: ${durations.length}/${iterations}`, 'green');
    if (errors > 0) {
      this.log(`   ❌ Errors: ${errors}`, 'red');
    }
    this.log(`   ⏱️  Average: ${avg.toFixed(2)}ms`, avg < 200 ? 'green' : avg < 500 ? 'yellow' : 'red');
    this.log(`   📈 Min/Max: ${min}ms / ${max}ms`);
    this.log(`   📊 Median: ${median}ms`);

    if (avg < 100) {
      this.log(`   🎯 Excellent performance!`, 'green');
    } else if (avg < 200) {
      this.log(`   ✅ Good performance`, 'green');
    } else if (avg < 500) {
      this.log(`   ⚠️  Moderate performance`, 'yellow');
    } else {
      this.log(`   ❌ Slow performance - optimization needed`, 'red');
    }
  }

  async runBenchmarks() {
    this.log('\n====================================', 'blue');
    this.log('  Performance Benchmark', 'blue');
    this.log('====================================\n', 'blue');

    this.log(`🎯 Target: ${this.baseURL}`, 'blue');
    this.log('');

    // Check server health first
    this.log('🔍 Checking server health...', 'blue');
    try {
      const health = await this.request('/health');
      if (health.statusCode === 200) {
        this.log('✅ Server is healthy\n', 'green');
      } else {
        this.log(`⚠️  Server returned status: ${health.statusCode}\n`, 'yellow');
      }
    } catch (error) {
      this.log('❌ Server is not responding. Please start the server first.\n', 'red');
      this.log(`   Start server: npm run dev\n`, 'yellow');
      process.exit(1);
    }

    // Blog Endpoints
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    this.log('Blog API Endpoints', 'blue');
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

    await this.benchmarkEndpoint(
      'Get Blog Posts (List)',
      '/api/blog/posts',
      'GET'
    );

    await this.benchmarkEndpoint(
      'Get Blog Posts (Paginated)',
      '/api/blog/posts?page=1&limit=10',
      'GET'
    );

    await this.benchmarkEndpoint(
      'Get Blog Posts (Category Filter)',
      '/api/blog/posts?category=watches',
      'GET'
    );

    await this.benchmarkEndpoint(
      'Get Blog Categories',
      '/api/blog/categories',
      'GET'
    );

    // AI Features
    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    this.log('AI Features', 'blue');
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

    await this.benchmarkEndpoint(
      'Natural Language Search (Watches)',
      '/api/search/watches',
      'POST',
      { query: 'rolex submariner under 10000' },
      5 // Fewer iterations for AI endpoints
    );

    await this.benchmarkEndpoint(
      'Deal Scoring Status',
      '/api/deal-scoring/scheduler/status',
      'GET'
    );

    // Performance Monitoring
    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    this.log('Performance Monitoring', 'blue');
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

    await this.benchmarkEndpoint(
      'Performance Summary',
      '/api/admin/performance/summary',
      'GET'
    );

    await this.benchmarkEndpoint(
      'Cache Statistics',
      '/api/admin/cache/stats',
      'GET'
    );

    // SEO Endpoints
    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    this.log('SEO Endpoints', 'blue');
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

    await this.benchmarkEndpoint(
      'Sitemap Generation',
      '/sitemap.xml',
      'GET'
    );

    await this.benchmarkEndpoint(
      'RSS Feed',
      '/rss.xml',
      'GET'
    );

    this.printReport();
  }

  printReport() {
    console.log('\n====================================');
    this.log('  Benchmark Report', 'blue');
    console.log('====================================\n');

    const successful = this.results.filter(r => !r.failed);
    const failed = this.results.filter(r => r.failed);

    if (successful.length > 0) {
      // Sort by average time
      const sorted = [...successful].sort((a, b) => a.avg - b.avg);

      this.log('🏆 Fastest Endpoints:', 'green');
      sorted.slice(0, 5).forEach((r, i) => {
        this.log(`   ${i + 1}. ${r.name}: ${r.avg.toFixed(2)}ms avg`, 'green');
      });

      console.log('');
      this.log('🐌 Slowest Endpoints:', 'yellow');
      sorted.slice(-5).reverse().forEach((r, i) => {
        const color = r.avg > 500 ? 'red' : 'yellow';
        this.log(`   ${i + 1}. ${r.name}: ${r.avg.toFixed(2)}ms avg`, color);
      });

      // Calculate overall stats
      const allDurations = successful.map(r => r.avg);
      const overallAvg = allDurations.reduce((a, b) => a + b, 0) / allDurations.length;

      console.log('');
      this.log('📊 Overall Statistics:', 'blue');
      console.log(`   Endpoints tested: ${this.results.length}`);
      console.log(`   Successful: ${successful.length}`);
      console.log(`   Failed: ${failed.length}`);
      console.log(`   Overall average: ${overallAvg.toFixed(2)}ms`);

      // Performance rating
      console.log('');
      if (overallAvg < 200) {
        this.log('✅ Performance Rating: EXCELLENT', 'green');
        this.log('   All endpoints meet performance targets!', 'green');
      } else if (overallAvg < 500) {
        this.log('✅ Performance Rating: GOOD', 'green');
        this.log('   Most endpoints perform well', 'green');
      } else if (overallAvg < 1000) {
        this.log('⚠️  Performance Rating: MODERATE', 'yellow');
        this.log('   Consider optimizing slower endpoints', 'yellow');
      } else {
        this.log('❌ Performance Rating: NEEDS IMPROVEMENT', 'red');
        this.log('   Significant optimization required', 'red');
      }
    }

    if (failed.length > 0) {
      console.log('');
      this.log(`❌ Failed Endpoints (${failed.length}):`, 'red');
      failed.forEach((r, i) => {
        this.log(`   ${i + 1}. ${r.name} (${r.method} ${r.path})`, 'red');
      });
    }

    // Recommendations
    console.log('');
    this.log('💡 Recommendations:', 'blue');

    const slow = successful.filter(r => r.avg > 500);
    if (slow.length > 0) {
      this.log(`   • Optimize ${slow.length} slow endpoint(s) (>500ms):`, 'yellow');
      slow.forEach(r => {
        console.log(`     - ${r.name}: ${r.avg.toFixed(2)}ms`);
      });
    }

    const withErrors = successful.filter(r => r.errors > 0);
    if (withErrors.length > 0) {
      this.log(`   • Investigate ${withErrors.length} endpoint(s) with errors:`, 'yellow');
      withErrors.forEach(r => {
        console.log(`     - ${r.name}: ${r.errors} error(s)`);
      });
    }

    if (slow.length === 0 && withErrors.length === 0 && failed.length === 0) {
      this.log('   • No issues found - keep up the good work!', 'green');
    }

    console.log('');

    // Save results to file
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `benchmark-results-${timestamp}.json`;

    fs.writeFileSync(filename, JSON.stringify({
      timestamp: new Date().toISOString(),
      baseURL: this.baseURL,
      results: this.results
    }, null, 2));

    this.log(`📄 Results saved to: ${filename}`, 'blue');
    console.log('');
  }
}

// Run benchmarks
const baseURL = process.argv[2] || 'http://localhost:3000';
const benchmarker = new PerformanceBenchmarker(baseURL);

benchmarker.runBenchmarks().catch(error => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
