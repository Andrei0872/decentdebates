import type { INestApplication } from "@nestjs/common";
import request = require("supertest");
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { closeTestApp, createTestApp } from "../helpers/app";
import { SEEDED_USER_CREDENTIALS } from "../helpers/auth";

describe("Auth (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await closeTestApp(app);
    }
  });

  it("logs in a seeded user and sets the session cookie", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send(SEEDED_USER_CREDENTIALS)
      .expect(201);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        username: "foo.bar",
        email: "foo@bar.com",
        role: "USER",
      }),
    );
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("sessionId=")]),
    );
  });

  it("rejects invalid credentials", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        emailOrUsername: SEEDED_USER_CREDENTIALS.emailOrUsername,
        password: "wrong-password",
      })
      .expect(400);
  });

  it("allows an authenticated user to access a protected route", async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post("/api/auth/login")
      .send(SEEDED_USER_CREDENTIALS)
      .expect(201);

    const response = await agent.get("/api/user/activity").expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("rejects an unauthenticated user on a protected route", async () => {
    await request(app.getHttpServer()).get("/api/user/activity").expect(401);
  });
});
