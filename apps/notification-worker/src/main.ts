import { NestFactory } from "@nestjs/core";
import { Logger } from "@decentdebates/logging";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
}
bootstrap();
