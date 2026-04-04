import * as redis from 'redis'
import { config } from 'src/config';

export const redisClient = redis.createClient({
  port: 6379,
  host: config.REDIS_HOST,
});

redisClient.on('connect', () => {
  console.log('Redis connected!');
});

redisClient.on('error', (err) => {
  if (err instanceof Error) {
    console.error('Redis connection error:', err.message);
  } else {
    console.error('Redis connection error:', err);
  }
});
