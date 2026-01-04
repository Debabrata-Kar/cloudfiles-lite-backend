import { getRedis } from './redis.client';

/**
 * Gets a JSON value from Redis cache
 */
export async function redisGetJson<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  const value = await redis.get(key);
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Sets a JSON value in Redis cache with TTL
 */
export async function redisSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const redis = getRedis();
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

/**
 * Cache wrapper that gets from cache or executes function and caches result
 */
export async function cached<T>(options: {
  key: string;
  ttlSeconds: number;
  fn: () => Promise<T>;
}): Promise<T> {
  const { key, ttlSeconds, fn } = options;

  // Try to get from cache
  const cachedValue = await redisGetJson<T>(key);
  if (cachedValue !== null) {
    return cachedValue;
  }

  // Execute function and cache result
  const result = await fn();
  await redisSetJson(key, result, ttlSeconds);
  return result;
}

/**
 * Creates a stable hash from a query object for cache keys.
 * Uses JSON stringify with sorted keys for stability.
 */
export function hashQuery(query: Record<string, unknown>): string {
  const sortedKeys = Object.keys(query).sort();
  const sortedObj: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    const value = query[key];
    if (value !== undefined && value !== null && value !== '') {
      sortedObj[key] = value;
    }
  }
  // Simple base64 encoding of the JSON string
  const jsonStr = JSON.stringify(sortedObj);
  return Buffer.from(jsonStr).toString('base64').replace(/[/+=]/g, '');
}
