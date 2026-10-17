import { Writable } from "node:stream";
import pino from "pino";
import {
  createBaseLoggerOptions,
  createLoggerModuleParams,
} from "./logger-params";

function createCapturingLogger() {
  const lines: Record<string, any>[] = [];
  const destination = new Writable({
    write(chunk, _enc, cb) {
      lines.push(JSON.parse(chunk.toString()));
      cb();
    },
  });
  const logger = pino(
    createBaseLoggerOptions({ serviceName: "test-service", level: "info" }),
    destination,
  );
  return { logger, lines };
}

describe("createBaseLoggerOptions", () => {
  it("redacts passwords and emails at the top level and when nested", () => {
    const { logger, lines } = createCapturingLogger();

    logger.info({
      password: "p",
      email: "a@b.c",
      user: { email: "a@b.c", password: "p", username: "alice" },
      payload: { user: { email: "a@b.c" } },
    });

    expect(lines[0].password).toBe("[Redacted]");
    expect(lines[0].email).toBe("[Redacted]");
    expect(lines[0].user).toEqual({
      email: "[Redacted]",
      password: "[Redacted]",
      username: "alice",
    });
    expect(lines[0].payload.user.email).toBe("[Redacted]");
  });

  it("redacts cookies and authorization headers", () => {
    const { logger, lines } = createCapturingLogger();

    logger.info({
      headers: { cookie: "sid=1", authorization: "Bearer x", accept: "*/*" },
      req: { headers: { cookie: "sid=1", authorization: "Bearer x" } },
      res: { headers: { "set-cookie": "sid=1" } },
    });

    expect(lines[0].headers).toEqual({
      cookie: "[Redacted]",
      authorization: "[Redacted]",
      accept: "*/*",
    });
    expect(lines[0].req.headers).toEqual({
      cookie: "[Redacted]",
      authorization: "[Redacted]",
    });
    expect(lines[0].res.headers["set-cookie"]).toBe("[Redacted]");
  });

  it("writes the level as a label, an ISO timestamp and the service name", () => {
    const { logger, lines } = createCapturingLogger();

    logger.warn("hello");

    expect(lines[0]).toMatchObject({
      level: "warn",
      service: "test-service",
      msg: "hello",
    });
    expect(new Date(lines[0].time).toISOString()).toBe(lines[0].time);
  });
});

describe("createLoggerModuleParams", () => {
  it("is silent and does not pretty-print under tests", () => {
    const { pinoHttp } = createLoggerModuleParams({ serviceName: "api" });

    expect(pinoHttp).toMatchObject({ level: "silent", transport: undefined });
  });

  it("skips the completion log line only for ignored paths", () => {
    const { pinoHttp } = createLoggerModuleParams({
      serviceName: "api",
      ignorePaths: ["/api/health"],
    });
    const { ignore } = (
      pinoHttp as { autoLogging: { ignore: (req: { url: string }) => boolean } }
    ).autoLogging;

    expect(ignore({ url: "/api/health" })).toBe(true);
    expect(ignore({ url: "/api/health?probe=1" })).toBe(true);
    expect(ignore({ url: "/api/healthz" })).toBe(false);
  });
});
