import { Module } from "@nestjs/common";
import { NotificationProcessor } from "./notification.processor";
import { RedisPublisherModule } from "./redis-publisher.module";

@Module({
  imports: [RedisPublisherModule],
  providers: [NotificationProcessor],
})
export class NotificationModule {}
