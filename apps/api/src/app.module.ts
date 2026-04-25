import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DbModule } from "@decentdebates/db";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
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
import { EventEmitterModule } from "@nestjs/event-emitter";
import { RedisModule } from "./redis/redis.module";

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
    EventEmitterModule.forRoot(),
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
  constructor(private moduleRef: ModuleRef) {}
}
