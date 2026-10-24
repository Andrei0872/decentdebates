import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "../../src/app.module";
import { setupApp } from "../../src/app.setup";
import { closeApp } from "../../src/shutdown";
import { assertTestEnv, resetTestDatabase } from "./db";
import { flushTestRedis } from "./redis";

export async function createTestApp(options?: { reset?: boolean }) {
  assertTestEnv();

  if (options?.reset !== false) {
    await Promise.all([resetTestDatabase(), flushTestRedis()]);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: false,
  });

  setupApp(app);

  await app.init();

  return app;
}

export async function closeTestApp(app: INestApplication) {
  await closeApp(app);
}
