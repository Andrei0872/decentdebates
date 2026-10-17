import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "../../src/app.module";
import { setupApp } from "../../src/app.setup";
import { closeApp } from "../../src/shutdown";
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
  await closeApp(app);
}
