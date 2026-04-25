import type { INestApplication } from "@nestjs/common";
import * as request from "supertest";

export const SEEDED_USER_CREDENTIALS = {
  emailOrUsername: "foo.bar",
  password: "pas123",
};

export const SEEDED_MODERATOR_CREDENTIALS = {
  emailOrUsername: "mod.bar",
  password: "pas123",
};

export async function loginAsSeededUser(app: INestApplication) {
  const agent = request.agent(app.getHttpServer());

  await agent.post("/api/auth/login").send(SEEDED_USER_CREDENTIALS).expect(201);

  return agent;
}

export async function loginAsSeededModerator(app: INestApplication) {
  const agent = request.agent(app.getHttpServer());

  await agent
    .post("/api/auth/login")
    .send(SEEDED_MODERATOR_CREDENTIALS)
    .expect(201);

  return agent;
}
