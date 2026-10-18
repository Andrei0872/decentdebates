import { Logger, Module } from "@nestjs/common";
import { RedisStore } from "connect-redis";
import {
  createClient,
  type RedisClientOptions,
  type RedisClientType,
} from "redis";
import { config } from "src/config";
import { shouldEmitRoutineLogs } from "src/logging";

export const REDIS_SESSIONS_CLIENT_TOKEN = "@REDIS_SESSIONS_CLIENT_TOKEN";
export const REDIS_CACHE_CLIENT_TOKEN = "@REDIS_CACHE_CLIENT_TOKEN";
export const SESSION_STORE_TOKEN = "@SESSION_STORE_TOKEN";

export async function connectRedis(
  name: string,
  options: RedisClientOptions,
): Promise<RedisClientType> {
  const logger = new Logger(`Redis:${name}`);
  const client = createClient(options) as RedisClientType;

  client.on("error", (err) => {
    logger.error(
      `Redis connection error: ${err instanceof Error ? err.message : String(err)}`,
    );
  });

  await client.connect();

  if (shouldEmitRoutineLogs()) {
    logger.log("Redis connected!");
  }

  return client;
}

@Module({
  providers: [
    {
      provide: REDIS_SESSIONS_CLIENT_TOKEN,
      useFactory: () =>
        connectRedis("sessions", { url: config.REDIS_SESSIONS_URL }),
    },
    {
      provide: REDIS_CACHE_CLIENT_TOKEN,
      // Commands fail fast while disconnected instead of queueing, so cache
      // reads fall through to the DB rather than hanging the request.
      useFactory: () =>
        connectRedis("cache", {
          url: config.REDIS_CACHE_URL,
          disableOfflineQueue: true,
        }),
    },
    {
      provide: SESSION_STORE_TOKEN,
      useFactory: (client: RedisClientType) => new RedisStore({ client }),
      inject: [REDIS_SESSIONS_CLIENT_TOKEN],
    },
  ],
  exports: [
    REDIS_SESSIONS_CLIENT_TOKEN,
    REDIS_CACHE_CLIENT_TOKEN,
    SESSION_STORE_TOKEN,
  ],
})
export class RedisModule {}
