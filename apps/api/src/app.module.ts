import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DbModule } from "@decentdebates/db";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./entities/user/user.module";
import { SESSION_MIDDLEWARE_PROVIDER } from "./middlewares/session.middleware";
import { APP_GUARD, ModuleRef } from "@nestjs/core";
import { AuthenticateGuard } from "./guards/authenticate.guard";
import { DebatesModule } from "./entities/debates/debates.module";
import { ModeratorModule } from "./entities/moderator/moderator.module";
import { ReviewModule } from "./entities/review/review.module";
import { CommentModule } from "./entities/comment/comment.module";
import { NotificationModule } from "./entities/notification/notification.module";
import { BullModule } from "@nestjs/bullmq";
import { RedisModule } from "./redis/redis.module";
import { config } from "./config";

@Module({
  imports: [
    DbModule,
    AuthModule,
    UserModule,
    ConfigModule.forRoot({
      envFilePath: ".env",
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
        port: 6379,
      },
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
  ],
})
export class AppModule {
  constructor(private moduleRef: ModuleRef) {}
}
