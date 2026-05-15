import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { NOTIFICATION_QUEUE } from "@decentdebates/shared-types";
import { RedisModule } from "src/redis/redis.module";
import { DebatesModule } from "../debates/debates.module";
import { ModeratorController } from "./moderator.controller";
import { ModeratorService } from "./moderator.service";

@Module({
  controllers: [ModeratorController],
  providers: [ModeratorService],
  exports: [ModeratorService],
  imports: [DebatesModule, RedisModule, BullModule.registerQueue({ name: NOTIFICATION_QUEUE })],
})
export class ModeratorModule {}
