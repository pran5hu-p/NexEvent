import { Queue } from 'bullmq';
import Redis from 'ioredis';

const bullConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // required by BullMQ
});

export const emailQueue = new Queue('emails', { connection: bullConnection });