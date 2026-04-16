import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SESSION_MIDDLEWARE_TOKEN } from './middlewares/session.middleware';
import * as cors from 'cors';
import { config } from './config'
import { shouldEmitRoutineLogs } from './logging';

const PORT = 3001;
const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }));

  app.setGlobalPrefix('api');

  const sessionMiddleware = app.get(SESSION_MIDDLEWARE_TOKEN);
  app.use(sessionMiddleware);

  app.use(cors({
    origin: config.CLIENT_URL,
    credentials: true,
  }));

  await app.listen(PORT);

  if (shouldEmitRoutineLogs()) {
    logger.log(`Server up & running on PORT ${PORT}`);
  }
}
bootstrap();
