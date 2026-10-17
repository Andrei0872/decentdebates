import * as session from "express-session";
import { FactoryProvider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { REDIS_STORE_TOKEN } from "src/redis/redis.module";

export const SESSION_MIDDLEWARE_TOKEN = "@SESSION_MIDDLEWARE_TOKEN";

const DEFAULT_SESSION_COOKIE_NAME = "sessionId";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function getSessionCookieName(cs: ConfigService): string {
  return cs.get("SESSION_COOKIE_NAME") ?? DEFAULT_SESSION_COOKIE_NAME;
}

export const SESSION_MIDDLEWARE_PROVIDER: FactoryProvider<any> = {
  provide: SESSION_MIDDLEWARE_TOKEN,
  useFactory: (cs: ConfigService, redisStore: session.Store) => {
    const sessionMiddleware = session({
      store: redisStore,
      secret: cs.get("COOKIE_SECRET"),
      saveUninitialized: false,
      resave: false,
      rolling: true,
      name: getSessionCookieName(cs),
      cookie: {
        // Behind a proxy, `req.secure` comes from `X-Forwarded-Proto`, which
        // Express only trusts with `trust proxy` set (`TRUST_PROXY_HOPS`).
        secure: cs.get<boolean>("SESSION_COOKIE_SECURE"),
        httpOnly: true,
        maxAge: SESSION_MAX_AGE_MS,
        sameSite: "lax",
      },
    });
    return sessionMiddleware;
  },
  inject: [ConfigService, REDIS_STORE_TOKEN],
};
