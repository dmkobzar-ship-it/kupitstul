/**
 * Cache Layer
 * In-memory cache with TTL support
 * Ready to swap for Redis when available
 *
 * For Redis, install: npm install ioredis
 * Set REDIS_URL environment variable
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Cleanup expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached value with TTL in seconds
   */
  async set<T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete a cached value
   */
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Delete all keys matching a pattern (prefix*)
   */
  async delPattern(prefix: string): Promise<number> {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all cached values
   */
  async flush(): Promise<void> {
    this.store.clear();
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy cache (cleanup interval)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Singleton instance
const globalForCache = globalThis as unknown as {
  cache: MemoryCache | undefined;
};

export const cache = globalForCache.cache ?? new MemoryCache();

if (process.env.NODE_ENV !== "production") {
  globalForCache.cache = cache;
}

// ==========================================
// Cache Key Helpers
// ==========================================

export const CacheKeys = {
  products: (page?: number, category?: string) =>
    `products:${category || "all"}:${page || 0}`,
  product: (slug: string) => `product:${slug}`,
  categories: () => "categories",
  stats: () => "admin:stats",
  orders: (page?: number) => `orders:${page || 0}`,
} as const;

// ==========================================
// Cache TTL Presets (seconds)
// ==========================================

export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

// ==========================================
// Cache-through helper
// ==========================================

/**
 * Get data from cache or compute it
 *
 * Usage:
 * ```
 * const products = await cacheThrough(
 *   CacheKeys.products(1, "stulya"),
 *   () => fetchProducts(1, "stulya"),
 *   CacheTTL.MEDIUM
 * );
 * ```
 */
export async function cacheThrough<T>(
  key: string,
  compute: () => Promise<T>,
  ttlSeconds: number = CacheTTL.MEDIUM
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await compute();
  await cache.set(key, data, ttlSeconds);
  return data;
}

export default cache;
