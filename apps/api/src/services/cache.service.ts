import { createClient } from 'redis';
import { logger } from '../utils/logger';

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;
let isConnected = false;

export async function getRedisClient(): Promise<RedisClient | null> {
  if (!process.env.REDIS_URL) return null;

  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => {
      logger.warn('Redis error (non-fatal):', err.message);
      isConnected = false;
    });
    client.on('connect', () => {
      isConnected = true;
      logger.info('Redis connected');
    });
    try {
      await client.connect();
    } catch {
      logger.warn('Redis unavailable — running without cache');
      client = null;
      return null;
    }
  }
  return client;
}

// ─── CACHE HELPERS ───────────────────────────────────
const DEFAULT_TTL = 300; // 5 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttl = DEFAULT_TTL): Promise<void> {
  try {
    const redis = await getRedisClient();
    if (!redis) return;
    await redis.setEx(key, ttl, JSON.stringify(value));
  } catch {
    // Cache failures are non-fatal
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    if (!redis) return;
    await redis.del(key);
  } catch { }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    if (!redis) return;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(keys);
  } catch { }
}

// ─── VENDOR SEARCH CACHE ─────────────────────────────
export function vendorSearchCacheKey(params: Record<string, any>): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  return `vendor-search:${sorted}`;
}

// ─── SESSION CACHE ───────────────────────────────────
export async function setSession(userId: string, data: any, ttl = 86400): Promise<void> {
  await cacheSet(`session:${userId}`, data, ttl);
}

export async function getSession(userId: string): Promise<any> {
  return cacheGet(`session:${userId}`);
}

export async function deleteSession(userId: string): Promise<void> {
  await cacheDel(`session:${userId}`);
}

// ─── RATE LIMIT COUNTER ──────────────────────────────
export async function incrementRateLimit(key: string, ttl = 60): Promise<number> {
  try {
    const redis = await getRedisClient();
    if (!redis) return 0;
    const count = await redis.incr(`rl:${key}`);
    if (count === 1) await redis.expire(`rl:${key}`, ttl);
    return count;
  } catch {
    return 0;
  }
}
