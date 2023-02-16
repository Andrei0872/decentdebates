import { Inject, MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule, PG_PROVIDER_TOKEN } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SESSION_MIDDLEWARE_PROVIDER, SESSION_MIDDLEWARE_TOKEN } from './middlewares/session.middleware';
import { APP_GUARD, ModuleRef } from '@nestjs/core';
import { AuthenticateGuard } from './guards/authenticate.guard';
import { DebatesModule } from './entities/debates/debates.module';

@Module({
  imports: [
    DbModule,
    AuthModule,
    UserModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    DebatesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SESSION_MIDDLEWARE_PROVIDER,
    {
      provide: APP_GUARD,
      useClass: AuthenticateGuard,
    },
  ],
})
export class AppModule {
  constructor (private moduleRef: ModuleRef) { }
  
}
