import { Controller, Get, INestApplication, Post } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AUTH_THROTTLE, AuthController } from "src/auth/auth.controller";
import { AuthService } from "src/auth/auth.service";
import {
  DEFAULT_THROTTLE,
  THROTTLER_GUARD_PROVIDER,
  THROTTLER_IMPORT,
} from "./throttler.guard";

// bcrypt's native loader emits a `url.parse()` deprecation warning on import,
// and hashing is never reached here.
jest.mock("bcrypt", () => ({}));

const TEST_USER_HEADER = "x-test-user-id";

@Controller("items")
class ItemsController {
  @Get()
  list() {
    return [];
  }

  @Post()
  create() {
    return {};
  }
}

describe("MutationThrottlerGuard", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [THROTTLER_IMPORT],
      controllers: [AuthController, ItemsController],
      providers: [
        THROTTLER_GUARD_PROVIDER,
        {
          provide: AuthService,
          useValue: { login: () => Promise.reject(new Error("bad creds")) },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    // Stands in for the session middleware.
    app.use((req, _res, next) => {
      const userId = req.headers[TEST_USER_HEADER];
      if (userId) {
        req.session = { user: { id: userId } };
      }
      next();
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function send(times: number, makeRequest: () => request.Test) {
    const statuses: number[] = [];
    for (let i = 0; i < times; i++) {
      statuses.push((await makeRequest()).status);
    }
    return statuses;
  }

  it("rejects login attempts over the auth limit", async () => {
    const statuses = await send(AUTH_THROTTLE.limit + 1, () =>
      request(app.getHttpServer())
        .post("/auth/login")
        .send({ emailOrUsername: "nobody", password: "wrong" }),
    );

    expect(statuses.slice(0, -1)).toEqual(Array(AUTH_THROTTLE.limit).fill(400));
    expect(statuses.at(-1)).toBe(429);
  });

  it("does not throttle reads", async () => {
    const statuses = await send(DEFAULT_THROTTLE.limit + 1, () =>
      request(app.getHttpServer()).get("/items"),
    );

    expect(statuses).toEqual(Array(DEFAULT_THROTTLE.limit + 1).fill(200));
  });

  it("gives each signed-in user a separate budget on the same IP", async () => {
    const postAs = (userId: string) => () =>
      request(app.getHttpServer()).post("/items").set(TEST_USER_HEADER, userId);

    const first = await send(DEFAULT_THROTTLE.limit + 1, postAs("1"));
    expect(first.at(-1)).toBe(429);

    await request(app.getHttpServer())
      .post("/items")
      .set(TEST_USER_HEADER, "2")
      .expect(201);
  });
});
