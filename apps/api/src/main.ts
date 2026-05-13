import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { SESSION_MIDDLEWARE_TOKEN } from "./middlewares/session.middleware";
import * as cors from "cors";
import { config } from "./config";
import { shouldEmitRoutineLogs } from "./logging";

const PORT = 3001;
const logger = new Logger("Bootstrap");

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
  });

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle("DecentDebates API")
    .setDescription("REST API for the DecentDebates platform")
    .setVersion("1.0")
    .addCookieAuth("connect.sid")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  await app.listen(PORT);

  if (shouldEmitRoutineLogs()) {
    logger.log(`Server up & running on PORT ${PORT}`);
  }
}
bootstrap();
