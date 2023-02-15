import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SESSION_MIDDLEWARE_TOKEN } from './middlewares/session.middleware';
import * as cors from 'cors';

const PORT = 3001;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }));

  app.setGlobalPrefix('api');

  const sessionMiddleware = app.get(SESSION_MIDDLEWARE_TOKEN);
  app.use(sessionMiddleware);

  // TODO: from `.env` file.
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }));

  await app.listen(PORT, () => console.log(`Server up & running on PORT ${PORT}`));
}
bootstrap();
