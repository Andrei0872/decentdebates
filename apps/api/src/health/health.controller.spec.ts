import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { PG_PROVIDER_TOKEN } from "@decentdebates/db";
import { REDIS_CLIENT_TOKEN } from "src/redis/redis.module";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let app: INestApplication;

  async function createApp(deps: {
    query: () => Promise<unknown>;
    ping: () => Promise<unknown>;
  }) {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PG_PROVIDER_TOKEN, useValue: { query: deps.query } },
        { provide: REDIS_CLIENT_TOKEN, useValue: { ping: deps.ping } },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  }

  afterEach(async () => {
    await app.close();
  });

  it("reports 503 and the failing dependency when one is unreachable", async () => {
    await createApp({
      query: () => Promise.reject(new Error("ECONNREFUSED")),
      ping: () => Promise.resolve("PONG"),
    });

    const res = await request(app.getHttpServer()).get("/ready").expect(503);

    expect(res.body).toEqual({
      status: "unavailable",
      checks: { postgres: "down", redis: "up" },
    });
  });

  it("reports 503 instead of hanging when a dependency doesn't answer", async () => {
    await createApp({
      query: () => Promise.resolve(),
      ping: () => new Promise(() => {}),
    });

    const res = await request(app.getHttpServer()).get("/ready").expect(503);

    expect(res.body.checks).toEqual({ postgres: "up", redis: "down" });
  });
});
