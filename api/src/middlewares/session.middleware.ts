import * as session from 'express-session';
import * as connectRedis from 'connect-redis';
import { FactoryProvider } from '@nestjs/common';
import { redisClient } from 'src/redis/redis.module';
import { ConfigService } from '@nestjs/config';

const RedisStore = connectRedis(session);

export const SESSION_MIDDLEWARE_TOKEN = '@SESSION_MIDDLEWARE_TOKEN';

export const redisStore = new RedisStore({ client: redisClient });

// TODO: use secrets properly.
export const SESSION_MIDDLEWARE_PROVIDER: FactoryProvider<any> = {
  provide: SESSION_MIDDLEWARE_TOKEN,
  useFactory: (cs: ConfigService) => {
    const sessionMiddleware = session({
      store: redisStore,
      secret: cs.get('COOKIE_SECRET'),
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
  inject: [ConfigService]
}