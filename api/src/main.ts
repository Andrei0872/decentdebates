import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const PORT = 3001;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }));

  app.setGlobalPrefix('api');

  await app.listen(PORT, () => console.log(`Server up & running on PORT ${PORT}`));
}
bootstrap();
