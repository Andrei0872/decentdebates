import type { INestApplicationContext } from "@nestjs/common";
import type IORedis from "ioredis";
import type { Pool } from "pg";
import { PG_PROVIDER_TOKEN } from "@decentdebates/db";
import { REDIS_PUBLISHER_TOKEN } from "./notification/redis-publisher.module";

// `app.close()` waits for active jobs, which still use the pool and publisher.
export async function closeWorker(app: INestApplicationContext) {
  await app.close();
  await app.get<Pool>(PG_PROVIDER_TOKEN, { strict: false }).end();
  await app.get<IORedis>(REDIS_PUBLISHER_TOKEN, { strict: false }).quit();
}
