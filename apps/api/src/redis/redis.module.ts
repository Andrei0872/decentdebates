import { Logger, Module } from '@nestjs/common';
import * as connectRedis from 'connect-redis';
import * as session from 'express-session';
import * as redis from 'redis';
import { config } from 'src/config';
import { shouldEmitRoutineLogs } from 'src/logging';

const RedisStore = connectRedis(session);

export const REDIS_CLIENT_TOKEN = '@REDIS_CLIENT_TOKEN';
export const REDIS_STORE_TOKEN = '@REDIS_STORE_TOKEN';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT_TOKEN,
      useFactory: () => {
        const logger = new Logger('Redis');
        const client = redis.createClient({
          port: 6379,
          host: config.REDIS_HOST,
        });

        client.on('connect', () => {
          if (shouldEmitRoutineLogs()) {
            logger.log('Redis connected!');
          }
        });

        client.on('error', (err) => {
          logger.error(`Redis connection error: ${err instanceof Error ? err.message : String(err)}`);
        });

        return client;
      },
    },
    {
      provide: REDIS_STORE_TOKEN,
      useFactory: (client: redis.RedisClient) => new RedisStore({ client }),
      inject: [REDIS_CLIENT_TOKEN],
    },
  ],
  exports: [REDIS_CLIENT_TOKEN, REDIS_STORE_TOKEN],
})
export class RedisModule { }
