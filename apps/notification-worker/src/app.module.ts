import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { DbModule } from "@decentdebates/db";
import { NOTIFICATION_QUEUE } from "@decentdebates/shared-types";
import { NotificationModule } from "./notification/notification.module";
import { config } from "./config";

@Module({
  imports: [
    DbModule,
    BullModule.forRoot({
      connection: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
      },
    }),
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
    NotificationModule,
  ],
})
export class AppModule {}
