import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
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
import { HealthModule } from "./health/health.module";
import { PROBE_PATHS } from "./health/health.paths";
import { config } from "./config";
import { createLoggerModuleParams, LoggerModule } from "@decentdebates/logging";
import { createBullMqTelemetry } from "@decentdebates/telemetry";
import { RequestContextMiddleware } from "./request-context";
import { HttpRouteInterceptor } from "./interceptors/http-route.interceptor";
import {
  THROTTLER_GUARD_PROVIDER,
  THROTTLER_IMPORT,
} from "./guards/throttler.guard";

@Module({
  imports: [
    LoggerModule.forRoot(
      createLoggerModuleParams({
        serviceName: "api",
        ignorePaths: PROBE_PATHS,
      }),
    ),
    DbModule,
    AuthModule,
    UserModule,
    THROTTLER_IMPORT,
    DebatesModule,
    ModeratorModule,
    ReviewModule,
    CommentModule,
    NotificationModule,
    RedisModule,
    HealthModule,
    BullModule.forRoot({
      connection: { url: config.REDIS_QUEUE_URL },
      telemetry: createBullMqTelemetry(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
        removeOnFail: { age: 7 * 24 * 60 * 60, count: 5000 },
      },
    }),
  ],
  providers: [
    SESSION_MIDDLEWARE_PROVIDER,
    {
      provide: APP_GUARD,
      useClass: AuthenticateGuard,
    },
    THROTTLER_GUARD_PROVIDER,
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
