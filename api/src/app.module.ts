import { Inject, MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule, PG_PROVIDER_TOKEN } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SESSION_MIDDLEWARE_PROVIDER, SESSION_MIDDLEWARE_TOKEN } from './middlewares/session.middleware';
import { ModuleRef } from '@nestjs/core';
import { authenticateMiddleware } from './middlewares/authenticate.middleware';

@Module({
  imports: [
    DbModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SESSION_MIDDLEWARE_PROVIDER,
  ],
})
export class AppModule {
  constructor (private moduleRef: ModuleRef) { }
  
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(authenticateMiddleware)
      .exclude('/api/auth/(.*)')
      .forRoutes('*');
  }
}
