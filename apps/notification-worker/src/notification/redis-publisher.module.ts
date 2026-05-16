import { Module } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import IORedis from "ioredis";
import { config } from "src/config";

export const REDIS_PUBLISHER_TOKEN = "REDIS_PUBLISHER_TOKEN";

@Module({
  providers: [
    {
      provide: REDIS_PUBLISHER_TOKEN,
      useFactory: () => {
        const logger = new Logger("RedisPublisher");
        const client = new IORedis({
          host: config.REDIS_HOST,
          port: 6379,
          maxRetriesPerRequest: null,
        });
        client.on("error", (err) => {
          logger.error(`Redis publisher error: ${err.message}`);
        });
        return client;
      },
    },
  ],
  exports: [REDIS_PUBLISHER_TOKEN],
})
export class RedisPublisherModule {}
