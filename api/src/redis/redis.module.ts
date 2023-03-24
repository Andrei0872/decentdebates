import * as redis from 'redis'
import { config } from 'src/config';

export const redisClient = redis.createClient({
  port: 6379,
  host: config.REDIS_HOST,
});

redisClient.on('connect', () => {
  console.log('Redis connected!');
});
