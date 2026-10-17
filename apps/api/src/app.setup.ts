import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NestExpressApplication } from "@nestjs/platform-express";
import * as cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import { SESSION_MIDDLEWARE_TOKEN } from "./middlewares/session.middleware";

export function setupApp(app: NestExpressApplication) {
  const cs = app.get(ConfigService);

  app.set("trust proxy", cs.get<number>("TRUST_PROXY_HOPS"));

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.setGlobalPrefix("api");

  const sessionMiddleware = app.get(SESSION_MIDDLEWARE_TOKEN);
  app.use(sessionMiddleware);

  app.use(
    cors({
      origin: config.CLIENT_URL,
      credentials: true,
    }),
  );
}
