import * as session from 'express-session';
import * as connectRedis from 'connect-redis';
import { FactoryProvider } from '@nestjs/common';
import { redisClient } from 'src/redis/redis.module';

const RedisStore = connectRedis(session);

export const SESSION_MIDDLEWARE_TOKEN = '@SESSION_MIDDLEWARE_TOKEN';

// TODO: use secrets properly.
export const SESSION_MIDDLEWARE_PROVIDER: FactoryProvider<any> = {
  provide: SESSION_MIDDLEWARE_TOKEN,
  useFactory: () => {
    const sessionMiddleware = session({
      store: new RedisStore({ client: redisClient }),
      secret: 'mySecret',
      saveUninitialized: false,
      resave: false,
      name: 'sessionId',
      cookie: {
        // TODO: activate on prod.
        secure: false,
        httpOnly: true,
        // maxAge: 1000 * 60 * 30,
        sameSite: 'lax',
      },
    });
    return sessionMiddleware;
  },
}