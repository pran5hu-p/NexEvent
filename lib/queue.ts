import { Queue } from 'bullmq';
import { redis } from './redis';

// Create a queue named 'emails' using our existing Redis connection
export const emailQueue = new Queue('emails', { connection: redis });