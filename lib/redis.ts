import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 1000);
    },
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;