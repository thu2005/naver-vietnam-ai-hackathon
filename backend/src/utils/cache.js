/**
 * Simple in-memory cache with TTL (Time To Live)
 * Optimizes repeated queries for ingredient data
 */
class SimpleCache {
  constructor(defaultTTL = 3600000) { // 1 hour default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Set a cache entry
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get a cache entry
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instances for different data types
export const ingredientCache = new SimpleCache(1800000); // 30 minutes
export const productCache = new SimpleCache(900000); // 15 minutes
export const ocrCache = new SimpleCache(300000); // 5 minutes

// Cleanup expired entries every 5 minutes
setInterval(() => {
  ingredientCache.cleanup();
  productCache.cleanup();
  ocrCache.cleanup();
}, 300000);

export default SimpleCache;
