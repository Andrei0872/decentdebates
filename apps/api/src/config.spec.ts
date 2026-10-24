import { parseApiConfig } from "./config";

const PRODUCTION_ENV = {
  NODE_ENV: "production",
  COOKIE_SECRET: "x".repeat(32),
  CLIENT_URL: "https://example.com",
  REDIS_SESSIONS_URL: "redis://sessions:6379",
  REDIS_QUEUE_URL: "redis://queue:6379",
  REDIS_CACHE_URL: "redis://cache:6379",
};

describe("parseApiConfig", () => {
  it("sets the session cookie as secure in production by default", () => {
    expect(parseApiConfig(PRODUCTION_ENV).SESSION_COOKIE_SECURE).toBe(true);
  });

  it("lets an explicit SESSION_COOKIE_SECURE=false override it", () => {
    const config = parseApiConfig({
      ...PRODUCTION_ENV,
      SESSION_COOKIE_SECURE: "false",
    });

    expect(config.SESSION_COOKIE_SECURE).toBe(false);
  });

  it("rejects a short COOKIE_SECRET in production", () => {
    expect(() =>
      parseApiConfig({ ...PRODUCTION_ENV, COOKIE_SECRET: "short" }),
    ).toThrow(/COOKIE_SECRET/);
  });

  it("rejects a missing CLIENT_URL instead of defaulting to localhost", () => {
    const { CLIENT_URL: _omitted, ...env } = PRODUCTION_ENV;

    expect(() => parseApiConfig(env)).toThrow(/CLIENT_URL/);
  });
});
