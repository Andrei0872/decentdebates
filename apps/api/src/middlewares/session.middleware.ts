import * as session from "express-session";
import { FactoryProvider } from "@nestjs/common";
import { SESSION_STORE_TOKEN } from "src/redis/redis.module";
import { config } from "src/config";

export const SESSION_MIDDLEWARE_TOKEN = "@SESSION_MIDDLEWARE_TOKEN";

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const SESSION_MIDDLEWARE_PROVIDER: FactoryProvider<any> = {
  provide: SESSION_MIDDLEWARE_TOKEN,
  useFactory: (sessionStore: session.Store) => {
    const sessionMiddleware = session({
      store: sessionStore,
      secret: config.COOKIE_SECRET,
      saveUninitialized: false,
      resave: false,
      rolling: true,
      name: config.SESSION_COOKIE_NAME,
      cookie: {
        // Behind a proxy, `req.secure` comes from `X-Forwarded-Proto`, which
        // Express only trusts with `trust proxy` set (`TRUST_PROXY_HOPS`).
        secure: config.SESSION_COOKIE_SECURE,
        httpOnly: true,
        maxAge: SESSION_MAX_AGE_MS,
        sameSite: "lax",
      },
    });
    return sessionMiddleware;
  },
  inject: [SESSION_STORE_TOKEN],
};
