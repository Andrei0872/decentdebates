import * as session from "express-session";
import { FactoryProvider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { REDIS_STORE_TOKEN } from "src/redis/redis.module";

export const SESSION_MIDDLEWARE_TOKEN = "@SESSION_MIDDLEWARE_TOKEN";

const DEFAULT_SESSION_COOKIE_NAME = "sessionId";

export function getSessionCookieName(cs: ConfigService): string {
  return cs.get("SESSION_COOKIE_NAME") ?? DEFAULT_SESSION_COOKIE_NAME;
}

// TODO: use secrets properly.
export const SESSION_MIDDLEWARE_PROVIDER: FactoryProvider<any> = {
  provide: SESSION_MIDDLEWARE_TOKEN,
  useFactory: (cs: ConfigService, redisStore: session.Store) => {
    const sessionMiddleware = session({
      store: redisStore,
      secret: cs.get("COOKIE_SECRET"),
      saveUninitialized: false,
      resave: false,
      name: getSessionCookieName(cs),
      cookie: {
        // TODO: activate on prod.
        secure: false,
        httpOnly: true,
        // maxAge: 1000 * 60 * 30,
        sameSite: "lax",
      },
    });
    return sessionMiddleware;
  },
  inject: [ConfigService, REDIS_STORE_TOKEN],
};
