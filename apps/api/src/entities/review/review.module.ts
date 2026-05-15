import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { NOTIFICATION_QUEUE } from "@decentdebates/shared-types";
import { CommentModule } from "../comment/comment.module";
import { ModeratorModule } from "../moderator/moderator.module";
import { UserModule } from "../user/user.module";
import { ReviewGateway } from "./review.gateway";
import { ReviewService } from "./review.service";
import { ReviewController } from "./review.controller";
import { DebatesModule } from "../debates/debates.module";
import { RedisModule } from "src/redis/redis.module";

@Module({
  providers: [ReviewGateway, ReviewService],
  imports: [
    CommentModule,
    DebatesModule,
    UserModule,
    ModeratorModule,
    RedisModule,
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
  ],
  controllers: [ReviewController],
})
export class ReviewModule {}
