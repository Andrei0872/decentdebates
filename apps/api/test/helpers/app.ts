import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cors from 'cors';
import type { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from '@decentdebates/db';
import { AppModule } from '../../src/app.module';
import { config } from '../../src/config';
import { redisClient } from '../../src/redis/redis.module';
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

  await app.close();

  if (pool) {
    await pool.end();
  }
}

export async function closeRedisClient() {
  if ((redisClient as any)?.connected) {
    await new Promise<void>((resolve, reject) => {
      redisClient.quit((err) => {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  }
}
