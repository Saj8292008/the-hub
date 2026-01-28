/**
 * Image Optimization Service
 * Handles image resizing, format conversion, and optimization
 */

const sharp = require('sharp');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

class ImageOptimizationService {
  constructor() {
    this.cacheDir = path.join(__dirname, '../../cache/images');
    this.maxWidth = 2000;
    this.maxHeight = 2000;
    this.quality = 85;
  }

  /**
   * Initialize cache directory
   */
  async init() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log('✅ Image optimization cache initialized');
    } catch (error) {
      console.error('❌ Failed to initialize image cache:', error);
    }
  }

  /**
   * Optimize image from URL or buffer
   * @param {string|Buffer} input - Image URL or buffer
   * @param {Object} options - Optimization options
   * @returns {Promise<Buffer>} - Optimized image buffer
   */
  async optimizeImage(input, options = {}) {
    const {
      width = null,
      height = null,
      format = 'webp',
      quality = this.quality,
      fit = 'cover'
    } = options;

    try {
      let imageBuffer;

      // If input is URL, fetch it
      if (typeof input === 'string' && input.startsWith('http')) {
        const response = await fetch(input);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } else if (Buffer.isBuffer(input)) {
        imageBuffer = input;
      } else {
        throw new Error('Invalid input: must be URL or Buffer');
      }

      // Process image with sharp
      let image = sharp(imageBuffer);

      // Resize if dimensions provided
      if (width || height) {
        image = image.resize({
          width: width ? Math.min(width, this.maxWidth) : null,
          height: height ? Math.min(height, this.maxHeight) : null,
          fit,
          withoutEnlargement: true
        });
      }

      // Convert format and optimize
      switch (format) {
        case 'webp':
          image = image.webp({ quality });
          break;
        case 'jpeg':
        case 'jpg':
          image = image.jpeg({ quality, progressive: true });
          break;
        case 'png':
          image = image.png({ compressionLevel: 9 });
          break;
        default:
          image = image.webp({ quality });
      }

      return await image.toBuffer();
    } catch (error) {
      console.error('Image optimization error:', error);
      throw error;
    }
  }

  /**
   * Generate responsive image sizes
   * @param {string|Buffer} input - Image URL or buffer
   * @returns {Promise<Object>} - Object with different image sizes
   */
  async generateResponsiveSizes(input) {
    const sizes = {
      thumbnail: { width: 300, height: 200 },
      medium: { width: 800, height: 600 },
      large: { width: 1200, height: 800 },
      original: { width: 2000, height: null }
    };

    const results = {};

    for (const [key, dimensions] of Object.entries(sizes)) {
      try {
        results[key] = await this.optimizeImage(input, {
          ...dimensions,
          format: 'webp',
          quality: key === 'thumbnail' ? 75 : 85
        });
      } catch (error) {
        console.error(`Failed to generate ${key} size:`, error);
        results[key] = null;
      }
    }

    return results;
  }

  /**
   * Get cached image or optimize and cache
   * @param {string} url - Image URL
   * @param {Object} options - Optimization options
   * @returns {Promise<Buffer>} - Optimized image buffer
   */
  async getOptimizedImage(url, options = {}) {
    // Generate cache key from URL and options
    const cacheKey = this.generateCacheKey(url, options);
    const cachePath = path.join(this.cacheDir, cacheKey);

    try {
      // Check if cached version exists
      const stats = await fs.stat(cachePath);

      // Cache for 7 days
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - stats.mtimeMs < maxAge) {
        return await fs.readFile(cachePath);
      }
    } catch (error) {
      // Cache miss, continue to optimization
    }

    // Optimize image
    const optimized = await this.optimizeImage(url, options);

    // Cache the result
    try {
      await fs.writeFile(cachePath, optimized);
    } catch (error) {
      console.error('Failed to cache image:', error);
    }

    return optimized;
  }

  /**
   * Generate cache key from URL and options
   */
  generateCacheKey(url, options) {
    const hash = crypto
      .createHash('md5')
      .update(url + JSON.stringify(options))
      .digest('hex');

    const format = options.format || 'webp';
    return `${hash}.${format}`;
  }

  /**
   * Clear image cache
   */
  async clearCache() {
    try {
      const files = await fs.readdir(this.cacheDir);

      for (const file of files) {
        await fs.unlink(path.join(this.cacheDir, file));
      }

      console.log(`✅ Cleared ${files.length} cached images`);
      return { cleared: files.length };
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;

      for (const file of files) {
        const stats = await fs.stat(path.join(this.cacheDir, file));
        totalSize += stats.size;
      }

      return {
        fileCount: files.length,
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { fileCount: 0, totalSize: 0, totalSizeMB: 0 };
    }
  }

  /**
   * Validate image URL
   */
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;

    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const lowerUrl = url.toLowerCase();

    return validExtensions.some(ext => lowerUrl.includes(ext)) ||
           lowerUrl.startsWith('http');
  }

  /**
   * Generate srcset for responsive images
   */
  generateSrcSet(baseUrl, widths = [300, 600, 900, 1200]) {
    return widths
      .map(width => `${baseUrl}?w=${width} ${width}w`)
      .join(', ');
  }
}

// Singleton instance
const imageOptimizationService = new ImageOptimizationService();

// Initialize on module load
imageOptimizationService.init().catch(console.error);

module.exports = imageOptimizationService;
