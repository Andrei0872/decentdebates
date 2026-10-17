import { Logger as NestLogger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@decentdebates/logging";
import { handleShutdownSignals } from "@decentdebates/telemetry";
import { AppModule } from "./app.module";
import { closeWorker } from "./shutdown";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  handleShutdownSignals({
    close: () => closeWorker(app),
    logger: new NestLogger("Bootstrap"),
  });
}
bootstrap();
