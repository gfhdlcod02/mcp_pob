import { LRUCache } from "lru-cache";
import { createHash } from "node:crypto";
import type { ParsedBuild } from "../models/build.js";

/**
 * Cache configuration
 */
const CACHE_MAX_SIZE = parseInt(process.env.CACHE_SIZE || "100", 10);
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL || "3600000", 10); // 1 hour default

/**
 * LRU cache for parsed PoB builds
 * Key: SHA-256 hash of build code
 * Value: ParsedBuild object
 * Max entries: 100 (configurable via CACHE_SIZE env var)
 * TTL: 1 hour (configurable via CACHE_TTL env var)
 */
export const buildCache = new LRUCache<string, ParsedBuild>({
  max: CACHE_MAX_SIZE,
  ttl: CACHE_TTL_MS,
  updateAgeOnGet: true, // Reset TTL when accessing cached item
  updateAgeOnHas: true, // Reset TTL when checking if key exists
});

/**
 * Generates SHA-256 hash of a build code for use as cache key
 * @param buildCode - Base64-encoded PoB build code
 * @returns SHA-256 hash as hex string
 */
export function generateCacheKey(buildCode: string): string {
  return createHash("sha256").update(buildCode).digest("hex");
}

/**
 * Retrieves a parsed build from cache
 * @param buildCode - Original build code (used to generate cache key)
 * @returns Cached ParsedBuild or undefined if not found/expired
 */
export function getCachedBuild(buildCode: string): ParsedBuild | undefined {
  const key = generateCacheKey(buildCode);
  return buildCache.get(key);
}

/**
 * Stores a parsed build in cache
 * @param buildCode - Original build code (used to generate cache key)
 * @param build - ParsedBuild to cache
 */
export function setCachedBuild(buildCode: string, build: ParsedBuild): void {
  const key = generateCacheKey(buildCode);
  buildCache.set(key, build);
}

/**
 * Checks if a build is in the cache (without retrieving it)
 * @param buildCode - Original build code (used to generate cache key)
 * @returns True if build is cached and not expired
 */
export function hasCachedBuild(buildCode: string): boolean {
  const key = generateCacheKey(buildCode);
  return buildCache.has(key);
}

/**
 * Clears all cached builds
 */
export function clearCache(): void {
  buildCache.clear();
}

/**
 * Gets cache statistics
 * @returns Object with cache size, max size, and calculated hit rate
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  hitRate: number;
} {
  return {
    size: buildCache.size,
    maxSize: CACHE_MAX_SIZE,
    hitRate: 0, // TODO: Track hits/misses if needed for monitoring
  };
}
