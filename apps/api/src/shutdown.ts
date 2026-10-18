import type { INestApplication } from "@nestjs/common";
import type { Pool } from "pg";
import type { RedisClientType } from "redis";
import { PG_PROVIDER_TOKEN } from "@decentdebates/db";
import {
  REDIS_CACHE_CLIENT_TOKEN,
  REDIS_SESSIONS_CLIENT_TOKEN,
} from "./redis/redis.module";
import { startDrainingConnections } from "./connection-drain";

// In-flight requests and BullMQ queues use the pool and Redis until
// `app.close()` returns, so those close after it.
export async function closeApp(app: INestApplication) {
  startDrainingConnections(app.getHttpServer());
  await app.close();
  await app.get<Pool>(PG_PROVIDER_TOKEN, { strict: false }).end();

  for (const token of [REDIS_SESSIONS_CLIENT_TOKEN, REDIS_CACHE_CLIENT_TOKEN]) {
    const redis = app.get<RedisClientType>(token, { strict: false });
    if (redis.isOpen) {
      await redis.close();
    }
  }
}
