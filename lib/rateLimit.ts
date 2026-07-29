import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from './redis';

export const authLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:auth',
  points: 5,
  duration: 60 * 15, // 5 attempts per 15 minutes
});

export const otpLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:otp',
  points: 3,
  duration: 60 * 10, // 3 attempts per 10 minutes
});

export const eventRegisterLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:event-register',
  points: 10,
  duration: 60, // 10 attempts per 1 minute
});

export const eventCreateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:event-create',
  points: 5,
  duration: 60 * 60, // 5 events per 1 hour (3600 seconds)
});

export const profileUpdateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:profile-update',
  points: 10,
  duration: 60, // 10 updates per 1 minute (60 seconds)
});

export const reviewLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:review',
  points: 5, // 5 reviews
  duration: 60 * 60, // per 1 hour
});

export const uploadLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:upload',
  points: 10, // 10 uploads
  duration: 60 * 60, // per 1 hour
});

export const checkinLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:checkin',
  points: 60, // 60 check-ins
  duration: 60, // per 1 minute (allows fast scanning, stops runaway loops)
});

// Helper function to get the user's IP address
export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd ? fwd.split(',')[0].trim() : 'unknown';
}