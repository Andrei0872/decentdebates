import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cors from 'cors';
import type { Pool } from 'pg';
import type { RedisClientType } from 'redis';
import { PG_PROVIDER_TOKEN } from '@decentdebates/db';
import { AppModule } from '../../src/app.module';
import { config } from '../../src/config';
import { REDIS_CLIENT_TOKEN } from '../../src/redis/redis.module';
import { SESSION_MIDDLEWARE_TOKEN } from '../../src/middlewares/session.middleware';
import { loadTestEnv, resetTestDatabase } from './db';

export async function createTestApp(options?: { resetDb?: boolean }) {
  loadTestEnv();

  if (options?.resetDb !== false) {
    await resetTestDatabase();
  }

  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }));

  app.setGlobalPrefix('api');

  const sessionMiddleware = app.get(SESSION_MIDDLEWARE_TOKEN);
  app.use(sessionMiddleware);

  app.use(cors({
    origin: config.CLIENT_URL,
    credentials: true,
  }));

  await app.init();

  return app;
}

export async function closeTestApp(app: INestApplication) {
  const pool = app.get<Pool>(PG_PROVIDER_TOKEN, { strict: false });
  const redisClient = app.get<RedisClientType>(REDIS_CLIENT_TOKEN, { strict: false });

  await app.close();

  if (pool) {
    await pool.end();
  }

  if (redisClient?.isOpen) {
    await redisClient.quit();
  }
}
