import { Logger, Module } from "@nestjs/common";
import { RedisStore } from "connect-redis";
import { createClient, type RedisClientType } from "redis";
import { config } from "src/config";
import { shouldEmitRoutineLogs } from "src/logging";

export const REDIS_CLIENT_TOKEN = "@REDIS_CLIENT_TOKEN";
export const REDIS_STORE_TOKEN = "@REDIS_STORE_TOKEN";

@Module({
  providers: [
    {
      provide: REDIS_CLIENT_TOKEN,
      useFactory: async () => {
        const logger = new Logger("Redis");
        const client = createClient({
          socket: {
            host: config.REDIS_HOST,
            port: 6379,
          },
        });

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
      },
    },
    {
      provide: REDIS_STORE_TOKEN,
      useFactory: (client: RedisClientType) => new RedisStore({ client }),
      inject: [REDIS_CLIENT_TOKEN],
    },
  ],
  exports: [REDIS_CLIENT_TOKEN, REDIS_STORE_TOKEN],
})
export class RedisModule {}
