import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DbModule } from "@decentdebates/db";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./entities/user/user.module";
import { SESSION_MIDDLEWARE_PROVIDER } from "./middlewares/session.middleware";
import { APP_GUARD, APP_INTERCEPTOR, ModuleRef } from "@nestjs/core";
import { AuthenticateGuard } from "./guards/authenticate.guard";
import { DebatesModule } from "./entities/debates/debates.module";
import { ModeratorModule } from "./entities/moderator/moderator.module";
import { ReviewModule } from "./entities/review/review.module";
import { CommentModule } from "./entities/comment/comment.module";
import { NotificationModule } from "./entities/notification/notification.module";
import { BullModule } from "@nestjs/bullmq";
import { RedisModule } from "./redis/redis.module";
import { config } from "./config";
import { createLoggerModuleParams, LoggerModule } from "@decentdebates/logging";
import { createBullMqTelemetry } from "@decentdebates/telemetry";
import { RequestContextMiddleware } from "./request-context";
import { HttpRouteInterceptor } from "./interceptors/http-route.interceptor";
import { validateEnv } from "./env";

@Module({
  imports: [
    LoggerModule.forRoot(createLoggerModuleParams({ serviceName: "api" })),
    DbModule,
    AuthModule,
    UserModule,
    ConfigModule.forRoot({
      envFilePath: ".env",
      validate: validateEnv,
    }),
    DebatesModule,
    ModeratorModule,
    ReviewModule,
    CommentModule,
    NotificationModule,
    RedisModule,
    BullModule.forRoot({
      connection: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
      },
      telemetry: createBullMqTelemetry(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    }),
  ],
  providers: [
    SESSION_MIDDLEWARE_PROVIDER,
    {
      provide: APP_GUARD,
      useClass: AuthenticateGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpRouteInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  constructor(private moduleRef: ModuleRef) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes("{*splat}");
  }
}
