import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { Pool } from "pg";
import type { RedisClientType } from "redis";
import { PG_PROVIDER_TOKEN } from "@decentdebates/db";
import { AppModule } from "../../src/app.module";
import { setupApp } from "../../src/app.setup";
import { REDIS_CLIENT_TOKEN } from "../../src/redis/redis.module";
import { loadTestEnv, resetTestDatabase } from "./db";

export async function createTestApp(options?: { resetDb?: boolean }) {
  loadTestEnv();

  if (options?.resetDb !== false) {
    await resetTestDatabase();
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: false,
  });

  setupApp(app);

  await app.init();

  return app;
}

export async function closeTestApp(app: INestApplication) {
  const pool = app.get<Pool>(PG_PROVIDER_TOKEN, { strict: false });
  const redisClient = app.get<RedisClientType>(REDIS_CLIENT_TOKEN, {
    strict: false,
  });

  await app.close();

  if (pool) {
    await pool.end();
  }

  if (redisClient?.isOpen) {
    await redisClient.quit();
  }
}
