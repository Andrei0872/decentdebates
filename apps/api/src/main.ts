import { Logger } from "@nestjs/common";
import { Logger as PinoNestLogger } from "@decentdebates/logging";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { getSessionCookieName } from "./middlewares/session.middleware";
import { config } from "./config";
import { setupApp } from "./app.setup";
import { shouldEmitRoutineLogs } from "./logging";

const PORT = 3001;
const logger = new Logger("Bootstrap");

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(PinoNestLogger));

  setupApp(app);

  if (config.SWAGGER_ENABLED) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("DecentDebates API")
      .setDescription("REST API for the DecentDebates platform")
      .setVersion("1.0")
      .addCookieAuth(getSessionCookieName(app.get(ConfigService)))
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
  }

  await app.listen(PORT);

  if (shouldEmitRoutineLogs()) {
    logger.log(`Server up & running on PORT ${PORT}`);
  }
}
bootstrap();
