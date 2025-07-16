/**
 * Performance Cache for SuperClaude Enterprise
 * Provides caching strategies for improved performance
 */

import { createHash } from 'crypto';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
  ttl: number;
}

export class PerformanceCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 300000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate cache key from input
   */
  generateKey(input: any): string {
    const normalized = typeof input === 'string' ? input : JSON.stringify(input);
    return createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Get item from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Update hit count
    entry.hits++;
    
    return entry.value;
  }

  /**
   * Set item in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Check cache size
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    avgHits: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    
    return {
      size: this.cache.size,
      hitRate: entries.length > 0 ? (totalHits / entries.length) : 0,
      avgHits: entries.length > 0 ? (totalHits / entries.length) : 0
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      const lastAccess = entry.timestamp + (entry.hits * 1000); // Factor in hits
      if (lastAccess < oldestTime) {
        oldestTime = lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

/**
 * Specialized caches for different components
 */

// Command parsing cache
export const commandParseCache = new PerformanceCache<any>(500, 600000); // 10 min

// Strategy selection cache  
export const strategyCache = new PerformanceCache<any>(200, 300000); // 5 min

// Session context cache
export const sessionCache = new PerformanceCache<any>(100, 1800000); // 30 min

// Pattern detection cache
export const patternCache = new PerformanceCache<any>(300, 900000); // 15 min