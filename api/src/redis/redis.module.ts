import * as redis from 'redis'

export const redisClient = redis.createClient({
  port: 6379,
  host: 'localhost',
});

redisClient.on('connect', () => {
  console.log('Redis connected!');
});
